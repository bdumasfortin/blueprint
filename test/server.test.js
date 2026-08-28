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
  await writeFile(artifact, "<!doctype html><h1>Sandbox me</h1>");

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
  assert.match(shell, /sandbox="allow-scripts"/);
  assert.doesNotMatch(shell, /allow-same-origin/);
  assert.match(shell, /Hold Alt\/Option to preview the exact element/);
  assert.match(shell, /Collapse inspector/);
  assert.match(shell, /Expand inspector/);
  assert.match(shell, />Send feedback<\/button>/);
  assert.doesNotMatch(shell, /Private local review|>Send packet<\/button>/);
  assert.match(shell, /<div class="sticky-action" id="send-area">[\s\S]*id="send-packet"[\s\S]*id="end-review"/);
  assert.doesNotMatch(shell, /Reveal artifact|Move earlier|Move later|Select text to comment|Copy latest packet|class="rail-mark"|Toggle inspector|Blueprint controls/);

  const wrongReviewer = await fetch(`${running.origin}/api/session/not-a-token/state`);
  assert.equal(wrongReviewer.status, 404);

  const stateResponse = await fetch(
    `${running.origin}/api/session/${encodeURIComponent(opened.reviewToken)}/state`,
  );
  assert.equal(stateResponse.status, 200);
  const state = await stateResponse.json();
  assert.ok(state.visibleRevision);
  assert.equal(state.stagedRevision, null);

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
  assert.doesNotMatch(artifactHtml, /mouseup|contextmenu|selectionDetail/);

  const artifactTokenOnReviewerRoute = await fetch(
    `${running.origin}/api/session/${encodeURIComponent(state.artifactToken)}/state`,
  );
  assert.equal(artifactTokenOnReviewerRoute.status, 404);

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
});
