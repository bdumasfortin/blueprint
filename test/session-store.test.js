import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { SessionStore } from "../src/session-store.js";

async function createHarness(t) {
  const root = await mkdtemp(path.join(tmpdir(), "blueprint-store-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const artifact = path.join(root, "artifact.html");
  await writeFile(artifact, "<!doctype html><h1>First revision</h1>");
  return { root: path.join(root, "state"), artifact };
}

function initialDraft(id = "feedback-1") {
  return {
    id,
    kind: "initial",
    body: "Make this heading more specific.",
    included: true,
    createdAt: "2026-08-28T12:00:00.000Z",
    anchor: {
      type: "element",
      quote: "First revision",
      prefix: "",
      suffix: "",
      selector: "h1",
    },
  };
}

function decisionDraft(id = "response-1-submission-model") {
  return {
    id,
    kind: "decision",
    body: "Decision response — Choose the submission model\n- Model: Typed content",
    createdAt: "2026-09-02T12:00:00.000Z",
    anchor: {
      type: "element",
      quote: "Choose the submission model",
      prefix: "",
      suffix: "",
      selector: "#submission-model",
    },
  };
}

test("packets survive restart and redeliver under one ID until acknowledged", async (t) => {
  const { root, artifact } = await createHarness(t);
  const store = new SessionStore(root);
  const opened = await store.openArtifact(artifact);
  assert.ok(opened.visibleRevision);
  assert.equal(opened.stagedRevision, null);

  await store.replaceDrafts(opened.reviewToken, {
    drafts: [initialDraft()],
    packetNote: "One focused revision.",
  });
  const sent = await store.sendPacket(opened.reviewToken);

  const firstDelivery = await store.nextQueuedPacket(artifact);
  const repeatedDelivery = await store.nextQueuedPacket(artifact);
  assert.equal(firstDelivery.id, sent.id);
  assert.equal(repeatedDelivery.id, sent.id);
  assert.deepEqual(repeatedDelivery, firstDelivery);

  const restarted = new SessionStore(root);
  const afterRestart = await restarted.nextQueuedPacket(artifact);
  assert.equal(afterRestart.id, sent.id);

  await restarted.acknowledgePacket(afterRestart.sessionId, afterRestart.id);
  assert.equal(await restarted.nextQueuedPacket(artifact), null);
  await restarted.acknowledgePacket(afterRestart.sessionId, afterRestart.id);

  const state = await restarted.getBrowserState(opened.reviewToken);
  assert.equal(state.packets[0].status, "delivered");
  assert.equal(state.feedback[0].id, "feedback-1");
});

test("every remaining draft is sent even when a legacy payload marks it excluded", async (t) => {
  const { root, artifact } = await createHarness(t);
  const store = new SessionStore(root);
  const opened = await store.openArtifact(artifact);
  const legacyDraft = initialDraft();
  legacyDraft.included = false;

  const saved = await store.replaceDrafts(opened.reviewToken, {
    drafts: [legacyDraft],
    packetNote: "",
  });
  assert.equal("included" in saved.drafts[0], false);

  const packet = await store.sendPacket(opened.reviewToken);
  assert.equal(packet.comments.length, 1);
  assert.equal(packet.comments[0].id, legacyDraft.id);
  const state = await store.getBrowserState(opened.reviewToken);
  assert.equal(state.drafts.length, 0);
});

test("additional feedback becomes a normal general comment before delivery", async (t) => {
  const { root, artifact } = await createHarness(t);
  const store = new SessionStore(root);
  const opened = await store.openArtifact(artifact);

  await store.replaceDrafts(opened.reviewToken, {
    drafts: [],
    packetNote: "Compare the empty state as well.",
  });
  const packet = await store.sendPacket(opened.reviewToken);

  assert.equal(packet.note, "");
  assert.equal(packet.comments.length, 1);
  assert.equal(packet.comments[0].body, "Compare the empty state as well.");
  assert.deepEqual(packet.comments[0].anchor, {
    type: "general",
    quote: "General feedback",
    prefix: "",
    suffix: "",
    selector: "",
  });
  const state = await store.getBrowserState(opened.reviewToken);
  assert.equal(state.packetNote, "");
  assert.equal(state.feedback[0].id, packet.comments[0].id);
});

test("approve is a final acknowledged batch and may contain no comments", async (t) => {
  const { root, artifact } = await createHarness(t);
  const store = new SessionStore(root);
  const opened = await store.openArtifact(artifact);

  const packet = await store.sendPacket(opened.reviewToken, { intent: "approve" });
  assert.equal(packet.schemaVersion, 3);
  assert.equal(packet.intent, "approve");
  assert.deepEqual(packet.decisions, []);
  assert.deepEqual(packet.comments, []);

  const state = await store.getBrowserState(opened.reviewToken);
  assert.equal(state.status, "ended");
  assert.ok(state.endedAt);
  assert.equal(state.packets[0].intent, "approve");
  assert.equal((await store.nextQueuedPacket(artifact)).id, packet.id);
});

test("approve with feedback accepts the history and ends the review", async (t) => {
  const { root, artifact } = await createHarness(t);
  const store = new SessionStore(root);
  const opened = await store.openArtifact(artifact);
  await store.replaceDrafts(opened.reviewToken, { drafts: [initialDraft()], packetNote: "" });

  const packet = await store.sendPacket(opened.reviewToken, { intent: "approve" });
  const state = await store.getBrowserState(opened.reviewToken);
  assert.equal(packet.intent, "approve");
  assert.equal(state.status, "ended");
  assert.equal(state.feedback[0].state, "accepted");
  assert.ok(state.feedback[0].acceptedAt);
});

test("decision responses are typed separately and cannot request revisions by themselves", async (t) => {
  const { root, artifact } = await createHarness(t);
  const store = new SessionStore(root);
  const opened = await store.openArtifact(artifact);
  const saved = await store.replaceDrafts(opened.reviewToken, {
    drafts: [decisionDraft()],
    packetNote: "",
  });

  assert.equal(saved.drafts[0].kind, "decision");
  assert.equal(saved.feedback.length, 0);
  await assert.rejects(
    () => store.sendPacket(opened.reviewToken, { intent: "revise" }),
    /at least one comment/i,
  );

  const packet = await store.sendPacket(opened.reviewToken, { intent: "approve" });
  assert.equal(packet.schemaVersion, 3);
  assert.equal(packet.intent, "approve");
  assert.equal(packet.decisions.length, 1);
  assert.equal(packet.decisions[0].kind, "decision");
  assert.deepEqual(packet.comments, []);

  const state = await store.getBrowserState(opened.reviewToken);
  assert.equal(state.status, "ended");
  assert.equal(state.feedback.length, 0);
  assert.deepEqual(state.packets[0].decisionIds, [packet.decisions[0].id]);

  const history = await store.getReviewHistory(opened.reviewToken);
  assert.equal(history.schemaVersion, 2);
  assert.equal(history.cycles[0].kind, "approval");
  assert.equal(history.cycles[0].decisions[0].body, packet.decisions[0].body);
  assert.deepEqual(history.cycles[0].comments, []);
  assert.deepEqual(history.cycles[0].amendments, []);
});

test("mixed revise packets report comments while keeping decisions as basis inputs", async (t) => {
  const { root, artifact } = await createHarness(t);
  const store = new SessionStore(root);
  const opened = await store.openArtifact(artifact);
  await store.replaceDrafts(opened.reviewToken, {
    drafts: [decisionDraft(), initialDraft()],
    packetNote: "",
  });

  const packet = await store.sendPacket(opened.reviewToken, { intent: "revise" });
  assert.equal(packet.decisions.length, 1);
  assert.equal(packet.comments.length, 1);
  assert.equal(packet.comments[0].id, "feedback-1");

  await writeFile(artifact, "<!doctype html><h1>A specific revision</h1>");
  await store.stageArtifact(artifact, {
    schemaVersion: 2,
    basisPacketIds: [packet.id],
    comments: [{
      commentId: "feedback-1",
      status: "addressed",
      before: "First revision",
      after: "A specific revision",
      summary: "Made the heading specific.",
      evidence: "The revised heading names the revision.",
      selector: "h1",
    }],
  });
  await store.revealStaged(opened.reviewToken);

  const history = await store.getReviewHistory(opened.reviewToken);
  assert.equal(history.cycles[0].decisions[0].id, packet.decisions[0].id);
  assert.equal(history.cycles[0].comments[0].id, "feedback-1");
  assert.equal(history.cycles[0].amendments.length, 1);
});

test("approval is rejected until a requested revision is revealed", async (t) => {
  const { root, artifact } = await createHarness(t);
  const store = new SessionStore(root);
  const opened = await store.openArtifact(artifact);
  await store.replaceDrafts(opened.reviewToken, { drafts: [initialDraft()], packetNote: "" });
  const revisePacket = await store.sendPacket(opened.reviewToken, { intent: "revise" });

  async function assertApprovalBlocked() {
    await assert.rejects(
      () => store.sendPacket(opened.reviewToken, { intent: "approve" }),
      (error) => {
        assert.equal(error.status, 409);
        assert.equal(error.code, "revision_pending");
        assert.match(error.message, /requested revision is revealed/i);
        return true;
      },
    );
  }

  await assertApprovalBlocked();
  await store.acknowledgePacket(revisePacket.sessionId, revisePacket.id);
  await assertApprovalBlocked();

  await writeFile(artifact, "<!doctype html><h1>A specific revision</h1>");
  await store.stageArtifact(artifact, {
    schemaVersion: 2,
    basisPacketIds: [revisePacket.id],
    comments: [{
      commentId: "feedback-1",
      status: "addressed",
      before: "First revision",
      after: "A specific revision",
      summary: "Made the heading specific.",
      evidence: "The revised heading names the revision.",
      selector: "h1",
    }],
  });
  await assertApprovalBlocked();

  await store.revealStaged(opened.reviewToken);
  const approval = await store.sendPacket(opened.reviewToken, { intent: "approve" });
  assert.equal(approval.intent, "approve");
  assert.equal((await store.getBrowserState(opened.reviewToken)).status, "ended");
});

test("version-one local sessions migrate drafts and queued packets without losing intent", async (t) => {
  const { root, artifact } = await createHarness(t);
  const store = new SessionStore(root);
  const opened = await store.openArtifact(artifact);
  await store.replaceDrafts(opened.reviewToken, { drafts: [initialDraft("feedback-sent")], packetNote: "" });
  await store.sendPacket(opened.reviewToken);
  await store.replaceDrafts(opened.reviewToken, { drafts: [initialDraft("feedback-unsent")], packetNote: "" });

  const manifestPath = path.join(root, "sessions", opened.sessionId, "manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  manifest.schemaVersion = 1;
  delete manifest.drafts[0].sourceRevisionId;
  delete manifest.packets[0].intent;
  delete manifest.packets[0].sourceRevisionId;
  delete manifest.revisions[0].basisPacketIds;
  const packetPath = path.join(root, "sessions", opened.sessionId, ...manifest.packets[0].path.split("/"));
  const packet = JSON.parse(await readFile(packetPath, "utf8"));
  packet.schemaVersion = 1;
  delete packet.intent;
  delete packet.submittedFromRevisionId;
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  await writeFile(packetPath, `${JSON.stringify(packet, null, 2)}\n`);

  const restarted = new SessionStore(root);
  const state = await restarted.getBrowserState(opened.reviewToken);
  assert.equal(state.schemaVersion, 2);
  assert.equal(state.drafts[0].sourceRevisionId, state.visibleRevision.id);
  assert.equal(state.packets[0].intent, "revise");
  assert.equal(state.latestPacket.intent, "revise");
  assert.equal((await restarted.nextQueuedPacket(artifact)).intent, "revise");
});

test("version-two comment packets remain readable after the typed-decision protocol change", async (t) => {
  const { root, artifact } = await createHarness(t);
  const store = new SessionStore(root);
  const opened = await store.openArtifact(artifact);
  await store.replaceDrafts(opened.reviewToken, { drafts: [initialDraft()], packetNote: "" });
  const sent = await store.sendPacket(opened.reviewToken, { intent: "revise" });

  const manifestPath = path.join(root, "sessions", opened.sessionId, "manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const packetPath = path.join(root, "sessions", opened.sessionId, ...manifest.packets[0].path.split("/"));
  const packet = JSON.parse(await readFile(packetPath, "utf8"));
  packet.schemaVersion = 2;
  delete packet.decisions;
  delete manifest.packets[0].decisionIds;
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  await writeFile(packetPath, `${JSON.stringify(packet, null, 2)}\n`);

  const restarted = new SessionStore(root);
  const delivered = await restarted.nextQueuedPacket(artifact);
  assert.equal(delivered.schemaVersion, 2);
  assert.equal(delivered.comments[0].id, sent.comments[0].id);
  assert.equal("decisions" in delivered, false);

  const history = await restarted.getReviewHistory(opened.reviewToken);
  assert.deepEqual(history.cycles[0].decisions, []);
  assert.equal(history.cycles[0].comments[0].id, sent.comments[0].id);
});

test("staging is invisible until reviewer reveal and reports only known feedback IDs", async (t) => {
  const { root, artifact } = await createHarness(t);
  const store = new SessionStore(root);
  const opened = await store.openArtifact(artifact);
  await store.replaceDrafts(opened.reviewToken, {
    drafts: [initialDraft()],
    packetNote: "",
  });
  const packet = await store.sendPacket(opened.reviewToken);

  await writeFile(artifact, "<!doctype html><h1>A specific first revision</h1>");
  await assert.rejects(
    () => store.stageArtifact(artifact, {
      packetId: packet.id,
      comments: [{
        commentId: "unknown-feedback",
        status: "addressed",
        summary: "Changed it.",
      }],
    }),
    /unknown feedback/i,
  );

  const staged = await store.stageArtifact(artifact, {
    packetId: packet.id,
    comments: [{
      commentId: "feedback-1",
      status: "addressed",
      summary: "Made the heading specific.",
      evidence: "The heading now names the revision.",
    }],
  });
  let state = await store.getBrowserState(opened.reviewToken);
  assert.equal(state.visibleRevision.id, opened.visibleRevision.id);
  assert.equal(state.stagedRevision.id, staged.revision.id);
  assert.notEqual(state.stagedRevision.id, state.visibleRevision.id);

  await assert.rejects(
    () => store.stageArtifact(artifact, null),
    /already staged/i,
  );

  await store.revealStaged(opened.reviewToken);
  state = await store.getBrowserState(opened.reviewToken);
  assert.equal(state.visibleRevision.id, staged.revision.id);
  assert.equal(state.stagedRevision, null);
  assert.equal(state.feedback[0].latestReport.status, "addressed");
});

test("review history groups comments and amendments by revealed revision without exposing staged evidence", async (t) => {
  const { root, artifact } = await createHarness(t);
  const store = new SessionStore(root);
  const opened = await store.openArtifact(artifact);
  await store.replaceDrafts(opened.reviewToken, { drafts: [initialDraft()], packetNote: "" });
  const packet = await store.sendPacket(opened.reviewToken, { intent: "revise" });

  let history = await store.getReviewHistory(opened.reviewToken);
  assert.equal(history.schemaVersion, 2);
  assert.equal(history.cycles[0].kind, "feedback");
  assert.equal(history.cycles[0].state, "queued");
  assert.equal(history.cycles[0].comments[0].body, "Make this heading more specific.");
  assert.equal(history.cycles[0].amendments.length, 0);

  await writeFile(artifact, "<!doctype html><h1>A specific first revision</h1>");
  const staged = await store.stageArtifact(artifact, {
    schemaVersion: 2,
    basisPacketIds: [packet.id],
    comments: [{
      commentId: "feedback-1",
      status: "addressed",
      summary: "Made the heading specific.",
      evidence: "The heading now names the first revision.",
      before: "First revision",
      after: "A specific first revision",
      selector: "h1",
    }],
  });

  history = await store.getReviewHistory(opened.reviewToken);
  assert.equal(history.cycles.some((cycle) => cycle.id === staged.revision.id), false);
  assert.equal(history.cycles[0].kind, "feedback");

  await store.revealStaged(opened.reviewToken);
  history = await store.getReviewHistory(opened.reviewToken);
  assert.equal(history.cycles[0].id, staged.revision.id);
  assert.equal(history.cycles[0].kind, "revision");
  assert.equal(history.cycles[0].comments[0].id, "feedback-1");
  assert.equal(history.cycles[0].amendments[0].after, "A specific first revision");
  assert.equal(history.cycles[0].amendments[0].feedbackState, "open");

  await store.acceptFeedback(opened.reviewToken, "feedback-1");
  history = await store.getReviewHistory(opened.reviewToken);
  assert.equal(history.cycles[0].amendments[0].feedbackState, "accepted");
  assert.ok(history.cycles[0].amendments[0].acceptedAt);
});

test("reopen requires a note and preserves the stable feedback identity", async (t) => {
  const { root, artifact } = await createHarness(t);
  const store = new SessionStore(root);
  const opened = await store.openArtifact(artifact);
  await store.replaceDrafts(opened.reviewToken, {
    drafts: [initialDraft()],
    packetNote: "",
  });
  await store.sendPacket(opened.reviewToken);
  await store.acceptFeedback(opened.reviewToken, "feedback-1");

  await assert.rejects(
    () => store.reopenFeedback(opened.reviewToken, "feedback-1", "   "),
    /note is required/i,
  );

  await store.reopenFeedback(
    opened.reviewToken,
    "feedback-1",
    "The wording is clearer, but it still needs the project name.",
  );
  let state = await store.getBrowserState(opened.reviewToken);
  assert.equal(state.feedback[0].state, "reopen-draft");
  assert.equal(state.drafts[0].id, "feedback-1");
  assert.equal(state.drafts[0].kind, "reopen");

  const followUp = await store.sendPacket(opened.reviewToken);
  assert.equal(followUp.comments[0].id, "feedback-1");
  assert.equal(followUp.comments[0].kind, "reopen");
  state = await store.getBrowserState(opened.reviewToken);
  assert.equal(state.feedback[0].state, "open");
  assert.equal(state.feedback[0].history.length, 2);
});

test("unsent drafts keep their source revision and v2 reports link changes to multiple batches", async (t) => {
  const { root, artifact } = await createHarness(t);
  const store = new SessionStore(root);
  const opened = await store.openArtifact(artifact);
  const firstRevisionId = opened.visibleRevision.id;

  await store.replaceDrafts(opened.reviewToken, { drafts: [initialDraft("feedback-old")], packetNote: "" });
  await writeFile(artifact, "<!doctype html><h1>Second revision</h1><p>Context</p>");
  await store.stageArtifact(artifact, null);
  await store.revealStaged(opened.reviewToken);
  let state = await store.getBrowserState(opened.reviewToken);
  const secondRevisionId = state.visibleRevision.id;
  assert.equal(state.drafts[0].sourceRevisionId, firstRevisionId);

  await store.replaceDrafts(opened.reviewToken, {
    drafts: [
      state.drafts[0],
      {
        ...initialDraft("feedback-new"),
        body: "Clarify the context.",
        anchor: { ...initialDraft().anchor, quote: "Context", selector: "p" },
      },
    ],
    packetNote: "",
  });
  const firstPacket = await store.sendPacket(opened.reviewToken, { intent: "revise" });
  assert.equal(firstPacket.comments[0].sourceRevisionId, firstRevisionId);
  assert.equal(firstPacket.comments[1].sourceRevisionId, secondRevisionId);

  await store.replaceDrafts(opened.reviewToken, {
    drafts: [{
      ...initialDraft("feedback-third"),
      body: "Add a useful caption.",
      anchor: { ...initialDraft().anchor, quote: "Context", selector: "p" },
    }],
    packetNote: "",
  });
  const secondPacket = await store.sendPacket(opened.reviewToken, { intent: "revise" });

  await writeFile(artifact, "<!doctype html><h1>Specific second revision</h1><p>Operational context</p>");
  await assert.rejects(
    () => store.stageArtifact(artifact, {
      schemaVersion: 2,
      basisPacketIds: [firstPacket.id],
      comments: [{
        commentId: "feedback-old",
        status: "addressed",
        summary: "Made the heading specific.",
        evidence: "The h1 names the revision.",
        before: "Second revision",
        after: "Specific second revision",
        selector: "h1",
      }],
    }),
    /omits feedback feedback-new/i,
  );
  const staged = await store.stageArtifact(artifact, {
    schemaVersion: 2,
    basisPacketIds: [firstPacket.id, secondPacket.id],
    comments: [
      {
        commentId: "feedback-old",
        status: "addressed",
        summary: "Made the heading specific.",
        evidence: "The h1 names the revision.",
        before: "Second revision",
        after: "Specific second revision",
        selector: "h1",
      },
      {
        commentId: "feedback-new",
        status: "stale",
        summary: "The generic context request no longer maps to a unique amendment.",
        evidence: "The later caption request superseded this wording-only note.",
      },
      {
        commentId: "feedback-third",
        status: "changed",
        summary: "Expanded the context caption.",
        evidence: "The paragraph now identifies operational context.",
        before: "Context",
        after: "Operational context",
        selector: "p",
      },
    ],
  });
  assert.deepEqual(staged.revision.basisPacketIds, [firstPacket.id, secondPacket.id]);
  state = await store.getBrowserState(opened.reviewToken);
  assert.equal(state.feedback.find((item) => item.id === "feedback-old").latestReport.before, "Second revision");
  assert.equal(state.feedback.find((item) => item.id === "feedback-third").latestReport.selector, "p");
});
