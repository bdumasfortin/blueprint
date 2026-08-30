# Blueprint product contract

Status: interaction and minimum-core architecture contracts approved for local implementation and user testing on 2026-08-28; AXI distribution direction, its first local implementation slice, and the approval/revision lifecycle approved on 2026-08-29; pending-revision approval gating, atomic launch-and-wait, specialist positioning, MIT licensing direction, and a validation-gated npm publication path approved on 2026-08-30. This document records approved directions and explicitly separates them from testing hypotheses and deferred product choices.

## Problem

Agent-generated HTML can communicate plans, comparisons, and designs far better than plain text, but the review loop often becomes noisy or unreliable. The reviewer may be interrupted by automatic browser behavior, lose draft feedback, struggle to point at the exact thing that should change, or receive a revision without a trustworthy way to verify what was addressed.

Blueprint should make visual review feel deliberate: the agent launches the requested initial artifact; the human drafts privately, then chooses final approval or requests a revision; the agent reports work, and the human deliberately reveals and verifies revisions.

## Core loop

1. The reviewer asks their agent to prepare and launch an artifact in Blueprint. The agent uses one atomic review command that opens the artifact and remains attached until the first explicit response arrives.
2. Blueprint displays the initial artifact immediately; there is no separate ready or reveal gate for the first snapshot.
3. The reviewer holds Alt/Option to preview the exact HTML element under the pointer, then clicks it to create a local draft comment.
4. Drafts collect chronologically into an editable, revision-scoped feedback batch.
5. With no drafts, the only submission is **Approve**. With drafts, it becomes **Approve with feedback** and **Revise using feedback** appears beside it.
6. Approval is final and ends the session. Once its packet is durably queued, the browser retires the artifact and all feedback controls behind an opaque completion screen; a loaded or polling shell that discovers an already-ended session does the same. **Revise using feedback** sends the current batch, shows one centered overlay confirmation that fades away, and keeps the visible revision available. Feedback persistently shows whether the request is waiting for the agent or has been received for work, while retaining the exact sent comments so the reviewer can continue without duplicating them. Final approval is unavailable from revision submission until the requested revision is revealed; additional feedback may still be sent as revise batches while the agent works.
7. The agent stages a revision against one or more revise batches and maps each amendment to stable comment identities.
8. Blueprint presents a blocking **Revision is ready** curtain. The artifact changes only when the reviewer chooses **See latest revision**; unsent drafts survive the reveal.
9. The revealed artifact marks amended elements, while the main **Feedback** tab shows drafts and all non-accepted review items with before, after, summary, evidence, Accept, and Reopen. Accepting an item removes both its amended-element marker and its card from Feedback. The read-only **History** tab retains comments and amendments in newest-first revision cycles.

## Settled decisions

### Audience and scope

- One human, one agent, one artifact.
- Personal/local-first. Friends and colleagues use their own local installations; Blueprint is not a shared multi-user workspace.
- Blueprint owns the specialist wedge for consequential agent-generated plans, architecture, and UI proposals where staged reveal, amendment evidence, human acceptance, final sign-off, and adaptation to the reviewer's visual and workflow preferences justify deliberate friction. It is not positioned as a generally superior or broader replacement for Lavish.
- Codex and Claude Code are the initial first-class adapters.
- The human entry point is conversational: the reviewer asks their agent to start or continue Blueprint and is never expected to invoke the CLI. The CLI is an agent-adapter surface.
- The public repository README is discovery-first: one clear promise, a short real-runtime review loop, concrete benefits, installation, an agent-ready first prompt, and explicit credit to Lavish and its creator, Kun Chen. Development, coding, protocol, validation, repository-map, and research guidance belongs in durable maintainer documentation rather than the public discovery path.
- The default agent launch is `blueprint review <artifact.html>`, which atomically opens the reviewer surface and retains the first feedback wait. Separate `open` and `wait` commands are recovery and diagnostic tools, not the normal launch path.
- Blueprint is formally an AXI. The approved distribution direction is a global npm CLI with explicit, reversible SessionStart hooks for Codex and Claude Code, plus a generated on-demand skill and later `npx` evaluation path.
- Installing the npm package alone must not edit agent configuration. Hook setup is a separate explicit action. `blueprint-local-review` is the MIT-licensed public package identity, and version 0.2.0 is the first public release. Its registry integrity must match the reviewed tarball. Public npm publication requires the enforced validation, browser and recovery coverage, isolated package checks, and an authenticated npm session. Changes to a user's real agent installation remain a separate authority gate.
- Ground-up product design informed by Lavish and selected MIT code, not a fork that inherits the entire product architecture.

### Human control

- A direct request to the agent to launch Blueprint authorizes opening the initial artifact without a second in-product reveal step.
- After launch, never reload or replace the artifact without a human reveal action. A staged revision deliberately takes focus with a blocking ready curtain, but the current artifact remains recorded and unreplaced until **See latest revision**. Reset to the top when the reviewer reveals it.
- Once a revision request is submitted, final approval remains unavailable while that request is queued, delivered, or represented by an unrevealed staged revision. Revealing a revision that names the request as a basis restores approval.
- Reviewer actions close the loop. Agent claims such as “addressed” do not auto-resolve feedback.
- Preserve stale anchors and evidence rather than silently discarding them when the artifact changes.

### Feedback

- Alt/Option-clicking an HTML element is the only annotation gesture in the first slice.
- While Alt/Option is held, a temporary outline and element label identify the exact click target before the reviewer annotates it.
- Text selection, an annotation toggle, and a context-menu fallback do not create comments.
- A new comment opens its editor and receives focus immediately, including reopening the inspector if necessary.
- Comments are private local drafts until the reviewer deliberately chooses **Approve with feedback** or **Revise using feedback**.
- Plain Enter in an existing comment editor queues and durably saves that private comment without sending feedback to the agent. In **Additional feedback**, Enter queues the text as a new general private comment and clears the composer. Only the explicit **Approve with feedback** or **Revise using feedback** actions deliver comments. Shift+Enter inserts a newline, text composition never queues or submits, and repeated key events cannot create duplicate queue or send actions.
- Every draft records the revision where it was written. Revealing a staged revision preserves unsent drafts and their original evidence instead of silently moving their anchors to the newest snapshot.
- Stable local comment IDs underpin revision mapping and verification without turning Blueprint into a ticket tracker.
- Attachments stay available through a quiet icon, not a prominent labeled control.

### Decisions inside artifacts

- A review that asks the reviewer to choose should provide native, keyboard-operable controls whenever they clarify the response: radios for mutually exclusive options, checkboxes or switches for independent choices, and selects for longer lists. Whole-card selection is encouraged when the card remains a real label for its native input.
- Selection is reversible browser-local state, not feedback or authorization. A separate **Queue response** action serializes the form's meaningful named values into one editable private draft in Feedback. Re-queueing the same form before delivery replaces that draft in place instead of adding duplicates.
- Queue response never contacts the agent, approves the artifact, requests a revision, or ends the session. Only **Approve with feedback** or **Revise using feedback** delivers the queued decision response.
- UI examples should behave like representative product slices when interaction affects the decision. Each option should expose the useful states, transitions, or microinteractions needed to judge it; purely static wireframes are reserved for choices where behavior is irrelevant.
- Specimen motion must clarify causality, remain restrained, support keyboard use, and honor `prefers-reduced-motion`. Decorative autoplay is not decision evidence.

### Interface

- Nearly chrome-free presentation. The right-edge rail is visible only while the inspector is collapsed, and clicking anywhere on it expands the inspector.
- When expanded on desktop, the inspector is docked and resizes the artifact rather than overlaying it. Its larger collapse chevron sits in the inspector's top-right corner. End review sits at the bottom-right beside the context-sensitive approval/revision actions.
- Revision readiness is a blocking full-page curtain whose only forward action is **See latest revision**. It is a lifecycle boundary, not an automatic page refresh and not an authored-artifact layout gate.
- The draft pane shows one concise instruction—“Hold Alt/Option and click any element to leave feedback.”—does not repeat it as an empty state, and keeps an unlabeled **Additional feedback** composer aligned immediately above the bottom action bar. Queuing that composer creates a normal general comment with a stable identity rather than a packet-level note. Additional feedback has no manual resize grip and grows vertically to fit its content. Draft editors use the approved compact edge-rail treatment: one content-sized line at rest, automatic vertical growth only when text wraps, no manual resize grip, and a red borderless trash-can delete action whose full-size target stays vertically centered as the comment grows. The edge rail is the editing-state signal; focusing the text itself does not add another rectangular outline. The end-review stop glyph remains compact but visually prominent.
- The inspector has **Feedback** and **History** tabs. Feedback is the sole action surface: it combines private drafts, a persistent revision-request delivery state, and every submitted non-accepted comment. An element-anchored draft label or submitted-feedback card is navigable: activating it scrolls the visible artifact to the associated element and briefly outlines that target, preferring the visible revision's reported amendment selector when available. Sent comments remain visible while waiting for or being worked by the agent; Accept/Reopen appears only after the agent reports an amendment. Accepted items disappear from Feedback. History is a read-only revision-cycle ledger of revealed snapshots, submitted comments, amendment evidence, and current reviewer state; it never exposes staged revision evidence before reveal.
- “Draft” remains an internal lifecycle term rather than reviewer-facing navigation.
- Compact first: one recommendation, at most three primary options, short tradeoffs, and collapsed supporting evidence.
- Show actual visual or motion specimens for visual decisions. When behavior matters, specimens are operable and expose representative states; styled, non-editable diagrams remain acceptable for routine architecture explanations.
- Agent presence is limited to lifecycle state and short replies; full conversation remains in Codex or Claude Code.
- Blueprint does not automatically inherit a workspace design system. Explicit user or agent instructions that state a preferred design system for Blueprint artifacts may supply one.
- Runtime review chrome does not rewrite the artifact's authored styling.

### Visual direction — approved source of truth

- The full-system candidate was explicitly approved as Blueprint's visual source of truth on 2026-08-28, without refinement notes. The durable implementation-facing contract is `docs/VISUAL_SYSTEM.md`; `.lavish/` is local review state and is not required to reconstruct the decision.
- The previously recorded calm, dark, editorial/instrument direction was an agent-authored synthesis of Lavish and Franky cues. The reviews approved interaction behavior and the requirement for visual specimens, but never asked for or received approval of that palette, typography, or component language.
- The former dark review shell and revised Fieldnote example remain useful behavioral-test specimens only. They are not visual authority or the product default.
- The approved direction uses Franky's diagnostic color scheme, one unified visual system across the review shell and default authored artifacts, and a uniform fine 24-pixel non-blue graphite grid at low contrast.
- Its grammar is near-black graphite canvas, slate structure, cyan interaction signal, restrained semantic colors, compact system sans with monospace controls/state/evidence, crisp one-pixel borders, minimally rounded geometry, dense controls, and generous document-scale whitespace.
- A subsequent explicit refinement reserves the earlier brass meta-band treatment for reviewer-facing instructions in authored artifacts and the runtime's single review-operation instruction. “Meta” means content about operating or interpreting the review—review protocol, choice instructions, scope/authority, queueing, and submission—not the artifact's subject, ordinary warnings, recommendations, or status. The dark token is `#d8a34d` over `rgba(216, 163, 77, .11)`; the light token is `#81500f` over `rgba(129, 80, 15, .09)`, with a brass border, four-pixel leading rule, and faint diagonal stripe.
- Explicit user or Blueprint-specific repository instructions may override the default for an artifact. Unrelated workspace styling is never inherited automatically.
- The user separately approved runtime review-chrome implementation on 2026-08-28. The shell and exact-target preview now use the approved graphite, slate, cyan, and restrained semantic system while preserving the existing interaction and reviewer-authority contracts.

### Feedback composition and history

- Draft comments remain in chronological order; the composer has no manual move-earlier or move-later controls.
- Individual drafts retain stable identities, source revisions, and editability. Every draft left in the composer is part of the chosen submission; deleting a draft is the only exclusion action.
- **Approve** sends a final intent-bearing batch and ends the review, with or without comments. After successful persistence, the shell stops polling and accepting annotation input, blanks the artifact iframe, hides the review application, and shows only a terminal completion screen. The queued final packet remains available to the attached agent wait. **Revise using feedback** appears only when there is valid feedback, sends a revise intent, clears only the sent batch, and keeps the session open for additional batches. The approval control is disabled, and the reviewer endpoint rejects approval, until every submitted revision request is represented by a revision the reviewer has revealed.
- A revision submission produces one centered dimmed-overlay confirmation, remains fully visible for roughly a couple of seconds, then fades without blocking continued review. The Feedback pane is the durable receipt: queued revise batches read as waiting for the agent, acknowledged batches read as agent working, and submitted comment text remains visible until accepted after a reported amendment.
- Blueprint may suggest possible duplicates but must not merge them automatically.
- Non-accepted review items preserve original artifact order in Feedback. History is grouped by revealed revision cycle, newest first, and is loaded on demand from immutable packet and report records.
- A revision report may cover multiple revise batches. Each addressed or changed item records before, after, summary, evidence, and a selector; the revealed artifact marks that selector and the inspector can focus it on demand.
- An amended-element marker remains visible only while its feedback item awaits reviewer acceptance. Accepting the item removes the marker and its Feedback card immediately without discarding the read-only evidence retained in History.
- Batch acceptance is guarded and excludes stale or unaddressed items.
- Reopening an item requires a short follow-up note explaining what remains wrong.
- **Copy feedback** appears only in the recovery path when delivery acknowledgement is in trouble; it does not occupy the normal control rail.

### Output, privacy, and safety

- Optional final output: a clean portable HTML artifact plus a compact machine-readable decision record.
- Sandboxed review and local operation are defaults.
- No telemetry.
- Artifact publishing and hosted sharing remain outside the core product.
- MIT is the approved repository license. Version 0.2.0 is publicly distributed through npm after satisfying the approved release gates; publication is not evidence of broad feature parity or production maturity.

## Keep / modify / remove from Lavish

| Area | Direction | Blueprint interpretation |
| --- | --- | --- |
| Local HTML artifact | Keep | The saved artifact remains portable and authoritative. |
| Loopback review service | Keep conceptually | Local service mediates browser and agent; exact process model remains open. |
| Sandboxed artifact iframe | Keep | Artifact content is untrusted and isolated from review chrome. |
| Element annotation | Keep, simplify | Hold Alt/Option to preview the exact target, then click it; no toggle, text-selection creation, or context-menu fallback. |
| Agent CLI and long poll | Keep conceptually | Codex/Claude adapters need a compact, reliable contract. |
| Image attachments | Keep, quiet | Available from annotation/draft UI without dominating it. |
| Portable export | Keep | Clean HTML, with review machinery excluded. |
| Browser chrome | Replace | Slim edge rail and contextual inspector. |
| Prompt queue | Replace | Durable private drafts become one editable feedback submission with acknowledged delivery. |
| Live reload | Replace | Stage revisions silently; reviewer explicitly reveals them. |
| Comment lifecycle | Add | Stable IDs, addressed/open/stale states, human accept/reopen. |
| Agent conversation | Reduce | Status and short replies only. |
| Layout curtain and issue inbox | Remove | No blocking gate or automatic issue workflow. |
| Publish/share shortcut | Remove | No core hosted publishing path. |
| DOM snapshot feedback | Remove | Do not expose a generic snapshot feature. |
| Editable Mermaid whiteboard | Remove | Use authored, non-editable visual explanations unless scope changes later. |
| Telemetry | Remove | No usage reporting. |

## Non-goals

- Multi-person comments, permissions, mentions, or shared workspaces.
- A replacement for Codex or Claude Code chat.
- General website hosting or publishing.
- Automatic design linting that blocks review.
- In-browser artifact authoring, diagram editing, or whiteboarding.
- Autonomous acceptance of agent changes.
- Support for every artifact format in the first product.

## Interaction approval and user-testing mandate

The core interaction contract was explicitly approved on 2026-08-28 as the basis for the architecture/protocol review. The approval was deliberately qualified: the reviewer expects real Blueprint sessions to expose overcomplication and does not consider untested choices permanent.

The next architecture must therefore optimize for the smallest credible end-to-end user-testing loop, not for feature completeness. A mechanism should be deferred when the core review loop can be tested without it. Simplification discovered through use is an intended outcome, not a failure of the approved contract.

The following remain testing hypotheses rather than reasons to delay the first usable loop:

- A narrow screen uses a sheet even though the desktop inspector is docked; the mobile behavior was not separately selected in the review.
- Resizing the artifact beside a docked inspector is preferable despite possible content reflow and anchor movement.
- Fixed chronological feedback order remains usable as comment count grows.
- A required reopen note remains helpful rather than burdensome in repeated review cycles.

## Approved minimum architecture

The first user-testing slice uses one loopback Node.js process, a framework-free trusted browser shell, a sandboxed artifact iframe, atomic per-session files, immutable snapshots and intent-bearing packets, and one adapter-neutral long-wait CLI. The complete behavior and failure contract is recorded in `docs/ARCHITECTURE.md`.

For this slice, packet delivery is at least once and duplicate-safe by packet ID; a packet remains queued until the CLI has fully written it and acknowledged it. The atomic `review` command opens and waits in one process, writes launch diagnostics to standard error, and reserves standard output for one exact packet. The initial snapshot is visible immediately after the requested launch. Approval ends the session, **Revise using feedback** keeps it active, and staging never changes the visible revision. Approval is rejected while any revise packet lacks a revealed basis revision or while any staged revision is unrevealed. The blocking reveal action, accept, reopen, approval, and end-session remain reviewer-only actions.

The initial reuse decision is to copy no implementation code from Lavish. The research submodule was removed during the distribution-readiness work; its exact source pin and findings remain in `docs/LAVISH_RESEARCH.md`. Export schemas, attachments, non-self-contained artifacts, marketplace packaging, and desktop packaging remain deferred until real sessions show what is needed.

## Evidence gate for implementation

Implementation should begin only after the user explicitly approves both gates:

1. End-to-end interaction contract — **satisfied on 2026-08-28 for architecture and user-testing direction**, subject to revision through real use.
2. Architecture/protocol contract — **satisfied on 2026-08-28 for the minimum credible core described in `docs/ARCHITECTURE.md`**.

The user separately authorized local implementation of that exact vertical slice on 2026-08-28. This authority does not extend to deferred product mechanisms, external publishing, production packaging, or upstream code reuse.

The user additionally approved making Blueprint a formal AXI and authorized the first local implementation slice on 2026-08-29. That approval covers the documented CLI ergonomics, versioned playbooks, generated skill, reversible hook setup/status/removal, tests, and a local npm tarball. It does not authorize public npm publication, a license choice, a marketplace submission, or modifying the user's actual Codex or Claude Code configuration.

The user then approved the final-approval/revision-request lifecycle on 2026-08-29 through a submitted review: final **Approve**, blocking revision-ready curtain, and feedback-linked change map. That approval covers the local protocol, browser shell, agent guidance, and validation implemented here; it does not expand any external or distribution authority.

On 2026-08-30 the user explicitly removed approval as a valid action while the agent is preparing a requested revision. The implemented gate begins when the revise packet is submitted, covers waiting, working, and staged-but-unrevealed states, and ends only after the reviewer reveals a revision that names the request as a basis.

On 2026-08-30 the user also approved the recommended atomic feedback attachment after observing agents sometimes stop after opening a review. `blueprint review <artifact.html>` is now the default launch-and-first-wait command; `open` and `wait` remain compatible lower-level recovery surfaces. The packet schema and browser authority model are unchanged.

On 2026-08-30 the user approved the specialist-wedge positioning after a direct Blueprint-versus-Lavish comparison. The approved next phase adopted MIT, strengthened validation and test depth including recovery coverage, removed the Lavish research submodule, and published the package to npm. The completed release does not claim present feature parity or production maturity.

Later on 2026-08-30 the user approved the exact 0.2.0 release candidate and ordered sequence: commit and push the matching source to `origin/main`, observe the Windows/Linux Node 22/24 CI matrix, authenticate npm, publish the reviewed `blueprint-local-review@0.2.0` tarball as `latest`, verify the registry, install the published package on this computer, verify the existing Codex integration, then create and push `v0.2.0`. Any CI, authentication, integrity, publication, installation, or verification failure stops the sequence without silent repacking.

That sequence completed with the unchanged reviewed tarball. The four-cell CI matrix passed, npm reports the approved integrity and SHA-1 with `latest` at 0.2.0, a clean public install passed, this computer now runs the public 0.2.0 package, and the existing Codex integration remained installed and byte-identical without repair. Tag `v0.2.0` records the matching release source.

Later on 2026-08-30 the user approved a story-first public README and selected the recommended inline looping GIF. The approved implementation uses a concise product explanation, a real Blueprint review loop, copy-paste installation, an agent-ready first prompt, explicit credit to Lavish and its creator Kun Chen, and a small set of useful documentation links. The user explicitly rejected and removed the proposed WebP banner. Maintainer material moves to `docs/DEVELOPMENT.md`. The approval covers local README and asset work only; it does not authorize a version bump, npm publication, commit, push, or other external effects.
