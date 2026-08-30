import assert from "node:assert/strict";
import { execFile as execFileCallback } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

import { renderHookContext } from "../src/axi.js";
import { createSkillMarkdown, MAX_SKILL_MARKDOWN_CHARS } from "../src/skill.js";

const execFile = promisify(execFileCallback);
const repositoryRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const executable = path.join(repositoryRoot, "bin", "blueprint.js");

async function run(args, options = {}) {
  return execFile(process.execPath, [executable, ...args], {
    cwd: options.cwd ?? repositoryRoot,
    env: { ...process.env, ...options.env },
  });
}

test("the AXI home view is live, directory-scoped, and bounded", async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), "blueprint-axi-home-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const stateDir = path.join(root, "state");
  const project = path.join(root, "project");
  await mkdir(project, { recursive: true });

  for (let index = 0; index < 7; index += 1) {
    const sessionDir = path.join(stateDir, "sessions", `session-${index}`);
    await mkdir(sessionDir, { recursive: true });
    await writeFile(path.join(sessionDir, "manifest.json"), JSON.stringify({
      artifactPath: path.join(project, `artifact-${index}.html`),
      status: "active",
      updatedAt: new Date(1_000 + index).toISOString(),
      stagedRevisionId: index === 6 ? "revision-2" : null,
      feedback: index === 6 ? [{ state: "open" }] : [],
      packets: index === 6 ? [{ status: "queued" }] : [],
    }));
  }

  const environment = { BLUEPRINT_STATE_DIR: stateDir };
  const compact = await run([], { cwd: project, env: environment });
  assert.match(compact.stdout, /description: "Local, human-gated HTML review/);
  assert.match(compact.stdout, /active_review_count: 7/);
  assert.match(compact.stdout, /reviews\[5\]/);
  assert.match(compact.stdout, /truncated_reviews: 2/);
  assert.doesNotMatch(compact.stdout, /Usage:/);
  assert.doesNotMatch(compact.stdout, /reviewToken|artifactToken|adminToken/);

  const full = await run(["--full"], { cwd: project, env: environment });
  assert.match(full.stdout, /reviews\[7\]/);
  assert.doesNotMatch(full.stdout, /truncated_reviews:/);
});

test("the AXI CLI exposes playbooks, focused help, and loud structured option errors", async () => {
  const playbooks = await run(["playbook"]);
  assert.match(playbooks.stdout, /playbooks\[3\]/);
  assert.match(playbooks.stdout, /"artifact"/);
  assert.match(playbooks.stdout, /"decision"/);
  assert.match(playbooks.stdout, /"review-loop"/);

  const artifactPlaybook = await run(["playbook", "artifact"]);
  assert.match(artifactPlaybook.stdout, /playbook_version: 7/);
  assert.match(artifactPlaybook.stdout, /radios for mutually exclusive options/);
  assert.match(artifactPlaybook.stdout, /data-blueprint-response/);
  assert.match(artifactPlaybook.stdout, /Queue response/);
  assert.match(artifactPlaybook.stdout, /states or transitions/);

  const decisionPlaybook = await run(["playbook", "decision"]);
  assert.match(decisionPlaybook.stdout, /labelled radio group/);
  assert.match(decisionPlaybook.stdout, /prefers-reduced-motion/);
  assert.match(decisionPlaybook.stdout, /re-queueing the same form replaces that unsent draft/);

  const reviewLoopPlaybook = await run(["playbook", "review-loop"]);
  assert.match(reviewLoopPlaybook.stdout, /blueprint review <artifact\.html>/);
  assert.match(reviewLoopPlaybook.stdout, /Do not end the turn while that command is still waiting/);
  assert.match(reviewLoopPlaybook.stdout, /Final approval is unavailable after a revise packet/);
  assert.match(reviewLoopPlaybook.stdout, /until a revision covering that request is staged and the reviewer reveals it/);

  const focused = await run(["open", "--help"]);
  assert.match(focused.stdout, /^Usage: blueprint open/m);
  assert.match(focused.stdout, /Prefer `blueprint review` for normal launches/);
  assert.doesNotMatch(focused.stdout, /blueprint setup/);

  const atomicReviewHelp = await run(["review", "--help"]);
  assert.match(atomicReviewHelp.stdout, /^Usage: blueprint review/m);
  assert.match(atomicReviewHelp.stdout, /stay attached until one feedback packet arrives/);
  assert.match(atomicReviewHelp.stdout, /standard output remains exact packet JSON/);

  await assert.rejects(
    () => run(["open", "--invented"]),
    (error) => {
      assert.equal(error.code, 2);
      assert.match(error.stdout, /error\.code: "UNKNOWN_OPTION"/);
      assert.match(error.stdout, /error\.message:/);
      assert.equal(error.stderr, "");
      return true;
    },
  );
});

test("SessionStart context is compact valid hook JSON without secrets", async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), "blueprint-axi-hook-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const stateDir = path.join(root, "state");
  const output = await renderHookContext("codex", { cwd: root, stateDir });
  const parsed = JSON.parse(output);
  assert.deepEqual(Object.keys(parsed), ["hookSpecificOutput"]);
  assert.equal(parsed.hookSpecificOutput.hookEventName, "SessionStart");
  assert.match(parsed.hookSpecificOutput.additionalContext, /Blueprint AXI is available/);
  assert.match(parsed.hookSpecificOutput.additionalContext, /active_review_count: 0/);
  assert.match(parsed.hookSpecificOutput.additionalContext, /blueprint review <artifact\.html>/);
  assert.ok(parsed.hookSpecificOutput.additionalContext.length < 1800);
  assert.doesNotMatch(output, /reviewToken|artifactToken|adminToken/);

  const brokenSession = path.join(stateDir, "sessions", "broken");
  await mkdir(brokenSession, { recursive: true });
  await writeFile(path.join(brokenSession, "manifest.json"), "{ broken json");
  const recovered = JSON.parse(await renderHookContext("claude", { cwd: root, stateDir }));
  assert.match(recovered.hookSpecificOutput.additionalContext, /live_state_error:/);
  assert.match(recovered.hookSpecificOutput.additionalContext, /run `blueprint`/);
});

test("the packaged Blueprint skill is a generated discovery stub", async () => {
  const expected = createSkillMarkdown();
  const actual = await readFile(path.join(repositoryRoot, "skills", "blueprint", "SKILL.md"), "utf8");
  assert.equal(actual, expected);
  assert.ok(actual.length < MAX_SKILL_MARKDOWN_CHARS);
  assert.match(actual, /name: blueprint/);
  assert.match(actual, /Treat the CLI as the source of truth/);
  assert.match(actual, /blueprint review <artifact\.html>/);
  assert.match(actual, /Do not end the turn while it is waiting/);
  assert.doesNotMatch(actual, /127\.0\.0\.1|implementation detail/i);
});
