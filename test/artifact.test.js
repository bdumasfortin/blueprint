import assert from "node:assert/strict";
import test from "node:test";

import { assertSelfContainedHtml, extractArtifactTitle } from "../src/artifact.js";

test("object URL helpers are not mistaken for CSS resource references", () => {
  assert.doesNotThrow(() => assertSelfContainedHtml(`<!doctype html>
    <script>
      function download(file) {
        const url = URL.createObjectURL(file);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    </script>
    <style>body { background: url("data:image/png;base64,AA=="); }</style>
  `));
  for (const html of [
    '<style>body { background: URL("./image.png"); }</style>',
    '<div style="background:url(./image.png)"></div>',
    '<style>@import "./theme.css";</style>',
  ]) {
    assert.throws(() => assertSelfContainedHtml(html), /external resource found/);
  }
});

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
