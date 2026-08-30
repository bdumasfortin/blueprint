import assert from "node:assert/strict";
import { execFile as execFileCallback } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

import { startBlueprintServer } from "../src/server.js";

const execFile = promisify(execFileCallback);
const repositoryRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const executable = path.join(repositoryRoot, "bin", "blueprint.js");

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { "content-type": "application/json", ...options.headers },
  });
  const payload = response.status === 204 ? null : await response.json();
  assert.equal(response.status, 200, payload?.error);
  return payload;
}

test("a graceful service stop removes only its own discovery record", async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), "blueprint-service-stop-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const stateDir = path.join(root, "state");

  const first = await startBlueprintServer({ stateDir, port: 0, adminToken: "first-token" });
  const second = await startBlueprintServer({ stateDir, port: 0, adminToken: "second-token" });
  t.after(async () => {
    if (first.server.listening) await first.close();
    if (second.server.listening) await second.close();
  });

  const successor = JSON.parse(await readFile(path.join(stateDir, "server.json"), "utf8"));
  assert.equal(successor.port, second.port);
  assert.equal(successor.adminToken, "second-token");

  await first.close();
  const preserved = JSON.parse(await readFile(path.join(stateDir, "server.json"), "utf8"));
  assert.equal(preserved.port, second.port);
  assert.equal(preserved.adminToken, "second-token");

  await second.close();
  await assert.rejects(readFile(path.join(stateDir, "server.json")), { code: "ENOENT" });
});

test("the CLI replaces a stale discovery record and starts a healthy service", async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), "blueprint-stale-service-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const stateDir = path.join(root, "state");
  const artifact = path.join(root, "artifact.html");
  await writeFile(artifact, "<!doctype html><h1>Recover the service</h1>");
  await mkdir(stateDir, { recursive: true });
  await writeFile(path.join(stateDir, "server.json"), JSON.stringify({
    schemaVersion: 1,
    pid: 999_999,
    port: 1,
    adminToken: "stale-token",
    startedAt: "2000-01-01T00:00:00.000Z",
  }));
  const environment = { ...process.env, BLUEPRINT_STATE_DIR: stateDir };

  let serviceRecord = null;
  t.after(() => {
    if (!serviceRecord?.pid || serviceRecord.pid === process.pid) return;
    try { process.kill(serviceRecord.pid, "SIGTERM"); } catch {}
  });
  const opened = await execFile(
    process.execPath,
    [executable, "open", artifact, "--no-open"],
    { cwd: repositoryRoot, env: environment },
  );
  assert.match(opened.stdout.trim(), /^http:\/\/127\.0\.0\.1:\d+\/review\//);

  serviceRecord = JSON.parse(await readFile(path.join(stateDir, "server.json"), "utf8"));
  assert.notEqual(serviceRecord.port, 1);
  assert.notEqual(serviceRecord.adminToken, "stale-token");
  const health = await request(`http://127.0.0.1:${serviceRecord.port}/api/admin/health`, {
    headers: { authorization: `Bearer ${serviceRecord.adminToken}` },
  });
  assert.equal(health.status, "ok");
});

test("a staged revision and private draft survive a complete service restart", async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), "blueprint-restart-cycle-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const stateDir = path.join(root, "state");
  const artifact = path.join(root, "artifact.html");
  await writeFile(artifact, "<!doctype html><h1>Before restart</h1>");

  const first = await startBlueprintServer({ stateDir, port: 0, adminToken: "agent-one" });
  const opened = await request(`${first.origin}/api/admin/open`, {
    method: "POST",
    headers: { authorization: "Bearer agent-one" },
    body: JSON.stringify({ artifactPath: artifact }),
  });
  const reviewer = `${first.origin}/api/session/${encodeURIComponent(opened.reviewToken)}`;
  const initial = await request(`${reviewer}/state`);
  await request(`${reviewer}/drafts`, {
    method: "PUT",
    body: JSON.stringify({
      packetNote: "",
      drafts: [{
        id: "feedback-restart",
        kind: "initial",
        body: "Update the heading.",
        createdAt: new Date().toISOString(),
        sourceRevisionId: initial.visibleRevision.id,
        anchor: { type: "element", quote: "Before restart", prefix: "", suffix: "", selector: "h1" },
      }],
    }),
  });
  const packet = await request(`${reviewer}/send`, {
    method: "POST",
    body: JSON.stringify({ intent: "revise" }),
  });
  await request(`${first.origin}/api/admin/ack`, {
    method: "POST",
    headers: { authorization: "Bearer agent-one" },
    body: JSON.stringify({ sessionId: packet.sessionId, packetId: packet.id }),
  });
  await writeFile(artifact, "<!doctype html><h1>After restart</h1>");
  const staged = await request(`${first.origin}/api/admin/stage`, {
    method: "POST",
    headers: { authorization: "Bearer agent-one" },
    body: JSON.stringify({
      artifactPath: artifact,
      report: {
        schemaVersion: 2,
        basisPacketIds: [packet.id],
        comments: [{
          commentId: "feedback-restart",
          status: "addressed",
          summary: "Updated the heading.",
          evidence: "The h1 contains the requested text.",
          before: "Before restart",
          after: "After restart",
          selector: "h1",
        }],
      },
    }),
  });
  assert.ok(staged.revision.id);

  await request(`${reviewer}/drafts`, {
    method: "PUT",
    body: JSON.stringify({
      packetNote: "",
      drafts: [{
        id: "draft-after-stage",
        kind: "initial",
        body: "Keep this private through restart.",
        createdAt: new Date().toISOString(),
        sourceRevisionId: initial.visibleRevision.id,
        anchor: { type: "general", quote: "General feedback", prefix: "", suffix: "", selector: "" },
      }],
    }),
  });
  await first.close();

  const second = await startBlueprintServer({ stateDir, port: 0, adminToken: "agent-two" });
  t.after(() => second.close());
  const restoredReviewer = `${second.origin}/api/session/${encodeURIComponent(opened.reviewToken)}`;
  const restored = await request(`${restoredReviewer}/state`);
  assert.equal(restored.visibleRevision.id, initial.visibleRevision.id);
  assert.equal(restored.stagedRevision.id, staged.revision.id);
  assert.equal(restored.drafts[0].id, "draft-after-stage");
  assert.equal(restored.feedback[0].latestReport.after, "After restart");

  const revealed = await request(`${restoredReviewer}/reveal`, { method: "POST", body: "{}" });
  assert.equal(revealed.visibleRevision.id, staged.revision.id);
  assert.equal(revealed.drafts[0].id, "draft-after-stage");
  const history = await request(`${restoredReviewer}/history`);
  assert.equal(history.cycles[0].revision.id, staged.revision.id);
  assert.equal(history.cycles[0].amendments[0].after, "After restart");
});
