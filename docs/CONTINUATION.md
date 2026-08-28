# Continuation handoff

Last updated: 2026-08-27.

## State at stop

- The workspace is a Git repository on branch `main`.
- Lavish is recorded as a pinned Git submodule at `upstream/lavish-axi`.
- Lavish research is complete enough to support product design; targeted architecture research can continue when specific decisions arise.
- Two Lavish artifacts are preserved under `.lavish/`:
  - `blueprint-discovery-round-1.html` contains the discovery work and was evolved into round two.
  - `blueprint-naming-round-1.html` is a closed, rejected naming exploration.
- The product name remains **Blueprint**.
- The product decision ledger is in `docs/PRODUCT.md`.
- No Blueprint application code, package manifest, implementation architecture, or dependency stack has been created.

## What was deliberately stopped

Work had begun on a possible next review covering the inspector, packet composer, revision reveal, and verification experience. The user asked to stop before a new artifact or review session was created. Do not assume any unpublished concept from that aborted work was accepted.

## Recommended next session

1. Re-read `docs/PRODUCT.md` and inspect the existing discovery artifact.
2. Create a **fresh** Lavish artifact for the core interaction contract.
3. Make the artifact itself a concrete, interactive simulation of:
   - annotate;
   - private draft;
   - packet compose/edit;
   - explicit send and acknowledgement;
   - agent working/disconnected state;
   - revision ready;
   - human reveal; and
   - accept/reopen verification.
4. Ask only the remaining high-value interaction questions listed in `docs/PRODUCT.md`. Carry settled decisions forward and do not reopen naming.
5. Update `docs/PRODUCT.md` with explicit feedback after the review ends.
6. Run a separate architecture/protocol review only after the interaction contract is approved.

## Definition of ready for implementation

Blueprint is not ready to implement until all of the following are true:

- The end-to-end interaction contract has explicit user approval.
- Revision identity, local persistence, delivery acknowledgement, adapter boundaries, and export schemas are documented and approved.
- The selected runtime/dependency approach has been compared against a smaller alternative.
- The reuse/attribution decision for each borrowed Lavish component is recorded.
- Core risk tests are planned: sandbox boundaries, path restrictions, draft durability, process recovery, duplicate delivery, stale anchors, and human-only acceptance.

## Repository checks when resuming

```sh
git submodule update --init --recursive
git status --short
git submodule status
```

The expected submodule commit is `a7ddbbaf585e101793938c6dacf8bb0c11e09003` (`lavish-axi-v0.1.62`).
