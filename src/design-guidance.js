export const DESIGN_GUIDANCE = `# Blueprint artifact design contract

Use this contract when authoring an HTML artifact for a Blueprint review.

## Precedence

1. Follow the user's explicit visual direction for this artifact.
2. Follow repository or agent instructions that explicitly state a preferred design system for Blueprint artifacts.

Do not automatically inspect, infer, or inherit a design system merely because one exists in the current workspace. General application styling is not a Blueprint design override unless the instruction explicitly applies it to Blueprint artifacts.

## Approved default visual system

- The approved visual source of truth is recorded in docs/VISUAL_SYSTEM.md. It preserves the full-system candidate approved on 2026-08-28 and the later brass meta-instruction refinement.
- Use one unified technical visual language across Blueprint's review shell and default authored artifacts: near-black graphite canvas, slate structure, cyan interaction signal, restrained semantic colors, compact system sans, and monospace labels for controls, state, and evidence.
- Use a uniform 24-pixel non-blue graphite grid at low contrast. Let it remain visible through restrained translucent surfaces without competing with artifact content.
- Prefer crisp one-pixel borders, square or minimally rounded geometry, explicit state labels, uppercase decision hierarchy, dense controls, and generous document-scale whitespace.
- Keep cyan for active interaction and primary actions. Use green, amber, and red only for semantic success, waiting/warning, and failure or destructive states.
- Reserve a distinct brass meta layer for reviewer-facing guidance inside an artifact: instructions about how to review, choose, interpret, queue, or submit; scope and authority notes; and other content that is about the review rather than the artifact's subject. Use dark-theme brass #d8a34d with rgba(216, 163, 77, .11), or light-theme brass #81500f with rgba(129, 80, 15, .09), as the foreground and soft surface.
- Render artifact meta guidance as a compact bordered band with a four-pixel brass leading rule and very faint diagonal brass striping. A short monospace uppercase label may identify the instruction type. Do not use this treatment for ordinary product content, recommendations, status, or warnings; semantic warning amber remains a separate state color.
- This approval establishes visual direction for new default artifacts. It does not by itself authorize restyling an active review session or implementing the runtime review chrome.
- The former calm, dark, editorial/instrument prototype remains only a behavioral specimen and is not the approved default.

## Settled authoring constraints

- Lead with one recommendation. Present no more than three primary choices, with short tradeoffs and supporting evidence available on demand.
- For visual, layout, or motion decisions, show a representative specimen for every option instead of asking the reviewer to choose from prose alone.
- Make the artifact responsive at wide and narrow widths, keyboard-readable, and self-contained. Do not use external network resources.
- Keep the reviewed HTML portable and authoritative. Blueprint's injected annotation behavior must not be copied into the source artifact.
`;
