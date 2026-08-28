# Blueprint product contract

Status: interaction and minimum-core architecture contracts approved for local implementation and user testing, 2026-08-28. This document records approved directions and explicitly separates them from testing hypotheses and deferred product choices.

## Problem

Agent-generated HTML can communicate plans, comparisons, and designs far better than plain text, but the review loop often becomes noisy or unreliable. The reviewer may be interrupted by automatic browser behavior, lose draft feedback, struggle to point at the exact thing that should change, or receive a revision without a trustworthy way to verify what was addressed.

Blueprint should make visual review feel deliberate: the agent launches the requested initial artifact; the human drafts privately, then sends; the agent reports work, and the human controls when revisions appear and verifies them.

## Core loop

1. The reviewer asks their agent to prepare and launch an artifact in Blueprint.
2. Blueprint displays the initial artifact immediately; there is no separate ready or reveal gate for the first snapshot.
3. The reviewer holds Alt/Option to preview the exact HTML element under the pointer, then clicks it to create a local draft comment.
4. Drafts collect chronologically into one editable feedback packet.
5. The reviewer explicitly sends the packet.
6. Blueprint reports acknowledgement, working, revision-ready, or disconnected state without becoming a full chat client.
7. The agent stages a revision and maps its work to stable comment identities.
8. The reviewer chooses when to reveal the revision.
9. The reviewer accepts or reopens comments individually, with a shortcut to accept all items currently reported as addressed.

## Settled decisions

### Audience and scope

- One human, one agent, one artifact.
- Personal/local-first. Friends and colleagues can install their own private copies; Blueprint is not a shared multi-user workspace.
- Codex and Claude Code are the initial first-class adapters.
- The human entry point is conversational: the reviewer asks their agent to start or continue Blueprint and is never expected to invoke the CLI. The CLI is an agent-adapter surface.
- Ground-up product design informed by Lavish and selected MIT code, not a fork that inherits the entire product architecture.

### Human control

- A direct request to the agent to launch Blueprint authorizes opening the initial artifact without a second in-product reveal step.
- After launch, never reload, replace, or take focus without a human reveal action. Reset to the top when the reviewer deliberately reveals a staged revision.
- Reviewer actions close the loop. Agent claims such as “addressed” do not auto-resolve feedback.
- Preserve stale anchors and evidence rather than silently discarding them when the artifact changes.

### Feedback

- Alt/Option-clicking an HTML element is the only annotation gesture in the first slice.
- While Alt/Option is held, a temporary outline and element label identify the exact click target before the reviewer annotates it.
- Text selection, an annotation toggle, and a context-menu fallback do not create comments.
- A new comment opens its editor and receives focus immediately, including reopening the inspector if necessary.
- Comments are private local drafts until bundled and sent deliberately.
- Stable local comment IDs underpin revision mapping and verification without turning Blueprint into a ticket tracker.
- Attachments stay available through a quiet icon, not a prominent labeled control.

### Interface

- Nearly chrome-free presentation. The right-edge rail is visible only while the inspector is collapsed, and clicking anywhere on it expands the inspector.
- When expanded on desktop, the inspector is docked and resizes the artifact rather than overlaying it. Its larger collapse chevron sits in the inspector's top-right corner. End review sits at the bottom-right beside **Send feedback**; staged-revision reveal remains in the inspector rather than the collapsed rail.
- Compact first: one recommendation, at most three primary options, short tradeoffs, and collapsed supporting evidence.
- Show actual visual or motion specimens for visual decisions. Styled, non-editable diagrams are acceptable for routine architecture explanations.
- Agent presence is limited to lifecycle state and short replies; full conversation remains in Codex or Claude Code.
- Blueprint does not automatically inherit a workspace design system. Explicit user or agent instructions that state a preferred design system for Blueprint artifacts may supply one.
- Runtime review chrome does not rewrite the artifact's authored styling.

### Visual direction — approved source of truth

- The full-system candidate was explicitly approved as Blueprint's visual source of truth on 2026-08-28, without refinement notes. The durable implementation-facing contract is `docs/VISUAL_SYSTEM.md`; `.lavish/` is local review state and is not required to reconstruct the decision.
- The previously recorded calm, dark, editorial/instrument direction was an agent-authored synthesis of Lavish and Franky cues. The reviews approved interaction behavior and the requirement for visual specimens, but never asked for or received approval of that palette, typography, or component language.
- The current dark review shell and revised Fieldnote example remain useful behavioral-test specimens only. They are not visual authority and must not silently become the product default.
- The approved direction uses Franky's diagnostic color scheme, one unified visual system across the review shell and default authored artifacts, and a uniform fine 24-pixel non-blue graphite grid at low contrast.
- Its grammar is near-black graphite canvas, slate structure, cyan interaction signal, restrained semantic colors, compact system sans with monospace controls/state/evidence, crisp one-pixel borders, minimally rounded geometry, dense controls, and generous document-scale whitespace.
- A subsequent explicit refinement reserves the earlier brass meta-band treatment for reviewer-facing instructions inside authored artifacts. “Meta” means content about operating or interpreting the review—review protocol, choice instructions, scope/authority, queueing, and submission—not the artifact's subject, ordinary warnings, recommendations, or status. The dark token is `#d8a34d` over `rgba(216, 163, 77, .11)`; the light token is `#81500f` over `rgba(129, 80, 15, .09)`, with a brass border, four-pixel leading rule, and faint diagonal stripe.
- Explicit user or Blueprint-specific repository instructions may override the default for an artifact. Unrelated workspace styling is never inherited automatically.
- The approval establishes visual direction and authoring guidance. Runtime review-chrome implementation remains a separate authority gate, and the running behavior-test session must not be silently restyled.

### Packet composition and verification

- Draft comments remain in chronological order; the composer has no manual move-earlier or move-later controls.
- Individual drafts retain stable identities and remain editable, includable/excludable, and subordinate to an optional packet-level note.
- Blueprint may suggest possible duplicates but must not merge them automatically.
- Verification preserves original artifact order with optional status filters.
- Revision evidence is collapsed by default and revealed per comment on demand.
- Batch acceptance is guarded and excludes stale or unaddressed items.
- Reopening an item requires a short follow-up note explaining what remains wrong.
- “Copy packet” appears only in the recovery path when delivery acknowledgement is in trouble; it does not occupy the normal control rail.

### Output, privacy, and safety

- Optional final output: a clean portable HTML artifact plus a compact machine-readable decision record.
- Sandboxed review and local operation are defaults.
- No telemetry.
- External publishing is outside the core product.

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
| Prompt queue | Replace | Durable private drafts become one editable packet with acknowledged delivery. |
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
- Fixed chronological packet order remains usable as comment count grows.
- A required reopen note remains helpful rather than burdensome in repeated review cycles.

## Approved minimum architecture

The first user-testing slice uses one loopback Node.js process, a framework-free trusted browser shell, a sandboxed artifact iframe, atomic per-session files, immutable snapshots and packets, and one adapter-neutral long-wait CLI. The complete behavior and failure contract is recorded in `docs/ARCHITECTURE.md`.

For this slice, packet delivery is at least once and duplicate-safe by packet ID; a packet remains queued until the CLI has fully written it and acknowledged it. The initial snapshot is visible immediately after the requested launch. Staging never changes the visible revision; staged-revision reveal, accept, reopen, and end-session remain reviewer-only actions.

The initial reuse decision is to copy no implementation code from Lavish. Export schemas, attachments, non-self-contained artifacts, production adapter wrappers, and packaging remain deferred until real sessions show what is needed.

## Evidence gate for implementation

Implementation should begin only after the user explicitly approves both gates:

1. End-to-end interaction contract — **satisfied on 2026-08-28 for architecture and user-testing direction**, subject to revision through real use.
2. Architecture/protocol contract — **satisfied on 2026-08-28 for the minimum credible core described in `docs/ARCHITECTURE.md`**.

The user separately authorized local implementation of that exact vertical slice on 2026-08-28. This authority does not extend to deferred product mechanisms, external publishing, production packaging, or upstream code reuse.
