import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { atomicWriteJson, readJson } from "../src/atomic.js";

test("an interrupted atomic replacement preserves the previous document", async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), "blueprint-atomic-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const target = path.join(root, "manifest.json");

  await atomicWriteJson(target, { revision: 1 });
  await assert.rejects(
    () => atomicWriteJson(target, { revision: 2 }, {
      beforeRename() {
        throw new Error("simulated interruption");
      },
    }),
    /simulated interruption/,
  );

  assert.deepEqual(await readJson(target), { revision: 1 });
  assert.match(await readFile(target, "utf8"), /"revision": 1/);
});
