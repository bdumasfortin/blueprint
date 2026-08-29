import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { manageHooks } from "../src/setup.js";

async function readJson(target) {
  return JSON.parse(await readFile(target, "utf8"));
}

test("hook setup is explicit, idempotent, repairable, and preserves unrelated settings", async (t) => {
  const home = await mkdtemp(path.join(tmpdir(), "blueprint-hooks-"));
  t.after(() => rm(home, { recursive: true, force: true }));
  const codexPath = path.join(home, ".codex", "hooks.json");
  const claudePath = path.join(home, ".claude", "settings.json");
  await mkdir(path.dirname(codexPath), { recursive: true });
  await mkdir(path.dirname(claudePath), { recursive: true });
  const externalHandler = { type: "command", command: "external-context", statusMessage: "External" };
  await writeFile(codexPath, JSON.stringify({
    description: "Existing Codex hooks",
    hooks: { SessionStart: [{ matcher: "startup", hooks: [externalHandler] }] },
  }));
  await writeFile(claudePath, JSON.stringify({
    theme: "dark",
    hooks: { SessionStart: [{ matcher: "startup", hooks: [externalHandler] }] },
  }));

  const first = await manageHooks("install", { agent: "all", configHome: home });
  assert.deepEqual(first.map((row) => [row.agent, row.state, row.changed]), [
    ["codex", "installed", true],
    ["claude", "installed", true],
  ]);
  const codexAfterFirst = await readFile(codexPath, "utf8");
  const claudeAfterFirst = await readFile(claudePath, "utf8");
  assert.equal((await readJson(codexPath)).description, "Existing Codex hooks");
  assert.equal((await readJson(claudePath)).theme, "dark");
  assert.equal((await readJson(codexPath)).hooks.SessionStart.length, 2);
  assert.equal((await readJson(claudePath)).hooks.SessionStart.length, 2);

  const second = await manageHooks("install", { agent: "all", configHome: home });
  assert.deepEqual(second.map((row) => row.changed), [false, false]);
  assert.equal(await readFile(codexPath, "utf8"), codexAfterFirst);
  assert.equal(await readFile(claudePath, "utf8"), claudeAfterFirst);

  const status = await manageHooks("status", { agent: "all", configHome: home });
  assert.deepEqual(status.map((row) => row.state), ["installed", "installed"]);

  const codex = await readJson(codexPath);
  const blueprintGroup = codex.hooks.SessionStart.at(-1);
  blueprintGroup.hooks[0].command = "C:\\stale\\blueprint hook context --agent codex";
  await writeFile(codexPath, JSON.stringify(codex));
  assert.equal((await manageHooks("status", { agent: "codex", configHome: home }))[0].state, "stale");
  const repaired = await manageHooks("install", { agent: "codex", configHome: home });
  assert.equal(repaired[0].state, "installed");
  assert.equal(repaired[0].changed, true);

  const removed = await manageHooks("remove", { agent: "all", configHome: home });
  assert.deepEqual(removed.map((row) => row.state), ["absent", "absent"]);
  assert.deepEqual((await readJson(codexPath)).hooks.SessionStart[0].hooks, [externalHandler]);
  assert.deepEqual((await readJson(claudePath)).hooks.SessionStart[0].hooks, [externalHandler]);
});

test("hook setup refuses invalid agent configuration without overwriting it", async (t) => {
  const home = await mkdtemp(path.join(tmpdir(), "blueprint-hooks-invalid-"));
  t.after(() => rm(home, { recursive: true, force: true }));
  const target = path.join(home, ".codex", "hooks.json");
  await mkdir(path.dirname(target), { recursive: true });
  const invalid = "{ invalid json";
  await writeFile(target, invalid);
  await assert.rejects(
    () => manageHooks("install", { agent: "codex", configHome: home }),
    (error) => error.code === "INVALID_AGENT_CONFIG" && /Refusing to modify/.test(error.message),
  );
  assert.equal(await readFile(target, "utf8"), invalid);
});
