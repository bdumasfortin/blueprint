# Blueprint minimum credible core

Status: approved for local implementation and user testing on 2026-08-28.

This contract defines the first usable Blueprint vertical slice. It is intentionally smaller than the full product direction in `docs/PRODUCT.md`. Its purpose is to expose the core review loop to real use before more machinery is added.

## Approved shape

- One Node.js process bound to `127.0.0.1` on an ephemeral port.
- A framework-free trusted browser shell with a docked review inspector.
- The reviewed artifact in an iframe sandbox that does not receive same-origin authority.
- Per-session JSON manifests and immutable revision, packet, and agent-report files.
- Atomic manifest replacement for durable state transitions.
- A compact command-line contract that Codex and Claude Code can both drive.
- Node.js built-ins only. No runtime packages and no copied Lavish implementation code.

The reviewed HTML file remains the editable, portable source of truth. Each opened or staged revision is copied into an immutable session snapshot so the reviewer can always see the exact evidence associated with a feedback cycle.

## First vertical slice

1. The agent runs `blueprint open <artifact.html>` after the reviewer asks it to launch Blueprint. It validates and snapshots a self-contained HTML file, makes the initial snapshot visible immediately, starts or reuses the loopback service, and opens the trusted review shell unless `--no-open` is supplied. The reviewer is not expected to run this command.
2. The reviewer holds Alt/Option to preview the exact HTML element under the pointer, clicks to annotate it, edits chronological private drafts, and deliberately sends one packet. Creating a draft focuses its editor immediately.
3. The agent retains one `blueprint wait <artifact.html>` for the review. It long-waits for the oldest undelivered packet and writes the complete packet to standard output before acknowledging delivery.
4. The agent edits the authoritative HTML file and runs `blueprint stage <artifact.html> [--report <report.json>]`.
5. Staging creates an immutable snapshot and a quiet ready state. Visible content is unchanged until the reviewer chooses **Reveal revision**.
6. The reviewer accepts or reopens each reported item. Reopening requires a note and creates a private follow-up draft under the same stable comment identity.
7. Only the reviewer can end the session from the browser shell.

## Durable protocol contracts

### Identity

- A canonical artifact path has a stable path key.
- Each review session has an opaque ID and a separate random reviewer token.
- Revisions, feedback packets, agent reports, and feedback items have stable explicit IDs.
- A reopened item keeps its original feedback ID across packets and revisions.

### Packet delivery

- Sending writes the immutable packet file before publishing its queued state in the session manifest.
- The agent receives the oldest queued packet.
- A packet stays queued until the CLI has completely written it to standard output and successfully acknowledges its ID.
- A process or connection failure before acknowledgement causes the same packet ID to be delivered again. Consumers must treat packet IDs as duplicate-safe, at-least-once delivery keys.
- Acknowledgement is idempotent. Packet history is retained after delivery.

### Revision staging

- Staging snapshots the current authoritative artifact; it never mutates the visible revision pointer.
- Only one unrevealed staged revision is allowed. A second stage is rejected until the reviewer reveals the first.
- Agent reports may classify known feedback IDs as `addressed`, `changed`, or `stale` and attach a short summary and evidence.
- Agent reports do not accept or resolve feedback.
- Reveal is a reviewer-token action. It advances the visible pointer and resets the artifact view to the top.

### Human authority

- Drafts stay private and editable until **Send feedback**.
- Excluded drafts remain private after a packet is sent.
- Accept, reopen, staged-revision reveal, and end-session operations exist only on the reviewer surface.
- Reopen requires a non-empty note and queues that note as a private draft. The reviewer must still send it deliberately.

## Persistence and recovery

Runtime state is stored outside the repository by default and may be redirected with `BLUEPRINT_STATE_DIR` for isolated tests. Each session contains:

- an atomically replaced `manifest.json`;
- immutable `revisions/*.html` snapshots;
- immutable `packets/*.json` payloads; and
- immutable `reports/*.json` agent reports.

Writes use a temporary file in the destination directory, flush the file, and rename it into place. Interrupted temporary files are ignored. A restarted process reconstructs active sessions from the manifests and artifact-path index. Immutable payloads may be written before the referencing manifest; an interruption can therefore leave a harmless orphan, but never a manifest pointing at a partially written payload.

## Trust and path boundaries

- The service binds only to loopback.
- Agent endpoints require a random bearer token stored in the private runtime directory.
- Reviewer endpoints require a separate per-session token.
- The iframe receives only a distinct read-only artifact capability. That capability can fetch recorded immutable revisions but cannot read session state or perform reviewer mutations.
- Artifact routes resolve only immutable revision files already recorded in the session manifest; they cannot browse arbitrary local paths.
- Input artifacts must exist, resolve canonically, and use the `.html` extension.
- The first slice supports self-contained HTML only. Artifact responses block network connections and run in an iframe with scripts allowed but without same-origin authority.
- The parent shell accepts annotation messages only from its current artifact iframe and validates their shape.
- The sandboxed, injected review layer renders the modifier-held target preview; it is absent from the authoritative artifact and immutable snapshot files.

## Replaceable prototype edges

The following are implementation details, not permanent product commitments:

- JSON manifest layout beyond the versioned fields needed by this contract;
- polling/long-wait HTTP rather than another local transport;
- the framework-free shell and its exact styling;
- operating-system browser launching;
- one active session per canonical artifact path; and
- the exact annotation selector and text-quote heuristics.

## Explicitly deferred

- Attachments and binary asset snapshotting.
- Non-self-contained HTML and local asset trees.
- Status filters and guarded batch acceptance.
- Portable decision-record export.
- Desktop packaging, auto-start, updates, or installers.
- Database, frontend framework, WebSockets, filesystem watching, publishing, telemetry, hosted collaboration, or full in-tool chat.
- Production Codex and Claude Code wrappers beyond their shared CLI contract.
- Any source-code reuse from `upstream/lavish-axi`.

These mechanisms should be added only when observed review sessions demonstrate that the smaller loop is inadequate.

## Required evidence

The implementation must exercise:

- canonical path and route-boundary rejection;
- atomic state survival across a store restart;
- same-ID packet redelivery before acknowledgement and no delivery after acknowledgement;
- staged-versus-visible revision separation;
- report validation against known stable feedback IDs;
- required reopen notes and stable IDs; and
- reviewer-token versus agent-token authority separation.

Browser QA must additionally inspect the docked layout, modifier-held target preview, Alt/Option-click element annotation and editor focus, private draft flow, sandbox response policy, explicit staged-revision reveal, and accept/reopen flow at wide and narrow widths.
