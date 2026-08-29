import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { createSkillMarkdown } from "../src/skill.js";

const target = new URL("../skills/blueprint/SKILL.md", import.meta.url);
const expected = createSkillMarkdown();
const check = process.argv.includes("--check");

if (check) {
  let actual = null;
  try {
    actual = await readFile(target, "utf8");
  } catch {
    // Missing output is reported as drift below.
  }
  if (actual !== expected) {
    process.stderr.write("skills/blueprint/SKILL.md is stale. Run `npm run build:skill`.\n");
    process.exitCode = 1;
  } else {
    process.stdout.write("skills/blueprint/SKILL.md is current.\n");
  }
} else {
  await mkdir(new URL("../skills/blueprint/", import.meta.url), { recursive: true });
  await writeFile(target, expected);
  process.stdout.write(`Wrote ${fileURLToPath(target)}\n`);
}
