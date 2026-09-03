import { CliError, renderFields, renderList, renderTable } from "./axi.js";

const PLAYBOOK_VERSION = 10;

const PLAYBOOKS = Object.freeze([
  {
    id: "artifact",
    useWhen: "Author a new portable HTML artifact for Blueprint review",
    guidance: [
      "Run `blueprint design` before authoring; it is the current visual authority.",
      "Use HTML only when interaction or visual structure materially improves understanding over concise prose.",
      "Open with the human-readable project or workspace name before the review title. Show a filesystem path only when the readable name is ambiguous.",
      "In the opening viewport, lead with one recommendation and one reason, then give a complete preview of every decision, preference, or confirmation the review will request. Link each preview item to its response area when the artifact is long enough to scroll.",
      "Omit background and rationale already established in the conversation unless they materially change the recommendation or a choice. Do not replay the thread as an introduction.",
      "Collapse supporting evidence and edge cases by default unless they are necessary to understand the primary options. Every visible paragraph must help the reviewer orient, decide, or verify.",
      "Present no more than three primary choices, and keep their labels and tradeoffs short.",
      "When the artifact asks for a choice, use an operable decision form: radios for mutually exclusive options, checkboxes or switches for independent choices, and a separate Queue response submit action. Give the form a unique safe id plus data-blueprint-response, and give every control a meaningful name and value.",
      "For visual, layout, or motion choices, render a representative specimen for every option. When behavior affects the decision, make each specimen demonstrate useful states or transitions with real HTML controls; static mockups are valid only when interaction is irrelevant.",
      "Keep selection local and reversible. Never queue on radio, checkbox, select, or option-card change; one explicit Queue response action creates or replaces one typed private decision response for that form.",
      "Keep the source self-contained, responsive, keyboard-readable, and free of Blueprint runtime code.",
      "Reserve the brass meta band for instructions about operating or interpreting the review, never ordinary subject matter.",
      "Verify wide and narrow layouts, keyboard operation, queued-response behavior, and every representative specimen state before opening the review.",
    ],
    next: [
      "Run `blueprint playbook decision` when the artifact asks the reviewer to choose.",
      "Run `blueprint playbook review-loop` before launching it.",
    ],
  },
  {
    id: "decision",
    useWhen: "Explain a consequential plan or compare options before implementation",
    guidance: [
      "State the project or workspace, decision, recommendation, one-sentence reason, complete ask preview, and authority boundary at the top. Defer evidence that is not needed to understand the ask.",
      "Present at most three mutually exclusive primary options and make the recommended option visually explicit.",
      "Place the response controls beside the smallest amount of evidence needed to make that decision. Put supporting detail and edge cases afterward in collapsed disclosure sections.",
      "Make mutually exclusive options selectable through a labelled radio group, preferably with the whole option card as its label. Use checkboxes or switches only for independently combinable choices, and a select only when a longer option list makes cards impractical.",
      "Show concrete behavior or a representative wireframe for each visual option; prose-only visual choices are invalid. Demonstrate the states, transitions, or microinteractions that would materially affect the implemented experience, honor prefers-reduced-motion, and avoid decorative motion that supplies no decision evidence.",
      "Expose benefits, costs, reversibility, risks, and unknowns at comparable levels of detail.",
      "Carry settled decisions forward and do not ask them again without new evidence.",
      "A selection remains browser-local until Queue response places one editable private decision response in the inspector; re-queueing the same form replaces that unsent response instead of adding another. A decision response alone leaves the final action labelled Approve and does not expose Revise using feedback. If actual revision comments also exist, those comments—not the decision—produce Approve with feedback and Revise using feedback.",
    ],
    next: [
      "Run `blueprint review <artifact.html>` only after the reviewer asks to launch the review; it opens and waits as one attached action.",
      "Use separate `blueprint open` and `blueprint wait` commands only for recovery or diagnostics.",
    ],
  },
  {
    id: "review-loop",
    useWhen: "Open a Blueprint review, receive feedback, and stage a revision",
    guidance: [
      "Treat the HTML file as authoritative and the served revision as immutable evidence.",
      "Run `blueprint review <artifact.html>` as the default launch. It opens the artifact and keeps the same command attached until exactly one feedback packet is delivered. Do not end the turn while that command is still waiting.",
      "Use separate `blueprint open <artifact.html>` and `blueprint wait <artifact.html>` only to recover or diagnose an existing review; never run concurrent waits.",
      "Do not act on unsent browser drafts. Wait returns one immutable intent-bearing JSON packet and acknowledges only after complete delivery.",
      "Handle packet IDs idempotently because delivery is at least once.",
      "An `approve` packet is final: the browser review surface retires after persistence; honor any typed decision responses and attached comments, and do not stage another revision or expect further browser feedback for that ended review. The reviewer may inspect the approved snapshot and History in the same tab through the read-only completion action, but that view never reactivates the session or creates new agent authority.",
      "A `revise` packet keeps the review active. Continue one attached wait while editing so later revise batches can join the same revision; replace a completed wait, but never run concurrent waits for one review.",
      "The reviewer shell keeps sent comments visible and derives waiting-for-agent versus agent-working state from packet acknowledgement. Acknowledge promptly after complete delivery, and do not interpret a still-queued batch as agent work already underway.",
      "Final approval is unavailable after a revise packet is submitted and remains unavailable until a revision covering that request is staged and the reviewer reveals it. Additional revise batches may still arrive while you work.",
      "Before staging, account for every revise packet used as a basis and report every revision comment in those packets. Decisions are typed basis inputs, not amendment items, and need no Accept/Reopen evidence. Use report schema version 2 with `basisPacketIds`; each addressed or changed comment needs `before`, `after`, `summary`, `evidence`, and the amended element's `selector`.",
      "Edit the authoritative HTML, then run `blueprint stage <artifact.html> --report <report.json>`. Staging opens a blocking ready curtain but never reveals the new snapshot.",
      "Only the reviewer may choose See latest revision, accept, reopen, approve, or end the session.",
      "If the wait is interrupted, restart the same wait; never create concurrent waits for one review.",
    ],
    next: [
      "Run `blueprint --help` for exact command syntax.",
      "Run `blueprint playbook artifact` before authoring the next artifact.",
    ],
  },
]);

export function renderPlaybookIndex() {
  return `${renderFields([["playbook_version", PLAYBOOK_VERSION], ["instruction", "Open every playbook that matches the task before authoring or launching."]])}\n${renderTable("playbooks", PLAYBOOKS, ["id", "useWhen"])}\n${renderList("help", ["Run `blueprint playbook <id>` for focused guidance."])}\n`;
}

export function renderPlaybook(id) {
  const playbook = PLAYBOOKS.find((candidate) => candidate.id === id);
  if (!playbook) {
    throw new CliError("UNKNOWN_PLAYBOOK", `Unknown playbook: ${id}`, {
      exitCode: 2,
      help: ["Run `blueprint playbook` to list valid playbook IDs."],
    });
  }
  return `${renderFields([["playbook_version", PLAYBOOK_VERSION], ["playbook", playbook.id], ["use_when", playbook.useWhen]])}\n${renderList("guidance", playbook.guidance)}\n${renderList("help", playbook.next)}\n`;
}
