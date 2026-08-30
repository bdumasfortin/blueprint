import assert from "node:assert/strict";
import { mkdtemp, mkdir, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import {
  canonicalArtifactPath,
  pathKeyFor,
  resolveInside,
} from "../src/paths.js";
import { assertSelfContainedHtml } from "../src/artifact.js";

test("artifact paths are canonical existing HTML files", async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), "blueprint-paths-"));
  t.after(() => rm(root, { recursive: true, force: true }));

  const artifact = path.join(root, "review.html");
  await writeFile(artifact, "<!doctype html><title>Review</title>");

  const canonical = await canonicalArtifactPath(artifact);
  assert.equal(canonical, await realpath(artifact));
  assert.match(pathKeyFor(canonical), /^[a-f0-9]{64}$/);

  const textFile = path.join(root, "review.txt");
  await writeFile(textFile, "not html");
  await assert.rejects(() => canonicalArtifactPath(textFile), /\.html/i);
  await assert.rejects(
    () => canonicalArtifactPath(path.join(root, "missing.html")),
    /does not exist/i,
  );
});

test("the first slice rejects HTML that depends on external resources", () => {
  assert.doesNotThrow(() => assertSelfContainedHtml(
    '<!doctype html><style>body{background:url("data:image/png;base64,AA==")}</style><img src="data:image/png;base64,AA==">',
  ));
  assert.throws(
    () => assertSelfContainedHtml('<!doctype html><script src="./app.js"></script>'),
    /self-contained html only/i,
  );
  assert.throws(
    () => assertSelfContainedHtml('<!doctype html><link rel="stylesheet" href="https://example.com/app.css">'),
    /self-contained html only/i,
  );
});

test("state paths cannot escape their declared root", async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), "blueprint-boundary-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, "sessions"));

  assert.equal(
    resolveInside(root, "sessions", "safe"),
    path.join(root, "sessions", "safe"),
  );
  assert.throws(() => resolveInside(root, "..", "escape"), /outside/i);
  assert.throws(() => resolveInside(root, "sessions", "..", ".."), /outside/i);
});
