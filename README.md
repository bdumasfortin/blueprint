# Blueprint

Blueprint is a proposed local-first review tool for one person and one coding agent working over one visual artifact. It is inspired by what works in Lavish Editor, but its product contract is deliberately calmer, more human-gated, and more focused on durable review cycles.

## Status

Blueprint is in product discovery. Research and design decisions exist; implementation has **not** begun or been authorized.

The working name is settled as **Blueprint**. A naming exploration was explicitly rejected and closed.

## Product in one paragraph

An agent prepares a portable HTML artifact without interrupting the reviewer. The reviewer chooses when to reveal it, annotates text or elements, keeps comments private while composing them, and deliberately sends one feedback packet. The agent acknowledges that packet and prepares a staged revision. The reviewer reveals the revision on their own terms, then accepts or reopens each addressed comment. The human—not the agent—closes the loop.

## Repository map

- [`docs/PRODUCT.md`](docs/PRODUCT.md) — product contract, settled decisions, non-goals, and open questions.
- [`docs/LAVISH_RESEARCH.md`](docs/LAVISH_RESEARCH.md) — evidence-backed notes about the Lavish architecture and the reuse boundary.
- [`docs/CONTINUATION.md`](docs/CONTINUATION.md) — exact handoff state and recommended next session.
- [`AGENTS.md`](AGENTS.md) — operating rules for agents working in this repository.
- [`.lavish/blueprint-discovery-round-1.html`](.lavish/blueprint-discovery-round-1.html) — the discovery artifact, evolved through round two.
- [`.lavish/blueprint-naming-round-1.html`](.lavish/blueprint-naming-round-1.html) — closed naming exploration; retained only as history.
- [`upstream/lavish-axi`](upstream/lavish-axi) — read-only Git submodule pinned to the researched Lavish release.

## Resume the workspace

Clone the repository, then initialize the research dependency:

```sh
git submodule update --init --recursive
```

Read `AGENTS.md`, `docs/PRODUCT.md`, and `docs/CONTINUATION.md` before proposing changes. The next step is another design review, not implementation.

## Upstream reference

The Lavish submodule is pinned to:

- Repository: `https://github.com/kunchenguid/lavish-axi.git`
- Release: `lavish-axi-v0.1.62`
- Commit: `a7ddbbaf585e101793938c6dacf8bb0c11e09003`

Lavish is MIT-licensed. Any future reuse of its code must preserve the relevant license and third-party notices. No decision has been made to copy any particular implementation.
