# Continuation handoff

Last updated: 2026-08-28.

## Current state

- The workspace is a Git repository on branch `main` with uncommitted Blueprint work.
- The user explicitly approved the minimum credible architecture and authorized local implementation of its exact first vertical slice on 2026-08-28.
- `docs/ARCHITECTURE.md` is the approved protocol, persistence, authority, security, and deferral contract.
- The minimum slice is implemented with Node.js built-ins only. There are no runtime package dependencies and no copied Lavish implementation files.
- The authoritative artifact must currently be a self-contained `.html` file.
- The local service binds to `127.0.0.1`, uses atomic per-session manifests and immutable revision/packet/report files, and stores runtime data outside the repository by default.
- The CLI supports `design`, `open`, `wait`, and `stage`. Only the reviewer browser surface can reveal a staged revision, accept, reopen, or end a session.
- The reviewer has explicitly said they will always ask Codex to launch Blueprint and will never invoke it themselves. Treat the CLI as an agent-adapter surface, not a human onboarding path.
- Direct user testing removed the initial reveal gate: a requested launch displays the first snapshot immediately, while staged revisions remain human-revealed.
- The trusted browser shell provides a docked desktop inspector, a safe narrow-screen sheet, an exact-target outline and element label while Alt/Option is held, Alt/Option-click element annotation, immediate durable editor focus, private durable drafts in fixed chronological order, explicit send, recovery-only packet copy, explicit staged-revision reveal, evidence on demand, and individual accept/reopen. The preview is injected only at serve time and never contaminates the authoritative artifact. The rail is hidden while the inspector is open and becomes one full-height expansion target while collapsed. The larger collapse chevron and staged-revision reveal live in the inspector header; **End review** sits at the bottom-right beside **Send feedback**. The redundant normal-state lifecycle row, decorative Blueprint mark, and standalone copy control are absent.
- The sandboxed artifact receives neither the agent bearer token nor the reviewer token. It receives a distinct read-only capability that can fetch only recorded immutable revision snapshots.
- `blueprint design` now reports the approved unified graphite diagnostic system as the default. Explicit Blueprint-specific user or repository instructions still take precedence, and an unrelated workspace design system is never inherited automatically.
- The previously recorded calm, dark, editorial/instrument direction was not actually selected in a visual review. It and the revised dark Fieldnote example are behavioral-test specimens, not an approved default.
- The existing Blueprint session remains the behavioral-testing track. The dedicated visual reconstruction track is complete.
- Visual reconstruction selected Franky's diagnostic color scheme, one unified system across shell and artifacts, and the fine 24-pixel non-blue graphite grid.
- The full-system review ended with explicit approval and no refinement notes. `docs/VISUAL_SYSTEM.md` is the durable source of truth; runtime review-chrome implementation remains a separate authority gate and the running behavioral session must not be restyled silently.
- The user subsequently reaffirmed the brass meta treatment from the architecture and user-testing artifacts. Default Blueprint artifacts now reserve brass bands for instructions about the review itself—protocol, interpretation, authority, queueing, and submission—while warnings and subject-matter content retain their own semantics. This is an approved visual-system refinement, not authority to restyle the runtime shell.

## Validation completed

`npm run check` passes eleven executable checks covering:

- atomic replacement interruption;
- canonical HTML and state path boundaries;
- rejection of non-self-contained resource dependencies;
- persistence across a store restart;
- same-ID packet redelivery before acknowledgement and idempotent acknowledgement;
- visible-versus-staged revision separation;
- report validation against known feedback IDs;
- required reopen notes and stable feedback identity;
- agent, reviewer, and read-only artifact authority separation;
- a spawned CLI cycle from open through acknowledged packet and staged report;
- feedback-wait recovery after a quiet request timeout; and
- CLI design-authority guidance that rejects automatic workspace-design inheritance and identifies the approved unified graphite diagnostic default.

The browser shell was also exercised in the in-app browser at wide and narrow widths. Observed behavior:

- the 390-pixel desktop inspector dock resizes the artifact;
- the narrow fallback stays within the viewport and presents the inspector as a bottom sheet;
- Alt/Option-click annotation creates an element-anchored draft through the sandbox message boundary, reopens a collapsed inspector, and retains textarea focus across durable autosave;
- holding Alt/Option outlines the browser's exact hit target and labels its element before click, then clears the preview on release or focus loss;
- text selection and context menus have no annotation listeners;
- a private draft survives a browser reload;
- browser send, CLI acknowledgement, staged ready state, explicit reveal, evidence, accept, and required-note reopen all work;
- the visible revision remained unchanged while revision 2 was staged; and
- no new browser warnings or errors appeared after replacing the unsupported native reopen prompt with an inline private-note editor.
- the revised dark Fieldnote behavioral specimen displays immediately without a reveal card and renders cleanly at wide and narrow widths;
- the send control remains scoped to the inspector rather than spanning the artifact.
- the refreshed durable behavior session serves exactly one isolated target-preview layer, shows the updated instruction at wide and narrow widths, and remains free of layout regressions in both geometries;
- the feedback wait remains attached across quiet request timeouts, and empty long polls clean up their event listeners instead of accumulating them;

## Preserved review history

- `.lavish/blueprint-discovery-round-1.html` contains the discovery work and was evolved into round two.
- `.lavish/blueprint-naming-round-1.html` is a closed, rejected naming exploration.
- Local Lavish sessions supplied the interaction, architecture, testing, and visual-decision evidence. `.lavish/` is now ignored local review state; approved product, architecture, and visual contracts are preserved in `docs/` instead.
- `examples/blueprint-evaluation/01-decision-brief.html` preserves the original Fieldnote example that exposed the design-contract mismatch; `01-decision-brief-blueprint.html` is the revised dark behavioral specimen, not a default-design example.
- The product name remains **Blueprint**.
- Lavish remains pinned read-only at `upstream/lavish-axi`, commit `a7ddbbaf585e101793938c6dacf8bb0c11e09003` (`lavish-axi-v0.1.62`).

## Deliberately deferred

- Attachments, local asset trees, and non-self-contained HTML.
- Status filters, duplicate suggestions, and guarded batch acceptance.
- Portable decision-record export.
- Desktop packaging, installers, updates, auto-start, and production lifecycle work.
- Database, frontend framework, WebSockets, filesystem watching, publishing, telemetry, hosted collaboration, or full in-tool chat.
- Production Codex/Claude wrappers beyond the shared CLI contract.
- Any reuse of source code from `upstream/lavish-axi`.

Do not implement these merely because the core exists. The user explicitly identified overcomplication as the main risk; real sessions should supply the evidence for expansion or simplification.

## Recommended next action

Continue the open revised Fieldnote decision-brief session as the behavioral track. The reviewer should Alt/Option-click elements, compose and send one packet, then inspect the staged revision and verification lifecycle. Codex must keep exactly one `wait` attached to that artifact. Do not apply the approved visual system to the running review chrome until the separate runtime implementation gate is approved.

## Resume checks

```sh
git submodule update --init --recursive
git status --short
npm run check
```
