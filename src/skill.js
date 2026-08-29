export const SKILL_DESCRIPTION = "Create and run local Blueprint HTML review loops when a plan, comparison, design, or other visual artifact needs precise human annotation and deliberate feedback.";
export const MAX_SKILL_MARKDOWN_CHARS = 4000;

export function createSkillMarkdown() {
  const markdown = `---
name: blueprint
description: ${SKILL_DESCRIPTION}
metadata:
  interface: blueprint-axi
  version: "2"
---

# Blueprint

Blueprint is a local, human-gated review loop for one person, one agent, and one portable HTML artifact. Use it when a plan, comparison, design, or other visual explanation will be easier to inspect and annotate as a page than as prose.

## Load current guidance from the CLI

Installed skill copies can become stale. Treat the CLI as the source of truth:

- Run \`blueprint\` for live, directory-scoped review state and contextual next steps.
- Run \`blueprint --help\` for the command contract.
- Run \`blueprint playbook\` and open every playbook matching the task.
- Run \`blueprint design\` before authoring an artifact.

The reviewer is not expected to operate the CLI. After the reviewer asks to begin, open the artifact and retain exactly one attached feedback wait. Browser-local drafts are private and do not authorize work until the reviewer submits an intent-bearing Approve or Revise using feedback action. Approve is final; Revise using feedback keeps the session active and may be followed by more feedback batches while the agent works. A staged revision remains hidden behind the reviewer-controlled ready curtain until they reveal it.
`;
  if (markdown.length > MAX_SKILL_MARKDOWN_CHARS) {
    throw new Error(`Generated Blueprint skill exceeds ${MAX_SKILL_MARKDOWN_CHARS} characters.`);
  }
  return markdown;
}
