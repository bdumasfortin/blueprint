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
- Reserve a distinct brass meta layer for reviewer-facing guidance: artifact instructions about how to review, choose, interpret, queue, or submit; scope and authority notes; and the runtime's single concise instruction for its primary review gesture. Use dark-theme brass #d8a34d with rgba(216, 163, 77, .11), or light-theme brass #81500f with rgba(129, 80, 15, .09), as the foreground and soft surface.
- Render artifact meta guidance as a compact bordered band with a four-pixel brass leading rule and very faint diagonal brass striping. A short monospace uppercase label may identify the instruction type. Do not use this treatment for ordinary product content, recommendations, status, or warnings; semantic warning amber remains a separate state color.
- Runtime review-chrome implementation was separately approved and completed on 2026-08-28. The chrome uses this system without rewriting authored artifact styles or bypassing the human reveal gate for staged revisions.
- The former calm, dark, editorial/instrument prototype remains only a behavioral specimen and is not the approved default.

## Settled authoring constraints

- Lead with one recommendation. Present no more than three primary choices, with short tradeoffs and supporting evidence available on demand.
- If the reviewer is expected to choose, provide an operable labelled form instead of making them annotate their preference. Use radios for one-of-many options, checkboxes or switches for independent choices, and select controls for longer lists. Selectable cards should be real labels around native inputs, not click-only divs.
- Keep control changes local and reversible. A decision form uses a unique safe \`id\`, a concise \`data-blueprint-response\` prompt, meaningful control names and values, and one explicit **Queue response** submit button. Queueing creates or replaces one typed private decision response; it never sends to the agent, creates revision feedback, or ends the review. A queued decision alone leaves the final action labelled **Approve** and does not expose **Revise using feedback**.
- For visual, layout, or motion decisions, show a representative specimen for every option instead of asking the reviewer to choose from prose alone. When behavior matters, specimens must expose decision-relevant states, transitions, or microinteractions through operable HTML controls. Static wireframes are acceptable only when interaction would not change the decision.
- Motion should clarify state and causality, stay restrained, and honor \`prefers-reduced-motion\`. Avoid decorative autoplay, fake controls, or transitions that cannot be exercised by keyboard.
- Make the artifact responsive at wide and narrow widths, keyboard-readable, and self-contained. Do not use external network resources.
- Keep the reviewed HTML portable and authoritative. Blueprint's injected annotation behavior must not be copied into the source artifact.
`;
