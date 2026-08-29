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
  let changeItems = [];
  let focusedSelector = "";
  let focusTimer;

  const previewHost = document.createElement("div");
  previewHost.dataset.blueprintTargetPreview = "";
  previewHost.setAttribute("aria-hidden", "true");
  previewHost.style.cssText = "position:fixed!important;inset:0!important;z-index:2147483647!important;pointer-events:none!important;display:none!important;";
  const previewRoot = previewHost.attachShadow({ mode: "closed" });
  const previewStyle = document.createElement("style");
  previewStyle.textContent = [
    ":host { all: initial; }",
    ".outline { position: fixed; box-sizing: border-box; border: 2px solid #43e5dd; border-radius: 2px; background: rgba(67, 229, 221, .09); box-shadow: 0 0 0 1px rgba(5, 7, 10, .86), 0 0 0 3px rgba(67, 229, 221, .22); }",
    ".label { position: fixed; box-sizing: border-box; max-width: calc(100vw - 12px); overflow: hidden; padding: 4px 7px; border: 1px solid #43e5dd; border-radius: 2px; background: #081417; box-shadow: 0 3px 12px rgba(0, 0, 0, .38); color: #43e5dd; font: 700 10px/1.2 ui-monospace, SFMono-Regular, Consolas, 'Liberation Mono', monospace; letter-spacing: .04em; text-overflow: ellipsis; white-space: nowrap; }",
  ].join("");
  const previewOutline = document.createElement("div");
  previewOutline.className = "outline";
  const previewLabel = document.createElement("div");
  previewLabel.className = "label";
  previewRoot.append(previewStyle, previewOutline, previewLabel);
  (document.body || document.documentElement).append(previewHost);

  const changeHost = document.createElement("div");
  changeHost.dataset.blueprintChangeMap = "";
  changeHost.setAttribute("aria-hidden", "true");
  changeHost.style.cssText = "position:fixed!important;inset:0!important;z-index:2147483646!important;pointer-events:none!important;";
  const changeRoot = changeHost.attachShadow({ mode: "closed" });
  const changeStyle = document.createElement("style");
  changeStyle.textContent = [
    ":host { all: initial; }",
    ".change { position: fixed; box-sizing: border-box; border: 2px solid #74e996; border-radius: 2px; background: rgba(116, 233, 150, .08); box-shadow: 0 0 0 1px rgba(5, 7, 10, .86), 0 0 0 4px rgba(116, 233, 150, .14); }",
    ".badge { position: absolute; left: -9px; top: -9px; min-width: 20px; height: 20px; padding: 0 5px; border: 1px solid #74e996; border-radius: 10px; background: #0a1711; color: #74e996; font: 700 10px/18px ui-monospace, SFMono-Regular, Consolas, 'Liberation Mono', monospace; text-align: center; }",
    ".focus { position: fixed; box-sizing: border-box; border: 2px solid #43e5dd; border-radius: 2px; background: rgba(67, 229, 221, .1); box-shadow: 0 0 0 1px rgba(5, 7, 10, .9), 0 0 0 5px rgba(67, 229, 221, .2); }",
  ].join("");
  changeRoot.append(changeStyle);
  (document.body || document.documentElement).append(changeHost);

  function selectedElement(selector) {
    if (typeof selector !== "string" || !selector) return null;
    try { return document.querySelector(selector); }
    catch { return null; }
  }

  function renderChangeMap() {
    changeRoot.querySelectorAll(".change").forEach((node) => node.remove());
    changeItems.forEach((item, index) => {
      const element = selectedElement(item.selector);
      if (!element) return;
      const rect = element.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0 || rect.bottom < 0 || rect.right < 0
        || rect.top > window.innerHeight || rect.left > window.innerWidth) return;
      const outline = document.createElement("div");
      outline.className = "change";
      outline.style.left = Math.max(0, rect.left) + "px";
      outline.style.top = Math.max(0, rect.top) + "px";
      outline.style.width = Math.min(rect.right, window.innerWidth) - Math.max(0, rect.left) + "px";
      outline.style.height = Math.min(rect.bottom, window.innerHeight) - Math.max(0, rect.top) + "px";
      const badge = document.createElement("span");
      badge.className = "badge";
      badge.textContent = String(item.number ?? index + 1);
      outline.append(badge);
      changeRoot.append(outline);
    });
  }

  function renderFocusTarget() {
    changeRoot.querySelector(".focus")?.remove();
    const element = selectedElement(focusedSelector);
    if (!element) return;
    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0 || rect.bottom < 0 || rect.right < 0
      || rect.top > window.innerHeight || rect.left > window.innerWidth) return;
    const outline = document.createElement("div");
    outline.className = "focus";
    outline.style.left = Math.max(0, rect.left) + "px";
    outline.style.top = Math.max(0, rect.top) + "px";
    outline.style.width = Math.min(rect.right, window.innerWidth) - Math.max(0, rect.left) + "px";
    outline.style.height = Math.min(rect.bottom, window.innerHeight) - Math.max(0, rect.top) + "px";
    changeRoot.append(outline);
  }

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

  function responseStatus(form, message) {
    const status = form.querySelector("[data-blueprint-response-status]");
    if (status) status.textContent = message;
  }

  function responseLabel(name) {
    const words = name.replace(/[_-]+/g, " ").trim();
    return words ? words[0].toUpperCase() + words.slice(1) : "Selection";
  }

  function responseBody(form, prompt) {
    const grouped = new Map();
    for (const [name, rawValue] of new FormData(form).entries()) {
      if (typeof rawValue !== "string" || !rawValue.trim()) continue;
      const values = grouped.get(name) || [];
      values.push(rawValue.trim());
      grouped.set(name, values);
    }
    const lines = ["Decision response — " + prompt];
    if (grouped.size === 0) lines.push("- No optional choices selected");
    else grouped.forEach((values, name) => lines.push("- " + responseLabel(name) + ": " + values.join(", ")));
    return lines.join("\n").slice(0, 10000);
  }

  function queueResponseForm(form) {
    if (!form.reportValidity()) return;
    const responseId = form.id.trim();
    const prompt = (form.dataset.blueprintResponse || "").trim();
    if (!/^[a-zA-Z0-9._:-]{1,60}$/.test(responseId) || !prompt) {
      responseStatus(form, "This response form needs a unique safe id and a response prompt.");
      return;
    }
    post({
      type: "response",
      responseId,
      prompt: prompt.slice(0, 180),
      body: responseBody(form, prompt),
      selector: selectorFor(form),
    });
    responseStatus(form, "Queued in Feedback. Use Revise using feedback or Approve with feedback to send.");
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

  window.addEventListener("scroll", () => { showPreview(); renderChangeMap(); renderFocusTarget(); }, true);
  window.addEventListener("resize", () => { showPreview(); renderChangeMap(); renderFocusTarget(); });
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
    if (event.source !== parent || event.data?.version !== 1) return;
    if (event.data.type === "blueprint:modifier") {
      modifierHeld = event.data.active === true;
      if (modifierHeld) showPreview();
      else hidePreview();
      return;
    }
    if (event.data.type === "blueprint:change-map") {
      changeItems = Array.isArray(event.data.items)
        ? event.data.items.filter((item) => item && typeof item.selector === "string").slice(0, 200)
        : [];
      renderChangeMap();
      return;
    }
    if (event.data.type === "blueprint:focus-change") {
      const element = selectedElement(event.data.selector);
      if (!element) return;
      focusedSelector = event.data.selector;
      clearTimeout(focusTimer);
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      element.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center", inline: "nearest" });
      renderFocusTarget();
      setTimeout(renderFocusTarget, 350);
      setTimeout(renderChangeMap, 350);
      focusTimer = setTimeout(() => {
        focusedSelector = "";
        renderFocusTarget();
      }, 1800);
    }
  });

  document.addEventListener("click", (event) => {
    if (event.altKey) {
      event.preventDefault();
      event.stopPropagation();
      targetElement(event);
      return;
    }
    const submitter = event.target instanceof Element
      ? event.target.closest('button[type="submit"], input[type="submit"]')
      : null;
    const form = submitter?.form;
    if (!form?.matches("form[data-blueprint-response]") || !event.isTrusted) return;
    event.preventDefault();
    queueResponseForm(form);
  }, true);

  document.addEventListener("submit", (event) => {
    const form = event.target instanceof Element
      ? event.target.closest("form[data-blueprint-response]")
      : null;
    if (!form || !event.isTrusted) return;
    event.preventDefault();
    queueResponseForm(form);
  }, true);
})();
</script>`;

export function injectAnnotationSdk(contents) {
  const closingBody = contents.toLowerCase().lastIndexOf("</body>");
  if (closingBody === -1) return `${contents}\n${ANNOTATION_SDK}`;
  return `${contents.slice(0, closingBody)}${ANNOTATION_SDK}\n${contents.slice(closingBody)}`;
}
