---
name: blueprint
description: Create and run local Blueprint HTML review loops when a plan, comparison, design, or other visual artifact needs precise human annotation and deliberate feedback.
metadata:
  interface: blueprint-axi
  version: "3"
---

# Blueprint

Blueprint is a local, human-gated review loop for one person, one agent, and one portable HTML artifact. Use it when a plan, comparison, design, or other visual explanation will be easier to inspect and annotate as a page than as prose.

## Load current guidance from the CLI

Installed skill copies can become stale. Treat the CLI as the source of truth:

- Run `blueprint` for live, directory-scoped review state and contextual next steps.
- Run `blueprint --help` for the command contract.
- Run `blueprint playbook` and open every playbook matching the task.
- Run `blueprint design` before authoring an artifact.

The reviewer is not expected to operate the CLI. After the reviewer asks to begin, use `blueprint review <artifact.html>`: it opens the review and keeps that same command attached until exactly one feedback packet arrives. Do not end the turn while it is waiting. Use separate `open` and `wait` commands only for recovery or diagnostics. Browser-local drafts are private and do not authorize work until the reviewer submits an intent-bearing Approve or Revise using feedback action. Approve is final; Revise using feedback keeps the session active and may be followed by more feedback batches while the agent works. A staged revision remains hidden behind the reviewer-controlled ready curtain until they reveal it.
