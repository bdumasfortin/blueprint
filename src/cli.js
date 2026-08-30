import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { readJson } from "./atomic.js";
import {
  CliError,
  formatCliError,
  getHomeModel,
  renderFields,
  renderHome,
  renderHookContext,
  renderList,
  renderTable,
} from "./axi.js";
import { DESIGN_GUIDANCE } from "./design-guidance.js";
import { getStateRoot, resolveInside } from "./paths.js";
import { renderPlaybook, renderPlaybookIndex } from "./playbooks.js";
import { startBlueprintServer } from "./server.js";
import { manageHooks } from "./setup.js";

const executablePath = fileURLToPath(new URL("../bin/blueprint.js", import.meta.url));

function helpText(command = null) {
  const commandHelp = {
    review: `Usage: blueprint review <artifact.html> [--no-open] [--state-dir <directory>]

Open a self-contained HTML artifact and stay attached until one feedback packet arrives.
The review URL and waiting state go to standard error; standard output remains exact packet JSON.
This is the default agent workflow after the reviewer asks to launch Blueprint.
`,
    open: `Usage: blueprint open <artifact.html> [--no-open] [--state-dir <directory>]

Open the local reviewer surface without attaching a feedback wait.
Prefer \`blueprint review\` for normal launches; use \`open\` for recovery or diagnostics.
`,
    wait: `Usage: blueprint wait <artifact.html> [--state-dir <directory>]

Long-wait for one immutable feedback packet. Keep exactly one wait attached per review.
The JSON packet is acknowledged only after complete standard-output delivery.
`,
    stage: `Usage: blueprint stage <artifact.html> [--report <report.json>] [--state-dir <directory>]

Snapshot the edited authoritative HTML as a staged revision. Staging never reveals it.
`,
    playbook: `Usage: blueprint playbook [artifact|decision|review-loop]

List versioned guidance or print one focused playbook. Open every matching playbook.
`,
    design: `Usage: blueprint design

Print Blueprint's current artifact visual authority.
`,
    setup: `Usage: blueprint setup hooks|status|remove [--agent codex|claude|all] [--config-home <directory>]

hooks: add or repair one opt-in SessionStart context hook without replacing unrelated settings.
status: inspect the supported agent configurations without changing them.
remove: remove only Blueprint's SessionStart hook entries.
Restart the selected agent after a change. Codex requires reviewing and trusting changed hooks with /hooks.
`,
    server: `Usage: blueprint server [--state-dir <directory>]

Run the loopback service in the foreground for diagnostics. Normal review, open, wait, and stage commands start or reuse it automatically.
`,
  };
  if (command && commandHelp[command]) return commandHelp[command];
  return `Blueprint AXI - local, human-gated HTML review

Usage:
  blueprint [--full]
  blueprint design
  blueprint playbook [playbook_id]
  blueprint review <artifact.html> [--no-open]
  blueprint open <artifact.html> [--no-open]
  blueprint wait <artifact.html>
  blueprint stage <artifact.html> [--report <report.json>]
  blueprint setup hooks|status|remove [--agent codex|claude|all]
  blueprint server [--state-dir <directory>]

No arguments prints live directory-scoped review state. The first slice accepts
self-contained HTML only. Feedback delivery is at least once: handle duplicate
packet IDs idempotently. Run \`blueprint <command> --help\` for focused guidance.
`;
}

function parseArguments(args, options = {}) {
  const valueFlags = new Set(options.valueFlags ?? []);
  const booleanFlags = new Set(options.booleanFlags ?? []);
  const positional = [];
  const values = {};
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (valueFlags.has(argument)) {
      const value = args[index + 1];
      if (!value || value.startsWith("--")) {
        throw new CliError("MISSING_OPTION_VALUE", `${argument} requires a value.`, { exitCode: 2 });
      }
      values[argument] = value;
      index += 1;
      continue;
    }
    if (booleanFlags.has(argument)) {
      values[argument] = true;
      continue;
    }
    if (argument.startsWith("-")) {
      throw new CliError("UNKNOWN_OPTION", `Unknown option: ${argument}`, {
        exitCode: 2,
        help: ["Run `blueprint --help` or `blueprint <command> --help` for supported options."],
      });
    }
    positional.push(argument);
  }
  return { positional, values };
}

function requireArtifact(command, positional) {
  if (!positional[0]) {
    throw new CliError("MISSING_ARTIFACT", `${command} requires an artifact path.`, {
      exitCode: 2,
      help: [`Run \`blueprint ${command} --help\` for the command contract.`],
    });
  }
  if (positional.length > 1) {
    throw new CliError("UNEXPECTED_ARGUMENT", `${command} accepts exactly one artifact path.`, { exitCode: 2 });
  }
  return path.resolve(positional[0]);
}

async function request(record, route, options = {}) {
  const response = await fetch(`http://127.0.0.1:${record.port}${route}`, {
    ...options,
    headers: {
      authorization: `Bearer ${record.adminToken}`,
      "content-type": "application/json",
      ...options.headers,
    },
    signal: options.signal ?? AbortSignal.timeout(35_000),
  });
  const payload = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new CliError("SERVICE_ERROR", payload?.error || `Blueprint service returned ${response.status}.`);
  return payload;
}

async function healthyRecord(stateDir) {
  try {
    const record = await readJson(resolveInside(stateDir, "server.json"));
    if (!Number.isInteger(record.port) || typeof record.adminToken !== "string") return null;
    await request(record, "/api/admin/health", { method: "GET", signal: AbortSignal.timeout(800) });
    return record;
  } catch {
    return null;
  }
}

async function ensureServer(stateDir) {
  const existing = await healthyRecord(stateDir);
  if (existing) return existing;
  const child = spawn(process.execPath, [executablePath, "server", "--state-dir", stateDir], {
    detached: true,
    stdio: "ignore",
    windowsHide: true,
  });
  child.unref();
  const deadline = Date.now() + 8_000;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 80));
    const record = await healthyRecord(stateDir);
    if (record) return record;
  }
  throw new CliError("SERVICE_START_FAILED", "Blueprint could not start its local service.", {
    help: ["Run `blueprint server` directly to inspect its startup error."],
  });
}

function openBrowser(url) {
  let command;
  let args;
  if (process.platform === "win32") {
    command = "rundll32";
    args = ["url.dll,FileProtocolHandler", url];
  } else if (process.platform === "darwin") {
    command = "open";
    args = [url];
  } else {
    command = "xdg-open";
    args = [url];
  }
  const child = spawn(command, args, { detached: true, stdio: "ignore", windowsHide: true });
  child.unref();
}

async function writePacketThenAcknowledge(record, packet) {
  await new Promise((resolve, reject) => {
    process.stdout.write(`${JSON.stringify(packet, null, 2)}\n`, (error) => error ? reject(error) : resolve());
  });
  await request(record, "/api/admin/ack", {
    method: "POST",
    body: JSON.stringify({ sessionId: packet.sessionId, packetId: packet.id }),
  });
}

function isRequestTimeout(error) {
  return error?.name === "TimeoutError"
    || (error?.name === "AbortError" && /timeout/i.test(error?.message ?? ""));
}

export async function waitForPacketDelivery(record, artifactPath, options = {}) {
  const pollTimeoutMs = options.pollTimeoutMs ?? 25_000;
  const requestTimeoutMs = options.requestTimeoutMs ?? Math.max(35_000, pollTimeoutMs + 5_000);
  const requestPacket = options.requestPacket ?? request;
  const deliverPacket = options.deliverPacket ?? writePacketThenAcknowledge;
  const query = new URLSearchParams({ artifactPath, timeoutMs: String(pollTimeoutMs) });
  while (true) {
    let packet;
    try {
      packet = await requestPacket(record, `/api/admin/wait?${query}`, {
        method: "GET",
        signal: AbortSignal.timeout(requestTimeoutMs),
      });
    } catch (error) {
      if (isRequestTimeout(error)) continue;
      throw error;
    }
    if (!packet) continue;
    await deliverPacket(record, packet);
    return packet;
  }
}

async function runServer(args) {
  const parsed = parseArguments(args, { valueFlags: ["--state-dir"] });
  if (parsed.positional.length > 0) {
    throw new CliError("UNEXPECTED_ARGUMENT", "server does not accept positional arguments.", { exitCode: 2 });
  }
  const stateDir = path.resolve(parsed.values["--state-dir"] ?? getStateRoot());
  const running = await startBlueprintServer({ stateDir });
  process.stderr.write(`Blueprint service listening at ${running.origin}\n`);
  const shutdown = async () => {
    await running.close().catch(() => {});
    process.exit(0);
  };
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
  await new Promise(() => {});
}

async function readHookInput() {
  if (process.stdin.isTTY) return {};
  let raw = "";
  for await (const chunk of process.stdin) {
    raw += chunk;
    if (raw.length > 64 * 1024) throw new CliError("HOOK_INPUT_TOO_LARGE", "Hook input exceeds 64 KiB.");
  }
  if (raw.trim() === "") return {};
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new CliError("INVALID_HOOK_INPUT", `Hook input is not valid JSON: ${error.message}`);
  }
}

function setupOutput(operation, rows) {
  const help = operation === "install"
    ? ["Restart the selected agent session.", "In Codex, use `/hooks` to review and trust the new hook definition."]
    : operation === "remove"
      ? ["Restart the selected agent session so the removal takes effect."]
      : ["Run `blueprint setup hooks --agent <agent>` to install or repair a missing or stale integration."];
  return `${renderFields([["setup_operation", operation]])}\n${renderTable("agents", rows, ["agent", "state", "changed", "config"])}\n${renderList("help", help)}\n`;
}

export async function runCli(argv = process.argv.slice(2)) {
  if (argv.length === 0 || (argv.length === 1 && argv[0] === "--full")) {
    const full = argv.includes("--full");
    const model = await getHomeModel({ full });
    process.stdout.write(renderHome(model, { executable: executablePath }));
    return;
  }
  const [command, ...args] = argv;
  if (["help", "--help", "-h"].includes(command)) {
    process.stdout.write(helpText());
    return;
  }
  if (args.includes("--help") || args.includes("-h")) {
    if (["review", "open", "wait", "stage", "playbook", "design", "setup", "server"].includes(command)) {
      process.stdout.write(helpText(command));
      return;
    }
  }
  if (command === "server") {
    await runServer(args);
    return;
  }
  if (command === "design") {
    const parsed = parseArguments(args);
    if (parsed.positional.length > 0) {
      throw new CliError("UNEXPECTED_ARGUMENT", "design does not accept arguments.", { exitCode: 2 });
    }
    process.stdout.write(DESIGN_GUIDANCE);
    return;
  }
  if (command === "playbook") {
    const parsed = parseArguments(args);
    if (parsed.positional.length > 1) {
      throw new CliError("UNEXPECTED_ARGUMENT", "playbook accepts at most one ID.", { exitCode: 2 });
    }
    process.stdout.write(parsed.positional[0] ? renderPlaybook(parsed.positional[0]) : renderPlaybookIndex());
    return;
  }
  if (command === "setup") {
    const parsed = parseArguments(args, { valueFlags: ["--agent", "--config-home"] });
    const [action] = parsed.positional;
    if (!action || parsed.positional.length > 1 || !["hooks", "status", "remove"].includes(action)) {
      throw new CliError("UNKNOWN_SETUP_OPERATION", `Expected setup operation hooks, status, or remove; received ${action || "none"}.`, {
        exitCode: 2,
        help: ["Run `blueprint setup --help` for the integration contract."],
      });
    }
    const operation = action === "hooks" ? "install" : action;
    const rows = await manageHooks(operation, {
      agent: parsed.values["--agent"] ?? "all",
      configHome: parsed.values["--config-home"] ? path.resolve(parsed.values["--config-home"]) : undefined,
    });
    process.stdout.write(setupOutput(operation, rows));
    return;
  }
  if (command === "hook") {
    const parsed = parseArguments(args, { valueFlags: ["--agent"] });
    if (parsed.positional.length !== 1 || parsed.positional[0] !== "context") {
      throw new CliError("UNKNOWN_HOOK_OPERATION", "The internal hook command supports only `context`.", { exitCode: 2 });
    }
    const agent = parsed.values["--agent"];
    if (!agent || !["codex", "claude"].includes(agent)) {
      throw new CliError("UNKNOWN_AGENT", "Hook context requires `--agent codex` or `--agent claude`.", { exitCode: 2 });
    }
    const input = await readHookInput();
    const cwd = typeof input.cwd === "string" ? input.cwd : process.cwd();
    process.stdout.write(`${await renderHookContext(agent, { cwd })}\n`);
    return;
  }
  if (!["review", "open", "wait", "stage"].includes(command)) {
    throw new CliError("UNKNOWN_COMMAND", `Unknown command: ${command}`, {
      exitCode: 2,
      help: ["Run `blueprint --help` to list commands."],
    });
  }
  const parsed = parseArguments(args, {
    valueFlags: command === "stage" ? ["--state-dir", "--report"] : ["--state-dir"],
    booleanFlags: ["review", "open"].includes(command) ? ["--no-open"] : [],
  });
  const stateDir = path.resolve(parsed.values["--state-dir"] ?? getStateRoot());
  const artifactPath = requireArtifact(command, parsed.positional);
  const record = await ensureServer(stateDir);
  if (["review", "open"].includes(command)) {
    const opened = await request(record, "/api/admin/open", {
      method: "POST",
      body: JSON.stringify({ artifactPath }),
    });
    if (!parsed.values["--no-open"]) openBrowser(opened.reviewUrl);
    if (command === "open") {
      process.stdout.write(`${opened.reviewUrl}\n`);
      return;
    }
    process.stderr.write(`${renderFields([
      ["review_url", opened.reviewUrl],
      ["status", "waiting for one intent-bearing feedback packet"],
    ])}\n`);
    await waitForPacketDelivery(record, artifactPath);
    return;
  }
  if (command === "wait") {
    await waitForPacketDelivery(record, artifactPath);
    return;
  }
  const reportPath = parsed.values["--report"];
  let report = null;
  if (reportPath) {
    try {
      report = JSON.parse(await readFile(path.resolve(reportPath), "utf8"));
    } catch (error) {
      throw new CliError("INVALID_REPORT", `Could not read agent report: ${error.message}`);
    }
  }
  const staged = await request(record, "/api/admin/stage", {
    method: "POST",
    body: JSON.stringify({ artifactPath, report }),
  });
  process.stdout.write(`${JSON.stringify(staged, null, 2)}\n`);
}

export { formatCliError };
