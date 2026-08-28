# Blueprint product contract

Status: discovery baseline, 2026-08-27. This document records approved directions and explicitly separates them from unresolved design and architecture choices.

## Problem

Agent-generated HTML can communicate plans, comparisons, and designs far better than plain text, but the review loop often becomes noisy or unreliable. The reviewer may be interrupted by automatic browser behavior, lose draft feedback, struggle to point at the exact thing that should change, or receive a revision without a trustworthy way to verify what was addressed.

Blueprint should make visual review feel deliberate: the agent prepares, the human reveals; the human drafts privately, then sends; the agent reports work, and the human verifies.

## Core loop

1. The agent prepares an artifact silently.
2. Blueprint shows a quiet ready state without stealing focus.
3. The reviewer chooses to reveal the artifact; a deliberately loaded revision starts at the top.
4. The reviewer selects text or targets an element and creates local draft comments.
5. Drafts collect into one editable feedback packet.
6. The reviewer explicitly sends the packet.
7. Blueprint reports acknowledgement, working, revision-ready, or disconnected state without becoming a full chat client.
8. The agent stages a revision and maps its work to stable comment identities.
9. The reviewer chooses when to reveal the revision.
10. The reviewer accepts or reopens comments individually, with a shortcut to accept all items currently reported as addressed.

## Settled decisions

### Audience and scope

- One human, one agent, one artifact.
- Personal/local-first. Friends and colleagues can install their own private copies; Blueprint is not a shared multi-user workspace.
- Codex and Claude Code are the initial first-class adapters.
- Ground-up product design informed by Lavish and selected MIT code, not a fork that inherits the entire product architecture.

### Human control

- Never open, reload, replace, or take focus without a human reveal action.
- Reset to the top when the reviewer deliberately reveals a new revision.
- Reviewer actions close the loop. Agent claims such as “addressed” do not auto-resolve feedback.
- Preserve stale anchors and evidence rather than silently discarding them when the artifact changes.

### Feedback

- Text selection is the primary annotation gesture.
- Alt/Option-click targets an element; a context-menu action is the discoverable fallback.
- Comments are private local drafts until bundled and sent deliberately.
- Stable local comment IDs underpin revision mapping and verification without turning Blueprint into a ticket tracker.
- Attachments stay available through a quiet icon, not a prominent labeled control.

### Interface

- Nearly chrome-free presentation with a slim right-edge rail rather than a large global header.
- Compact first: one recommendation, at most three primary options, short tradeoffs, and collapsed supporting evidence.
- Show actual visual or motion specimens for visual decisions. Styled, non-editable diagrams are acceptable for routine architecture explanations.
- Agent presence is limited to lifecycle state and short replies; full conversation remains in Codex or Claude Code.
- The visual direction is a calm, dark, editorial/instrument interface derived from the strongest aspects of the earlier Franky reference, with lower density and less dashboard noise.

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
| Text and element annotation | Keep, simplify | Selection first; modifier-click and context menu for elements. |
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

## Unresolved before implementation

The next interaction review should make these concrete with working visual specimens:

1. Exact collapsed and expanded edge-rail/inspector behavior, including desktop overlay versus content resizing and the mobile sheet.
2. Packet-composer structure: comment ordering, editing, deduplication, packet-level note, and the final send affordance.
3. Revision evidence: how “addressed,” “changed,” and “stale” are presented without creating visual noise.
4. Verification flow: original order versus status grouping, batch acceptance guardrails, and reopening with follow-up text.
5. Disconnection and recovery states, including when the always-available “Copy packet” escape should appear.

After the core interaction is approved, a separate architecture review must settle:

- Revision identity and snapshot strategy.
- Durable local state format and migration policy.
- Browser/server/agent protocol and delivery acknowledgement semantics.
- Codex and Claude Code adapter boundaries.
- Export and machine-readable decision-record schemas.
- Exact upstream code reuse and attribution plan.

## Evidence gate for implementation

Implementation should begin only after the user explicitly approves both:

1. the end-to-end interaction contract; and
2. the architecture/protocol contract.

An exploratory prototype, a queued Lavish response, or an agent recommendation alone is not approval.
