import assert from "node:assert/strict";
import { execFile as execFileCallback } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFile = promisify(execFileCallback);
const repositoryRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const npmCli = process.env.npm_execpath;
assert.ok(npmCli, "Package validation must run through npm run check:package.");
const manifest = JSON.parse(await readFile(path.join(repositoryRoot, "package.json"), "utf8"));
assert.equal(manifest.license, "MIT");
assert.equal(manifest.private, undefined);
assert.equal(manifest.publishConfig?.access, "public");

const { stdout } = await execFile(
  process.execPath,
  [npmCli, "pack", "--dry-run", "--json", "--ignore-scripts"],
  { cwd: repositoryRoot, maxBuffer: 5 * 1024 * 1024 },
);
const [packed] = JSON.parse(stdout);
assert.ok(packed, "npm pack did not describe a package.");
assert.equal(packed.id, `${manifest.name}@${manifest.version}`);

const files = packed.files.map((entry) => entry.path.replaceAll("\\", "/"));
const required = [
  "CHANGELOG.md",
  "LICENSE",
  "README.md",
  "bin/blueprint.js",
  "package.json",
  "src/cli.js",
  "src/server.js",
  "src/session-store.js",
  "src/ui.js",
];
for (const file of required) {
  assert.ok(files.includes(file), `Published package is missing ${file}.`);
}

const allowed = [
  "CHANGELOG.md",
  "LICENSE",
  "README.md",
  "package.json",
  "bin/",
  "src/",
];
for (const file of files) {
  assert.ok(
    allowed.some((entry) => entry.endsWith("/") ? file.startsWith(entry) : file === entry),
    `Published package contains an unexpected file: ${file}`,
  );
}

process.stdout.write(`package_contract: ${packed.id}; ${files.length} files; ${packed.size} bytes\n`);
