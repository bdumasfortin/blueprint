# Lavish research baseline

This note records what was learned from the cloned Lavish source and which lessons carry into Blueprint. It is not a promise to reuse Lavish code.

## Source pin

- Upstream: `https://github.com/kunchenguid/lavish-axi.git`
- Package version: `0.1.63`
- Tag: `lavish-axi-v0.1.63`
- Commit: `ffd7aacff563b8bca09eb7ebfb17c14faeb968ce`
- License: MIT; see the pinned upstream [`LICENSE`](https://github.com/kunchenguid/lavish-axi/blob/ffd7aacff563b8bca09eb7ebfb17c14faeb968ce/LICENSE) and [`THIRD-PARTY-NOTICES.md`](https://github.com/kunchenguid/lavish-axi/blob/ffd7aacff563b8bca09eb7ebfb17c14faeb968ce/THIRD-PARTY-NOTICES.md).

The source pin is preserved as documentation rather than a repository dependency. The local research submodule was removed after the comparative audit; consult the exact upstream commit above when evidence needs to be revisited.

## 2026-08-30 comparative refresh

An independent feature audit and direct source review found that Blueprint has a defensible reason to exist, but not as a general replacement for Lavish. Lavish is the broader and more mature visual-review utility: it leads on targeting richness, attachments and local assets, layout diagnostics, diagrams and whiteboards, chat, live reload, export, sharing and phone review, public distribution, integrations, and demonstrated edge-case coverage.

Blueprint's distinct value is a narrower decision-grade revision and sign-off cycle: feedback remains private until an explicit intent is submitted; a staged revision cannot replace the visible evidence until the reviewer reveals it; every claimed amendment carries before/after evidence tied to its basis feedback; only the reviewer accepts or reopens each item; and final approval closes the session. The recommended positioning is therefore to complement Lavish and serve consequential agent-generated plans, architecture, and UI proposals where those controls justify deliberate friction.

The refreshed Lavish checkout passed build, lint, formatting, and type checks on Windows. Its test run discovered 1,156 tests: 1,143 passed, 11 were skipped, and 2 Cursor plugin-registration tests failed on Windows-specific link behavior. That is recorded as a local integration caveat rather than evidence of a core review-loop failure.

## How Lavish works

### Agent-facing CLI

[`src/cli.js`](https://github.com/kunchenguid/lavish-axi/blob/ffd7aacff563b8bca09eb7ebfb17c14faeb968ce/src/cli.js) owns the main agent interface: open an HTML file, long-poll for reviewer feedback, end a session, export, share, start/stop the local server, and expose design/playbook guidance. The compact CLI contract is a major reason capable agents can operate Lavish without a richer integration protocol.

Blueprint should retain a small agent-facing command surface, but the command vocabulary and response schema should be designed around staged revisions, acknowledged packets, and verification rather than copied as-is.

### Local session service

[`src/server.js`](https://github.com/kunchenguid/lavish-axi/blob/ffd7aacff563b8bca09eb7ebfb17c14faeb968ce/src/server.js) provides the local HTTP service and browser endpoints. [`src/session-store.js`](https://github.com/kunchenguid/lavish-axi/blob/ffd7aacff563b8bca09eb7ebfb17c14faeb968ce/src/session-store.js) manages review sessions, while the public contract identifies a session by the canonical artifact path instead of requiring the agent to retain an opaque browser ID.

Blueprint should keep loopback-first operation and easy artifact identity. It still needs an explicit design for revision identity, durable state, and multi-process recovery.

### Artifact isolation and injection

[`src/html-transform.js`](https://github.com/kunchenguid/lavish-axi/blob/ffd7aacff563b8bca09eb7ebfb17c14faeb968ce/src/html-transform.js) injects the review SDK at serve time. [`src/artifact-sdk.js`](https://github.com/kunchenguid/lavish-axi/blob/ffd7aacff563b8bca09eb7ebfb17c14faeb968ce/src/artifact-sdk.js) runs inside the artifact frame and implements annotation targeting, text selection, attachment handling, prompt queuing, snapshots, layout auditing, and whiteboard enhancement. [`src/chrome-client.js`](https://github.com/kunchenguid/lavish-axi/blob/ffd7aacff563b8bca09eb7ebfb17c14faeb968ce/src/chrome-client.js) owns the trusted review chrome and mediates messages from the sandboxed, opaque-origin artifact frame.

The security split is worth preserving: treat the artifact as untrusted; give the trusted shell sole authority over server mutations; validate `postMessage` origin/source context and revision tokens. Blueprint should narrow the SDK to the selected feature set rather than bring over layout auditing, snapshots, or whiteboards.

### Feedback delivery

The artifact SDK exposes `queuePrompt`, `sendQueuedPrompts`, and `endSession`; the browser chrome forwards queued feedback to the local service, and the CLI poll returns it to the waiting agent. Lavish also protects unsent review state during live reloads.

Blueprint changes the product contract substantially: local comments are durable drafts, one deliberate packet is sent, delivery is acknowledged, and a later revision maps back to stable comment IDs for human verification.

### Attachments

[`src/attachment-store.js`](https://github.com/kunchenguid/lavish-axi/blob/ffd7aacff563b8bca09eb7ebfb17c14faeb968ce/src/attachment-store.js) validates accepted image formats, applies per-file and per-prompt limits, stores files locally, and sweeps expired data. This is useful evidence for the operational concerns Blueprint must cover even if it chooses a new store.

### Portable export

[`src/export-bundle.js`](https://github.com/kunchenguid/lavish-axi/blob/ffd7aacff563b8bca09eb7ebfb17c14faeb968ce/src/export-bundle.js) creates a standalone HTML bundle by inlining local assets and excluding Lavish review machinery. The distinction between the saved artifact and transient review chrome aligns with Blueprint's portability goal.

### Guidance as product surface

[`src/playbooks.js`](https://github.com/kunchenguid/lavish-axi/blob/ffd7aacff563b8bca09eb7ebfb17c14faeb968ce/src/playbooks.js), [`src/design-reference.js`](https://github.com/kunchenguid/lavish-axi/blob/ffd7aacff563b8bca09eb7ebfb17c14faeb968ce/src/design-reference.js), and [`skills/lavish/SKILL.md`](https://github.com/kunchenguid/lavish-axi/blob/ffd7aacff563b8bca09eb7ebfb17c14faeb968ce/skills/lavish/SKILL.md) teach agents how to create appropriate artifacts. Lavish treats CLI output and progressively disclosed guidance as part of its interface, not merely documentation.

Blueprint should preserve that insight. Codex and Claude Code adapters should share one versioned behavior contract so installed guidance cannot silently drift from the executable.

## Strong ideas to preserve

- The artifact stays valid and useful without the review tool.
- The saved HTML is the author's source of truth.
- Review is local by default and external network activity is explicit.
- The artifact executes in a sandbox and communicates through a narrow mediated channel.
- The agent operates through a compact CLI and a single long-lived wait rather than repeated polling chatter.
- Review feedback can point to exact text and elements instead of relying on prose-only descriptions.
- Export excludes the review SDK and can inline local assets.
- Agent guidance is versioned alongside the implementation.

## Product and implementation to reject

- Surprise browser opening, focus changes, or visible live reloads.
- A blocking layout curtain and layout-issues workflow.
- Hosted share/publish controls in the core experience.
- Generic DOM snapshot feedback.
- Editable Mermaid/Excalidraw whiteboards.
- Telemetry.
- A dense top bar, full embedded chat, or large persistent chrome.
- Agent-reported completion automatically resolving human feedback.

## Reuse policy

No Lavish source file has been selected for reuse. Before copying code:

1. prove that reuse is simpler than a focused reimplementation;
2. record the exact upstream file and pinned commit;
3. preserve MIT copyright/license notices and applicable third-party notices;
4. adapt the code to Blueprint's approved contracts rather than preserving incompatible behavior; and
5. add tests around the retained security and state assumptions.
