import { readdir, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { getStateRoot } from "./paths.js";

export const AXI_CONTRACT_VERSION = 1;
export const CLI_DESCRIPTION = "Local, human-gated HTML review for one person and one agent.";
export const DEFAULT_SESSION_LIMIT = 5;
export const HOOK_SESSION_LIMIT = 3;
export const FULL_SESSION_LIMIT = 100;

export class CliError extends Error {
  constructor(code, message, options = {}) {
    super(message, options);
    this.name = "CliError";
    this.code = code;
    this.exitCode = options.exitCode ?? 1;
    this.help = options.help ?? [];
  }
}

function scalar(value) {
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value === null || value === undefined) return "null";
  return JSON.stringify(String(value));
}

export function renderFields(entries) {
  return entries.map(([key, value]) => `${key}: ${scalar(value)}`).join("\n");
}

export function renderList(name, values) {
  if (values.length === 0) return `${name}[0]:`;
  return `${name}[${values.length}]:\n${values.map((value) => `  ${scalar(value)}`).join("\n")}`;
}

export function renderTable(name, rows, columns) {
  if (rows.length === 0) return `${name}[0]{${columns.join(",")}}:`;
  const body = rows.map((row) => `  ${columns.map((column) => scalar(row[column])).join(",")}`).join("\n");
  return `${name}[${rows.length}]{${columns.join(",")}}:\n${body}`;
}

export function formatCliError(error) {
  const code = error?.code || "UNEXPECTED_ERROR";
  const message = error?.message || "Blueprint failed without an error message.";
  const help = Array.isArray(error?.help) && error.help.length > 0
    ? error.help
    : ["Run `blueprint --help` for the command contract."];
  return `${renderFields([["error.code", code], ["error.message", message]])}\n${renderList("help", help)}\n`;
}

export function collapseHome(input, home = os.homedir()) {
  const resolved = path.resolve(input);
  const resolvedHome = path.resolve(home);
  if (resolved === resolvedHome) return "~";
  const relative = path.relative(resolvedHome, resolved);
  if (relative !== "" && !relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative)) {
    return `~${path.sep}${relative}`;
  }
  return resolved;
}

function isInside(directory, candidate) {
  const relative = path.relative(path.resolve(directory), path.resolve(candidate));
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
}

async function readSessionManifests(stateDir) {
  const sessionsDir = path.join(stateDir, "sessions");
  let entries;
  try {
    entries = await readdir(sessionsDir, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }

  const manifests = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    try {
      const contents = await readFile(path.join(sessionsDir, entry.name, "manifest.json"), "utf8");
      const manifest = JSON.parse(contents);
      if (typeof manifest.artifactPath === "string") manifests.push(manifest);
    } catch (error) {
      if (error?.code !== "ENOENT") {
        throw new CliError("INVALID_SESSION_STATE", `Could not read session ${entry.name}: ${error.message}`);
      }
    }
  }
  return manifests;
}

function summarizeSession(manifest, options = {}) {
  const artifact = options.fullPath ? manifest.artifactPath : path.basename(manifest.artifactPath);
  const openFeedback = Array.isArray(manifest.feedback)
    ? manifest.feedback.filter((item) => item?.state === "open").length
    : 0;
  const queuedFeedback = Array.isArray(manifest.packets)
    ? manifest.packets.filter((packet) => packet?.status === "queued").length
    : 0;
  return {
    artifact,
    status: manifest.status === "active" ? "active" : "ended",
    open_comments: openFeedback,
    queued_feedback: queuedFeedback,
    revision: manifest.stagedRevisionId ? "staged-ready" : "visible",
    artifactPath: manifest.artifactPath,
    updatedAt: manifest.updatedAt || manifest.createdAt || "",
  };
}

export async function getHomeModel(options = {}) {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const stateDir = path.resolve(options.stateDir ?? getStateRoot(options.env ?? process.env));
  const full = options.full ?? false;
  const limit = options.limit ?? (full ? FULL_SESSION_LIMIT : DEFAULT_SESSION_LIMIT);
  const manifests = await readSessionManifests(stateDir);
  const scoped = manifests
    .filter((manifest) => manifest.status === "active" && isInside(cwd, manifest.artifactPath))
    .map((manifest) => summarizeSession(manifest, { fullPath: full }))
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  const reviews = scoped.slice(0, limit);
  return {
    cwd,
    stateDir,
    full,
    total: scoped.length,
    reviews,
    truncated: Math.max(0, scoped.length - reviews.length),
  };
}

export function renderHome(model, options = {}) {
  const executable = collapseHome(options.executable ?? process.argv[1] ?? "blueprint", options.home);
  const scope = collapseHome(model.cwd, options.home);
  const help = [];
  const queued = model.reviews.find((review) => review.queued_feedback > 0);
  if (queued) help.push(`Run \`blueprint wait ${JSON.stringify(queued.artifact)}\` to receive the oldest queued feedback.`);
  if (model.total === 0) help.push("Run `blueprint open <artifact.html>` after the reviewer asks to begin a review.");
  help.push("Run `blueprint playbook` to choose the current authoring or review-loop guidance.");
  if (model.truncated > 0) {
    help.push(model.full
      ? "The 100-review safety bound was reached; run Blueprint from a narrower project directory."
      : "Run `blueprint --full` to include more active reviews.");
  }

  const sections = [
    renderFields([
      ["axi_version", AXI_CONTRACT_VERSION],
      ["bin", executable],
      ["description", CLI_DESCRIPTION],
      ["scope", scope],
      ["active_review_count", model.total],
    ]),
    renderTable("reviews", model.reviews, ["artifact", "status", "open_comments", "queued_feedback", "revision"]),
  ];
  if (model.truncated > 0) {
    sections.push(renderFields([["truncated_reviews", model.truncated]]));
  }
  sections.push(renderList("help", help));
  return `${sections.join("\n")}\n`;
}

export async function renderHookContext(agent, options = {}) {
  let model;
  let stateError = null;
  try {
    model = await getHomeModel({
      ...options,
      limit: HOOK_SESSION_LIMIT,
      full: false,
    });
  } catch (error) {
    stateError = String(error?.message || "unknown state error").slice(0, 240);
    model = { total: 0, reviews: [], truncated: 0 };
  }
  const lines = [
    "Blueprint AXI is available for local, human-gated HTML review.",
    `active_review_count: ${model.total}`,
  ];
  for (const review of model.reviews) {
    lines.push(
      `- ${review.artifact}: ${review.revision}; ${review.queued_feedback} queued feedback; ${review.open_comments} open comments`,
    );
  }
  if (stateError) lines.push(`live_state_error: ${stateError}; run \`blueprint\` for structured recovery guidance`);
  if (model.truncated > 0) lines.push(`- ${model.truncated} more active reviews; run \`blueprint --full\``);
  lines.push("When a review is requested, run `blueprint playbook`, then keep exactly one `blueprint wait <artifact.html>` attached after opening.");
  const additionalContext = lines.join("\n");
  return JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext: `${additionalContext}\nagent_adapter: ${agent}`,
    },
  });
}
