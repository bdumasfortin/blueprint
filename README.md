# Blueprint

Blueprint is a local-first review tool for one person and one coding agent working over one visual artifact. It is inspired by what works in Lavish Editor, but its product contract is deliberately calmer, more human-gated, and more focused on durable review cycles. Its agent-facing CLI is now formally designed as an AXI (Agent eXperience Interface).

## Status

Blueprint's approved minimum credible core and first local AXI integration slice are implemented for local user testing. Broader product mechanisms remain in discovery and are intentionally deferred.

The working name is settled as **Blueprint**. A naming exploration was explicitly rejected and closed.

## Product in one paragraph

At the reviewer's request, an agent prepares and launches a portable HTML artifact directly into Blueprint. Decision artifacts use native selectable controls and a deliberate **Queue response** action; queueing creates one editable private Feedback draft and never sends by itself. Decision-relevant UI specimens expose representative states and transitions instead of behaving like static screenshots. Holding Alt/Option still previews the exact element under the pointer for free-form annotation, and Enter queues that comment locally. With no comments, **Approve** is the only submission. With comments, the reviewer can choose final **Approve with feedback** or **Revise using feedback**. Approval atomically ends the session and retires the review surface behind an opaque completion screen; revision requests keep the session open, receive a centered temporary confirmation, and persistently distinguish waiting-for-agent from agent-working state while retaining sent comments. A prepared revision presents a blocking ready curtain; **See latest revision** reveals it without losing unsent drafts. Feedback combines drafts with non-accepted review items, while read-only History retains comments and amendments by revealed revision cycle. The human—not the agent—closes the loop.

## Ask an agent to run the first slice

The reviewer never needs to operate Blueprint from a terminal. Ask Codex or Claude Code to author or open a self-contained HTML artifact in Blueprint and remain attached to its feedback. Running Blueprint with no arguments gives the agent bounded, directory-scoped live review state and contextual next commands. Before authoring, the agent must load every matching content playbook and inspect Blueprint's current visual authority:

```sh
node bin/blueprint.js playbook
node bin/blueprint.js design
```

Blueprint's implemented default is the unified graphite diagnostic system recorded in [`docs/VISUAL_SYSTEM.md`](docs/VISUAL_SYSTEM.md): a fine 24-pixel non-blue grid, slate structure, cyan interaction signal, restrained semantic colors, and shared visual language across review chrome and default artifacts. Reviewer-facing instructions inside an artifact use a dedicated brass meta band so they remain visibly separate from the artifact's subject. Explicit Blueprint-specific user or repository instructions may override the default; Blueprint does not automatically inherit a design system merely because one exists in the current workspace. The earlier dark Fieldnote prototype remains a behavioral specimen, not the approved default. [`examples/blueprint-evaluation/02-triage-console.html`](examples/blueprint-evaluation/02-triage-console.html) is the first complete approved-system example; [`examples/blueprint-evaluation/04-interactive-decision.html`](examples/blueprint-evaluation/04-interactive-decision.html) demonstrates selectable decisions, queued responses, and live UI specimen states.

The agent-facing open command is:

```sh
node bin/blueprint.js open path/to/artifact.html
```

The initial artifact appears immediately. The reviewer annotates it and chooses final approval or requests a revision. The agent—not the reviewer—receives the oldest queued intent-bearing feedback submission with:

```sh
node bin/blueprint.js wait path/to/artifact.html
```

`wait` prints one immutable JSON feedback payload, including `intent: "approve" | "revise"`, then acknowledges it only after standard output has completed. After one or more revise batches and edits to the authoritative HTML, the agent can stage a revision:

```sh
node bin/blueprint.js stage path/to/artifact.html --report path/to/report.json
```

A schema-version-2 report names every `basisPacketIds` entry used for the revision. Each `addressed` or `changed` comment supplies `before`, `after`, `summary`, `evidence`, and the amended element's `selector`; `stale` records why no reliable mapping remains. Staging does not change visible content. It opens the blocking ready curtain, and only **See latest revision** reveals the new snapshot and its feedback-linked change map.

Run the executable contract checks with:

```sh
npm test
```

Blueprint currently requires Node.js 22 or newer and has no runtime package dependencies. Runtime state lives outside the repository by default; agents can set `BLUEPRINT_STATE_DIR` to isolate it when testing.

## Local AXI installation

The repository can now be packed or installed locally as an npm CLI without publishing it:

```sh
npm install --global .
blueprint
blueprint setup status
```

Agent integration remains opt-in. `blueprint setup hooks` merges one reversible SessionStart context hook for Codex and Claude Code; `--agent codex` or `--agent claude` narrows the target. The command preserves unrelated settings, is idempotent, and refuses malformed configuration. Codex users must review and trust the resulting hook through `/hooks`. `blueprint setup remove` removes only Blueprint's entries.

The package also includes the generated discovery skill at `skills/blueprint/SKILL.md`. It deliberately points agents to `blueprint`, `blueprint playbook`, and `blueprint design` so installed skill text does not become a second, stale manual.

The npm name and license are not approved for public release. `package.json` therefore remains `private` and `UNLICENSED`; local packing and installation do not authorize publication or changes to a real agent configuration.

## Repository map

- [`docs/PRODUCT.md`](docs/PRODUCT.md) — product contract, settled decisions, non-goals, and open questions.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — approved minimum-core architecture, protocol, recovery, and security contract.
- [`docs/AXI.md`](docs/AXI.md) — approved agent-interface, hook integration, packaging, and authority contract.
- [`docs/VISUAL_SYSTEM.md`](docs/VISUAL_SYSTEM.md) — approved default visual language and artifact meta-instruction treatment.
- [`docs/LAVISH_RESEARCH.md`](docs/LAVISH_RESEARCH.md) — evidence-backed notes about the Lavish architecture and the reuse boundary.
- [`docs/CONTINUATION.md`](docs/CONTINUATION.md) — exact handoff state and recommended next session.
- [`AGENTS.md`](AGENTS.md) — operating rules for agents working in this repository.
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
