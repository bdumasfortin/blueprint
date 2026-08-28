# Blueprint repository guidance

These instructions apply to the entire repository unless a more specific `AGENTS.md` says otherwise.

## Start here

1. Read `README.md`, `docs/PRODUCT.md`, and `docs/CONTINUATION.md`.
2. Treat `.lavish/blueprint-discovery-round-1.html` as design history, not as an implementation specification.
3. Treat `upstream/lavish-axi` as a read-only research submodule. Do not modify it, advance its pin, or copy code from it without an explicit, documented reason.

## Current phase and authority

- Blueprint's minimum credible core is approved, implemented locally, and undergoing direct user testing. Broader product mechanisms remain in discovery.
- Do not expand beyond the approved core merely because deferred steps are documented.
- Before consequential product, UX, architecture, dependency, protocol, persistence, or licensing decisions, present a recommendation, alternatives, tradeoffs, risks, and unknowns for explicit review.
- Local prototypes and review artifacts are exploration. They do not authorize production implementation.
- The product name is **Blueprint**. Do not restart naming work unless the user asks.

## Product invariants

- One human, one agent, one artifact.
- Personal and local-first; colleagues use their own private installations.
- Codex and Claude Code are the first-class agent adapters.
- The reviewer initiates Blueprint through their agent and controls send, staged-revision reveal, verification, and session completion.
- The requested initial launch displays the artifact immediately. A prepared revision must not steal focus, open itself, or silently replace visible content.
- Feedback remains private and editable until the reviewer deliberately sends one bundled packet.
- Agent delivery must be acknowledged; failures must preserve drafts and offer a recoverable copy path.
- Stable comment identities survive revisions. The agent may report an item addressed; only the human may accept it or reopen it.
- The reviewed HTML remains portable and authoritative. Local operation and sandboxing are default requirements.
- No telemetry.
- Compact-first communication: one recommendation, no more than three primary choices, short tradeoffs, evidence on demand.
- Visual or motion decisions require representative specimens. Do not ask the user to choose a visual direction from prose alone.

## Lavish-derived boundary

Preserve conceptually: local HTML review, sandboxed rendering, precise element annotation, loopback operation, an agent-friendly CLI, long-poll feedback delivery, attachments, and portable export.

Redesign: the browser chrome, annotation gesture, private draft queue, packet composer, delivery acknowledgement, staged revision reveal, connection status, comment lifecycle, verification, and optional final decision artifact.

Exclude from Blueprint unless a later review reverses the decision: layout curtain/gate, layout-issues inbox, publishing shortcut or hosted sharing, DOM snapshot feedback, editable Mermaid/whiteboard mode, telemetry, multi-human collaboration, and full in-tool chat.

## Blueprint artifact design

- Before authoring an artifact for Blueprint, use `blueprint design` to check the current visual authority.
- Precedence is: explicit user direction for the artifact; then repository or agent instructions explicitly about Blueprint artifact design.
- Do not inspect, infer, or inherit a workspace design system merely because it exists. General project styling is not an override unless an instruction explicitly applies it to Blueprint artifacts.
- Blueprint's approved default is the unified graphite diagnostic system in `docs/VISUAL_SYSTEM.md`: a fine 24-pixel non-blue grid, slate structure, cyan interaction signal, restrained semantic colors, and a shared language across review chrome and default artifacts.
- Reserve the documented brass meta band for reviewer-facing instructions inside artifacts. Do not use it for subject matter, recommendations, ordinary warnings, or status.
- The former calm, dark, editorial/instrument prototype remains a behavioral specimen and is not visual authority.
- Runtime review chrome must not rewrite the artifact's authored styling.

## Review workflow

- Use Lavish for non-trivial product, UX, architecture, or implementation plans intended for user review.
- Use a fresh artifact for each new review iteration. Do not reopen a concluded session as a shortcut.
- Carry settled decisions forward visibly and do not ask them again without new evidence.
- Every decision form must keep edits local until the reviewer chooses **Queue response**. Queue exactly one response per form; never auto-send or auto-end the session.
- Give the reviewer an explicit submission path. A browser-local selection is not feedback or authorization.
- Open one tracked feedback wait per review and retain it until the reviewer sends feedback or ends the session.
- Validate review contracts and visually inspect wide, narrow, light/dark where applicable before opening the review.
- Do not estimate development duration.

## Engineering expectations once implementation is approved

- Prefer a small, explicit architecture with durable state and protocol contracts over inheriting Lavish wholesale.
- Write behavior contracts and tests before choosing which upstream components, if any, to reuse.
- Preserve the artifact as source of truth; injected review behavior must not contaminate portable exports.
- Bind locally by default and model the artifact iframe as untrusted input.
- Keep external network activity opt-in, named, and visible at the moment it occurs.
- Validate in proportion to risk: protocol/state tests, sandbox and path-boundary tests, recovery tests, accessibility checks, and real-browser interaction tests are expected for the core loop.
- If MIT code is reused, retain required copyright, license, and third-party notices and record the source file and upstream commit.

## Repository hygiene

- Keep Blueprint runtime state and Lavish review artifacts out of Git; `.blueprint/` and `.lavish/` are intentionally ignored.
- The early Lavish discovery and naming files already tracked in Git remain historical evidence. Do not remove or rewrite them casually, but record all new approved decisions durably in `docs/` rather than relying on ignored review files.
- Update `docs/PRODUCT.md` when a product decision is approved and `docs/CONTINUATION.md` whenever the stopping point changes materially.
- Keep commits focused and leave the main worktree in a resumable state.
