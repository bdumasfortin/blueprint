# Blueprint visual system

Status: approved visual source of truth for Blueprint's runtime review chrome and default artifacts, 2026-08-28. Runtime implementation was separately approved and completed on 2026-08-28.

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

## Reviewer meta instructions

Reserve a distinct brass band for reviewer-facing guidance. It means “about the review,” not “part of the subject.” In authored artifacts it may explain review protocol, choices, scope, or submission. In the runtime chrome it is limited to the single concise instruction for the primary review gesture. Appropriate content includes:

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

Render the instruction as a compact band with a one-pixel brass border, a four-pixel brass leading rule, and very faint diagonal brass striping. A short uppercase monospace label may name the instruction type. The runtime instruction omits the label and says only: “Hold Alt/Option and click any element to leave feedback.”

## Artifact structure

- Lead with one recommendation.
- Present no more than three primary choices with concise tradeoffs and supporting evidence available on demand.
- When the reviewer must choose, use a labelled native decision form: radios for mutually exclusive options, checkboxes or switches for independent choices, and selects for longer lists. A selectable card is a visual label for a real input, not a click-only container.
- Keep selection visibly distinct from queueing. Control changes remain local; one explicit **Queue response** action creates or replaces one editable private Feedback draft for the form and never sends it to the agent.
- Show a representative specimen for every visual, layout, or motion option. If behavior affects the choice, provide keyboard-operable controls that demonstrate meaningful states, transitions, or microinteractions rather than a static screenshot.
- Use motion to explain state and causality, not as decoration. Honor `prefers-reduced-motion`, avoid distracting autoplay, and keep the static fallback equally understandable.
- Keep artifacts responsive at wide and narrow widths, keyboard-readable, and self-contained.
- Keep the authored HTML portable and authoritative. Blueprint's injected annotation behavior must not be copied into the source artifact.

## Runtime boundary

The user separately authorized applying this system to the runtime review chrome on 2026-08-28. The shell, controls, lifecycle states, and injected exact-target preview now use the graphite, slate, cyan, and restrained semantic tokens defined here. The chrome must never rewrite authored artifact styling, and a runtime restyle does not change the human reveal gate for staged artifact revisions.

Trusted review panes use a compact ten-pixel scrollbar: canvas-colored track, slate thumb at rest, cyan hover and active states, and the same two-pixel corner geometry as the surrounding controls. This styling belongs only to Blueprint's shell; scrollbars inside the sandboxed artifact remain under the artifact author's control.
