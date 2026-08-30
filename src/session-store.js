import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";

import { assertSelfContainedHtml } from "./artifact.js";
import { atomicWriteJson, readJson, writeImmutableFile } from "./atomic.js";
import { canonicalArtifactPath, pathKeyFor, resolveInside } from "./paths.js";

const SCHEMA_VERSION = 2;
const ID_PATTERN = /^[a-zA-Z0-9._:-]{1,120}$/;
const REPORT_STATUSES = new Set(["addressed", "changed", "stale"]);
const PACKET_INTENTS = new Set(["approve", "revise"]);

export class BlueprintError extends Error {
  constructor(message, status = 400, code = "invalid_request") {
    super(message);
    this.name = "BlueprintError";
    this.status = status;
    this.code = code;
  }
}

function sha256(contents) {
  return createHash("sha256").update(contents).digest("hex");
}

function publicRevision(revision) {
  if (!revision) return null;
  const { path: ignoredPath, ...visible } = revision;
  return visible;
}

function safeString(value, label, maximum, { required = false } = {}) {
  if (typeof value !== "string") {
    if (!required && value == null) return "";
    throw new BlueprintError(`${label} must be text.`);
  }
  const normalized = value.trim();
  if (required && !normalized) throw new BlueprintError(`${label} is required.`);
  if (value.length > maximum) throw new BlueprintError(`${label} is too long.`);
  return value;
}

function safeId(value, label) {
  if (typeof value !== "string" || !ID_PATTERN.test(value)) {
    throw new BlueprintError(`${label} has an invalid ID.`);
  }
  return value;
}

function safeAnchor(value) {
  if (!value || typeof value !== "object" || !["element", "general"].includes(value.type)) {
    throw new BlueprintError("Each draft needs an element or general-feedback anchor.");
  }
  if (value.type === "general") {
    return {
      type: "general",
      quote: "General feedback",
      prefix: "",
      suffix: "",
      selector: "",
    };
  }
  return {
    type: value.type,
    quote: safeString(value.quote ?? "", "Anchor quote", 1_000),
    prefix: safeString(value.prefix ?? "", "Anchor prefix", 500),
    suffix: safeString(value.suffix ?? "", "Anchor suffix", 500),
    selector: safeString(value.selector ?? "", "Anchor selector", 1_000),
  };
}

function tokenMatches(actual, expected) {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length
    && timingSafeEqual(actualBuffer, expectedBuffer);
}

function migrateManifest(manifest) {
  if (manifest?.schemaVersion === SCHEMA_VERSION) return manifest;
  if (manifest?.schemaVersion !== 1) return manifest;

  manifest.schemaVersion = SCHEMA_VERSION;
  for (const revision of manifest.revisions ?? []) {
    revision.basisPacketIds = Array.isArray(revision.basisPacketIds)
      ? revision.basisPacketIds
      : revision.packetId ? [revision.packetId] : [];
  }
  for (const draft of manifest.drafts ?? []) {
    draft.sourceRevisionId ??= manifest.visibleRevisionId;
  }
  for (const packet of manifest.packets ?? []) {
    packet.intent ??= "revise";
  }
  return manifest;
}

function packetForDelivery(packet) {
  if (packet?.schemaVersion === 1 && !packet.intent) {
    return { ...packet, intent: "revise" };
  }
  return packet;
}

function hasUnrevealedRevisionWork(manifest) {
  const visibleRevision = manifest.revisions.find(
    (revision) => revision.id === manifest.visibleRevisionId,
  );
  const visibleBasisPacketIds = new Set(
    manifest.revisions
      .filter((revision) => visibleRevision && revision.sequence <= visibleRevision.sequence)
      .flatMap((revision) => revision.basisPacketIds ?? []),
  );
  return Boolean(manifest.stagedRevisionId)
    || manifest.packets.some(
      (packet) => packet.intent === "revise" && !visibleBasisPacketIds.has(packet.id),
    );
}

export class SessionStore {
  constructor(stateRoot, options = {}) {
    this.root = path.resolve(stateRoot);
    this.sessionsRoot = resolveInside(this.root, "sessions");
    this.indexRoot = resolveInside(this.root, "index");
    this.clock = options.clock ?? (() => new Date());
    this.uuid = options.uuid ?? randomUUID;
    this.tokenFactory = options.tokenFactory ?? (() => randomBytes(24).toString("base64url"));
    this.locks = new Map();
  }

  now() {
    const value = this.clock();
    return (value instanceof Date ? value : new Date(value)).toISOString();
  }

  async initialize() {
    await Promise.all([
      mkdir(this.sessionsRoot, { recursive: true }),
      mkdir(this.indexRoot, { recursive: true }),
    ]);
  }

  async withLock(key, operation) {
    const previous = this.locks.get(key) ?? Promise.resolve();
    const current = previous.catch(() => {}).then(operation);
    this.locks.set(key, current);
    try {
      return await current;
    } finally {
      if (this.locks.get(key) === current) this.locks.delete(key);
    }
  }

  sessionDirectory(sessionId) {
    safeId(sessionId, "Session");
    return resolveInside(this.sessionsRoot, sessionId);
  }

  manifestPath(sessionId) {
    return resolveInside(this.sessionDirectory(sessionId), "manifest.json");
  }

  indexPath(pathKey) {
    if (!/^[a-f0-9]{64}$/.test(pathKey)) throw new BlueprintError("Invalid artifact path key.");
    return resolveInside(this.indexRoot, `${pathKey}.json`);
  }

  async readOptionalJson(target) {
    try {
      return await readJson(target);
    } catch (error) {
      if (error?.code === "ENOENT") return null;
      throw error;
    }
  }

  async loadManifest(sessionId) {
    let manifest;
    try {
      manifest = await readJson(this.manifestPath(sessionId));
    } catch (error) {
      if (error?.code === "ENOENT") {
        throw new BlueprintError("Review session was not found.", 404, "not_found");
      }
      throw error;
    }
    manifest = migrateManifest(manifest);
    if (manifest.schemaVersion !== SCHEMA_VERSION || manifest.sessionId !== sessionId) {
      throw new BlueprintError("Review session state is incompatible or damaged.", 500, "state_invalid");
    }
    return manifest;
  }

  async loadByReviewToken(reviewToken) {
    if (typeof reviewToken !== "string") {
      throw new BlueprintError("Review session was not found.", 404, "not_found");
    }
    const separator = reviewToken.indexOf(".");
    if (separator < 1) throw new BlueprintError("Review session was not found.", 404, "not_found");
    const sessionId = reviewToken.slice(0, separator);
    if (!ID_PATTERN.test(sessionId)) {
      throw new BlueprintError("Review session was not found.", 404, "not_found");
    }
    const manifest = await this.loadManifest(sessionId);
    if (!tokenMatches(reviewToken, manifest.reviewToken)) {
      throw new BlueprintError("Review session was not found.", 404, "not_found");
    }
    return manifest;
  }

  async loadByArtifactToken(artifactToken) {
    if (typeof artifactToken !== "string") {
      throw new BlueprintError("Artifact snapshot was not found.", 404, "not_found");
    }
    const separator = artifactToken.indexOf(".");
    if (separator < 1) throw new BlueprintError("Artifact snapshot was not found.", 404, "not_found");
    const sessionId = artifactToken.slice(0, separator);
    if (!ID_PATTERN.test(sessionId)) {
      throw new BlueprintError("Artifact snapshot was not found.", 404, "not_found");
    }
    const manifest = await this.loadManifest(sessionId);
    if (!tokenMatches(artifactToken, manifest.artifactToken)) {
      throw new BlueprintError("Artifact snapshot was not found.", 404, "not_found");
    }
    return manifest;
  }

  async loadLatestForCanonical(canonicalPath) {
    const pathKey = pathKeyFor(canonicalPath);
    const index = await this.readOptionalJson(this.indexPath(pathKey));
    if (!index?.sessionId) {
      throw new BlueprintError("No Blueprint session exists for this artifact.", 404, "not_found");
    }
    const manifest = await this.loadManifest(index.sessionId);
    if (manifest.pathKey !== pathKey || manifest.artifactPath !== canonicalPath) {
      throw new BlueprintError("Artifact index does not match its session.", 500, "state_invalid");
    }
    return manifest;
  }

  revisionPath(manifest, revision) {
    const segments = revision.path.split("/");
    return resolveInside(this.sessionDirectory(manifest.sessionId), ...segments);
  }

  packetPath(manifest, packetSummary) {
    return resolveInside(this.sessionDirectory(manifest.sessionId), ...packetSummary.path.split("/"));
  }

  reportPath(manifest, revision) {
    if (!revision.reportId) return null;
    const reportFile = `${String(revision.sequence).padStart(4, "0")}-${revision.reportId}.json`;
    return resolveInside(this.sessionDirectory(manifest.sessionId), "reports", reportFile);
  }

  async commit(manifest) {
    manifest.updatedAt = this.now();
    await atomicWriteJson(this.manifestPath(manifest.sessionId), manifest);
  }

  openResponse(manifest) {
    const visible = manifest.revisions.find((item) => item.id === manifest.visibleRevisionId) ?? null;
    const staged = manifest.revisions.find((item) => item.id === manifest.stagedRevisionId) ?? null;
    return {
      sessionId: manifest.sessionId,
      reviewToken: manifest.reviewToken,
      status: manifest.status,
      artifactName: path.basename(manifest.artifactPath),
      visibleRevision: publicRevision(visible),
      stagedRevision: publicRevision(staged),
    };
  }

  async openArtifact(inputPath) {
    await this.initialize();
    const canonicalPath = await canonicalArtifactPath(inputPath);
    const pathKey = pathKeyFor(canonicalPath);
    const contents = await readFile(canonicalPath, "utf8");
    assertSelfContainedHtml(contents);

    return this.withLock(`artifact:${pathKey}`, async () => {
      const existingIndex = await this.readOptionalJson(this.indexPath(pathKey));
      if (existingIndex?.sessionId) {
        const existing = await this.loadManifest(existingIndex.sessionId);
        if (existing.status === "active") {
          const staged = existing.revisions.find((item) => item.id === existing.stagedRevisionId);
          if (!existing.visibleRevisionId && staged?.source === "open") {
            existing.visibleRevisionId = staged.id;
            existing.stagedRevisionId = null;
            await this.commit(existing);
          }
          return this.openResponse(existing);
        }
      }

      const createdAt = this.now();
      const sessionId = `ses-${pathKey.slice(0, 16)}-${this.uuid().slice(0, 8)}`;
      const reviewToken = `${sessionId}.${this.tokenFactory()}`;
      const artifactToken = `${sessionId}.${this.tokenFactory()}`;
      const hash = sha256(contents);
      const revisionId = `rev-0001-${hash.slice(0, 12)}`;
      const revisionFile = `0001-${hash}.html`;
      const relativeRevisionPath = `revisions/${revisionFile}`;
      const revision = {
        id: revisionId,
        sequence: 1,
        hash,
        path: relativeRevisionPath,
        createdAt,
        source: "open",
        reportId: null,
        packetId: null,
        basisPacketIds: [],
      };

      await writeImmutableFile(
        resolveInside(this.sessionDirectory(sessionId), "revisions", revisionFile),
        contents,
      );
      const manifest = {
        schemaVersion: SCHEMA_VERSION,
        sessionId,
        reviewToken,
        artifactToken,
        artifactPath: canonicalPath,
        pathKey,
        createdAt,
        updatedAt: createdAt,
        status: "active",
        endedAt: null,
        visibleRevisionId: revisionId,
        stagedRevisionId: null,
        revisions: [revision],
        drafts: [],
        packetNote: "",
        feedback: [],
        packets: [],
      };
      await atomicWriteJson(this.manifestPath(sessionId), manifest);
      await atomicWriteJson(this.indexPath(pathKey), {
        schemaVersion: SCHEMA_VERSION,
        pathKey,
        artifactPath: canonicalPath,
        sessionId,
        updatedAt: createdAt,
      });
      return this.openResponse(manifest);
    });
  }

  normalizeDraft(raw, manifest) {
    if (!raw || typeof raw !== "object") throw new BlueprintError("Each draft must be an object.");
    const id = safeId(raw.id, "Draft");
    const kind = raw.kind ?? "initial";
    if (!["initial", "reopen"].includes(kind)) throw new BlueprintError("Draft kind is invalid.");
    const existingFeedback = manifest.feedback.find((item) => item.id === id);
    if (kind === "initial" && existingFeedback) {
      throw new BlueprintError(`Draft ${id} conflicts with existing feedback.`);
    }
    if (kind === "reopen" && (!existingFeedback || existingFeedback.state !== "reopen-draft")) {
      throw new BlueprintError(`Reopen draft ${id} is not attached to reopened feedback.`);
    }
    const sourceRevisionId = safeId(raw.sourceRevisionId ?? manifest.visibleRevisionId, "Draft source revision");
    if (!manifest.revisions.some((revision) => revision.id === sourceRevisionId)) {
      throw new BlueprintError(`Draft ${id} references unknown revision ${sourceRevisionId}.`);
    }
    return {
      id,
      kind,
      body: safeString(raw.body ?? "", "Draft body", 10_000),
      createdAt: typeof raw.createdAt === "string" ? raw.createdAt : this.now(),
      sourceRevisionId,
      anchor: safeAnchor(raw.anchor),
    };
  }

  async replaceDrafts(reviewToken, payload) {
    const initial = await this.loadByReviewToken(reviewToken);
    return this.withLock(`session:${initial.sessionId}`, async () => {
      const manifest = await this.loadByReviewToken(reviewToken);
      if (manifest.status !== "active") throw new BlueprintError("This review session has ended.", 409);
      if (!payload || !Array.isArray(payload.drafts)) {
        throw new BlueprintError("Drafts must be an array.");
      }
      if (payload.drafts.length > 200) throw new BlueprintError("A session cannot hold more than 200 drafts.");
      const drafts = payload.drafts.map((draft) => this.normalizeDraft(draft, manifest));
      const unique = new Set(drafts.map((draft) => draft.id));
      if (unique.size !== drafts.length) throw new BlueprintError("Draft IDs must be unique.");

      for (const feedback of manifest.feedback) {
        if (feedback.state === "reopen-draft" && !drafts.some((draft) => draft.id === feedback.id && draft.kind === "reopen")) {
          feedback.state = feedback.reopenFromState ?? "open";
          delete feedback.reopenFromState;
        }
      }
      manifest.drafts = drafts;
      manifest.packetNote = safeString(payload.packetNote ?? "", "Additional feedback", 10_000);
      await this.commit(manifest);
      return this.browserStateFromManifest(manifest);
    });
  }

  async sendPacket(reviewToken, options = {}) {
    const intent = Object.hasOwn(options, "intent") ? options.intent : "revise";
    if (!PACKET_INTENTS.has(intent)) throw new BlueprintError("Feedback intent must be approve or revise.");
    const initial = await this.loadByReviewToken(reviewToken);
    return this.withLock(`session:${initial.sessionId}`, async () => {
      const manifest = await this.loadByReviewToken(reviewToken);
      if (manifest.status !== "active") throw new BlueprintError("This review session has ended.", 409);
      if (!manifest.visibleRevisionId) {
        throw new BlueprintError("Reveal the artifact before sending feedback.", 409);
      }
      if (intent === "approve" && hasUnrevealedRevisionWork(manifest)) {
        throw new BlueprintError(
          "Approval is unavailable until the requested revision is revealed.",
          409,
          "revision_pending",
        );
      }
      const createdAt = this.now();
      const submittedDrafts = [...manifest.drafts];
      if (manifest.packetNote.trim()) {
        submittedDrafts.push({
          id: `feedback-${this.uuid()}`,
          kind: "initial",
          body: manifest.packetNote.trim(),
          createdAt,
          sourceRevisionId: manifest.visibleRevisionId,
          anchor: {
            type: "general",
            quote: "General feedback",
            prefix: "",
            suffix: "",
            selector: "",
          },
        });
      }
      if (intent === "revise" && submittedDrafts.length === 0) {
        throw new BlueprintError("Add at least one comment before requesting a revision.");
      }
      for (const draft of submittedDrafts) {
        safeString(draft.body, "Draft body", 10_000, { required: true });
      }

      const packetId = `pkt-${this.uuid()}`;
      const sequence = manifest.packets.length + 1;
      const comments = submittedDrafts.map((draft) => ({
        id: draft.id,
        kind: draft.kind,
        body: draft.body.trim(),
        anchor: draft.anchor,
        sourceRevisionId: draft.sourceRevisionId ?? manifest.visibleRevisionId,
        createdAt: draft.createdAt,
      }));
      const packet = {
        schemaVersion: SCHEMA_VERSION,
        id: packetId,
        sessionId: manifest.sessionId,
        sequence,
        intent,
        createdAt,
        artifact: { name: path.basename(manifest.artifactPath) },
        sourceRevisionId: manifest.visibleRevisionId,
        submittedFromRevisionId: manifest.visibleRevisionId,
        note: "",
        comments,
      };

      const packetFile = `${String(sequence).padStart(4, "0")}-${packetId}.json`;
      const relativePacketPath = `packets/${packetFile}`;
      await writeImmutableFile(
        resolveInside(this.sessionDirectory(manifest.sessionId), "packets", packetFile),
        `${JSON.stringify(packet, null, 2)}\n`,
      );

      for (const comment of comments) {
        if (comment.kind === "initial") {
          manifest.feedback.push({
            id: comment.id,
            anchor: comment.anchor,
            originalRevisionId: comment.sourceRevisionId,
            state: "open",
            createdAt: comment.createdAt,
            acceptedAt: null,
            latestReport: null,
            history: [{
              kind: "initial",
              body: comment.body,
              packetId,
              revisionId: comment.sourceRevisionId,
              createdAt,
            }],
          });
        } else {
          const feedback = manifest.feedback.find((item) => item.id === comment.id);
          if (!feedback || feedback.state !== "reopen-draft") {
            throw new BlueprintError(`Feedback ${comment.id} is not ready to reopen.`, 409);
          }
          feedback.history.push({
            kind: "reopen",
            body: comment.body,
            packetId,
            revisionId: comment.sourceRevisionId,
            createdAt,
          });
          feedback.state = "open";
          feedback.acceptedAt = null;
          feedback.latestReport = null;
          delete feedback.reopenFromState;
        }
      }

      manifest.packets.push({
        id: packetId,
        sequence,
        intent,
        sourceRevisionId: manifest.visibleRevisionId,
        path: relativePacketPath,
        createdAt,
        status: "queued",
        deliveredAt: null,
      });
      manifest.drafts = [];
      manifest.packetNote = "";
      if (intent === "approve") {
        for (const feedback of manifest.feedback) {
          feedback.state = "accepted";
          feedback.acceptedAt = createdAt;
          delete feedback.reopenFromState;
        }
        manifest.status = "ended";
        manifest.endedAt = createdAt;
      }
      await this.commit(manifest);
      return packet;
    });
  }

  async nextQueuedPacket(inputPath) {
    await this.initialize();
    const canonicalPath = await canonicalArtifactPath(inputPath);
    const manifest = await this.loadLatestForCanonical(canonicalPath);
    const queued = manifest.packets.find((packet) => packet.status === "queued");
    if (!queued) return null;
    return packetForDelivery(await readJson(this.packetPath(manifest, queued)));
  }

  async acknowledgePacket(sessionId, packetId) {
    safeId(sessionId, "Session");
    safeId(packetId, "Packet");
    return this.withLock(`session:${sessionId}`, async () => {
      const manifest = await this.loadManifest(sessionId);
      const packet = manifest.packets.find((item) => item.id === packetId);
      if (!packet) throw new BlueprintError("Packet was not found.", 404, "not_found");
      if (packet.status === "delivered") return { id: packetId, status: "delivered" };
      packet.status = "delivered";
      packet.deliveredAt = this.now();
      await this.commit(manifest);
      return { id: packetId, status: "delivered" };
    });
  }

  validateReport(report, manifest) {
    if (report == null) return null;
    if (typeof report !== "object" || Array.isArray(report)) {
      throw new BlueprintError("Agent report must be an object.");
    }
    const reportSchemaVersion = report.schemaVersion ?? 1;
    if (![1, 2].includes(reportSchemaVersion)) {
      throw new BlueprintError("Agent report schema version is unsupported.");
    }
    const rawBasisPacketIds = reportSchemaVersion === 2
      ? report.basisPacketIds
      : [report.packetId];
    if (!Array.isArray(rawBasisPacketIds) || rawBasisPacketIds.length === 0) {
      throw new BlueprintError("Agent report needs at least one basis packet.");
    }
    const basisPacketIds = rawBasisPacketIds.map((packetId) => safeId(packetId, "Report packet"));
    if (new Set(basisPacketIds).size !== basisPacketIds.length) {
      throw new BlueprintError("Agent report repeats a basis packet.");
    }
    for (const packetId of basisPacketIds) {
      const packet = manifest.packets.find((item) => item.id === packetId);
      if (!packet) throw new BlueprintError(`Report references unknown packet ${packetId}.`);
      if (reportSchemaVersion === 2 && packet.intent !== "revise") {
        throw new BlueprintError(`Report packet ${packetId} did not request a revision.`);
      }
    }
    if (!Array.isArray(report.comments)) throw new BlueprintError("Agent report comments must be an array.");
    const seen = new Set();
    const comments = report.comments.map((item) => {
      const commentId = safeId(item?.commentId, "Report comment");
      if (seen.has(commentId)) throw new BlueprintError(`Report repeats feedback ${commentId}.`);
      seen.add(commentId);
      const feedback = manifest.feedback.find((item) => item.id === commentId);
      if (!feedback) {
        throw new BlueprintError(`Report references unknown feedback ${commentId}.`);
      }
      if (!feedback.history.some((entry) => basisPacketIds.includes(entry.packetId))) {
        throw new BlueprintError(`Report feedback ${commentId} is not part of its basis packets.`);
      }
      if (!REPORT_STATUSES.has(item.status)) {
        throw new BlueprintError(`Report status for ${commentId} is invalid.`);
      }
      const normalized = {
        commentId,
        status: item.status,
        summary: safeString(item.summary, "Report summary", 2_000, { required: true }).trim(),
        evidence: safeString(item.evidence ?? "", "Report evidence", 5_000, {
          required: reportSchemaVersion === 2,
        }).trim(),
      };
      if (reportSchemaVersion === 2) {
        normalized.before = safeString(item.before ?? "", "Report before value", 5_000, {
          required: item.status !== "stale",
        }).trim();
        normalized.after = safeString(item.after ?? "", "Report after value", 5_000, {
          required: item.status !== "stale",
        }).trim();
        normalized.selector = safeString(item.selector ?? "", "Report selector", 1_000, {
          required: item.status !== "stale",
        }).trim();
      }
      return normalized;
    });
    if (reportSchemaVersion === 2) {
      const requiredFeedbackIds = new Set(
        manifest.feedback
          .filter((feedback) => feedback.history.some((entry) => basisPacketIds.includes(entry.packetId)))
          .map((feedback) => feedback.id),
      );
      const missing = [...requiredFeedbackIds].filter((feedbackId) => !seen.has(feedbackId));
      if (missing.length) {
        throw new BlueprintError(`Agent report omits feedback ${missing[0]} from its basis packets.`);
      }
    }
    return { schemaVersion: reportSchemaVersion, basisPacketIds, comments };
  }

  async stageArtifact(inputPath, rawReport = null) {
    await this.initialize();
    const canonicalPath = await canonicalArtifactPath(inputPath);
    const contents = await readFile(canonicalPath, "utf8");
    assertSelfContainedHtml(contents);
    const latest = await this.loadLatestForCanonical(canonicalPath);

    return this.withLock(`session:${latest.sessionId}`, async () => {
      const manifest = await this.loadManifest(latest.sessionId);
      if (manifest.status !== "active") throw new BlueprintError("This review session has ended.", 409);
      if (manifest.stagedRevisionId) {
        throw new BlueprintError("A revision is already staged; the reviewer must reveal it first.", 409);
      }
      const report = this.validateReport(rawReport, manifest);
      const createdAt = this.now();
      const sequence = manifest.revisions.length + 1;
      const hash = sha256(contents);
      const revisionId = `rev-${String(sequence).padStart(4, "0")}-${hash.slice(0, 12)}`;
      const revisionFile = `${String(sequence).padStart(4, "0")}-${hash}.html`;
      let reportRecord = null;

      if (report) {
        const reportId = `rpt-${this.uuid()}`;
        const reportFile = `${String(sequence).padStart(4, "0")}-${reportId}.json`;
        reportRecord = {
          schemaVersion: SCHEMA_VERSION,
          id: reportId,
          sessionId: manifest.sessionId,
          revisionId,
          packetId: report.basisPacketIds[0],
          basisPacketIds: report.basisPacketIds,
          createdAt,
          comments: report.comments,
        };
        await writeImmutableFile(
          resolveInside(this.sessionDirectory(manifest.sessionId), "reports", reportFile),
          `${JSON.stringify(reportRecord, null, 2)}\n`,
        );
        reportRecord.path = `reports/${reportFile}`;
      }

      await writeImmutableFile(
        resolveInside(this.sessionDirectory(manifest.sessionId), "revisions", revisionFile),
        contents,
      );
      const revision = {
        id: revisionId,
        sequence,
        hash,
        path: `revisions/${revisionFile}`,
        createdAt,
        source: "agent",
        reportId: reportRecord?.id ?? null,
        packetId: reportRecord?.packetId ?? null,
        basisPacketIds: reportRecord?.basisPacketIds ?? [],
      };
      manifest.revisions.push(revision);
      manifest.stagedRevisionId = revisionId;
      if (reportRecord) {
        for (const reportComment of reportRecord.comments) {
          const feedback = manifest.feedback.find((item) => item.id === reportComment.commentId);
          feedback.latestReport = {
            reportId: reportRecord.id,
            revisionId,
            status: reportComment.status,
            summary: reportComment.summary,
            evidence: reportComment.evidence,
            before: reportComment.before ?? "",
            after: reportComment.after ?? "",
            selector: reportComment.selector ?? "",
            createdAt,
          };
        }
      }
      await this.commit(manifest);
      return { revision: publicRevision(revision), report: reportRecord && {
        id: reportRecord.id,
        packetId: reportRecord.packetId,
        basisPacketIds: reportRecord.basisPacketIds,
        comments: reportRecord.comments,
      } };
    });
  }

  async revealStaged(reviewToken) {
    const initial = await this.loadByReviewToken(reviewToken);
    return this.withLock(`session:${initial.sessionId}`, async () => {
      const manifest = await this.loadByReviewToken(reviewToken);
      if (manifest.status !== "active") throw new BlueprintError("This review session has ended.", 409);
      if (!manifest.stagedRevisionId) throw new BlueprintError("No revision is ready to reveal.", 409);
      manifest.visibleRevisionId = manifest.stagedRevisionId;
      manifest.stagedRevisionId = null;
      await this.commit(manifest);
      return this.browserStateFromManifest(manifest);
    });
  }

  async acceptFeedback(reviewToken, feedbackId) {
    safeId(feedbackId, "Feedback");
    const initial = await this.loadByReviewToken(reviewToken);
    return this.withLock(`session:${initial.sessionId}`, async () => {
      const manifest = await this.loadByReviewToken(reviewToken);
      if (manifest.status !== "active") throw new BlueprintError("This review session has ended.", 409);
      const feedback = manifest.feedback.find((item) => item.id === feedbackId);
      if (!feedback) throw new BlueprintError("Feedback was not found.", 404, "not_found");
      if (feedback.state === "reopen-draft") {
        throw new BlueprintError("Remove or send the reopen draft before accepting this feedback.", 409);
      }
      feedback.state = "accepted";
      feedback.acceptedAt = this.now();
      await this.commit(manifest);
      return this.browserStateFromManifest(manifest);
    });
  }

  async reopenFeedback(reviewToken, feedbackId, rawNote) {
    safeId(feedbackId, "Feedback");
    const note = safeString(rawNote, "Reopen note", 10_000, { required: true }).trim();
    const initial = await this.loadByReviewToken(reviewToken);
    return this.withLock(`session:${initial.sessionId}`, async () => {
      const manifest = await this.loadByReviewToken(reviewToken);
      if (manifest.status !== "active") throw new BlueprintError("This review session has ended.", 409);
      if (!manifest.visibleRevisionId) throw new BlueprintError("No revision is visible.", 409);
      const feedback = manifest.feedback.find((item) => item.id === feedbackId);
      if (!feedback) throw new BlueprintError("Feedback was not found.", 404, "not_found");
      if (feedback.state === "reopen-draft") {
        throw new BlueprintError("This feedback already has a private reopen draft.", 409);
      }
      feedback.reopenFromState = feedback.state;
      feedback.state = "reopen-draft";
      feedback.acceptedAt = null;
      manifest.drafts.push({
        id: feedback.id,
        kind: "reopen",
        body: note,
        createdAt: this.now(),
        sourceRevisionId: manifest.visibleRevisionId,
        anchor: feedback.anchor,
      });
      await this.commit(manifest);
      return this.browserStateFromManifest(manifest);
    });
  }

  async endSession(reviewToken) {
    const initial = await this.loadByReviewToken(reviewToken);
    return this.withLock(`session:${initial.sessionId}`, async () => {
      const manifest = await this.loadByReviewToken(reviewToken);
      if (manifest.status === "ended") return this.browserStateFromManifest(manifest);
      manifest.status = "ended";
      manifest.endedAt = this.now();
      await this.commit(manifest);
      return this.browserStateFromManifest(manifest);
    });
  }

  browserStateFromManifest(manifest) {
    const visible = manifest.revisions.find((item) => item.id === manifest.visibleRevisionId) ?? null;
    const staged = manifest.revisions.find((item) => item.id === manifest.stagedRevisionId) ?? null;
    return {
      schemaVersion: manifest.schemaVersion,
      sessionId: manifest.sessionId,
      artifactName: path.basename(manifest.artifactPath),
      status: manifest.status,
      createdAt: manifest.createdAt,
      updatedAt: manifest.updatedAt,
      endedAt: manifest.endedAt,
      visibleRevision: publicRevision(visible),
      stagedRevision: publicRevision(staged),
      artifactToken: manifest.artifactToken,
      revisions: manifest.revisions.map(publicRevision),
      drafts: structuredClone(manifest.drafts),
      packetNote: manifest.packetNote,
      feedback: structuredClone(manifest.feedback),
      packets: manifest.packets.map(({ path: ignoredPath, ...packet }) => ({ ...packet })),
    };
  }

  async getBrowserState(reviewToken) {
    const manifest = await this.loadByReviewToken(reviewToken);
    const state = this.browserStateFromManifest(manifest);
    const latest = manifest.packets.at(-1);
    state.latestPacket = latest
      ? packetForDelivery(await readJson(this.packetPath(manifest, latest)))
      : null;
    return state;
  }

  async getReviewHistory(reviewToken) {
    const manifest = await this.loadByReviewToken(reviewToken);
    const visibleRevision = manifest.revisions.find((item) => item.id === manifest.visibleRevisionId) ?? null;
    const visibleRevisions = visibleRevision
      ? manifest.revisions.filter((item) => item.sequence <= visibleRevision.sequence)
      : [];
    const visibleBasisPacketIds = new Set(
      visibleRevisions.flatMap((revision) => revision.basisPacketIds ?? []),
    );
    const packetRecords = new Map(await Promise.all(manifest.packets.map(async (summary) => {
      const packet = packetForDelivery(await readJson(this.packetPath(manifest, summary)));
      return [summary.id, packet];
    })));
    const feedbackById = new Map(manifest.feedback.map((feedback) => [feedback.id, feedback]));

    const commentRecord = (comment, packet) => ({
      id: comment.id,
      kind: comment.kind,
      body: comment.body,
      anchor: comment.anchor,
      sourceRevisionId: comment.sourceRevisionId,
      packetId: packet.id,
      packetIntent: packet.intent,
      createdAt: comment.createdAt ?? packet.createdAt,
    });

    const revisionCycles = await Promise.all(visibleRevisions.map(async (revision) => {
      const basisPackets = (revision.basisPacketIds ?? [])
        .map((packetId) => packetRecords.get(packetId))
        .filter(Boolean);
      const report = revision.reportId
        ? await readJson(this.reportPath(manifest, revision))
        : null;
      return {
        id: revision.id,
        kind: revision.source === "open" ? "initial" : "revision",
        state: revision.id === manifest.visibleRevisionId ? "visible" : "superseded",
        createdAt: revision.createdAt,
        revision: publicRevision(revision),
        packetIds: basisPackets.map((packet) => packet.id),
        comments: basisPackets.flatMap((packet) => packet.comments.map((comment) => commentRecord(comment, packet))),
        amendments: (report?.comments ?? []).map((item) => {
          const feedback = feedbackById.get(item.commentId);
          return {
            commentId: item.commentId,
            status: item.status,
            summary: item.summary,
            evidence: item.evidence ?? "",
            before: item.before ?? "",
            after: item.after ?? "",
            selector: item.selector ?? "",
            feedbackState: feedback?.state ?? "unknown",
            acceptedAt: feedback?.acceptedAt ?? null,
          };
        }),
      };
    }));

    const pendingCycles = manifest.packets
      .filter((summary) => !visibleBasisPacketIds.has(summary.id))
      .map((summary) => {
        const packet = packetRecords.get(summary.id);
        return {
          id: `pending-${summary.id}`,
          kind: packet.intent === "approve" ? "approval" : "feedback",
          state: summary.status === "queued" ? "queued" : "awaiting-revision",
          createdAt: packet.createdAt,
          revision: null,
          packetIds: [packet.id],
          comments: packet.comments.map((comment) => commentRecord(comment, packet)),
          amendments: [],
        };
      });

    return {
      schemaVersion: 1,
      updatedAt: manifest.updatedAt,
      cycles: [...pendingCycles, ...revisionCycles].sort((left, right) =>
        right.createdAt.localeCompare(left.createdAt)),
    };
  }

  async readRevision(artifactToken, revisionId) {
    safeId(revisionId, "Revision");
    const manifest = await this.loadByArtifactToken(artifactToken);
    const revision = manifest.revisions.find((item) => item.id === revisionId);
    if (!revision) throw new BlueprintError("Revision was not found.", 404, "not_found");
    return {
      contents: await readFile(this.revisionPath(manifest, revision), "utf8"),
      revision: publicRevision(revision),
    };
  }
}
