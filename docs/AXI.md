# Blueprint AXI contract

Status: direction and first local implementation slice approved on 2026-08-29; atomic review launch-and-wait contract and this computer's Codex integration update approved on 2026-08-30. Public publication, package naming, licensing, and modifications to other agent installations remain separate authority gates.

Blueprint is formally an **Agent eXperience Interface (AXI)**: its command-line output is a product interface for capable agents, while the browser remains the human review surface. The AXI layer does not weaken Blueprint's product invariants. One human, one agent, one authoritative HTML artifact, revision-scoped private drafts, intent-bearing acknowledged feedback, reviewer-controlled revision reveal, a unified Feedback action surface, and read-only revision-cycle History remain the governing contract.

## Distribution direction

The approved target is:

1. A globally installed npm package provides the durable local CLI and loopback review runtime.
2. `blueprint setup hooks` explicitly installs or repairs compact SessionStart context for Codex and Claude Code.
3. The npm package ships a generated, on-demand `blueprint` skill that points agents back to the current CLI guidance.
4. An `npx` path may later provide zero-setup evaluation, but persistent local sessions make a global installation the preferred repeated-use model.

The current package remains named `blueprint-local-review`, marked `private`, and licensed `UNLICENSED`. It may be packed and installed locally, but it must not be published until the public npm name and license are separately approved.

## AXI interface principles

Blueprint applies the ten principles described at [axi.md](https://axi.md/) with one deliberate protocol exception:

| Principle | Blueprint contract |
| --- | --- |
| Token-efficient output | Home, playbook, setup, and error output use a compact TOON-like line format. Exact feedback and staged-revision protocol payloads remain JSON so existing durable contracts are not made ambiguous. |
| Minimal default schemas | The home view reports only artifact, lifecycle state, open comment count, queued feedback count, and revision state. |
| Content truncation | Home output defaults to five directory-scoped active reviews. `--full` raises the explicit bound to 100 and reports remaining truncation. Session hooks default to three. |
| Pre-computed aggregates | Active review, open comment, queued feedback, and staged-ready counts are computed before output. |
| Definitive empty states | Zero active reviews render as an explicit `reviews[0]` plus the next useful command. |
| Structured errors and exit codes | Errors are written as structured standard output. Operational failures exit `1`; unknown commands, flags, IDs, or malformed command shapes exit `2`. No command prompts interactively. |
| Ambient context | Opt-in SessionStart hooks provide a bounded, directory-scoped dashboard. They never grant authority, open reviews, or control tools. |
| Content first | Running `blueprint` without arguments prints live local review state, not general help. |
| Contextual disclosure | Successful outputs end with concrete next-command suggestions. |
| Consistent help | `blueprint --help` and focused `blueprint <command> --help` remain available without inflating default output. |

## Current command ownership

- `blueprint` owns live AXI state and next-step discovery.
- `blueprint playbook` owns versioned content and review-loop guidance.
- `blueprint design` owns the current Blueprint artifact visual authority.
- `blueprint review` is the default launch: it opens the artifact and keeps the same process attached until one intent-bearing feedback packet is printed and acknowledged.
- `blueprint open` and `wait` preserve the same durable protocol as separate lower-level recovery and diagnostic commands; `stage` owns revision preparation.
- `blueprint setup hooks|status|remove` owns optional agent integration.
- `skills/blueprint/SKILL.md` is generated discovery metadata, not a second copy of the CLI manual.

The versioned playbooks are:

- `artifact` for deciding whether HTML earns its format and authoring a portable, operable review artifact;
- `decision` for recommendations, comparisons, native decision controls, live representative specimens, explicit queueing, and authority; and
- `review-loop` for one tracked wait, immutable approve/revise packet delivery, multi-batch revision reports, staged revision handling, and reviewer-only completion.

AXI contract version 2 removes the procedural seam between initial launch and the first feedback wait. `blueprint review <artifact.html>` writes the reviewer URL and waiting status to standard error, keeps standard output clean for the exact packet JSON, survives quiet long-poll timeouts, and exits only after delivering one packet. This is additive: existing `open` and `wait` scripts remain valid.

## Intent-bearing review contract

Packet schema version 2 gives the agent an explicit `intent`:

- `approve` is final, may contain zero or more comments, and means the session has ended. The agent may honor attached final comments but must not stage another revision for that ended review.
- `revise` always contains feedback and keeps the review active. The agent should keep exactly one wait attached while editing so later revise batches can be folded into the same prepared revision.

The report passed to `blueprint stage` uses schema version 2 and lists every handled revise packet in `basisPacketIds`. Each addressed or changed comment reports `before`, `after`, `summary`, `evidence`, and the selector of the amended element. This evidence drives both the inspector and the non-authoritative runtime change markers injected into the revealed snapshot.

## Hook installation contract

Hook installation is explicit, idempotent, non-interactive, and reversible:

```sh
blueprint setup status
blueprint setup hooks --agent codex
blueprint setup hooks --agent claude
blueprint setup remove --agent all
```

`--agent all` is the default. `--config-home <directory>` exists for isolated testing and controlled alternate homes.

For Codex, Blueprint merges one `SessionStart` group into `~/.codex/hooks.json` (or the active `CODEX_HOME`). Codex requires the user to review and trust non-managed hooks with `/hooks`; Blueprint does not bypass that trust gate. See the [official Codex hooks documentation](https://developers.openai.com/codex/hooks).

For Claude Code, Blueprint merges one `SessionStart` group into `~/.claude/settings.json` (or `CLAUDE_CONFIG_DIR`). See the [official Claude Code hooks reference](https://code.claude.com/docs/en/hooks).

Setup preserves unrelated JSON settings, repairs a recognizable stale Blueprint entry, refuses malformed configuration rather than overwriting it, and removes only Blueprint's identifiable handler. It does not install anything merely because the npm package was installed. The user or agent must deliberately run setup.

The hook invokes `blueprint hook context --agent <agent>`. Its JSON output contains only supported `SessionStart.additionalContext`: a short description, directory-scoped active-review summaries, and the next review-loop command. It exposes no reviewer, artifact, or admin tokens.

## Package boundary

The local npm tarball contains only the executable, runtime source, generated Blueprint skill, and README. It has no runtime dependencies and retains the Node.js 22 minimum. The current slice does not add:

- public npm publication;
- a marketplace listing or plugin bundle;
- desktop packaging, installers, updates, or auto-start;
- automatic modification of Codex or Claude configuration during npm installation;
- telemetry or hosted services; or
- source copied from `upstream/lavish-axi`.

Those remain separate decisions and authority gates.
