import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { readJson } from "./atomic.js";
import { DESIGN_GUIDANCE } from "./design-guidance.js";
import { getStateRoot, resolveInside } from "./paths.js";
import { startBlueprintServer } from "./server.js";

const executablePath = fileURLToPath(new URL("../bin/blueprint.js", import.meta.url));

function helpText() {
  return `Blueprint local review

Usage:
  blueprint design
  blueprint open <artifact.html> [--no-open]
  blueprint wait <artifact.html>
  blueprint stage <artifact.html> [--report <report.json>]
  blueprint server [--state-dir <directory>]

The first slice accepts self-contained HTML only. Feedback delivery is at least
once: duplicate packet IDs must be handled idempotently.
`;
}

function optionValue(args, name) {
  const index = args.indexOf(name);
  if (index === -1) return null;
  if (!args[index + 1] || args[index + 1].startsWith("--")) {
    throw new Error(`${name} requires a value.`);
  }
  return args[index + 1];
}

function positionalArguments(args) {
  const positional = [];
  for (let index = 0; index < args.length; index += 1) {
    if (args[index].startsWith("--")) {
      if (["--state-dir", "--report"].includes(args[index])) index += 1;
      continue;
    }
    positional.push(args[index]);
  }
  return positional;
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
  if (!response.ok) throw new Error(payload?.error || `Blueprint service returned ${response.status}.`);
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
  throw new Error("Blueprint could not start its local service.");
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
  const stateDir = path.resolve(optionValue(args, "--state-dir") ?? getStateRoot());
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

export async function runCli(argv = process.argv.slice(2)) {
  const [command, ...args] = argv;
  if (!command || ["help", "--help", "-h"].includes(command)) {
    process.stdout.write(helpText());
    return;
  }

  if (command === "server") {
    await runServer(args);
    return;
  }

  if (command === "design") {
    process.stdout.write(DESIGN_GUIDANCE);
    return;
  }

  const stateDir = path.resolve(optionValue(args, "--state-dir") ?? getStateRoot());
  const [artifactInput] = positionalArguments(args);
  if (!artifactInput) throw new Error(`${command} requires an artifact path.`);
  const artifactPath = path.resolve(artifactInput);
  const record = await ensureServer(stateDir);

  if (command === "open") {
    const opened = await request(record, "/api/admin/open", {
      method: "POST",
      body: JSON.stringify({ artifactPath }),
    });
    if (!args.includes("--no-open")) openBrowser(opened.reviewUrl);
    process.stdout.write(`${opened.reviewUrl}\n`);
    return;
  }

  if (command === "wait") {
    await waitForPacketDelivery(record, artifactPath);
    return;
  }

  if (command === "stage") {
    const reportPath = optionValue(args, "--report");
    let report = null;
    if (reportPath) {
      try {
        report = JSON.parse(await readFile(path.resolve(reportPath), "utf8"));
      } catch (error) {
        throw new Error(`Could not read agent report: ${error.message}`);
      }
    }
    const staged = await request(record, "/api/admin/stage", {
      method: "POST",
      body: JSON.stringify({ artifactPath, report }),
    });
    process.stdout.write(`${JSON.stringify(staged, null, 2)}\n`);
    return;
  }

  throw new Error(`Unknown Blueprint command: ${command}\n\n${helpText()}`);
}
