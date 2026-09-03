import assert from "node:assert/strict";
import test from "node:test";

import { extractArtifactTitle } from "../src/artifact.js";

test("artifact titles decode common entities and collapse display whitespace", () => {
  assert.equal(
    extractArtifactTitle("<!doctype html><TITLE> Checkout &amp; payments &#xB7;\n Q3 </TITLE>"),
    "Checkout & payments · Q3",
  );
});

test("artifact titles preserve unknown entities and reject invalid numeric code points", () => {
  assert.equal(extractArtifactTitle("<title>Known &copy; unknown &custom;</title>"), "Known © unknown &custom;");
  assert.equal(extractArtifactTitle("<title>Invalid &#xD800;</title>"), "Invalid �");
});

test("missing and blank artifact titles produce no title", () => {
  assert.equal(extractArtifactTitle("<!doctype html><h1>Untitled</h1>"), "");
  assert.equal(extractArtifactTitle("<!doctype html><title> \n </title>"), "");
});
