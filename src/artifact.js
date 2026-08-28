const MAX_ARTIFACT_BYTES = 10 * 1024 * 1024;

function isEmbeddedReference(value) {
  const normalized = value.trim().toLowerCase();
  return normalized === ""
    || normalized.startsWith("data:")
    || normalized.startsWith("blob:")
    || normalized.startsWith("#")
    || normalized.startsWith("javascript:");
}

export function assertSelfContainedHtml(contents) {
  const bytes = Buffer.byteLength(contents);
  if (bytes > MAX_ARTIFACT_BYTES) {
    throw new Error("Artifact exceeds the 10 MB first-slice limit.");
  }

  const references = [];
  const attributePattern = /\b(?:src|poster)\s*=\s*(["'])(.*?)\1/gi;
  for (const match of contents.matchAll(attributePattern)) {
    if (!isEmbeddedReference(match[2])) references.push(match[2]);
  }

  const sourceSetPattern = /\bsrcset\s*=\s*(["'])(.*?)\1/gi;
  for (const match of contents.matchAll(sourceSetPattern)) {
    for (const candidate of match[2].split(",")) {
      const reference = candidate.trim().split(/\s+/)[0];
      if (reference && !isEmbeddedReference(reference)) references.push(reference);
    }
  }

  const linkPattern = /<link\b[^>]*\bhref\s*=\s*(["'])(.*?)\1[^>]*>/gi;
  for (const match of contents.matchAll(linkPattern)) {
    if (!isEmbeddedReference(match[2])) references.push(match[2]);
  }

  const cssUrlPattern = /url\(\s*(["']?)(.*?)\1\s*\)/gi;
  for (const match of contents.matchAll(cssUrlPattern)) {
    if (!isEmbeddedReference(match[2])) references.push(match[2]);
  }

  const importPattern = /@import\s+(?:url\()?\s*(["'])(.*?)\1/gi;
  for (const match of contents.matchAll(importPattern)) {
    if (!isEmbeddedReference(match[2])) references.push(match[2]);
  }

  if (references.length > 0) {
    throw new Error(
      `The first Blueprint slice accepts self-contained HTML only; external resource found: ${references[0]}`,
    );
  }
}

export const ANNOTATION_SDK = String.raw`<script data-blueprint-sdk>
(() => {
  "use strict";
  const TYPE = "blueprint:annotation";
  let modifierHeld = false;
  let pointerPosition = null;

  const previewHost = document.createElement("div");
  previewHost.dataset.blueprintTargetPreview = "";
  previewHost.setAttribute("aria-hidden", "true");
  previewHost.style.cssText = "position:fixed!important;inset:0!important;z-index:2147483647!important;pointer-events:none!important;display:none!important;";
  const previewRoot = previewHost.attachShadow({ mode: "closed" });
  const previewStyle = document.createElement("style");
  previewStyle.textContent = [
    ":host { all: initial; }",
    ".outline { position: fixed; box-sizing: border-box; border: 2px solid #168cff; border-radius: 3px; background: rgba(22, 140, 255, .09); box-shadow: 0 0 0 1px rgba(255, 255, 255, .82), 0 0 0 3px rgba(22, 140, 255, .2); }",
    ".label { position: fixed; box-sizing: border-box; max-width: calc(100vw - 12px); overflow: hidden; padding: 4px 7px; border: 1px solid rgba(255, 255, 255, .34); border-radius: 4px; background: #086fd1; box-shadow: 0 3px 12px rgba(0, 0, 0, .28); color: #fff; font: 600 11px/1.2 ui-monospace, SFMono-Regular, Consolas, 'Liberation Mono', monospace; letter-spacing: 0; text-overflow: ellipsis; white-space: nowrap; }",
  ].join("");
  const previewOutline = document.createElement("div");
  previewOutline.className = "outline";
  const previewLabel = document.createElement("div");
  previewLabel.className = "label";
  previewRoot.append(previewStyle, previewOutline, previewLabel);
  (document.body || document.documentElement).append(previewHost);

  function selectorFor(element) {
    if (!(element instanceof Element)) return "body";
    if (element.id) return "#" + CSS.escape(element.id);
    const parts = [];
    let current = element;
    while (current && current !== document.body && parts.length < 7) {
      let part = current.tagName.toLowerCase();
      const siblings = current.parentElement
        ? Array.from(current.parentElement.children).filter((item) => item.tagName === current.tagName)
        : [];
      if (siblings.length > 1) part += ":nth-of-type(" + (siblings.indexOf(current) + 1) + ")";
      parts.unshift(part);
      current = current.parentElement;
    }
    return parts.length ? "body > " + parts.join(" > ") : "body";
  }

  function elementLabel(element) {
    const text = (element.innerText || element.getAttribute("aria-label") || "").trim().replace(/\s+/g, " ");
    return text.slice(0, 180) || "<" + element.tagName.toLowerCase() + ">";
  }

  function previewLabelFor(element) {
    let label = element.tagName.toLowerCase();
    if (element.id) return (label + "#" + element.id).slice(0, 100);
    const classes = Array.from(element.classList || []).filter(Boolean).slice(0, 3);
    if (classes.length) label += "." + classes.join(".");
    const role = element.getAttribute("role");
    if (role) label += '[role="' + role + '"]';
    return label.slice(0, 100);
  }

  function elementAt(x, y, fallback = null) {
    const hit = Number.isFinite(x) && Number.isFinite(y) ? document.elementFromPoint(x, y) : null;
    const element = hit instanceof Element ? hit : (fallback instanceof Element ? fallback : null);
    if (!element || element === previewHost || previewHost.contains(element)) return null;
    return element;
  }

  function hidePreview() {
    previewHost.style.setProperty("display", "none", "important");
  }

  function showPreview() {
    if (!modifierHeld || !pointerPosition) {
      hidePreview();
      return;
    }
    const element = elementAt(pointerPosition.x, pointerPosition.y);
    if (!element) {
      hidePreview();
      return;
    }
    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0 || rect.bottom < 0 || rect.right < 0
      || rect.top > window.innerHeight || rect.left > window.innerWidth) {
      hidePreview();
      return;
    }

    previewOutline.style.left = Math.max(0, rect.left) + "px";
    previewOutline.style.top = Math.max(0, rect.top) + "px";
    previewOutline.style.width = Math.min(rect.right, window.innerWidth) - Math.max(0, rect.left) + "px";
    previewOutline.style.height = Math.min(rect.bottom, window.innerHeight) - Math.max(0, rect.top) + "px";
    previewLabel.textContent = previewLabelFor(element);
    previewHost.style.setProperty("display", "block", "important");

    const labelRect = previewLabel.getBoundingClientRect();
    const labelLeft = Math.min(Math.max(6, rect.left), Math.max(6, window.innerWidth - labelRect.width - 6));
    const labelTop = rect.top >= labelRect.height + 8
      ? rect.top - labelRect.height - 5
      : Math.min(window.innerHeight - labelRect.height - 6, rect.bottom + 5);
    previewLabel.style.left = labelLeft + "px";
    previewLabel.style.top = Math.max(6, labelTop) + "px";
  }

  function post(detail) {
    parent.postMessage({ type: TYPE, version: 1, detail }, "*");
  }

  function targetElement(event) {
    const target = elementAt(event.clientX, event.clientY, event.target);
    if (!target) return;
    post({ type: "element", selector: selectorFor(target), quote: elementLabel(target) });
  }

  document.addEventListener("pointermove", (event) => {
    pointerPosition = { x: event.clientX, y: event.clientY };
    modifierHeld = event.altKey;
    showPreview();
  }, true);

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Alt") return;
    modifierHeld = true;
    showPreview();
  }, true);

  document.addEventListener("keyup", (event) => {
    if (event.key !== "Alt") return;
    modifierHeld = false;
    hidePreview();
  }, true);

  document.addEventListener("pointerout", (event) => {
    if (event.relatedTarget) return;
    pointerPosition = null;
    hidePreview();
  }, true);

  window.addEventListener("scroll", showPreview, true);
  window.addEventListener("resize", showPreview);
  window.addEventListener("blur", () => {
    modifierHeld = false;
    hidePreview();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      modifierHeld = false;
      hidePreview();
    }
  });

  window.addEventListener("message", (event) => {
    if (event.source !== parent || event.data?.type !== "blueprint:modifier" || event.data?.version !== 1) return;
    modifierHeld = event.data.active === true;
    if (modifierHeld) showPreview();
    else hidePreview();
  });

  document.addEventListener("click", (event) => {
    if (!event.altKey) return;
    event.preventDefault();
    event.stopPropagation();
    targetElement(event);
  }, true);
})();
</script>`;

export function injectAnnotationSdk(contents) {
  const closingBody = contents.toLowerCase().lastIndexOf("</body>");
  if (closingBody === -1) return `${contents}\n${ANNOTATION_SDK}`;
  return `${contents.slice(0, closingBody)}${ANNOTATION_SDK}\n${contents.slice(closingBody)}`;
}
