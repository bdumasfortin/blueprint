# Blueprint development notes

This document contains repository, coding, validation, and maintainer guidance that does not belong in the public discovery README.

## Start here

Before changing Blueprint, read:

1. [`AGENTS.md`](../AGENTS.md) for repository operating rules and authority gates.
2. [`PRODUCT.md`](PRODUCT.md) for the approved product contract and non-goals.
3. [`ARCHITECTURE.md`](ARCHITECTURE.md) for protocol, persistence, security, and recovery contracts.
4. [`CONTINUATION.md`](CONTINUATION.md) for the current implementation and release handoff.
5. [`VISUAL_SYSTEM.md`](VISUAL_SYSTEM.md) before changing runtime chrome or default Blueprint artifacts.

The approved minimum core is implemented and publicly distributed as `blueprint-local-review`. Broader mechanisms remain intentionally deferred; documented ideas do not authorize implementation by themselves.

## Requirements

- Node.js 22 or newer.
- No runtime package dependencies.
- A self-contained HTML artifact for the current review slice.

Install the current checkout globally when local agent testing requires it:

```sh
npm install --global .
```

Installing the package does not edit Codex or Claude Code configuration. Agent hooks remain an explicit operation:

```sh
blueprint setup hooks --agent codex
blueprint setup status --agent codex
blueprint setup remove --agent codex
```

Use `--agent claude` for the Claude Code adapter. Setup is idempotent, preserves unrelated configuration, repairs recognizable stale Blueprint entries, and refuses malformed configuration rather than overwriting it.

## Validation

Run the complete local contract before handing off a change:

```sh
npm run check
```

That command verifies syntax, generated-skill drift, the executable test suite with coverage gates, and the exact npm package allowlist. Current minimum coverage is 90% lines, 65% branches, and 90% functions.

Focused commands are also available:

```sh
npm test
npm run test:coverage
npm run check:skill
npm run check:package
```

Changes to review state, persistence, authority boundaries, delivery acknowledgement, staged revision reveal, or recovery need proportionate protocol tests and real-browser validation. Visual and motion changes require wide and narrow inspection, keyboard checks, and representative state coverage.

## Running the source checkout

The repository entry point is `bin/blueprint.js`:

```sh
node bin/blueprint.js
node bin/blueprint.js --help
node bin/blueprint.js playbook
node bin/blueprint.js design
```

The normal review launch is atomic:

```sh
node bin/blueprint.js review path/to/artifact.html
```

It opens the artifact and keeps one feedback wait attached until an intent-bearing packet is delivered and acknowledged. The lower-level commands are recovery and diagnostic surfaces:

```sh
node bin/blueprint.js open path/to/artifact.html
node bin/blueprint.js wait path/to/artifact.html
```

After applying one or more revise packets, stage the authoritative HTML with a schema-version-2 report:

```sh
node bin/blueprint.js stage path/to/artifact.html --report path/to/report.json
```

The report names every basis packet and accounts for every included comment. Addressed or changed items provide before, after, summary, evidence, and an amended-element selector. Staging never reveals the revision; only the reviewer can do that.

Runtime state lives outside the repository by default. Use `BLUEPRINT_STATE_DIR` or `--state-dir` to isolate development and browser-test sessions.

## Repository map

- [`../src/`](../src/) — loopback service, durable store, sandbox injection, browser shell, AXI output, and setup behavior.
- [`../bin/blueprint.js`](../bin/blueprint.js) — executable entry point.
- [`../test/`](../test/) — protocol, recovery, authority, setup, CLI, and full-cycle checks.
- [`../skills/blueprint/SKILL.md`](../skills/blueprint/SKILL.md) — generated discovery skill; edit its source in `src/skill.js`, not the generated file.
- [`../examples/blueprint-evaluation/`](../examples/blueprint-evaluation/) — behavioral and visual specimens used during product evaluation.
- [`PRODUCT.md`](PRODUCT.md) — durable product decisions and authority history.
- [`ARCHITECTURE.md`](ARCHITECTURE.md) — approved implementation contract.
- [`AXI.md`](AXI.md) — agent-interface, hook, packaging, and distribution contract.
- [`VISUAL_SYSTEM.md`](VISUAL_SYSTEM.md) — approved graphite diagnostic visual system.
- [`LAVISH_RESEARCH.md`](LAVISH_RESEARCH.md) — pinned comparative research and reuse boundary.

## Package and release boundary

The public package is `blueprint-local-review`, licensed MIT. The package allowlist contains only the CLI, runtime source, generated skill, skill builder, README, license, and package metadata; review history, tests, examples, durable docs, and research material stay outside the npm payload.

Do not silently repack or republish a released version. Public npm publication, tags, pushes, and changes to a user's active agent installation require their applicable approval gates and exact release verification.

## Lavish research boundary

Blueprint's comparative research used Lavish release `lavish-axi-v0.1.63` at commit `ffd7aacff563b8bca09eb7ebfb17c14faeb968ce`. The research checkout is deliberately not carried in this repository, and Blueprint currently copies no Lavish implementation code. Any later reuse must be separately justified, pinned, and recorded with the required license and third-party notices.
