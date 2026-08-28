# Lavish research baseline

This note records what was learned from the cloned Lavish source and which lessons carry into Blueprint. It is not a promise to reuse Lavish code.

## Source pin

- Upstream: `https://github.com/kunchenguid/lavish-axi.git`
- Package version: `0.1.62`
- Tag: `lavish-axi-v0.1.62`
- Commit: `a7ddbbaf585e101793938c6dacf8bb0c11e09003`
- License: MIT; see `upstream/lavish-axi/LICENSE` and `THIRD-PARTY-NOTICES.md`.

The source is preserved as the Git submodule `upstream/lavish-axi`. Keep the pin stable until a deliberate research update is approved.

## How Lavish works

### Agent-facing CLI

[`src/cli.js`](../upstream/lavish-axi/src/cli.js) owns the main agent interface: open an HTML file, long-poll for reviewer feedback, end a session, export, share, start/stop the local server, and expose design/playbook guidance. The compact CLI contract is a major reason capable agents can operate Lavish without a richer integration protocol.

Blueprint should retain a small agent-facing command surface, but the command vocabulary and response schema should be designed around staged revisions, acknowledged packets, and verification rather than copied as-is.

### Local session service

[`src/server.js`](../upstream/lavish-axi/src/server.js) provides the local HTTP service and browser endpoints. [`src/session-store.js`](../upstream/lavish-axi/src/session-store.js) manages review sessions, while the public contract identifies a session by the canonical artifact path instead of requiring the agent to retain an opaque browser ID.

Blueprint should keep loopback-first operation and easy artifact identity. It still needs an explicit design for revision identity, durable state, and multi-process recovery.

### Artifact isolation and injection

[`src/html-transform.js`](../upstream/lavish-axi/src/html-transform.js) injects the review SDK at serve time. [`src/artifact-sdk.js`](../upstream/lavish-axi/src/artifact-sdk.js) runs inside the artifact frame and implements annotation targeting, text selection, attachment handling, prompt queuing, snapshots, layout auditing, and whiteboard enhancement. [`src/chrome-client.js`](../upstream/lavish-axi/src/chrome-client.js) owns the trusted review chrome and mediates messages from the sandboxed, opaque-origin artifact frame.

The security split is worth preserving: treat the artifact as untrusted; give the trusted shell sole authority over server mutations; validate `postMessage` origin/source context and revision tokens. Blueprint should narrow the SDK to the selected feature set rather than bring over layout auditing, snapshots, or whiteboards.

### Feedback delivery

The artifact SDK exposes `queuePrompt`, `sendQueuedPrompts`, and `endSession`; the browser chrome forwards queued feedback to the local service, and the CLI poll returns it to the waiting agent. Lavish also protects unsent review state during live reloads.

Blueprint changes the product contract substantially: local comments are durable drafts, one deliberate packet is sent, delivery is acknowledged, and a later revision maps back to stable comment IDs for human verification.

### Attachments

[`src/attachment-store.js`](../upstream/lavish-axi/src/attachment-store.js) validates accepted image formats, applies per-file and per-prompt limits, stores files locally, and sweeps expired data. This is useful evidence for the operational concerns Blueprint must cover even if it chooses a new store.

### Portable export

[`src/export-bundle.js`](../upstream/lavish-axi/src/export-bundle.js) creates a standalone HTML bundle by inlining local assets and excluding Lavish review machinery. The distinction between the saved artifact and transient review chrome aligns with Blueprint's portability goal.

### Guidance as product surface

[`src/playbooks.js`](../upstream/lavish-axi/src/playbooks.js), [`src/design-reference.js`](../upstream/lavish-axi/src/design-reference.js), and [`skills/lavish/SKILL.md`](../upstream/lavish-axi/skills/lavish/SKILL.md) teach agents how to create appropriate artifacts. Lavish treats CLI output and progressively disclosed guidance as part of its interface, not merely documentation.

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
