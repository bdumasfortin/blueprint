import { randomBytes } from "node:crypto";
import { EventEmitter } from "node:events";
import { createServer } from "node:http";

import { injectAnnotationSdk } from "./artifact.js";
import { atomicWriteJson } from "./atomic.js";
import { getStateRoot, resolveInside } from "./paths.js";
import { BlueprintError, SessionStore } from "./session-store.js";
import { renderReviewShell } from "./ui.js";

const MAX_BODY_BYTES = 1_000_000;

function baseHeaders(contentType) {
  return {
    "content-type": contentType,
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    "referrer-policy": "no-referrer",
  };
}

function sendJson(response, status, value) {
  response.writeHead(status, baseHeaders("application/json; charset=utf-8"));
  response.end(value == null ? "" : `${JSON.stringify(value)}\n`);
}

function sendHtml(response, status, value, extraHeaders = {}) {
  response.writeHead(status, { ...baseHeaders("text/html; charset=utf-8"), ...extraHeaders });
  response.end(value);
}

async function readJsonBody(request) {
  const chunks = [];
  let total = 0;
  for await (const chunk of request) {
    total += chunk.length;
    if (total > MAX_BODY_BYTES) throw new BlueprintError("Request body is too large.", 413);
    chunks.push(chunk);
  }
  if (chunks.length === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new BlueprintError("Request body is not valid JSON.");
  }
}

function routeParts(pathname) {
  try {
    return pathname.split("/").filter(Boolean).map(decodeURIComponent);
  } catch {
    throw new BlueprintError("Route contains invalid encoding.");
  }
}

function bearerToken(request) {
  const value = request.headers.authorization ?? "";
  return value.startsWith("Bearer ") ? value.slice(7) : "";
}

function hostIsLoopback(host) {
  const normalized = String(host ?? "").toLowerCase();
  return normalized.startsWith("127.0.0.1:")
    || normalized === "127.0.0.1"
    || normalized.startsWith("localhost:")
    || normalized === "localhost";
}

async function waitForPacket(store, artifactPath, timeoutMs, events) {
  const deadline = Date.now() + timeoutMs;
  while (true) {
    const packet = await store.nextQueuedPacket(artifactPath);
    if (packet) return packet;
    const remaining = deadline - Date.now();
    if (remaining <= 0) return null;
    await new Promise((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        events.off("packet", finish);
        resolve();
      };
      const timer = setTimeout(finish, Math.min(remaining, 1_000));
      events.once("packet", finish);
    });
  }
}

export async function startBlueprintServer(options = {}) {
  const stateDir = options.stateDir ?? getStateRoot();
  const adminToken = options.adminToken ?? randomBytes(32).toString("base64url");
  const port = Number.isInteger(options.port) ? options.port : 0;
  const logger = options.logger ?? console;
  const store = options.store ?? new SessionStore(stateDir);
  const events = new EventEmitter();
  events.setMaxListeners(200);
  await store.initialize();

  let origin = "http://127.0.0.1";
  const server = createServer(async (request, response) => {
    try {
      if (!hostIsLoopback(request.headers.host)) {
        throw new BlueprintError("Host is not allowed.", 403, "forbidden");
      }
      const url = new URL(request.url, origin);
      const parts = routeParts(url.pathname);

      if (parts[0] === "api" && parts[1] === "admin") {
        if (bearerToken(request) !== adminToken) {
          throw new BlueprintError("Agent authorization is required.", 401, "unauthorized");
        }

        if (request.method === "GET" && parts[2] === "health" && parts.length === 3) {
          return sendJson(response, 200, { status: "ok", pid: process.pid });
        }

        if (request.method === "POST" && parts[2] === "open" && parts.length === 3) {
          const body = await readJsonBody(request);
          const opened = await store.openArtifact(body.artifactPath);
          return sendJson(response, 200, {
            ...opened,
            reviewUrl: `${origin}/review/${encodeURIComponent(opened.reviewToken)}`,
          });
        }

        if (request.method === "GET" && parts[2] === "wait" && parts.length === 3) {
          const artifactPath = url.searchParams.get("artifactPath");
          const requestedTimeout = Number(url.searchParams.get("timeoutMs") ?? 25_000);
          const timeoutMs = Number.isFinite(requestedTimeout)
            ? Math.max(0, Math.min(30_000, requestedTimeout))
            : 25_000;
          const packet = await waitForPacket(store, artifactPath, timeoutMs, events);
          return packet ? sendJson(response, 200, packet) : sendJson(response, 204, null);
        }

        if (request.method === "POST" && parts[2] === "ack" && parts.length === 3) {
          const body = await readJsonBody(request);
          const result = await store.acknowledgePacket(body.sessionId, body.packetId);
          events.emit("state");
          return sendJson(response, 200, result);
        }

        if (request.method === "POST" && parts[2] === "stage" && parts.length === 3) {
          const body = await readJsonBody(request);
          const result = await store.stageArtifact(body.artifactPath, body.report ?? null);
          events.emit("state");
          return sendJson(response, 200, result);
        }

        throw new BlueprintError("Agent route was not found.", 404, "not_found");
      }

      if (request.method === "GET" && parts[0] === "review" && parts.length === 2) {
        await store.loadByReviewToken(parts[1]);
        const nonce = randomBytes(18).toString("base64");
        return sendHtml(response, 200, renderReviewShell(parts[1], nonce), {
          "content-security-policy": `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; connect-src 'self'; frame-src 'self'; img-src data:; font-src data:; base-uri 'none'; form-action 'none'`,
          "x-frame-options": "DENY",
        });
      }

      if (request.method === "GET" && parts[0] === "artifact" && parts[2] === "revision" && parts.length === 4) {
        const artifact = await store.readRevision(parts[1], parts[3]);
        return sendHtml(response, 200, injectAnnotationSdk(artifact.contents), {
          "content-security-policy": "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; media-src data: blob:; connect-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'",
        });
      }

      if (parts[0] === "api" && parts[1] === "session" && parts.length >= 4) {
        const reviewToken = parts[2];

        if (request.method === "GET" && parts[3] === "state" && parts.length === 4) {
          return sendJson(response, 200, await store.getBrowserState(reviewToken));
        }

        if (request.method === "PUT" && parts[3] === "drafts" && parts.length === 4) {
          const state = await store.replaceDrafts(reviewToken, await readJsonBody(request));
          return sendJson(response, 200, state);
        }

        if (request.method === "POST" && parts[3] === "send" && parts.length === 4) {
          const packet = await store.sendPacket(reviewToken);
          events.emit("packet");
          return sendJson(response, 200, packet);
        }

        if (request.method === "POST" && parts[3] === "reveal" && parts.length === 4) {
          await readJsonBody(request);
          await store.revealStaged(reviewToken);
          events.emit("state");
          return sendJson(response, 200, await store.getBrowserState(reviewToken));
        }

        if (request.method === "POST" && parts[3] === "feedback" && parts.length === 6) {
          const feedbackId = parts[4];
          if (parts[5] === "accept") {
            await readJsonBody(request);
            await store.acceptFeedback(reviewToken, feedbackId);
            return sendJson(response, 200, await store.getBrowserState(reviewToken));
          }
          if (parts[5] === "reopen") {
            const body = await readJsonBody(request);
            await store.reopenFeedback(reviewToken, feedbackId, body.note);
            return sendJson(response, 200, await store.getBrowserState(reviewToken));
          }
        }

        if (request.method === "POST" && parts[3] === "end" && parts.length === 4) {
          await readJsonBody(request);
          await store.endSession(reviewToken);
          return sendJson(response, 200, await store.getBrowserState(reviewToken));
        }

        throw new BlueprintError("Reviewer route was not found.", 404, "not_found");
      }

      throw new BlueprintError("Route was not found.", 404, "not_found");
    } catch (error) {
      const known = error instanceof BlueprintError;
      if (!known) logger.error?.(error);
      sendJson(response, known ? error.status : 500, {
        error: known ? error.message : "Blueprint encountered an internal error.",
        code: known ? error.code : "internal_error",
      });
    }
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", resolve);
  });
  const address = server.address();
  origin = `http://127.0.0.1:${address.port}`;

  if (options.writeServerRecord !== false) {
    await atomicWriteJson(resolveInside(stateDir, "server.json"), {
      schemaVersion: 1,
      pid: process.pid,
      port: address.port,
      adminToken,
      startedAt: new Date().toISOString(),
    });
  }

  return {
    server,
    store,
    stateDir,
    adminToken,
    origin,
    port: address.port,
    close() {
      return new Promise((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
      });
    },
  };
}
