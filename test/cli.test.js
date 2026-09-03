import assert from "node:assert/strict";
import { execFile as execFileCallback, spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

import { waitForPacketDelivery } from "../src/cli.js";
import { startBlueprintServer } from "../src/server.js";

const execFile = promisify(execFileCallback);
const repositoryRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const executable = path.join(repositoryRoot, "bin", "blueprint.js");

function runAttached(args, options = {}) {
  const child = spawn(process.execPath, [executable, ...args], {
    cwd: options.cwd ?? repositoryRoot,
    env: { ...process.env, ...options.env },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let stdout = "";
  let stderr = "";
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk) => { stdout += chunk; });
  child.stderr.on("data", (chunk) => { stderr += chunk; });
  const completed = new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("close", (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`Attached CLI exited ${code}: ${stderr || stdout}`));
    });
  });
  return { child, completed, stdout: () => stdout, stderr: () => stderr };
}

async function waitUntil(predicate, message, timeoutMs = 5_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await delay(10);
  }
  throw new Error(message);
}

test("the feedback wait survives a quiet request timeout", async () => {
  const packet = { id: "packet-after-timeout" };
  let attempts = 0;
  let delivered = null;
  await waitForPacketDelivery({ port: 1, adminToken: "test" }, "C:\\artifact.html", {
    pollTimeoutMs: 1,
    requestTimeoutMs: 2,
    async requestPacket() {
      attempts += 1;
      if (attempts === 1) throw new DOMException("The operation was aborted due to timeout", "TimeoutError");
      return packet;
    },
    async deliverPacket(_record, value) {
      delivered = value;
    },
  });
  assert.equal(attempts, 2);
  assert.equal(delivered, packet);
});

test("review atomically opens and stays attached until one packet is delivered", async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), "blueprint-review-cli-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const stateDir = path.join(root, "state");
  const artifact = path.join(root, "artifact.html");
  await writeFile(artifact, "<!doctype html><h1>Atomic review</h1>");

  const running = await startBlueprintServer({ stateDir, port: 0 });
  t.after(() => running.close());
  const environment = { BLUEPRINT_STATE_DIR: stateDir };
  const attached = runAttached(["review", artifact, "--no-open"], { env: environment });
  t.after(() => {
    if (attached.child.exitCode === null) attached.child.kill();
  });

  await waitUntil(
    () => /review_url: "http:\/\/127\.0\.0\.1:\d+\/review\//.test(attached.stderr()),
    "Atomic review did not report its reviewer URL.",
  );
  assert.equal(attached.child.exitCode, null);
  assert.equal(attached.stdout(), "");
  assert.match(attached.stderr(), /status: "waiting for one intent-bearing feedback packet"/);

  const reviewUrl = JSON.parse(attached.stderr().match(/review_url: ("[^"]+")/)[1]);
  const reviewToken = decodeURIComponent(new URL(reviewUrl).pathname.split("/").at(-1));
  const browserBase = `${running.origin}/api/session/${encodeURIComponent(reviewToken)}`;
  const state = await api(`${browserBase}/state`);
  await api(`${browserBase}/drafts`, {
    method: "PUT",
    body: JSON.stringify({
      packetNote: "",
      drafts: [{
        id: "feedback-atomic-1",
        kind: "initial",
        body: "Keep the launch attached.",
        createdAt: new Date().toISOString(),
        sourceRevisionId: state.visibleRevision.id,
        anchor: { type: "general", quote: "General feedback", prefix: "", suffix: "", selector: "" },
      }],
    }),
  });
  const packet = await api(`${browserBase}/send`, {
    method: "POST",
    body: JSON.stringify({ intent: "revise" }),
  });

  const completed = await attached.completed;
  assert.equal(JSON.parse(completed.stdout).id, packet.id);
  assert.doesNotMatch(completed.stdout, /review_url|http:\/\/127\.0\.0\.1/);
  assert.equal((await api(`${browserBase}/state`)).packets[0].status, "delivered");
});

async function api(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { "content-type": "application/json", ...options.headers },
  });
  const payload = await response.json();
  assert.equal(response.status, 200, payload.error);
  return payload;
}

test("the CLI drives one acknowledged feedback and staged-revision cycle", async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), "blueprint-cli-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const stateDir = path.join(root, "state");
  const artifact = path.join(root, "artifact.html");
  const reportFile = path.join(root, "report.json");
  await writeFile(artifact, "<!doctype html><h1>First heading</h1>");

  const running = await startBlueprintServer({ stateDir, port: 0 });
  t.after(() => running.close());
  const environment = { ...process.env, BLUEPRINT_STATE_DIR: stateDir };

  const openedProcess = await execFile(
    process.execPath,
    [executable, "open", artifact, "--no-open"],
    { cwd: repositoryRoot, env: environment },
  );
  const reviewUrl = openedProcess.stdout.trim();
  assert.match(reviewUrl, /^http:\/\/127\.0\.0\.1:\d+\/review\//);
  const reviewToken = decodeURIComponent(new URL(reviewUrl).pathname.split("/").at(-1));
  const browserBase = `${running.origin}/api/session/${encodeURIComponent(reviewToken)}`;

  let state = await api(`${browserBase}/state`);
  const originalRevisionId = state.visibleRevision.id;
  await api(`${browserBase}/drafts`, {
    method: "PUT",
    body: JSON.stringify({
      packetNote: "",
      drafts: [{
        id: "feedback-cli-1",
        kind: "initial",
        body: "Name the project in the heading.",
        included: true,
        createdAt: new Date().toISOString(),
        anchor: {
          type: "element",
          quote: "First heading",
          prefix: "",
          suffix: "",
          selector: "h1",
        },
      }],
    }),
  });
  const packet = await api(`${browserBase}/send`, {
    method: "POST",
    body: JSON.stringify({ intent: "revise" }),
  });

  const waited = await execFile(
    process.execPath,
    [executable, "wait", artifact],
    { cwd: repositoryRoot, env: environment },
  );
  assert.equal(JSON.parse(waited.stdout).id, packet.id);
  state = await api(`${browserBase}/state`);
  assert.equal(state.packets[0].status, "delivered");

  await writeFile(artifact, "<!doctype html><h1>Blueprint first heading</h1>");
  await writeFile(reportFile, JSON.stringify({
    schemaVersion: 2,
    basisPacketIds: [packet.id],
    comments: [{
      commentId: "feedback-cli-1",
      status: "addressed",
      summary: "Named Blueprint in the heading.",
      evidence: "The h1 now starts with Blueprint.",
      before: "First heading",
      after: "Blueprint first heading",
      selector: "h1",
    }],
  }));
  const stagedProcess = await execFile(
    process.execPath,
    [executable, "stage", artifact, "--report", reportFile],
    { cwd: repositoryRoot, env: environment },
  );
  const staged = JSON.parse(stagedProcess.stdout);
  state = await api(`${browserBase}/state`);
  assert.equal(state.visibleRevision.id, originalRevisionId);
  assert.equal(state.stagedRevision.id, staged.revision.id);
  assert.equal(state.feedback[0].latestReport.status, "addressed");
  assert.equal(state.feedback[0].latestReport.after, "Blueprint first heading");
});

test("the CLI reports the approved visual authority without inheriting workspace design", async () => {
  const result = await execFile(
    process.execPath,
    [executable, "design"],
    { cwd: repositoryRoot },
  );
  assert.match(result.stdout, /Blueprint artifact design contract/);
  assert.match(result.stdout, /Do not automatically inspect, infer, or inherit a design system/);
  assert.match(result.stdout, /explicitly state a preferred design system for Blueprint artifacts/);
  assert.match(result.stdout, /approved visual source of truth/);
  assert.match(result.stdout, /uniform 24-pixel non-blue graphite grid/);
  assert.match(result.stdout, /distinct brass meta layer/);
  assert.match(result.stdout, /#d8a34d/);
  assert.match(result.stdout, /operable labelled form/);
  assert.match(result.stdout, /human-readable project or workspace name before the review title/);
  assert.match(result.stdout, /complete preview of every decision, preference, or confirmation/);
  assert.match(result.stdout, /Collapse supporting evidence and edge cases by default/);
  assert.match(result.stdout, /Omit background and rationale already established in the conversation/);
  assert.match(result.stdout, /data-blueprint-response/);
  assert.match(result.stdout, /Queue response/);
  assert.match(result.stdout, /decision-relevant states, transitions, or microinteractions/);
  assert.match(result.stdout, /prefers-reduced-motion/);
  assert.match(result.stdout, /Do not use this treatment for ordinary product content/);
  assert.match(result.stdout, /Runtime review-chrome implementation was separately approved and completed/);
  assert.match(result.stdout, /without rewriting authored artifact styles/);
});
