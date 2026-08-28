function escapeJsonForScript(value) {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

export function renderReviewShell(reviewToken, nonce) {
  const tokenLiteral = escapeJsonForScript(reviewToken);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Blueprint review</title>
  <style>
    :root {
      color-scheme: dark;
      --ink: #eef2f8;
      --muted: #98a2b3;
      --faint: #626d7e;
      --line: #283140;
      --panel: #111722;
      --panel-2: #171e2a;
      --base: #090d13;
      --accent: #90b9ff;
      --accent-2: #b7d0ff;
      --ok: #77d0a0;
      --warn: #f0bd67;
      --danger: #ee8d91;
      --rail: 52px;
      --inspector: 390px;
      font: 14px/1.45 Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    * { box-sizing: border-box; }
    html, body { height: 100%; margin: 0; background: var(--base); color: var(--ink); }
    button, textarea, input { font: inherit; }
    button { color: inherit; }
    .app { height: 100%; display: grid; grid-template-columns: minmax(0, 1fr) var(--inspector) 0; overflow: hidden; transition: grid-template-columns .18s; }
    .app.inspector-closed { grid-template-columns: minmax(0, 1fr) 0 var(--rail); }
    .artifact-stage { min-width: 0; position: relative; grid-column: 1; background: #fff; overflow: hidden; }
    iframe { width: 100%; height: 100%; display: block; border: 0; background: #fff; }
    .inspector { min-width: 0; position: relative; grid-column: 2; overflow: hidden; border-left: 1px solid var(--line); background: var(--panel); display: flex; flex-direction: column; }
    .inspector-header { padding: 17px 18px 13px; border-bottom: 1px solid var(--line); }
    .inspector-top { display: flex; align-items: flex-start; gap: 10px; }
    .inspector-identity { min-width: 0; flex: 1; align-self: center; }
    .artifact-name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 650; }
    .inspector-actions { display: flex; align-items: center; gap: 4px; }
    .inspector-action { width: 29px; height: 29px; padding: 0; border: 1px solid transparent; border-radius: 7px; background: transparent; color: var(--muted); cursor: pointer; }
    .inspector-action:hover { border-color: var(--line); background: var(--panel-2); color: var(--ink); }
    .collapse-action { width: 34px; height: 34px; font-size: 28px; line-height: 1; }
    .tabs { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-top: 14px; padding: 3px; border: 1px solid var(--line); border-radius: 9px; background: #0c1119; }
    .tab { border: 0; border-radius: 6px; padding: 7px; background: transparent; color: var(--muted); cursor: pointer; }
    .tab.active { color: var(--ink); background: var(--panel-2); }
    .pane { flex: 1; min-height: 0; overflow-y: auto; padding: 16px 18px 110px; }
    .meta-band { margin-bottom: 14px; padding: 11px 12px; border: 1px solid #30405a; border-radius: 9px; background: #121c2b; color: #afbed2; font-size: 12px; }
    .draft { margin-bottom: 10px; border: 1px solid var(--line); border-radius: 11px; background: var(--panel-2); overflow: hidden; }
    .draft-top { display: flex; align-items: center; gap: 7px; padding: 8px 9px; border-bottom: 1px solid var(--line); color: var(--muted); font-size: 11px; }
    .anchor { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .icon-button { width: 25px; height: 25px; padding: 0; border: 0; border-radius: 6px; background: transparent; color: var(--muted); cursor: pointer; }
    .icon-button:hover { background: #242d3c; color: var(--ink); }
    textarea { width: 100%; resize: vertical; border: 1px solid var(--line); border-radius: 8px; background: #0d121a; color: var(--ink); padding: 10px; outline: none; }
    textarea:focus { border-color: #5778ab; box-shadow: 0 0 0 2px rgba(144,185,255,.1); }
    .draft textarea { min-height: 76px; resize: vertical; border: 0; border-radius: 0; background: transparent; }
    .packet-note { min-height: 70px; margin-top: 5px; }
    .label { display: block; margin: 17px 0 5px; color: var(--muted); font-size: 12px; font-weight: 650; }
    .sticky-action { position: absolute; left: 0; right: 0; bottom: 0; display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px; padding: 12px 18px 16px; border-top: 1px solid var(--line); background: linear-gradient(180deg, rgba(17,23,34,.88), #111722 28%); }
    .primary, .secondary, .danger { border-radius: 9px; padding: 9px 12px; cursor: pointer; }
    .primary { min-width: 0; border: 1px solid #7ea8e7; background: #a6c7ff; color: #0b1422; font-weight: 750; }
    .primary:hover { background: #bdd6ff; }
    .primary:disabled { opacity: .45; cursor: default; }
    .secondary { border: 1px solid #3a4659; background: #1b2330; }
    .danger { border: 1px solid #6c373b; background: #2a171c; color: #ffb3b5; }
    .end-action { width: 40px; padding: 9px 0; font-size: 12px; }
    .rail { z-index: 5; grid-column: 3; width: 100%; height: 100%; padding: 0; border: 0; border-left: 1px solid var(--line); background: #0b1017; color: var(--muted); font-size: 24px; cursor: pointer; visibility: hidden; opacity: 0; }
    .inspector-closed .rail { visibility: visible; opacity: 1; }
    .rail:hover, .rail:focus-visible { background: var(--panel-2); color: var(--ink); outline: none; }
    .empty { padding: 24px 8px; color: var(--muted); text-align: center; }
    .feedback { margin-bottom: 10px; padding: 12px; border: 1px solid var(--line); border-radius: 11px; background: var(--panel-2); }
    .feedback-head { display: flex; gap: 8px; align-items: center; margin-bottom: 7px; }
    .badge { border-radius: 99px; padding: 2px 7px; background: #263044; color: #bed2f3; font-size: 10px; font-weight: 750; text-transform: uppercase; }
    .badge.addressed { background: #173629; color: #99e2b9; }
    .badge.stale { background: #3a2e18; color: #f2cb83; }
    .feedback-quote { color: var(--muted); font-size: 12px; }
    .feedback-summary { margin: 8px 0; }
    details { color: var(--muted); font-size: 12px; }
    details p { color: #c2cad6; }
    .feedback-actions { display: flex; gap: 7px; margin-top: 11px; }
    .feedback-actions button { flex: 1; }
    .reopen-note { min-height: 74px; margin-top: 11px; }
    .accepted { opacity: .58; }
    .banner { margin-bottom: 12px; padding: 10px 11px; border: 1px solid #665027; border-radius: 9px; background: #2a2113; color: #f0cc88; font-size: 12px; }
    .banner button { margin-top: 8px; }
    .toast { position: fixed; z-index: 20; left: 18px; bottom: 18px; max-width: min(440px, calc(100vw - 36px)); padding: 10px 13px; border: 1px solid #3c4b60; border-radius: 9px; background: #131b27; box-shadow: 0 16px 45px rgba(0,0,0,.35); opacity: 0; transform: translateY(8px); pointer-events: none; transition: .18s; }
    .toast.show { opacity: 1; transform: translateY(0); }
    .toast.error { border-color: #773d43; color: #ffbdc0; }
    .count { margin-left: 4px; color: var(--faint); }
    [hidden] { display: none !important; }
    @media (max-width: 800px) {
      :root { --inspector: 0px; }
      .app { grid-template-columns: minmax(0,1fr) 0 0; }
      .app.inspector-closed { grid-template-columns: minmax(0,1fr) 0 var(--rail); }
      .inspector { position: fixed; z-index: 4; left: 0; right: 0; bottom: 0; height: min(62vh, 560px); border: 1px solid var(--line); border-width: 1px 0 0; border-radius: 16px 16px 0 0; box-shadow: 0 -24px 70px rgba(0,0,0,.42); transform: translateY(0); transition: transform .18s; }
      .inspector-closed .inspector { transform: translateY(105%); }
      .sticky-action { right: 0; }
    }
  </style>
</head>
<body>
  <main class="app" id="app">
    <section class="artifact-stage" aria-label="Reviewed artifact">
      <iframe id="artifact" title="Reviewed artifact" sandbox="allow-scripts"></iframe>
    </section>

    <aside class="inspector" aria-label="Review inspector">
      <header class="inspector-header">
        <div class="inspector-top">
          <div class="inspector-identity">
            <div class="artifact-name" id="artifact-name">Blueprint review</div>
          </div>
          <div class="inspector-actions">
            <button class="inspector-action" id="reveal-revision" type="button" title="Reveal staged revision" aria-label="Reveal staged revision" hidden>↻</button>
            <button class="inspector-action collapse-action" id="collapse-inspector" type="button" title="Collapse inspector" aria-label="Collapse inspector">›</button>
          </div>
        </div>
        <div class="tabs" role="tablist">
          <button class="tab active" id="drafts-tab" type="button">Drafts <span class="count" id="draft-count">0</span></button>
          <button class="tab" id="verify-tab" type="button">Verify <span class="count" id="verify-count">0</span></button>
        </div>
      </header>
      <section class="pane" id="drafts-pane">
        <div class="meta-band">Hold Alt/Option to preview the exact element, then click to add a private comment. Nothing leaves this review until you send feedback.</div>
        <div class="banner" id="recovery-banner" hidden>Delivery has not been acknowledged. Your packet remains saved locally.<br><button class="secondary" id="copy-recovery" type="button">Copy packet</button></div>
        <div id="draft-list"></div>
        <label class="label" for="packet-note">Packet note · optional</label>
        <textarea class="packet-note" id="packet-note" placeholder="One note that frames this round of feedback"></textarea>
      </section>
      <section class="pane" id="verify-pane" hidden>
        <div class="meta-band">Agent reports are evidence, not acceptance. Review items stay in their original artifact order; only you can accept or reopen them.</div>
        <div id="feedback-list"></div>
      </section>
      <div class="sticky-action" id="send-area">
        <button class="primary" id="send-packet" type="button">Send feedback</button>
        <button class="danger end-action" id="end-review" type="button" title="End review" aria-label="End review">■</button>
      </div>
    </aside>

    <button class="rail" id="expand-inspector" type="button" title="Expand inspector" aria-label="Expand inspector">‹</button>
  </main>
  <div class="toast" id="toast" role="status" aria-live="polite"></div>

  <script nonce="${nonce}">
  (() => {
    "use strict";
    const reviewToken = ${tokenLiteral};
    const base = "/api/session/" + encodeURIComponent(reviewToken);
    const app = document.getElementById("app");
    const frame = document.getElementById("artifact");
    const draftsPane = document.getElementById("drafts-pane");
    const verifyPane = document.getElementById("verify-pane");
    const sendArea = document.getElementById("send-area");
    const draftsTab = document.getElementById("drafts-tab");
    const verifyTab = document.getElementById("verify-tab");
    const noteField = document.getElementById("packet-note");
    const toastElement = document.getElementById("toast");
    let state;
    let activePane = "drafts";
    let dirty = false;
    let saving;
    let saveTimer;
    let disconnected = false;
    let toastTimer;
    let lastAnnotation = "";
    let lastAnnotationAt = 0;
    let reopenEditingId = null;

    function toast(message, isError = false) {
      clearTimeout(toastTimer);
      toastElement.textContent = message;
      toastElement.className = "toast show" + (isError ? " error" : "");
      toastTimer = setTimeout(() => { toastElement.className = "toast"; }, 3200);
    }

    async function api(path, options = {}) {
      const response = await fetch(base + path, {
        ...options,
        headers: { "content-type": "application/json", ...(options.headers || {}) },
      });
      const payload = response.status === 204 ? null : await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error || "Blueprint request failed.");
      return payload;
    }

    function revisionUrl(revision) {
      return "/artifact/" + encodeURIComponent(state.artifactToken)
        + "/revision/" + encodeURIComponent(revision.id);
    }

    function postAnnotationModifier(active) {
      frame.contentWindow?.postMessage({ type: "blueprint:modifier", version: 1, active }, "*");
    }

    function setPane(next) {
      activePane = next;
      const draftsActive = next === "drafts";
      draftsPane.hidden = !draftsActive;
      verifyPane.hidden = draftsActive;
      sendArea.hidden = !draftsActive || state?.status === "ended";
      draftsTab.classList.toggle("active", draftsActive);
      verifyTab.classList.toggle("active", !draftsActive);
    }

    function renderDrafts() {
      const list = document.getElementById("draft-list");
      const activeEditor = document.activeElement?.dataset?.draftId ? document.activeElement : null;
      const activeDraftId = activeEditor?.dataset.draftId;
      const selectionStart = activeEditor?.selectionStart;
      const selectionEnd = activeEditor?.selectionEnd;
      list.replaceChildren();
      if (!state.drafts.length) {
        const empty = document.createElement("div");
        empty.className = "empty";
        empty.textContent = "Hold Alt/Option to preview an element, then click it to begin.";
        list.append(empty);
      }
      state.drafts.forEach((draft, index) => {
        const card = document.createElement("article");
        card.className = "draft";
        const top = document.createElement("div");
        top.className = "draft-top";
        const included = document.createElement("input");
        included.type = "checkbox";
        included.checked = draft.included;
        included.title = "Include in packet";
        included.addEventListener("change", () => { draft.included = included.checked; changed(); });
        const anchor = document.createElement("span");
        anchor.className = "anchor";
        anchor.textContent = draft.kind === "reopen" ? "Reopen · " + draft.anchor.quote : draft.anchor.quote || draft.anchor.selector || "Element";
        const remove = iconButton("×", "Delete draft", () => { state.drafts.splice(index, 1); changed(true); });
        top.append(included, anchor, remove);
        const textarea = document.createElement("textarea");
        textarea.value = draft.body;
        textarea.placeholder = draft.kind === "reopen" ? "What still needs to change?" : "Write a private draft comment";
        textarea.dataset.draftId = draft.id;
        textarea.addEventListener("input", () => { draft.body = textarea.value; changed(); });
        card.append(top, textarea);
        list.append(card);
      });
      document.getElementById("draft-count").textContent = state.drafts.length;
      const canSend = state.status === "active" && !!state.visibleRevision
        && (state.drafts.some((draft) => draft.included && draft.body.trim()) || noteField.value.trim());
      document.getElementById("send-packet").disabled = !canSend;
      if (activeDraftId) {
        requestAnimationFrame(() => {
          const editor = document.querySelector('[data-draft-id="' + CSS.escape(activeDraftId) + '"]');
          if (!editor) return;
          editor.focus({ preventScroll: true });
          if (Number.isInteger(selectionStart) && Number.isInteger(selectionEnd)) {
            editor.setSelectionRange(selectionStart, selectionEnd);
          }
        });
      }
    }

    function iconButton(label, title, action) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "icon-button";
      button.textContent = label;
      button.title = title;
      button.addEventListener("click", action);
      return button;
    }

    function renderFeedback() {
      const list = document.getElementById("feedback-list");
      list.replaceChildren();
      if (!state.feedback.length) {
        const empty = document.createElement("div");
        empty.className = "empty";
        empty.textContent = "Sent feedback and agent evidence will appear here.";
        list.append(empty);
      }
      state.feedback.forEach((feedback) => {
        const card = document.createElement("article");
        card.className = "feedback" + (feedback.state === "accepted" ? " accepted" : "");
        const head = document.createElement("div");
        head.className = "feedback-head";
        const badge = document.createElement("span");
        const status = feedback.state === "accepted" ? "accepted" : (feedback.latestReport?.status || feedback.state);
        badge.className = "badge " + status;
        badge.textContent = status.replace("-", " ");
        const quote = document.createElement("span");
        quote.className = "feedback-quote anchor";
        quote.textContent = feedback.anchor.quote || feedback.anchor.selector || feedback.id;
        head.append(badge, quote);
        card.append(head);
        const history = feedback.history.at(-1);
        const request = document.createElement("div");
        request.className = "feedback-quote";
        request.textContent = history?.body || "";
        card.append(request);
        if (feedback.latestReport) {
          const summary = document.createElement("div");
          summary.className = "feedback-summary";
          summary.textContent = feedback.latestReport.summary;
          card.append(summary);
          if (feedback.latestReport.evidence) {
            const details = document.createElement("details");
            const label = document.createElement("summary");
            label.textContent = "Show evidence";
            const evidence = document.createElement("p");
            evidence.textContent = feedback.latestReport.evidence;
            details.append(label, evidence);
            card.append(details);
          }
        }
        if (state.status === "active" && feedback.state !== "reopen-draft") {
          if (reopenEditingId === feedback.id) {
            const note = document.createElement("textarea");
            note.className = "reopen-note";
            note.placeholder = "What still needs to change?";
            note.setAttribute("aria-label", "Reopen note");
            const editActions = document.createElement("div");
            editActions.className = "feedback-actions";
            const cancel = document.createElement("button");
            cancel.type = "button";
            cancel.className = "secondary";
            cancel.textContent = "Cancel";
            cancel.addEventListener("click", () => { reopenEditingId = null; renderFeedback(); });
            const save = document.createElement("button");
            save.type = "button";
            save.className = "secondary";
            save.textContent = "Save private note";
            save.addEventListener("click", () => reopenFeedback(feedback.id, note.value));
            editActions.append(cancel, save);
            card.append(note, editActions);
            requestAnimationFrame(() => note.focus());
            list.append(card);
            return;
          }
          const actions = document.createElement("div");
          actions.className = "feedback-actions";
          const accept = document.createElement("button");
          accept.type = "button";
          accept.className = "secondary";
          accept.textContent = "Accept";
          accept.disabled = feedback.state === "accepted";
          accept.addEventListener("click", () => acceptFeedback(feedback.id));
          const reopen = document.createElement("button");
          reopen.type = "button";
          reopen.className = "secondary";
          reopen.textContent = "Reopen";
          reopen.addEventListener("click", () => { reopenEditingId = feedback.id; renderFeedback(); });
          actions.append(accept, reopen);
          card.append(actions);
        }
        list.append(card);
      });
      document.getElementById("verify-count").textContent = state.feedback.filter((item) => item.latestReport || item.state === "accepted").length;
    }

    function render() {
      document.getElementById("artifact-name").textContent = state.artifactName;
      if (state.visibleRevision && !frame.dataset.revision) {
        frame.src = revisionUrl(state.visibleRevision);
        frame.dataset.revision = state.visibleRevision.id;
      }
      noteField.value = state.packetNote;
      renderDrafts();
      renderFeedback();
      setPane(activePane);
      const queued = state.packets.find((packet) => packet.status === "queued");
      const trouble = disconnected || (queued && Date.now() - Date.parse(queued.createdAt) > 15000);
      document.getElementById("recovery-banner").hidden = !trouble;
      document.getElementById("reveal-revision").hidden = !(state.stagedRevision && state.visibleRevision);
      if (state.stagedRevision && state.visibleRevision) {
        toast("A revision is ready. Reveal it when you want to inspect the changes.");
      }
    }

    function changed(rerender = false) {
      dirty = true;
      clearTimeout(saveTimer);
      saveTimer = setTimeout(saveDrafts, 350);
      if (rerender) renderDrafts();
      else document.getElementById("send-packet").disabled = false;
    }

    async function saveDrafts() {
      clearTimeout(saveTimer);
      saveTimer = null;
      const payload = { drafts: state.drafts, packetNote: noteField.value };
      saving = api("/drafts", { method: "PUT", body: JSON.stringify(payload) });
      try {
        await saving;
        dirty = false;
        disconnected = false;
      } catch (error) {
        disconnected = true;
        toast(error.message + " Your drafts remain in this page.", true);
      } finally {
        saving = null;
        render();
      }
    }

    async function flushDrafts() {
      if (saveTimer) await saveDrafts();
      else if (saving) await saving;
      if (dirty || disconnected) throw new Error("Drafts have not been durably saved yet.");
    }

    async function loadState({ quiet = false } = {}) {
      if (dirty || saving) return;
      try {
        state = await api("/state");
        disconnected = false;
        render();
      } catch (error) {
        disconnected = true;
        if (!quiet) toast(error.message, true);
        if (state) render();
      }
    }

    async function reveal() {
      try {
        state = await api("/reveal", { method: "POST", body: "{}" });
        const revision = state.visibleRevision;
        frame.src = revisionUrl(revision) + "?revealed=" + Date.now();
        frame.dataset.revision = revision.id;
        frame.focus();
        toast("Revision revealed from the top.");
        render();
      } catch (error) { toast(error.message, true); }
    }

    async function sendPacket() {
      try {
        await flushDrafts();
        const packet = await api("/send", { method: "POST", body: "{}" });
        toast("Packet " + packet.id + " is saved and queued for the agent.");
        await loadState();
      } catch (error) { toast(error.message, true); }
    }

    async function acceptFeedback(id) {
      try {
        state = await api("/feedback/" + encodeURIComponent(id) + "/accept", { method: "POST", body: "{}" });
        render();
      } catch (error) { toast(error.message, true); }
    }

    async function reopenFeedback(id, note) {
      if (!note.trim()) { toast("A reopen note is required.", true); return; }
      try {
        state = await api("/feedback/" + encodeURIComponent(id) + "/reopen", {
          method: "POST", body: JSON.stringify({ note }),
        });
        reopenEditingId = null;
        activePane = "drafts";
        render();
        toast("Reopen note saved as a private draft.");
      } catch (error) { toast(error.message, true); }
    }

    async function copyLatestPacket() {
      if (!state?.latestPacket) { toast("No sent packet to copy yet."); return; }
      const text = JSON.stringify(state.latestPacket, null, 2);
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const field = document.createElement("textarea");
        field.value = text;
        document.body.append(field);
        field.select();
        document.execCommand("copy");
        field.remove();
      }
      toast("Latest packet copied.");
    }

    noteField.addEventListener("input", () => { state.packetNote = noteField.value; changed(); });
    draftsTab.addEventListener("click", () => setPane("drafts"));
    verifyTab.addEventListener("click", () => setPane("verify"));
    document.getElementById("collapse-inspector").addEventListener("click", () => app.classList.add("inspector-closed"));
    document.getElementById("expand-inspector").addEventListener("click", () => app.classList.remove("inspector-closed"));
    document.getElementById("reveal-revision").addEventListener("click", reveal);
    document.getElementById("send-packet").addEventListener("click", sendPacket);
    document.getElementById("copy-recovery").addEventListener("click", copyLatestPacket);
    window.addEventListener("keydown", (event) => {
      if (event.key === "Alt") postAnnotationModifier(true);
    }, true);
    window.addEventListener("keyup", (event) => {
      if (event.key === "Alt") postAnnotationModifier(false);
    }, true);
    window.addEventListener("blur", () => postAnnotationModifier(false));
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) postAnnotationModifier(false);
    });
    document.getElementById("end-review").addEventListener("click", async () => {
      if (!confirm("End this Blueprint review? Saved history will remain available.")) return;
      try { state = await api("/end", { method: "POST", body: "{}" }); render(); toast("Review ended."); }
      catch (error) { toast(error.message, true); }
    });

    window.addEventListener("message", (event) => {
      if (event.source !== frame.contentWindow || event.data?.type !== "blueprint:annotation" || event.data?.version !== 1) return;
      const detail = event.data.detail;
      if (!detail || detail.type !== "element" || typeof detail.selector !== "string") return;
      const signature = JSON.stringify(detail);
      if (signature === lastAnnotation && Date.now() - lastAnnotationAt < 800) return;
      lastAnnotation = signature;
      lastAnnotationAt = Date.now();
      const draft = {
        id: "feedback-" + crypto.randomUUID(), kind: "initial", body: "", included: true,
        createdAt: new Date().toISOString(),
        anchor: {
          type: "element",
          quote: typeof detail.quote === "string" ? detail.quote.slice(0, 1000) : "",
          prefix: typeof detail.prefix === "string" ? detail.prefix.slice(0, 500) : "",
          suffix: typeof detail.suffix === "string" ? detail.suffix.slice(0, 500) : "",
          selector: detail.selector.slice(0, 1000),
        },
      };
      state.drafts.push(draft);
      activePane = "drafts";
      app.classList.remove("inspector-closed");
      changed(true);
      requestAnimationFrame(() => {
        document.querySelector('[data-draft-id="' + CSS.escape(draft.id) + '"]')?.focus({ preventScroll: false });
      });
    });

    loadState();
    setInterval(() => loadState({ quiet: true }), 2000);
  })();
  </script>
</body>
</html>`;
}
