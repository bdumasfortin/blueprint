# Continuation handoff

Last updated: 2026-08-29.

## Current state

- The workspace is a Git repository on branch `main`; release `0.1.0` is the current local AXI milestone.
- The user explicitly approved the minimum credible architecture and authorized local implementation of its exact first vertical slice on 2026-08-28.
- `docs/ARCHITECTURE.md` is the approved protocol, persistence, authority, security, and deferral contract.
- The minimum slice is implemented with Node.js built-ins only. There are no runtime package dependencies and no copied Lavish implementation files.
- The authoritative artifact must currently be a self-contained `.html` file.
- The local service binds to `127.0.0.1`, uses atomic per-session manifests and immutable revision/packet/report files, and stores runtime data outside the repository by default.
- The CLI supports `design`, `open`, `wait`, and `stage`. Only the reviewer browser surface can reveal a staged revision, accept, reopen, or end a session.
- The user approved making Blueprint a formal AXI and authorized its first local implementation slice on 2026-08-29. The durable contract is `docs/AXI.md`.
- Running `blueprint` without arguments now prints bounded, directory-scoped active-review state rather than generic help. `--full` raises the explicit review bound, and all home results include definitive counts and contextual next commands.
- `blueprint playbook` now owns versioned `artifact`, `decision`, and `review-loop` guidance. `blueprint design` remains the separate visual-authority surface.
- CLI errors are structured on standard output. Operational failures exit `1`; unknown commands, options, playbooks, agents, and malformed command shapes exit `2`. Existing feedback and stage payloads remain JSON to preserve the durable protocol.
- The npm package includes a generated `skills/blueprint/SKILL.md` discovery stub and fails its check when that file drifts from `src/skill.js`.
- `blueprint setup hooks|status|remove` supports opt-in SessionStart context for Codex and Claude Code. It preserves unrelated JSON, repairs a recognizable stale entry, refuses malformed configuration, and removes only Blueprint's handler. npm installation itself changes no agent configuration.
- On 2026-08-29 the user explicitly approved the recommended personal Codex cutover after a terminal Lavish review. The active global `C:\Users\Bryan\.codex\AGENTS.md` now names Blueprint as the default non-trivial review workflow, `C:\Users\Bryan\.codex\skills\blueprint` contains the packaged generated discovery skill, and `C:\Users\Bryan\.codex\hooks.json` contains only Blueprint's SessionStart hook. The previous global instructions, dual-hook file, and complete `lavish-local-review` personal skill are preserved with SHA-256 hashes and restore instructions at `C:\Users\Bryan\.codex-backups\lavish-cutover-2026-08-29-124632`. `lavish-axi@0.1.62` and all `.lavish` review history remain installed and untouched for rollback.
- Hook context is bounded to three directory-scoped active reviews and exposes no reviewer, artifact, or admin tokens. It does not open reviews, control tools, reveal revisions, or grant authority.
- The current package remains `private` and `UNLICENSED`. Public npm naming, licensing, publication, marketplace/plugin distribution, and future changes to the user's real Codex or Claude Code installation remain separate approval gates. On 2026-08-29 the user explicitly authorized installing release `0.1.0` on this computer, committing it, and pushing the current branch.
- The reviewer has explicitly said they will always ask Codex to launch Blueprint and will never invoke it themselves. Treat the CLI as an agent-adapter surface, not a human onboarding path.
- Direct user testing removed the initial reveal gate: a requested launch displays the first snapshot immediately. Staged revisions remain human-revealed through the approved blocking ready curtain.
- The trusted browser shell provides a docked desktop inspector, a safe narrow-screen sheet, an exact-target outline and element label while Alt/Option is held, Alt/Option-click element annotation, immediate durable editor focus, revision-scoped private drafts in fixed chronological order, intent-bearing approval/revision actions, recovery-only feedback copy, blocking staged-revision reveal, feedback-linked before/after evidence and amended-element markers, and individual accept/reopen. The main **Feedback** tab combines drafts with every non-accepted review item and its actions. Accepting an item removes its marker and Feedback card; the read-only **History** tab retains comments and amendments in newest-first revealed-revision cycles. Runtime layers are injected only at serve time and never contaminate the authoritative artifact. The rail is hidden while the inspector is open and becomes one full-height expansion target while collapsed. The larger collapse chevron lives in the inspector header; **End review** remains at bottom-right beside the context-sensitive submission actions.
- The sandboxed artifact receives neither the agent bearer token nor the reviewer token. It receives a distinct read-only capability that can fetch only recorded immutable revision snapshots.
- `blueprint design` now reports the approved unified graphite diagnostic system as the default. Explicit Blueprint-specific user or repository instructions still take precedence, and an unrelated workspace design system is never inherited automatically.
- The previously recorded calm, dark, editorial/instrument direction was not actually selected in a visual review. It and the revised dark Fieldnote example remain behavioral-test specimens, not the approved default.
- The user separately approved implementation of the selected visual system in the runtime review chrome on 2026-08-28.
- Visual reconstruction selected Franky's diagnostic color scheme, one unified system across shell and artifacts, and the fine 24-pixel non-blue graphite grid.
- The runtime shell now implements the approved canvas, panel, border, type, state, grid, compact-control, and minimally rounded geometry tokens. The injected exact-target preview uses the same cyan interaction signal. Behavior and reviewer authority are unchanged.
- The trusted Feedback and History panes use a compact graphite scrollbar with a slate resting thumb and cyan interaction states. Blueprint does not restyle scrollbars inside the sandboxed artifact.
- Blueprint playbook version 5 requires operable decision controls when a reviewer is expected to choose: radios for mutually exclusive options, checkboxes or switches for independent choices, and selects for longer lists. Decision-relevant UI specimens must expose useful states, transitions, or microinteractions instead of relying on static wireframes. Its review-loop guidance also requires sent feedback to remain visible and acknowledgement-driven waiting/working state to stay persistent while the agent prepares a revision, while final approval retires the browser review surface.
- A self-contained artifact can opt a native form into Blueprint with a unique safe `id` and `data-blueprint-response`. Changing controls remains local; activating **Queue response** creates or replaces one revision-scoped private Feedback draft anchored to the form. The sandbox retains no forms-navigation authority, and only **Approve with feedback** or **Revise using feedback** delivers the queued response.
- `examples/blueprint-evaluation/04-interactive-decision.html` is the canonical three-option specimen for selectable radio cards, an explicit Queue response action, live rest/sending/success/failure states, responsive layout, and reduced-motion behavior.
- The user reaffirmed the brass meta treatment from the architecture and user-testing artifacts. Default Blueprint artifacts reserve brass bands for instructions about the review itself—protocol, interpretation, authority, queueing, and submission—while warnings and subject-matter content retain their own semantics.
- Direct review of the implemented shell simplified the draft pane: one ochre instruction now says only “Hold Alt/Option and click any element to leave feedback”; the duplicate empty-state prompt and packet-note label are removed; the **Additional feedback** field is bottom-aligned above the actions; and the end-review stop glyph is larger without enlarging its control.
- A 12-specimen Lavish comparison selected the B4 **Edge rail** draft treatment. Drafts now rest at a compact one-line height, grow only as their text wraps, hide the native resize grip, and use a larger red delete control; the cyan edge rail carries the editing signal without changing the approved submission lifecycle.
- Direct testing removed the draft textarea's additional cyan focus rectangle as visually excessive. The slim edge rail now carries the editing signal by itself.
- The draft delete action now uses a red 17-pixel trash-can glyph in a borderless, background-free 32-pixel target. The target stays vertically centered against the full card height as comment text wraps and grows.
- Plain Enter in an existing comment editor queues and durably saves the private comment without contacting the agent. Enter in **Additional feedback** queues a normal general private comment and clears the composer. Only **Approve with feedback** or **Revise using feedback** delivers queued comments. Shift+Enter inserts a newline; composition and key-repeat events do not queue or submit.
- With no feedback, **Approve** is the only submission. With feedback, it becomes **Approve with feedback** and **Revise using feedback** appears. Approval queues a final batch and ends the session; **Revise using feedback** queues a revision request and leaves the session open for more reading and feedback.
- A successfully approved or otherwise ended session now retires the browser review surface like Lavish's ended state, with stricter concealment: polling and annotation intake stop, the iframe is blanked, the application is hidden, and an opaque graphite completion screen is the only remaining view. The final approval packet remains queued for agent delivery. Reloading an ended review shows the same terminal state instead of reconstructing an interactive sidebar.
- A revision request now receives one centered confirmation over a dimmed full-screen overlay, stays readable for 2.8 seconds, and fades out. Feedback remains the durable receipt: it shows **Revision requested · Waiting for agent** before packet acknowledgement, **Agent working on revision** afterward, and keeps every submitted comment visible with its sent/delivery state so reviewers can avoid duplicates. Accept/Reopen appears only after an agent report exists.
- A staged revision now opens one blocking full-page **Revision is ready** curtain whose sole forward action is **See latest revision**. Polling updates the curtain state rather than producing a repeatable toast. Reveal preserves unsent drafts and returns to Feedback with feedback-linked review items.
- Draft include/exclude checkboxes were removed after direct testing. Every draft remaining in the composer is now sent, and deleting the draft is the only exclusion action. The store still accepts legacy draft payloads with an `included` field but ignores that field so old excluded drafts cannot become stranded.
- The inspector tabs are reviewer-facing **Feedback** and **History**. Feedback is the sole editing and action surface; History is read-only and loaded on demand from immutable packets and reports. Draft remains internal persistence terminology.
- “Packet” is now internal protocol terminology only. Reviewer-facing recovery, confirmation, and copy language uses **feedback** for the submission and **comments** for its items.
- Protocol schema version 2 records `approve` or `revise` intent, preserves a source revision per draft/comment, and lets one revision report name multiple basis packets. Addressed and changed report items carry before, after, summary, evidence, and the amended element selector.
- The bottom reserve beneath **Additional feedback** was reduced so the field sits about 22 pixels above the action bar at both desktop and narrow widths instead of 38 pixels.
- **Additional feedback** no longer exposes a manual resize handle. It keeps its 70-pixel resting height, grows automatically as text wraps or Shift+Enter adds lines, and returns to its resting height after Enter queues the comment.
- Element-anchored feedback in the sidebar is now navigable. Draft anchor labels are explicit keyboard-operable targets, and clicking a submitted feedback card outside its nested controls centers the associated element in the visible artifact with a brief cyan outline. Reported selectors for the visible revision take precedence over original anchors; general feedback remains non-navigable.
- `examples/blueprint-evaluation/02-triage-console.html` is the first complete approved-system example. It is a self-contained fictional product-decision brief with one recommendation, three rendered interface specimens, evidence on demand, and the brass review-protocol band.
- Direct review tightened the Beacon hero: its inherited 72-pixel section margin was removed, leaving 48 pixels above the title block on wide layouts and 34 pixels on narrow layouts.

## Validation completed

`npm run check` passes twenty-four executable checks covering:

- atomic replacement interruption;
- canonical HTML and state path boundaries;
- rejection of non-self-contained resource dependencies;
- persistence across a store restart;
- same-ID packet redelivery before acknowledgement and idempotent acknowledgement;
- compatibility with legacy excluded-draft payloads while sending every draft that remains in the composer;
- promotion of additional-feedback text into a stable general comment rather than a packet-level note;
- final approval with zero comments, final approval with comments, and revise continuity;
- preservation of draft source revisions across reveal;
- migration of version-one local manifests, unsent drafts, and queued packet intent;
- visible-versus-staged revision separation;
- reviewer-token-only revision-cycle history that groups immutable comments and amendment evidence without exposing staged reports before reveal;
- legacy report compatibility plus schema-version-2 multi-packet change evidence;
- required reopen notes and stable feedback identity;
- agent, reviewer, and read-only artifact authority separation;
- a spawned CLI cycle from open through acknowledged packet and staged report;
- feedback-wait recovery after a quiet request timeout; and
- CLI design-authority guidance that rejects automatic workspace-design inheritance and identifies the approved unified graphite diagnostic default.
- bounded content-first AXI home output, `--full`, directory scoping, definitive empty states, and token exclusion;
- versioned playbook discovery, focused help, and structured unknown-option exit code `2`;
- valid bounded SessionStart hook JSON for Codex and Claude Code;
- generated skill drift detection and skill-format validation;
- idempotent hook install, status, stale-entry repair, and removal while preserving unrelated agent settings; and
- refusal to overwrite malformed agent configuration.

The generated skill also passes the Codex skill creator's `quick_validate.py` check.

The approved personal Codex cutover also passed a post-change integrity audit: the archived instructions, hooks, and three Lavish skill files match their recorded SHA-256 hashes; the active Blueprint skill matches the packaged source; the active hook JSON parses with exactly one Blueprint SessionStart entry; no Lavish reference remains in active global instructions or hooks; and `blueprint setup status --agent codex` reports the integration installed without repair.

The earlier `npm pack` check produced a 34,495-byte local `blueprint-local-review@0.0.1` tarball with 17 entries containing only package metadata, README, the CLI, runtime source, the skill generator, and the generated Blueprint skill. The tarball was installed into an isolated temporary npm prefix; the packaged command's home view and the complete hook install/status/remove cycle passed against an isolated configuration home. That earlier check changed no global npm state or real Codex/Claude configuration.

Release `0.1.0` produced a 45,918-byte tarball with 17 entries and an unpacked size of 178,793 bytes. The exact tarball installed successfully into a fresh temporary npm prefix and its packaged CLI help completed successfully. With explicit user authorization, the computer-wide npm link now reports `blueprint-local-review@0.1.0`, the Codex SessionStart integration still reports installed without repair, and the active personal Blueprint skill is byte-identical to the packaged generated skill. Nothing was published to npm, and no Claude configuration was changed.

The browser shell was also exercised in the in-app browser at wide and narrow widths. Observed behavior:

- the 390-pixel desktop inspector dock resizes the artifact;
- the narrow fallback stays within the viewport and presents the inspector as a bottom sheet;
- Alt/Option-click annotation creates an element-anchored draft through the sandbox message boundary, reopens a collapsed inspector, and retains textarea focus across durable autosave;
- holding Alt/Option outlines the browser's exact hit target and labels its element before click, then clears the preview on release or focus loss;
- text selection and context menus have no annotation listeners;
- a private draft survives a browser reload;
- browser revise, CLI acknowledgement, blocking staged ready state, explicit reveal, evidence, accept, and required-note reopen all work;
- the visible revision remained unchanged while revision 2 was staged; and
- no new browser warnings or errors appeared after replacing the unsupported native reopen prompt with an inline private-note editor.
- the revised dark Fieldnote behavioral specimen displays immediately without a reveal card and renders cleanly at wide and narrow widths;
- the submission controls remain scoped to the inspector rather than spanning the artifact.
- the refreshed durable behavior session serves exactly one isolated target-preview layer, shows the updated instruction at wide and narrow widths, and remains free of layout regressions in both geometries;
- the feedback wait remains attached across quiet request timeouts, and empty long polls clean up their event listeners instead of accumulating them;
- the implemented graphite runtime preserves the 390-pixel desktop dock, resolves to a 44-pixel collapsed rail, and uses the existing 62%-height narrow sheet without horizontal overflow;
- the new Beacon example and chrome were visually inspected together at 1440 × 1000 and 390 × 844, with the 24-pixel grid, cyan interaction hierarchy, semantic recommendation state, and brass artifact meta band rendering as designed; and
- an isolated real-browser interaction confirmed Alt-click draft creation, immediate textarea focus, and inspector collapse/expand after the visual change.
- the simplified draft pane was visually inspected at 1922 × 912 and 390 × 844: the feedback field stays 22 pixels above the action area at both widths, the ochre instruction remains readable, the 17-pixel stop glyph stays centered, and no horizontal overflow or browser warning appears.
- an isolated browser cycle confirmed that **Additional feedback** preserves `First line\nSecond line` with Shift+Enter, while Enter creates one durable **General feedback** draft, clears and retains focus in the composer, exposes **Approve with feedback** and **Revise using feedback**, and does not deliver the bundle. The queued draft survived a reload.
- the tightened Beacon hero was inspected at 1922 × 912 and 390 × 844: the hero begins directly after the masthead, retains 48/34 pixels of responsive top padding, and introduces no horizontal overflow. Revision 2 is staged in the active review and remains hidden until the reviewer reveals it.
- the approved lifecycle was exercised end to end in an isolated real-browser session at 1440 × 1000 and 390 × 844. No-feedback state showed only **Approve**; queued feedback switched to **Approve with feedback** plus **Revise using feedback**; the revision action left the session active; a staged revision opened a focused blocking curtain with **See latest revision** as the only forward action; one unsent draft survived reveal; verification showed before, after, summary, evidence, and a numbered outline on the amended element; final no-feedback approval ended the session. Both widths had zero horizontal overflow and the browser console had no warnings or errors.
- the selected edge-rail draft card was inspected at 1440 × 1000 and 390 × 844. A one-line comment stayed at 20 pixels when focused inside a 47-pixel card, wrapped content grew the editor to 55 pixels and shrank back when shortened, the delete target measured 32 × 32 pixels, the cyan rail measured 4 pixels, and the original saved comment survived reload. Neither width overflowed and the browser console had no warnings or errors.
- the quieter editing refinement was inspected at 877 × 912: the focused textarea reports no outline or box shadow, the card retains its slate border, the cyan rail remains the sole active cue, and the page has no horizontal overflow or browser warnings.
- the red borderless trash action was inspected at 877 × 912 across a 64-pixel wrapped-comment card and a 47-pixel one-line card. In both cases the 32-pixel target's center matched the card center exactly, the 17-pixel SVG stayed red with zero border and a transparent background, and no browser warnings or overflow appeared.
- an isolated real-browser interaction confirmed the revised delivery gate: Enter in an element comment removed editing focus and durably preserved one private draft while creating zero feedback packets; only clicking **Revise using feedback** cleared the draft and created one queued `revise` packet.
- an isolated real-browser acceptance cycle confirmed that an addressed item initially marks its amended element with the numbered green outline, accepting that item removes the outline immediately, and the accepted before/after evidence remains available in the inspector's read-only history. The browser console stayed free of warnings and errors.
- a fresh Blueprint decision review approved the combined **Feedback** action surface and Option A revision-cycle **History**, with feedback that accepted items must disappear from Feedback. The implemented runtime was then exercised end to end: reveal returned to Feedback with the addressed card and Accept/Reopen actions; History showed the same comment and amendment without actions; acceptance removed the Feedback card and amended-element outline while History retained the evidence as **Accepted by reviewer**. The 390 × 844 sheet had zero horizontal overflow and the browser console had no warnings or errors.
- the styled review-pane scrollbar was inspected at 1440 × 1000 and 390 × 844 with overflowing feedback: its computed track is canvas graphite, its resting thumb is strong slate, its width is 10 pixels, and its corner radius is 2 pixels; pointer hover visibly switches the thumb to cyan. The sandboxed artifact retained its independent native scrollbar, neither layout overflowed horizontally, and the browser console remained clean.
- the interactive decision contract was exercised in an isolated real-browser review at 1440 × 1000 and 390 × 844. Selecting another radio option created no draft or packet. **Queue response** created one durable form-anchored draft and exposed the shell submission actions; selecting a different option and queueing again replaced that draft in place while its count remained one and packet count remained zero. Radio selection with Space and queueing with Enter produced the same single-draft result. The rest/sending/success/failure controls changed representative specimen state and copy, the narrow artifact and shell had zero horizontal overflow, and the browser console remained clean.

## Decision history

- Local Lavish sessions supplied the interaction, architecture, testing, and visual-decision evidence. `.lavish/` is now ignored local review state; approved product, architecture, and visual contracts are preserved in `docs/` instead.
- The 2026-08-29 approval/revision lifecycle review explicitly selected final approval, a blocking revision-ready curtain, and a feedback-linked change map. It authorized the implemented local slice and did not authorize publishing or other external changes.
- `examples/blueprint-evaluation/01-decision-brief.html` preserves the original Fieldnote example that exposed the design-contract mismatch; `01-decision-brief-blueprint.html` is the revised dark behavioral specimen, not a default-design example.
- The product name remains **Blueprint**.
- Lavish remains pinned read-only at `upstream/lavish-axi`, commit `a7ddbbaf585e101793938c6dacf8bb0c11e09003` (`lavish-axi-v0.1.62`).

## Deliberately deferred

- Attachments, local asset trees, and non-self-contained HTML.
- Status filters, duplicate suggestions, and guarded batch acceptance.
- Portable decision-record export.
- Desktop packaging, installers, updates, auto-start, and production lifecycle work.
- Database, frontend framework, WebSockets, filesystem watching, publishing, telemetry, hosted collaboration, or full in-tool chat.
- Public npm publication, final package naming, license selection, marketplace/plugin distribution, and desktop distribution.
- Any reuse of source code from `upstream/lavish-axi`.

Do not implement these merely because the core exists. The user explicitly identified overcomplication as the main risk; real sessions should supply the evidence for expansion or simplification.

## Recommended next action

Start a fresh Codex task in another project and exercise Blueprint as the sole default review workflow; the current task retains its startup instruction chain and cannot prove new-task discovery. Continue the Beacon triage-console session as the primary visual and behavioral testing track when useful. Resolve the public npm name and license in a later decision review before any publication.

## Resume checks

```sh
git submodule update --init --recursive
git status --short
npm run check
```
