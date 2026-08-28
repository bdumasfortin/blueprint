# Blueprint visual system

Status: approved visual source of truth for default Blueprint artifacts, 2026-08-28. Runtime review-chrome implementation remains a separate authority gate.

## Precedence

1. Follow the user's explicit visual direction for the artifact.
2. Follow repository or agent instructions that explicitly apply a preferred design system to Blueprint artifacts.
3. Otherwise use this default.

Do not inspect, infer, or inherit a design system merely because it exists in the workspace. General application styling is not a Blueprint override.

## Character

Blueprint uses one quiet technical language across its review chrome and default authored artifacts:

- near-black graphite canvases and translucent dark surfaces;
- slate borders and secondary structure;
- cyan for active interaction and primary actions;
- green, amber, and red only for semantic success, waiting or warning, and failure or destructive states;
- compact system sans for readable content and monospace for controls, state, evidence, and technical metadata;
- crisp one-pixel borders, square or minimally rounded geometry, dense controls, and generous document-scale whitespace; and
- uppercase labels and decision hierarchy where scanning benefits from them.

The earlier calm, dark, editorial Fieldnote treatment remains a behavioral specimen, not the default visual authority.

## Core tokens

| Role | Default |
| --- | --- |
| Canvas | `#05070a` |
| Application surface | `#080c11` |
| Primary panel | `#0b1118` |
| Secondary panel | `#0e151d` |
| Border | `#202d38` |
| Strong border | `#33434f` |
| Primary text | `#edf4f3` |
| Muted text | `#80909c` |
| Faint text | `#52616c` |
| Interaction cyan | `#43e5dd` |
| Success | `#74e996` |
| Warning or waiting | `#ffbd5c` |
| Danger | `#ff6971` |

These values define relationships, not a requirement to repeat every token in every artifact. Contrast and readability take precedence over ornamental fidelity.

## Graphite grid

Use a uniform 24-pixel non-blue graphite grid at low contrast. A representative dark treatment is two one-pixel linear gradients using `rgba(185, 199, 207, .05)` over the canvas. The grid may remain visible through restrained translucent surfaces, but it must not compete with artifact content.

## Artifact meta instructions

Reserve a distinct brass band for reviewer-facing guidance inside an artifact. It means “about the review,” not “part of the subject.” Appropriate content includes:

- review protocol or interaction instructions;
- how to interpret or choose among options;
- scope and authority boundaries;
- queueing and submission instructions; and
- disclosure that an example is fictional or exists to exercise Blueprint.

Do not use the brass treatment for recommendations, product content, status, or ordinary warnings. Warning amber remains a separate semantic state.

| Theme | Brass | Soft surface |
| --- | --- | --- |
| Dark | `#d8a34d` | `rgba(216, 163, 77, .11)` |
| Light | `#81500f` | `rgba(129, 80, 15, .09)` |

Render the instruction as a compact band with a one-pixel brass border, a four-pixel brass leading rule, and very faint diagonal brass striping. A short uppercase monospace label may name the instruction type.

## Artifact structure

- Lead with one recommendation.
- Present no more than three primary choices with concise tradeoffs and supporting evidence available on demand.
- Show a representative specimen for every visual, layout, or motion option.
- Keep artifacts responsive at wide and narrow widths, keyboard-readable, and self-contained.
- Keep the authored HTML portable and authoritative. Blueprint's injected annotation behavior must not be copied into the source artifact.

## Runtime boundary

This contract guides new default artifacts now. The approved direction also unifies the eventual runtime review chrome, but the visual approval did not authorize silently restyling an active session or implementing that runtime change. The chrome must never rewrite authored artifact styling.
