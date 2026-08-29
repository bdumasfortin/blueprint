import { readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { atomicWriteJson } from "./atomic.js";
import { CliError } from "./axi.js";

export const SETUP_AGENTS = Object.freeze(["codex", "claude"]);
const STATUS_MESSAGE = "Loading Blueprint review context";

function codexHandler() {
  return {
    type: "command",
    command: "blueprint hook context --agent codex",
    commandWindows: "blueprint hook context --agent codex",
    timeout: 5,
    statusMessage: STATUS_MESSAGE,
    additionalContextLimit: 1200,
  };
}

function claudeHandler() {
  return {
    type: "command",
    command: "blueprint",
    args: ["hook", "context", "--agent", "claude"],
    timeout: 5,
    statusMessage: STATUS_MESSAGE,
  };
}

function expectedGroup(agent) {
  return {
    matcher: agent === "codex" ? "startup|resume|clear|compact" : "startup|resume|clear|compact|fork",
    hooks: [agent === "codex" ? codexHandler() : claudeHandler()],
  };
}

function isBlueprintHandler(handler) {
  if (!handler || typeof handler !== "object") return false;
  if (handler.statusMessage !== STATUS_MESSAGE) return false;
  const args = Array.isArray(handler.args) ? handler.args.join(" ") : "";
  return `${handler.command || ""} ${handler.commandWindows || ""} ${args}`.includes("blueprint")
    && `${handler.command || ""} ${handler.commandWindows || ""} ${args}`.includes("hook context");
}

function sameJson(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function removeBlueprintHandlers(document) {
  const next = structuredClone(document);
  if (!next.hooks || typeof next.hooks !== "object" || Array.isArray(next.hooks)) return next;
  const groups = next.hooks.SessionStart;
  if (!Array.isArray(groups)) return next;
  const retained = groups
    .map((group) => {
      if (!group || typeof group !== "object" || !Array.isArray(group.hooks)) return group;
      return { ...group, hooks: group.hooks.filter((handler) => !isBlueprintHandler(handler)) };
    })
    .filter((group) => !group || typeof group !== "object" || !Array.isArray(group.hooks) || group.hooks.length > 0);
  if (retained.length === 0) delete next.hooks.SessionStart;
  else next.hooks.SessionStart = retained;
  return next;
}

function integrationState(document, agent) {
  const groups = document?.hooks?.SessionStart;
  if (!Array.isArray(groups)) return "absent";
  const expected = expectedGroup(agent);
  for (const group of groups) {
    if (sameJson(group, expected)) return "installed";
  }
  for (const group of groups) {
    if (Array.isArray(group?.hooks) && group.hooks.some(isBlueprintHandler)) return "stale";
  }
  return "absent";
}

async function readConfig(target) {
  try {
    const contents = await readFile(target, "utf8");
    const parsed = JSON.parse(contents);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("top-level JSON value must be an object");
    }
    if (parsed.hooks !== undefined && (!parsed.hooks || typeof parsed.hooks !== "object" || Array.isArray(parsed.hooks))) {
      throw new Error("`hooks` must be an object");
    }
    if (parsed.hooks?.SessionStart !== undefined && !Array.isArray(parsed.hooks.SessionStart)) {
      throw new Error("`hooks.SessionStart` must be an array");
    }
    return { document: parsed, exists: true };
  } catch (error) {
    if (error?.code === "ENOENT") return { document: {}, exists: false };
    throw new CliError("INVALID_AGENT_CONFIG", `Refusing to modify ${target}: ${error.message}`, {
      help: ["Repair the JSON manually, then rerun the same Blueprint setup command."],
    });
  }
}

function configPath(agent, options = {}) {
  const env = options.env ?? process.env;
  const home = path.resolve(options.configHome ?? os.homedir());
  if (agent === "codex") {
    const root = options.configHome ? path.join(home, ".codex") : (env.CODEX_HOME || path.join(home, ".codex"));
    return path.join(root, "hooks.json");
  }
  const root = options.configHome ? path.join(home, ".claude") : (env.CLAUDE_CONFIG_DIR || path.join(home, ".claude"));
  return path.join(root, "settings.json");
}

function normalizedAgents(agent) {
  if (agent === "all") return [...SETUP_AGENTS];
  if (!SETUP_AGENTS.includes(agent)) {
    throw new CliError("UNKNOWN_AGENT", `Unknown setup agent: ${agent}`, {
      exitCode: 2,
      help: ["Use `--agent codex`, `--agent claude`, or `--agent all`."],
    });
  }
  return [agent];
}

export async function manageHooks(operation, options = {}) {
  const agents = normalizedAgents(options.agent ?? "all");
  const results = [];
  for (const agent of agents) {
    const target = configPath(agent, options);
    const loaded = await readConfig(target);
    const beforeState = integrationState(loaded.document, agent);
    let next = loaded.document;
    if (operation === "install") {
      next = removeBlueprintHandlers(next);
      if (!next.hooks) next.hooks = {};
      if (!Array.isArray(next.hooks.SessionStart)) next.hooks.SessionStart = [];
      next.hooks.SessionStart.push(expectedGroup(agent));
    } else if (operation === "remove") {
      next = removeBlueprintHandlers(next);
    } else if (operation !== "status") {
      throw new CliError("UNKNOWN_SETUP_OPERATION", `Unknown setup operation: ${operation}`, { exitCode: 2 });
    }
    const changed = !sameJson(next, loaded.document);
    if (operation !== "status" && changed) await atomicWriteJson(target, next);
    results.push({
      agent,
      state: operation === "remove" ? integrationState(next, agent) : integrationState(operation === "status" ? loaded.document : next, agent),
      changed,
      config: target,
      previousState: beforeState,
    });
  }
  return results;
}
