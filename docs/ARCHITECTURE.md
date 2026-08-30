# Blueprint minimum credible core

Status: minimum core approved on 2026-08-28; first local AXI integration slice and approval/revision lifecycle approved on 2026-08-29; pending-revision approval gating and atomic launch-and-wait approved on 2026-08-30.

This contract defines the first usable Blueprint vertical slice. It is intentionally smaller than the full product direction in `docs/PRODUCT.md`. Its purpose is to expose the core review loop to real use before more machinery is added.

## Approved shape

- One Node.js process bound to `127.0.0.1` on an ephemeral port.
- A framework-free trusted browser shell with a docked review inspector.
- The reviewed artifact in an iframe sandbox that does not receive same-origin authority.
- Per-session JSON manifests and immutable revision, packet, and agent-report files.
- Atomic manifest replacement for durable state transitions.
- A compact command-line contract that Codex and Claude Code can both drive.
- A formal AXI layer with content-first live state, bounded summaries, structured errors, contextual next commands, versioned playbooks, a generated skill, and explicit reversible SessionStart hooks.
- Node.js built-ins only. No runtime packages and no copied Lavish implementation code.

The reviewed HTML file remains the editable, portable source of truth. Each opened or staged revision is copied into an immutable session snapshot so the reviewer can always see the exact evidence associated with a feedback cycle.

## First vertical slice

1. The agent runs `blueprint review <artifact.html>` after the reviewer asks it to launch Blueprint. One attached process validates and snapshots a self-contained HTML file, makes the initial snapshot visible immediately, starts or reuses the loopback service, opens the trusted review shell unless `--no-open` is supplied, and waits for exactly one intent-bearing response. The reviewer URL and waiting status use standard error so standard output remains exact packet JSON. The reviewer is not expected to run this command. Separate `open` and `wait` commands remain recovery and diagnostic surfaces.
2. The reviewer holds Alt/Option to preview the exact HTML element under the pointer, clicks to annotate it, and edits chronological private drafts. Creating an anchored draft focuses its editor immediately; submitting **Additional feedback** queues a normal unanchored general comment rather than sending anything. A declarative decision form may instead use native controls and **Queue response** to create or replace one form-scoped private draft without sending it.
3. With no feedback, the reviewer can only choose **Approve**. With feedback, that action becomes **Approve with feedback** and **Revise using feedback** appears. Approval queues a final packet and atomically ends the session. After the server confirms that transition, the shell becomes terminal: it stops polling and annotation intake, blanks the sandbox, removes the review application from view, and exposes only an opaque completion screen. Reloaded or polling shells apply the same terminal state when they observe `status: ended`. **Revise using feedback** queues a revision-request packet, clears only that sent batch, briefly confirms it in a centered overlay, and leaves the current artifact and session active. Feedback derives a persistent waiting/working state from queued/delivered packet acknowledgement and retains the submitted comment records below it. Approval is disabled from revision submission until the reviewer reveals a revision that names the request as a basis; the reviewer endpoint enforces the same gate.
4. The initial `blueprint review` process receives and acknowledges the oldest intent-bearing packet, then exits. After each completed revise delivery, the agent attaches exactly one `blueprint wait <artifact.html>` while editing so later batches can be included; concurrent waits for one review are invalid.
5. The agent edits the authoritative HTML file and runs `blueprint stage <artifact.html> --report <report.json>`. A schema-version-2 report names all basis packet IDs and supplies comment-linked change evidence.
6. Staging creates an immutable snapshot and opens a blocking **Revision is ready** curtain. Visible artifact content is unchanged until the reviewer chooses **See latest revision**. Unsent drafts and their source-revision identities survive this transition.
7. The revealed artifact marks reported amended elements. The main **Feedback** tab combines private drafts with all submitted non-accepted comments. Activating an element-anchored draft label or submitted card sends a selector-only focus message across the sandbox boundary; the injected runtime resolves it, centers the visible element, and briefly outlines it. A visible-revision amendment selector takes precedence over the original feedback anchor. Unreported comments remain as read-only sent receipts; reported items add before/after evidence and Accept/Reopen actions. Accepting an item immediately removes both its marker and Feedback card. The read-only **History** tab retains comments and amendments grouped by revealed revision cycle. Reopening requires a note and creates a private follow-up draft under the same identity.
8. Only the reviewer can approve or end the session from the browser shell.

## AXI adapter slice

The CLI remains the shared first-class adapter for Codex and Claude Code. Its AXI behavior is versioned separately from the immutable review payload schema:

- no arguments produce bounded active-review state scoped to the current directory;
- `--full` is the explicit larger-output escape hatch;
- home, playbook, setup, and error output use a compact TOON-like line contract;
- feedback packets and staged-revision results remain exact JSON protocol payloads;
- atomic `review` launch diagnostics use standard error so its eventual standard output remains one exact feedback packet;
- unknown commands, flags, playbooks, agents, and command shapes fail with structured standard output and exit code `2`;
- operational errors fail with structured standard output and exit code `1`;
- `blueprint playbook` owns current content and review-loop guidance;
- the generated skill is only a discovery stub pointing to CLI-owned guidance; and
- `blueprint setup hooks|status|remove` merges or removes one identifiable SessionStart handler while preserving unrelated Codex and Claude Code settings.

The hook command is context-only. It may report bounded directory-scoped session state and next commands. It must not open or end reviews, reveal revisions, accept feedback, grant authority, expose tokens, or control agent tool calls. Setup is never run automatically by npm installation.

The complete distribution and packaging boundary is recorded in `docs/AXI.md`.

## Durable protocol contracts

### Identity

- A canonical artifact path has a stable path key.
- Each review session has an opaque ID and a separate random reviewer token.
- Revisions, feedback packets, agent reports, and feedback items have stable explicit IDs.
- A reopened item keeps its original feedback ID across packets and revisions.

### Packet delivery

- Submission writes the immutable packet file before publishing its queued state in the session manifest.
- Packet schema version 2 includes an explicit `intent` of `approve` or `revise`, a submission revision, and a source revision on every comment.
- `approve` may contain zero comments and atomically ends the review. `revise` requires at least one non-empty comment and keeps the review active.
- An `approve` submission is rejected with conflict status while any revise packet is not represented by a visible revision or while a staged revision remains unrevealed. Rejection preserves all drafts and session state.
- The agent receives the oldest queued packet.
- A packet stays queued until the CLI has completely written it to standard output and successfully acknowledges its ID.
- A process or connection failure before acknowledgement causes the same packet ID to be delivered again. Consumers must treat packet IDs as duplicate-safe, at-least-once delivery keys.
- Acknowledgement is idempotent. Packet history is retained after delivery.
- The reviewer shell projects unconsumed revise packets as lifecycle state: queued means waiting for the agent; delivered means the agent has received the batch and is working toward a staged revision. A revision that names the packet as basis supersedes that progress state with the blocking ready curtain.

### Revision staging

- Staging snapshots the current authoritative artifact; it never mutates the visible revision pointer.
- Only one unrevealed staged revision is allowed. A second stage is rejected until the reviewer reveals the first.
- Report schema version 2 names one or more `basisPacketIds`, all of which must be revise packets. Every reported feedback item must occur in at least one named basis packet.
- Agent reports may classify known feedback IDs as `addressed`, `changed`, or `stale`. Addressed and changed items require `before`, `after`, `summary`, `evidence`, and a selector locating the amended element in the new snapshot.
- Agent reports do not accept or resolve feedback.
- Revision readiness blocks the browser shell but does not advance the visible pointer. **See latest revision** is the sole forward action; it advances the pointer, resets the artifact view to the top, opens Feedback with its review items, and publishes the report's selector change map into the sandbox.
- History is a reviewer-token-only, read-only projection loaded on demand from immutable packet and report files. It includes only visible revisions plus feedback packets not yet represented by a visible revision; staged report evidence remains unavailable until reviewer reveal.

### Human authority

- Drafts stay private and editable until **Approve with feedback** or **Revise using feedback**.
- Final approval is unavailable while a revision request is queued, delivered, or covered only by an unrevealed staged revision. Additional revise batches remain available during this period.
- Artifact decision forms are opt-in through a unique safe form `id` and `data-blueprint-response`. The injected review layer intercepts a trusted submit-button activation (or submit event where permitted), serializes meaningful named values, and asks the shell to create or replace one revision-scoped draft. Input changes alone do nothing, and a queued response has no authority until the reviewer uses a shell submission action.
- Every draft records its source revision. Reveal never deletes a draft or rewrites that source. Every remaining draft is part of the selected submission; deleting it is the only exclusion action.
- Plain Enter in a comment editor queues and durably saves that private comment without sending it. Enter in **Additional feedback** queues one stable general comment without sending; Shift+Enter inserts a newline.
- Approve, **Revise using feedback**, accept, reopen, staged-revision reveal, and end-session operations exist only on the reviewer surface.
- Reopen requires a non-empty note and queues that note as a private draft. The reviewer must still choose approval or revision deliberately.

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
- The parent shell accepts annotation and queued-response messages only from its current artifact iframe and validates their shape. A response message can mutate only the private draft collection; it cannot send feedback, approve, reveal, accept, reopen, or end a review.
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
- Public npm publication, package-name selection, licensing, marketplace plugins, and desktop distribution.
- Any source-code reuse from `upstream/lavish-axi`.

These mechanisms should be added only when observed review sessions demonstrate that the smaller loop is inadequate.

## Required evidence

The implementation must exercise:

- canonical path and route-boundary rejection;
- atomic state survival across a store restart;
- same-ID packet redelivery before acknowledgement and no delivery after acknowledgement;
- atomic review launch, quiet-timeout persistence, exact packet-only standard output, and lower-level open/wait compatibility;
- approve-without-comments finality, approve-with-feedback finality, revise-with-feedback continuity, and approval rejection across queued, delivered, and staged revision work until reveal;
- revision-scoped draft preservation across reveal;
- staged-versus-visible revision separation;
- multi-packet report validation against known stable feedback IDs and rich change evidence;
- required reopen notes and stable IDs;
- reviewer-token versus agent-token authority separation;
- bounded content-first AXI home output and definitive empty states;
- structured failures and unknown-option exit code `2`;
- generated-skill drift detection; and
- idempotent hook install, status, repair, and removal without overwriting unrelated or malformed agent configuration.

Browser QA must additionally inspect the docked layout, modifier-held target preview, Alt/Option-click element annotation and editor focus, combined private-draft and review-item Feedback flow, context-sensitive approval/revision actions including pending-revision approval disablement, blocking ready curtain, preserved drafts, sandbox response policy, feedback-linked change map, accepted-item removal, read-only revision-cycle History, and accept/reopen flow at wide and narrow widths.
