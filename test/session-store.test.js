import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
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
