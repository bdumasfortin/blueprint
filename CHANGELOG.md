# Changelog

Notable public changes to Blueprint are recorded here. Version numbers follow Semantic Versioning.

## [0.2.1] - 2026-09-02

### Added

- Decision responses are stored and delivered separately from revision comments. New review packets use schema version 3 with distinct `decisions` and `comments` collections.
- Successful approval now offers **Close tab** and **View approved review**. The approved artifact and its History can be revisited in the same tab as an immutable read-only view without reactivating the session.

### Changed

- Queued decisions no longer make **Approve** read **Approve with feedback** or expose **Revise using feedback**. Those revision actions now depend only on actual comments.
- Blueprint's agent playbooks describe typed decision inputs, final approval, and post-approval read-only viewing explicitly.

### Removed

- The generated Blueprint agent skill and its build/check machinery. The CLI's versioned playbooks and optional SessionStart hook are now the only agent-guidance surfaces.

### Fixed

- Long Feedback lists no longer jump upward while the reviewer types in **Additional feedback**. Autosave and unchanged polling avoid rebuilding the pane, while genuine updates preserve its scroll anchor, field focus, and text selection.

### Compatibility

- Packet schemas 1 and 2 remain readable. Revision reports remain on schema version 2.
- The minimum supported runtime remains Node.js 22.
- Blueprint does not remove manually copied skill files. Users who previously installed the Blueprint skill should uninstall that copy from their agent configuration.

## [0.2.0] - 2026-08-30

### Added

- First public npm release of Blueprint's local, human-gated HTML review loop.
- Atomic `blueprint review` launch-and-wait behavior, with lower-level `open` and `wait` recovery commands.
- Private feedback drafts, precise element annotation, staged revision reveal, amendment evidence, Accept/Reopen, and read-only History.
- Versioned agent playbooks, generated Codex skill discovery, and optional Codex and Claude Code SessionStart hooks.
- Validation-gated packaging with Node 22/24 coverage across Windows and Linux.

[0.2.1]: https://github.com/bdumasfortin/blueprint/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/bdumasfortin/blueprint/releases/tag/v0.2.0
