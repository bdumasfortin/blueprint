# Blueprint repository guidance

These instructions apply to the entire repository unless a more specific `AGENTS.md` says otherwise.

## Start here

1. Read `README.md`, `docs/PRODUCT.md`, and `docs/CONTINUATION.md`.
2. Treat `.lavish/blueprint-discovery-round-1.html` as design history, not as an implementation specification.
3. Treat `upstream/lavish-axi` as a read-only research submodule. Do not modify it, advance its pin, or copy code from it without an explicit, documented reason.

## Current phase and authority

- Blueprint is in discovery and interaction design. There is no approved implementation architecture or scaffold.
- Do not begin product implementation merely because the next steps are documented.
- Before consequential product, UX, architecture, dependency, protocol, persistence, or licensing decisions, present a recommendation, alternatives, tradeoffs, risks, and unknowns for explicit review.
- Local prototypes and review artifacts are exploration. They do not authorize production implementation.
- The product name is **Blueprint**. Do not restart naming work unless the user asks.

## Product invariants

- One human, one agent, one artifact.
- Personal and local-first; colleagues use their own private installations.
- Codex and Claude Code are the first-class agent adapters.
- The reviewer controls reveal, send, verification, and session completion.
- A prepared artifact or revision must not steal focus, open itself, or silently replace visible content.
- Feedback remains private and editable until the reviewer deliberately sends one bundled packet.
- Agent delivery must be acknowledged; failures must preserve drafts and offer a recoverable copy path.
- Stable comment identities survive revisions. The agent may report an item addressed; only the human may accept it or reopen it.
- The reviewed HTML remains portable and authoritative. Local operation and sandboxing are default requirements.
- No telemetry.
- Compact-first communication: one recommendation, no more than three primary choices, short tradeoffs, evidence on demand.
- Visual or motion decisions require representative specimens. Do not ask the user to choose a visual direction from prose alone.

## Lavish-derived boundary

Preserve conceptually: local HTML review, sandboxed rendering, precise text/element annotation, loopback operation, an agent-friendly CLI, long-poll feedback delivery, attachments, and portable export.

Redesign: the browser chrome, annotation gesture, private draft queue, packet composer, delivery acknowledgement, staged revision reveal, connection status, comment lifecycle, verification, and optional final decision artifact.

Exclude from Blueprint unless a later review reverses the decision: layout curtain/gate, layout-issues inbox, publishing shortcut or hosted sharing, DOM snapshot feedback, editable Mermaid/whiteboard mode, telemetry, multi-human collaboration, and full in-tool chat.

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

- Keep generated browser profiles and QA runtime data out of Git; `.lavish/qa/` is intentionally ignored.
- Preserve `.lavish/*.html` and `.lavish/assets/` when they contain decision history.
- Update `docs/PRODUCT.md` when a product decision is approved and `docs/CONTINUATION.md` whenever the stopping point changes materially.
- Keep commits focused and leave the main worktree in a resumable state.
