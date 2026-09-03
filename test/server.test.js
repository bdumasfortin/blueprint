import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { startBlueprintServer } from "../src/server.js";

async function jsonRequest(url, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...options.headers,
    },
  });
}

test("agent and reviewer authorities are separated and artifact routes are sandboxed", async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), "blueprint-server-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const artifact = path.join(root, "artifact.html");
  await writeFile(artifact, "<!doctype html><title>Sandbox &amp; trust &lt;safe&gt;</title><h1>Sandbox me</h1>");

  const running = await startBlueprintServer({
    stateDir: path.join(root, "state"),
    adminToken: "agent-authority-token",
    port: 0,
  });
  t.after(() => running.close());

  const unauthorized = await jsonRequest(`${running.origin}/api/admin/open`, {
    method: "POST",
    body: JSON.stringify({ artifactPath: artifact }),
  });
  assert.equal(unauthorized.status, 401);

  const openedResponse = await jsonRequest(`${running.origin}/api/admin/open`, {
    method: "POST",
    headers: { authorization: "Bearer agent-authority-token" },
    body: JSON.stringify({ artifactPath: artifact }),
  });
  assert.equal(openedResponse.status, 200);
  const opened = await openedResponse.json();

  const shellResponse = await fetch(opened.reviewUrl);
  assert.equal(shellResponse.status, 200);
  const shell = await shellResponse.text();
  assert.match(shell, /<title>Sandbox &amp; trust &lt;safe&gt; · Blueprint<\/title>/);
  assert.match(shell, /<link rel="icon" type="image\/svg\+xml" href="data:image\/svg\+xml,/);
  assert.match(shell, /M5 12V5h7M20 5h7v7M27 20v7h-7M12 27H5v-7/);
  assert.doesNotMatch(shell, /M4 4h24v24H4zM4 16h24M16 4v24/);
  assert.match(shell, /document\.title = state\.reviewName \+ " · Blueprint"/);
  assert.match(shell, /document\.getElementById\("artifact-name"\)\.textContent = state\.reviewName/);
  assert.match(shell, /sandbox="allow-scripts"/);
  assert.doesNotMatch(shell, /allow-same-origin/);
  assert.match(shell, /Hold Alt\/Option and click any element to leave feedback/);
  assert.match(shell, /aria-label="Additional feedback" aria-keyshortcuts="Enter" placeholder="Additional feedback"/);
  assert.match(shell, /Feedback delivery has not been acknowledged\. Your comments remain saved locally/);
  assert.match(shell, />Copy feedback<\/button>/);
  assert.match(shell, /id="ended-curtain"[^>]*role="dialog"[^>]*aria-modal="true"/);
  assert.match(shell, /Review closed/);
  assert.match(shell, /Your final review submission is queued for the agent\. This review is now read-only\. You can close this tab\./);
  assert.match(shell, /id="ended-message">This review session has ended\. You can close this tab and return to your agent\.<\/p>/);
  assert.match(shell, /function retireReview\(title = "Review closed", message = "This review session has ended\. You can close this tab and return to your agent\."/);
  assert.match(shell, /retireReview\("Review ended", "This review session is closed\. You can close this tab and return to your agent\."\)/);
  assert.match(shell, /function retireReview\(title = "Review closed"/);
  assert.match(shell, /id="ended-actions"[^>]*hidden[\s\S]*id="view-approved-review"[^>]*>View approved review<\/button>/);
  assert.doesNotMatch(shell, /close-review-tab|Close tab|ended-close-help|window\.close\(\)|browser kept this tab open/i);
  assert.match(shell, /function isApprovedReview\(\)[\s\S]*state\.latestPacket\?\.intent === "approve"/);
  assert.match(shell, /function openApprovedReview\(\)[\s\S]*frame\.src = revisionUrl\(state\.visibleRevision, true\)/);
  assert.match(shell, /id="readonly-status"[^>]*hidden>Read only<\/div>/);
  assert.match(shell, /id="readonly-back"[^>]*hidden>Back to completion<\/button>/);
  assert.match(shell, /return readOnly \? url \+ "\?mode=readonly" : url/);
  assert.match(shell, /if \(readOnlyViewer\) next = "history"/);
  assert.match(shell, /app\.hidden = true/);
  assert.match(shell, /frame\.src = "about:blank"/);
  assert.match(shell, /clearInterval\(pollTimer\)/);
  assert.match(shell, /state\.status !== "active" \|\| reviewRetired \|\| sending/);
  assert.match(shell, /Revision requested\. Your sent feedback will stay visible while the agent works/);
  assert.match(shell, /Review submission copied/);
  assert.doesNotMatch(shell, /Hold Alt\/Option to preview an element, then click it to begin|Packet note · optional/);
  assert.doesNotMatch(shell, />Copy packet<\/button>|Your packet remains|Latest packet copied|No sent packet/);
  assert.doesNotMatch(shell, /Include in packet|included\.checked|draft\.included/);
  assert.match(shell, /event\.key === "Enter" && !event\.shiftKey && !event\.isComposing && !event\.repeat/);
  assert.match(shell, /additionalFeedbackField\.addEventListener\("keydown", queueAdditionalFeedbackOnEnter\)/);
  assert.match(shell, /textarea\.addEventListener\("keydown", queueDraftOnEnter\)/);
  const queuedDraftHandler = shell.match(/function queueDraftOnEnter\(event\) \{([\s\S]*?)\n    \}/)?.[1];
  assert.ok(queuedDraftHandler);
  assert.match(queuedDraftHandler, /event\.preventDefault\(\)/);
  assert.match(queuedDraftHandler, /event\.currentTarget\.blur\(\)/);
  assert.match(queuedDraftHandler, /void saveDrafts\(\)/);
  assert.doesNotMatch(queuedDraftHandler, /submitFeedback/);
  assert.match(shell, /type: "general"/);
  assert.match(shell, /quote: "General feedback"/);
  assert.match(shell, /setAttribute\("aria-keyshortcuts", "Enter"\)/);
  assert.match(shell, /if \(sending\) return/);
  assert.doesNotMatch(shell, /announcedStagedRevisionId|A revision is ready\. Reveal it when/);
  assert.match(shell, /Collapse inspector/);
  assert.match(shell, /Expand inspector/);
  assert.match(shell, /id="feedback-tab"[^>]*>Feedback/);
  assert.match(shell, /id="history-tab"[^>]*>History/);
  assert.doesNotMatch(shell, /id="verify-tab"[^>]*>Verify|id="drafts-tab"[^>]*>Drafts/);
  assert.match(shell, /id="feedback-pane"[\s\S]*id="decision-drafts"[\s\S]*id="decision-draft-list"[\s\S]*id="draft-list"[\s\S]*id="review-items"[\s\S]*id="feedback-list"[\s\S]*id="additional-feedback"/);
  assert.match(shell, /id="revision-progress"[\s\S]*id="revision-progress-title"[\s\S]*id="revision-progress-detail"/);
  assert.match(shell, /Revision requested · Waiting for agent/);
  assert.match(shell, /Agent working on revision/);
  assert.match(shell, /packet\.status === "delivered" \? " · received by agent" : " · waiting for agent"/);
  assert.match(shell, /Submitted feedback/);
  assert.match(shell, /feedback\.latestReport && feedback\.state !== "reopen-draft"/);
  assert.match(shell, /id="history-pane"[\s\S]*Read-only history of revealed revisions, decision responses, submitted comments, and reported amendments/);
  assert.match(shell, /state\.feedback\.filter\(\(feedback\) => feedback\.state !== "accepted"\)/);
  assert.match(shell, /reviewHistory = await api\("\/history"\)/);
  assert.match(shell, /activePane = "feedback"/);
  assert.match(shell, /id="approve-review"[^>]*>Approve<\/button>/);
  assert.match(shell, /id="revise-review"[^>]*hidden>Revise using feedback<\/button>/);
  assert.match(shell, /const hasFeedback = state\.drafts\.some\(\(draft\) => draft\.kind !== "decision"\)/);
  assert.match(shell, /approveButton\.textContent = hasFeedback \? "Approve with feedback" : "Approve"/);
  assert.match(shell, /reviseButton\.hidden = !hasFeedback/);
  assert.match(shell, /const approvalBlocked = pendingRevisionRequest\(\)\.packets\.length > 0 \|\| !!state\.stagedRevision/);
  assert.match(shell, /approveButton\.disabled = !active \|\| !draftsValid \|\| approvalBlocked/);
  assert.match(shell, /Approval is unavailable until the requested revision is revealed/);
  assert.match(shell, /revision\.sequence <= visibleSequence/);
  assert.match(shell, /JSON\.stringify\(\{ intent \}\)/);
  assert.match(shell, /Revision is ready/);
  assert.match(shell, /id="see-latest-revision"[^>]*>See latest revision<\/button>/);
  assert.match(shell, /app\.inert = !!stagedRevisionId/);
  assert.match(shell, /sourceRevisionId: state\.visibleRevision\.id/);
  assert.match(shell, /blueprint:change-map/);
  assert.match(shell, /function navigationAnchor\(label, selector/);
  assert.match(shell, /Show element: " \+ label/);
  assert.match(shell, /const targetSelector = currentReportSelector \|\| feedback\.anchor\.selector/);
  assert.match(shell, /event\.target\.closest\("button, a, input, textarea, select, summary, details"\)/);
  assert.match(shell, /card\.classList\.add\("navigable"\)/);
  assert.match(shell, /if \(feedback\.state === "accepted"[\s\S]*?\|\| !report\.selector\) return \[\]/);
  assert.match(shell, />Before<|beforeLabel\.textContent = "Before"/);
  assert.match(shell, />After<|afterLabel\.textContent = "After"/);
  assert.match(shell, /--canvas: #05070a/);
  assert.match(shell, /--accent: #43e5dd/);
  assert.match(shell, /background-size: 24px 24px/);
  assert.match(shell, /border-radius: 2px/);
  assert.match(shell, /@supports not selector\(::-webkit-scrollbar\) \{[\s\S]*?\.pane \{ scrollbar-color: var\(--line-strong\) var\(--canvas\); scrollbar-width: thin; \}/);
  assert.match(shell, /\.pane::-webkit-scrollbar \{ width: 10px; height: 10px; \}/);
  assert.match(shell, /\.pane::-webkit-scrollbar-track \{ background: var\(--canvas\); box-shadow: inset 1px 0 0 var\(--line\); \}/);
  assert.match(shell, /\.pane::-webkit-scrollbar-thumb \{[^}]*min-height: 40px;[^}]*border-radius: 2px;[^}]*background-color: var\(--line-strong\);[^}]*background-clip: padding-box/);
  assert.match(shell, /\.pane::-webkit-scrollbar-thumb:hover \{ background-color: rgba\(67, 229, 221, \.68\); \}/);
  assert.match(shell, /\.pane::-webkit-scrollbar-thumb:active \{ background-color: var\(--accent\); \}/);
  assert.match(shell, /\.toast-overlay \{ position: fixed; z-index: 60; inset: 0; display: grid/);
  assert.match(shell, /\.toast-overlay\.prominent \{ place-items: center; padding: 24px; background: rgba\(3, 5, 8, \.68\); backdrop-filter: blur\(3px\)/);
  assert.match(shell, /toast\("Revision requested\. Your sent feedback will stay visible while the agent works\.\", false, true\)/);
  assert.match(shell, /toastTimer = setTimeout\([\s\S]*?\}, 2800\)/);
  assert.match(shell, /#feedback-pane \{ display: flex; flex-direction: column; padding-bottom: 84px; \}/);
  assert.match(shell, /\.draft \{ display: grid; grid-template-columns: 4px minmax\(0, 1fr\) 38px/);
  assert.match(shell, /\.draft-rail \{[^}]*background: var\(--accent\)/);
  assert.match(shell, /\.draft textarea \{[^}]*height: 20px;[^}]*resize: none;[^}]*overflow: hidden/);
  assert.match(shell, /\.additional-feedback \{[^}]*height: 70px;[^}]*min-height: 70px;[^}]*resize: none;[^}]*overflow: hidden/);
  assert.match(shell, /function sizeAdditionalFeedback\(\) \{[\s\S]*?additionalFeedbackField\.style\.height = "0px";[\s\S]*?Math\.max\(70, additionalFeedbackField\.scrollHeight\)/);
  assert.match(shell, /additionalFeedbackField\.addEventListener\("input", \(\) => \{[\s\S]*sizeAdditionalFeedback\(\)/);
  assert.match(shell, /function captureFeedbackScroll\(\)[\s\S]*distanceFromBottom:[\s\S]*additionalFeedbackFocused: document\.activeElement === additionalFeedbackField/);
  assert.match(shell, /function restoreFeedbackScroll\(snapshot\)[\s\S]*additionalFeedbackField\.focus\(\{ preventScroll: true \}\)[\s\S]*additionalFeedbackField\.setSelectionRange/);
  assert.match(shell, /state\?\.updatedAt === nextState\.updatedAt[\s\S]*renderRecoveryState\(\);[\s\S]*return/);
  const saveDraftsHandler = shell.match(/async function saveDrafts\(\) \{([\s\S]*?)\n    \}/)?.[1];
  assert.ok(saveDraftsHandler);
  assert.match(saveDraftsHandler, /renderRecoveryState\(\)/);
  assert.doesNotMatch(saveDraftsHandler, /render\(\)/);
  assert.match(shell, /\.draft textarea:focus-visible \{ outline: none; \}/);
  assert.match(shell, /\.draft-delete \{ align-self: center; width: 32px; height: 32px; margin: 0 5px 0 0;[^}]*border: 0; background: transparent; color: var\(--danger\)/);
  assert.match(shell, /\.draft-delete svg \{[^}]*width: 17px; height: 17px/);
  assert.match(shell, /remove\.append\(trashIcon\(\)\)/);
  assert.match(shell, /button\.setAttribute\("aria-label", title\)/);
  assert.match(shell, /const paths = \["M3 6h18"/);
  assert.match(shell, /textarea\.style\.height = Math\.max\(20, textarea\.scrollHeight\) \+ "px"/);
  assert.match(shell, /textarea\.addEventListener\("input", \(\) => \{ sizeDraftEditor\(textarea\)/);
  assert.match(shell, /\.end-action \{ width: 40px; padding: 9px 0; font-size: 17px/);
  assert.doesNotMatch(shell, /Private local review|>Send packet<\/button>/);
  assert.match(shell, /<div class="sticky-action" id="send-area">[\s\S]*id="approve-review"[\s\S]*id="revise-review"[\s\S]*id="end-review"/);
  assert.doesNotMatch(shell, /Reveal artifact|Move earlier|Move later|Select text to comment|Copy latest packet|class="rail-mark"|Toggle inspector|Blueprint controls/);

  const wrongReviewer = await fetch(`${running.origin}/api/session/not-a-token/state`);
  assert.equal(wrongReviewer.status, 404);

  const stateResponse = await fetch(
    `${running.origin}/api/session/${encodeURIComponent(opened.reviewToken)}/state`,
  );
  assert.equal(stateResponse.status, 200);
  const state = await stateResponse.json();
  assert.equal(state.reviewName, "Sandbox & trust <safe>");
  assert.ok(state.visibleRevision);
  assert.equal(state.stagedRevision, null);

  const historyResponse = await fetch(
    `${running.origin}/api/session/${encodeURIComponent(opened.reviewToken)}/history`,
  );
  assert.equal(historyResponse.status, 200);
  const history = await historyResponse.json();
  assert.equal(history.schemaVersion, 2);
  assert.equal(history.cycles[0].kind, "initial");
  assert.equal(history.cycles[0].state, "visible");

  const artifactResponse = await fetch(
    `${running.origin}/artifact/${encodeURIComponent(state.artifactToken)}`
      + `/revision/${encodeURIComponent(state.visibleRevision.id)}`,
  );
  assert.equal(artifactResponse.status, 200);
  assert.match(
    artifactResponse.headers.get("content-security-policy"),
    /connect-src 'none'/,
  );
  const artifactHtml = await artifactResponse.text();
  assert.match(artifactHtml, /blueprint:annotation/);
  assert.match(artifactHtml, /dataset\.blueprintTargetPreview/);
  assert.match(artifactHtml, /event\.altKey/);
  assert.match(artifactHtml, /pointermove/);
  assert.match(artifactHtml, /event\.key !== "Alt"/);
  assert.match(artifactHtml, /getBoundingClientRect/);
  assert.match(artifactHtml, /pointer-events:none/);
  assert.match(artifactHtml, /border: 2px solid #43e5dd/);
  assert.match(artifactHtml, /background: #081417/);
  assert.match(artifactHtml, /dataset\.blueprintChangeMap/);
  assert.match(artifactHtml, /blueprint:focus-change/);
  assert.match(artifactHtml, /function renderFocusTarget\(\)/);
  assert.match(artifactHtml, /element\.scrollIntoView\(\{ behavior: reducedMotion \? "auto" : "smooth", block: "center", inline: "nearest" \}\)/);
  assert.match(artifactHtml, /focusTimer = setTimeout/);
  assert.match(artifactHtml, /\.focus \{ position: fixed;[\s\S]*?border: 2px solid #43e5dd/);
  assert.match(artifactHtml, /border: 2px solid #74e996/);
  assert.match(artifactHtml, /form\[data-blueprint-response\]/);
  assert.match(artifactHtml, /if \(!form \|\| !event\.isTrusted\) return/);
  assert.match(artifactHtml, /new FormData\(form\)\.entries\(\)/);
  assert.match(artifactHtml, /submitter\?\.form/);
  assert.match(artifactHtml, /form\?\.matches\("form\[data-blueprint-response\]"\)/);
  assert.match(artifactHtml, /if \(!form\.reportValidity\(\)\) return/);
  assert.match(artifactHtml, /type: "response"/);
  assert.match(artifactHtml, /Decision response queued\. It will be submitted with your next review action/);
  assert.doesNotMatch(artifactHtml, /mouseup|contextmenu|selectionDetail/);

  const readonlyArtifactResponse = await fetch(
    `${running.origin}/artifact/${encodeURIComponent(state.artifactToken)}`
      + `/revision/${encodeURIComponent(state.visibleRevision.id)}?mode=readonly`,
  );
  assert.equal(readonlyArtifactResponse.status, 200);
  assert.match(
    readonlyArtifactResponse.headers.get("content-security-policy"),
    /connect-src 'none'/,
  );
  const readonlyArtifactHtml = await readonlyArtifactResponse.text();
  assert.match(readonlyArtifactHtml, /<h1>Sandbox me<\/h1>/);
  assert.doesNotMatch(readonlyArtifactHtml, /blueprint:annotation|data-blueprint-runtime/);

  assert.match(shell, /function queueArtifactResponse\(detail\)/);
  assert.match(shell, /const base = "response-" \+ state\.visibleRevision\.sequence \+ "-" \+ responseId/);
  assert.match(shell, /state\.drafts\.splice\(existingIndex, 1, draft\)/);
  assert.match(shell, /kind: "decision"/);
  assert.match(shell, /if \(detail\?\.type === "response"\)/);
  const responseHandler = shell.match(/function queueArtifactResponse\(detail\) \{([\s\S]*?)\n    \}/)?.[1];
  assert.ok(responseHandler);
  assert.match(responseHandler, /void saveDrafts\(\)/);
  assert.doesNotMatch(responseHandler, /submitFeedback|\/send/);

  const artifactTokenOnReviewerRoute = await fetch(
    `${running.origin}/api/session/${encodeURIComponent(state.artifactToken)}/state`,
  );
  assert.equal(artifactTokenOnReviewerRoute.status, 404);
  const artifactTokenOnHistoryRoute = await fetch(
    `${running.origin}/api/session/${encodeURIComponent(state.artifactToken)}/history`,
  );
  assert.equal(artifactTokenOnHistoryRoute.status, 404);

  const reviewerTokenOnArtifactRoute = await fetch(
    `${running.origin}/artifact/${encodeURIComponent(opened.reviewToken)}`
      + `/revision/${encodeURIComponent(state.visibleRevision.id)}`,
  );
  assert.equal(reviewerTokenOnArtifactRoute.status, 404);

  const reviewerOnAdminRoute = await jsonRequest(`${running.origin}/api/admin/open`, {
    method: "POST",
    headers: { authorization: `Bearer ${opened.reviewToken}` },
    body: JSON.stringify({ artifactPath: artifact }),
  });
  assert.equal(reviewerOnAdminRoute.status, 401);

  const missingIntent = await jsonRequest(
    `${running.origin}/api/session/${encodeURIComponent(opened.reviewToken)}/send`,
    { method: "POST", body: "{}" },
  );
  assert.equal(missingIntent.status, 400);

  const approval = await jsonRequest(
    `${running.origin}/api/session/${encodeURIComponent(opened.reviewToken)}/send`,
    { method: "POST", body: JSON.stringify({ intent: "approve" }) },
  );
  assert.equal(approval.status, 200);
  assert.equal((await approval.json()).intent, "approve");
  const ended = await (
    await fetch(`${running.origin}/api/session/${encodeURIComponent(opened.reviewToken)}/state`)
  ).json();
  assert.equal(ended.status, "ended");
  assert.equal(ended.latestPacket.intent, "approve");
});
