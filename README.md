# Blueprint

Blueprint is a proposed local-first review tool for one person and one coding agent working over one visual artifact. It is inspired by what works in Lavish Editor, but its product contract is deliberately calmer, more human-gated, and more focused on durable review cycles.

## Status

Blueprint is implementing its approved minimum credible core for local user testing. Broader product mechanisms remain in discovery and are intentionally deferred.

The working name is settled as **Blueprint**. A naming exploration was explicitly rejected and closed.

## Product in one paragraph

At the reviewer's request, an agent prepares and launches a portable HTML artifact directly into Blueprint. Holding Alt/Option previews the exact element under the pointer; clicking while it is held creates an annotation. The reviewer keeps comments private while composing them and deliberately sends one feedback packet. The agent acknowledges that packet and prepares a staged revision. The reviewer reveals the revision on their own terms, then accepts or reopens each addressed comment. The human—not the agent—closes the loop.

## Ask an agent to run the first slice

The reviewer never needs to operate Blueprint from a terminal. Ask Codex or Claude Code to author or open a self-contained HTML artifact in Blueprint and remain attached to its feedback. Before authoring, the agent can inspect Blueprint's current visual authority with:

```sh
node bin/blueprint.js design
```

Blueprint's approved default is the unified graphite diagnostic system recorded in [`docs/VISUAL_SYSTEM.md`](docs/VISUAL_SYSTEM.md): a fine 24-pixel non-blue grid, slate structure, cyan interaction signal, restrained semantic colors, and shared visual language across review chrome and default artifacts. Reviewer-facing instructions inside an artifact use a dedicated brass meta band so they remain visibly separate from the artifact's subject. Explicit Blueprint-specific user or repository instructions may override the default; Blueprint does not automatically inherit a design system merely because one exists in the current workspace. The earlier dark Fieldnote prototype remains a behavioral specimen, not the approved default.

The agent-facing open command is:

```sh
node bin/blueprint.js open path/to/artifact.html
```

The initial artifact appears immediately. The reviewer annotates it and sends a packet. The agent—not the reviewer—receives the oldest queued packet with:

```sh
node bin/blueprint.js wait path/to/artifact.html
```

`wait` prints one immutable JSON packet, then acknowledges it only after standard output has completed. After editing the authoritative HTML, the agent can stage a revision:

```sh
node bin/blueprint.js stage path/to/artifact.html --report path/to/report.json
```

An optional report maps known `commentId` values to `addressed`, `changed`, or `stale`, with a summary and optional evidence. Staging does not change visible content; the reviewer reveals it from the browser shell.

Run the executable contract checks with:

```sh
npm test
```

Blueprint currently requires Node.js 22 or newer and has no runtime package dependencies. Runtime state lives outside the repository by default; agents can set `BLUEPRINT_STATE_DIR` to isolate it when testing.

## Repository map

- [`docs/PRODUCT.md`](docs/PRODUCT.md) — product contract, settled decisions, non-goals, and open questions.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — approved minimum-core architecture, protocol, recovery, and security contract.
- [`docs/VISUAL_SYSTEM.md`](docs/VISUAL_SYSTEM.md) — approved default visual language and artifact meta-instruction treatment.
- [`docs/LAVISH_RESEARCH.md`](docs/LAVISH_RESEARCH.md) — evidence-backed notes about the Lavish architecture and the reuse boundary.
- [`docs/CONTINUATION.md`](docs/CONTINUATION.md) — exact handoff state and recommended next session.
- [`AGENTS.md`](AGENTS.md) — operating rules for agents working in this repository.
- [`.lavish/blueprint-discovery-round-1.html`](.lavish/blueprint-discovery-round-1.html) — the discovery artifact, evolved through round two.
- [`.lavish/blueprint-naming-round-1.html`](.lavish/blueprint-naming-round-1.html) — closed naming exploration; retained only as history.
- [`upstream/lavish-axi`](upstream/lavish-axi) — read-only Git submodule pinned to the researched Lavish release.
- [`src/`](src) and [`bin/blueprint.js`](bin/blueprint.js) — the approved loopback service, durable store, sandbox injection, browser shell, and CLI.
- [`test/`](test) — executable protocol, recovery, authority, and full-cycle checks.

## Resume the workspace

Clone the repository, then initialize the research dependency:

```sh
git submodule update --init --recursive
```

Read `AGENTS.md`, `docs/PRODUCT.md`, `docs/ARCHITECTURE.md`, and `docs/CONTINUATION.md` before changing the implementation. Keep work inside the approved first vertical slice unless the user authorizes a broader decision.

## Upstream reference

The Lavish submodule is pinned to:

- Repository: `https://github.com/kunchenguid/lavish-axi.git`
- Release: `lavish-axi-v0.1.62`
- Commit: `a7ddbbaf585e101793938c6dacf8bb0c11e09003`

Lavish is MIT-licensed. The approved first slice copies no Lavish implementation code. Any later reuse must be separately justified and preserve the relevant license and third-party notices.
