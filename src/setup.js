import { readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { atomicWriteJson } from "./atomic.js";
import { CliError } from "./axi.js";

const SETUP_AGENTS = Object.freeze(["codex", "claude"]);
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

function expectedEvents(agent) {
  const events = {SessionStart: expectedGroup(agent)};
  if (agent === "codex") {
    for (const [event, operation] of [["Stop", "guard"], ["Interrupt", "interrupt"]]) {
      events[event] = {hooks: [{type:"command", command:`blueprint hook ${operation} --agent codex`, commandWindows:`blueprint hook ${operation} --agent codex`, timeout:3, statusMessage:`Blueprint review ${operation}`} ]};
    }
  }
  return events;
}

function isBlueprintHandler(handler) {
  if (!handler || typeof handler !== "object") return false;
  if (![STATUS_MESSAGE, "Blueprint review guard", "Blueprint review interrupt"].includes(handler.statusMessage)) return false;
  const args = Array.isArray(handler.args) ? handler.args.join(" ") : "";
  return `${handler.command || ""} ${handler.commandWindows || ""} ${args}`.includes("blueprint")
    && /hook (context|guard|interrupt)/.test(`${handler.command || ""} ${handler.commandWindows || ""} ${args}`);
}

function sameJson(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function removeBlueprintHandlers(document) {
  const next = structuredClone(document);
  if (!next.hooks || typeof next.hooks !== "object" || Array.isArray(next.hooks)) return next;
  for (const event of ["SessionStart", "Stop", "Interrupt"]) {
    const groups = next.hooks[event];
    if (!Array.isArray(groups)) continue;
    const retained = groups
      .map((group) => {
        if (!group || typeof group !== "object" || !Array.isArray(group.hooks)) return group;
        return { ...group, hooks: group.hooks.filter((handler) => !isBlueprintHandler(handler)) };
      })
      .filter((group) => !group || typeof group !== "object" || !Array.isArray(group.hooks) || group.hooks.length > 0);
    if (retained.length === 0) delete next.hooks[event];
    else next.hooks[event] = retained;
  }
  return next;
}

function integrationState(document, agent) {
  const expected = expectedEvents(agent);
  if (Object.entries(expected).every(([event, group]) => document?.hooks?.[event]?.some(candidate => sameJson(candidate,group)))) return "installed";
  if (Object.values(document?.hooks ?? {}).some(groups => Array.isArray(groups) && groups.some(group => Array.isArray(group?.hooks) && group.hooks.some(isBlueprintHandler)))) return "stale";
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
    for (const event of ["SessionStart", "Stop", "Interrupt"]) {
      if (parsed.hooks?.[event] !== undefined && !Array.isArray(parsed.hooks[event])) throw new Error(`hooks.${event} must be an array`);
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
      for (const [event, group] of Object.entries(expectedEvents(agent))) {
        if (!Array.isArray(next.hooks[event])) next.hooks[event] = [];
        next.hooks[event].push(group);
      }
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
      trust: agent === "codex" ? "not checked; review changed hooks in Codex /hooks" : "runtime execution not checked",
    });
  }
  return results;
}
