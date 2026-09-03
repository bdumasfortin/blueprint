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
      --canvas: #05070a;
      --application: #080c11;
      --panel: #0b1118;
      --panel-2: #0e151d;
      --line: #202d38;
      --line-strong: #33434f;
      --ink: #edf4f3;
      --muted: #80909c;
      --faint: #52616c;
      --accent: #43e5dd;
      --ok: #74e996;
      --warn: #ffbd5c;
      --danger: #ff6971;
      --brass: #d8a34d;
      --brass-soft: rgba(216, 163, 77, .11);
      --rail: 44px;
      --inspector: 390px;
      font: 13px/1.45 Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    * { box-sizing: border-box; }
    html, body {
      height: 100%;
      margin: 0;
      background-color: var(--canvas);
      background-image:
        linear-gradient(rgba(185, 199, 207, .05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(185, 199, 207, .05) 1px, transparent 1px);
      background-size: 24px 24px;
      color: var(--ink);
    }
    button, textarea, input { font: inherit; }
    button { color: inherit; letter-spacing: .02em; }
    button:focus-visible, textarea:focus-visible { outline: 1px solid var(--accent); outline-offset: 2px; }
    .app { height: 100%; display: grid; grid-template-columns: minmax(0, 1fr) var(--inspector) 0; overflow: hidden; transition: grid-template-columns .18s; }
    .app.inspector-closed { grid-template-columns: minmax(0, 1fr) 0 var(--rail); }
    .artifact-stage { min-width: 0; position: relative; grid-column: 1; background: var(--canvas); overflow: hidden; }
    iframe { width: 100%; height: 100%; display: block; border: 0; background: #fff; }
    .inspector {
      min-width: 0;
      position: relative;
      grid-column: 2;
      overflow: hidden;
      border-left: 1px solid var(--line-strong);
      background:
        linear-gradient(rgba(11, 17, 24, .965), rgba(11, 17, 24, .965)),
        linear-gradient(rgba(185, 199, 207, .05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(185, 199, 207, .05) 1px, transparent 1px);
      background-size: auto, 24px 24px, 24px 24px;
      display: flex;
      flex-direction: column;
      box-shadow: -12px 0 32px rgba(0, 0, 0, .22);
    }
    .inspector-header { padding: 14px 14px 0; border-bottom: 1px solid var(--line); background: rgba(8, 12, 17, .72); }
    .inspector-top { display: flex; align-items: flex-start; gap: 10px; }
    .inspector-identity { min-width: 0; flex: 1; align-self: center; }
    .artifact-name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font: 700 12px/1.2 ui-monospace, SFMono-Regular, Consolas, monospace; letter-spacing: .045em; text-transform: uppercase; }
    .inspector-actions { display: flex; align-items: center; gap: 4px; }
    .inspector-action { width: 28px; height: 28px; padding: 0; border: 1px solid transparent; border-radius: 2px; background: transparent; color: var(--muted); cursor: pointer; }
    .inspector-action:hover { border-color: var(--line-strong); background: var(--panel-2); color: var(--accent); }
    .collapse-action { width: 32px; height: 32px; font-size: 26px; line-height: 1; }
    .tabs { display: grid; grid-template-columns: 1fr 1fr; gap: 0; margin-top: 12px; }
    .tab { position: relative; border: 0; border-top: 1px solid transparent; padding: 9px 8px 10px; background: transparent; color: var(--muted); cursor: pointer; font: 700 10px/1 ui-monospace, SFMono-Regular, Consolas, monospace; letter-spacing: .095em; text-transform: uppercase; }
    .tab::after { content: ""; position: absolute; left: 8px; right: 8px; bottom: -1px; height: 1px; background: transparent; }
    .tab:hover { color: var(--ink); }
    .tab.active { color: var(--accent); background: linear-gradient(180deg, transparent, rgba(67, 229, 221, .055)); }
    .tab.active::after { background: var(--accent); box-shadow: 0 0 10px rgba(67, 229, 221, .28); }
    .pane { flex: 1; min-height: 0; overflow-y: auto; padding: 14px 14px 100px; }
    @supports not selector(::-webkit-scrollbar) {
      .pane { scrollbar-color: var(--line-strong) var(--canvas); scrollbar-width: thin; }
    }
    .pane::-webkit-scrollbar { width: 10px; height: 10px; }
    .pane::-webkit-scrollbar-track { background: var(--canvas); box-shadow: inset 1px 0 0 var(--line); }
    .pane::-webkit-scrollbar-thumb { min-height: 40px; border: 2px solid transparent; border-radius: 2px; background-color: var(--line-strong); background-clip: padding-box; }
    .pane::-webkit-scrollbar-thumb:hover { background-color: rgba(67, 229, 221, .68); }
    .pane::-webkit-scrollbar-thumb:active { background-color: var(--accent); }
    .pane::-webkit-scrollbar-corner { background: var(--canvas); }
    .pane::-webkit-scrollbar-button { display: none; }
    #feedback-pane { display: flex; flex-direction: column; padding-bottom: 84px; }
    .meta-band { margin-bottom: 14px; padding: 11px 12px 11px 15px; border: 1px solid var(--brass); border-left: 4px solid var(--brass); border-radius: 2px; background-color: var(--brass-soft); background-image: repeating-linear-gradient(135deg, transparent 0, transparent 8px, rgba(216, 163, 77, .045) 8px, rgba(216, 163, 77, .045) 9px); color: #e1c590; font-size: 12px; }
    .draft-section { margin-bottom: 12px; }
    .draft-section[hidden] { display: none; }
    .draft { display: grid; grid-template-columns: 4px minmax(0, 1fr) 38px; align-items: start; margin-bottom: 8px; border: 1px solid var(--line); border-radius: 2px; background: rgba(14, 21, 29, .93); overflow: hidden; }
    .draft:focus-within { border-color: var(--line-strong); }
    .draft-rail { align-self: stretch; min-height: 44px; background: var(--accent); opacity: .72; }
    .draft:focus-within .draft-rail { opacity: 1; box-shadow: 0 0 12px rgba(67, 229, 221, .35); }
    .draft.decision .draft-rail { background: var(--ok); }
    .draft-content { min-width: 0; padding: 5px 7px 6px 8px; }
    .draft-top { display: flex; align-items: center; min-height: 13px; margin-bottom: 1px; color: var(--muted); font: 10px/1.3 ui-monospace, SFMono-Regular, Consolas, monospace; }
    .anchor { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .anchor-navigation { min-width: 0; padding: 0; border: 0; background: transparent; color: inherit; cursor: pointer; font: inherit; text-align: left; }
    .anchor-navigation:hover { color: var(--accent); text-decoration: underline; text-underline-offset: 2px; }
    .icon-button { width: 24px; height: 24px; padding: 0; border: 0; border-radius: 2px; background: transparent; color: var(--muted); cursor: pointer; }
    .icon-button:hover { background: #18232d; color: var(--danger); }
    textarea { width: 100%; resize: vertical; border: 1px solid var(--line); border-radius: 2px; background: rgba(5, 7, 10, .76); color: var(--ink); padding: 9px 10px; outline: none; caret-color: var(--accent); }
    textarea::placeholder { color: var(--faint); }
    textarea:focus { border-color: var(--accent); box-shadow: inset 3px 0 0 rgba(67, 229, 221, .22); }
    .draft textarea { display: block; height: 20px; min-height: 20px; resize: none; overflow: hidden; border: 0; border-radius: 0; padding: 1px 0 0; background: transparent; line-height: 18px; }
    .draft textarea:focus { box-shadow: none; }
    .draft textarea:focus-visible { outline: none; }
    .draft-delete { align-self: center; width: 32px; height: 32px; margin: 0 5px 0 0; border: 0; background: transparent; color: var(--danger); line-height: 1; }
    .draft-delete:hover { background: transparent; color: #ff8b91; }
    .draft-delete svg { display: block; width: 17px; height: 17px; margin: auto; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: square; stroke-linejoin: miter; }
    .additional-feedback { flex: 0 0 auto; height: 70px; min-height: 70px; margin-top: auto; resize: none; overflow: hidden; }
    .label { display: block; margin: 17px 0 5px; color: var(--muted); font: 700 10px/1.2 ui-monospace, SFMono-Regular, Consolas, monospace; letter-spacing: .075em; text-transform: uppercase; }
    .sticky-action { position: absolute; left: 0; right: 0; bottom: 0; display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 7px; padding: 11px 14px 13px; border-top: 1px solid var(--line-strong); background: rgba(8, 12, 17, .96); }
    .sticky-action.has-feedback { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto; }
    .primary, .secondary, .danger { border-radius: 2px; padding: 8px 11px; cursor: pointer; font: 700 11px/1.2 ui-monospace, SFMono-Regular, Consolas, monospace; letter-spacing: .035em; }
    .primary { min-width: 0; border: 1px solid var(--accent); background: var(--accent); color: #031010; }
    .primary:hover { background: #7af2ec; border-color: #7af2ec; }
    .primary:disabled, .secondary:disabled { opacity: .45; cursor: default; }
    .secondary { border: 1px solid var(--line-strong); background: var(--panel-2); color: var(--ink); }
    .secondary:hover { border-color: #4f6471; background: #14202a; }
    .danger { border: 1px solid #5b3038; background: rgba(255, 105, 113, .07); color: var(--danger); }
    .danger:hover { border-color: var(--danger); background: rgba(255, 105, 113, .12); }
    .end-action { width: 40px; padding: 9px 0; font-size: 17px; line-height: 1; }
    .rail { z-index: 5; grid-column: 3; width: 100%; height: 100%; padding: 0; border: 0; border-left: 1px solid var(--line-strong); background: rgba(8, 12, 17, .96); color: var(--muted); font-size: 22px; cursor: pointer; visibility: hidden; opacity: 0; }
    .inspector-closed .rail { visibility: visible; opacity: 1; }
    .rail:hover, .rail:focus-visible { background: var(--panel-2); color: var(--accent); outline: none; box-shadow: inset 2px 0 0 var(--accent); }
    .empty { padding: 24px 8px; color: var(--muted); text-align: center; }
    .feedback { margin-bottom: 10px; padding: 11px; border: 1px solid var(--line); border-radius: 2px; background: rgba(14, 21, 29, .93); }
    .feedback.navigable { cursor: pointer; }
    .feedback.navigable:hover { border-color: var(--line-strong); background: rgba(18, 28, 38, .96); }
    .feedback-head { display: flex; gap: 8px; align-items: center; margin-bottom: 7px; }
    .badge { border: 1px solid var(--line-strong); border-radius: 2px; padding: 2px 6px; background: #111b24; color: var(--muted); font: 700 9px/1.25 ui-monospace, SFMono-Regular, Consolas, monospace; letter-spacing: .06em; text-transform: uppercase; }
    .badge.addressed { border-color: #356545; background: rgba(116, 233, 150, .08); color: var(--ok); }
    .badge.stale { border-color: #6c522d; background: rgba(255, 189, 92, .08); color: var(--warn); }
    .feedback-quote { color: var(--muted); font-size: 12px; }
    .feedback-summary { margin: 8px 0; }
    .change-pair { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; margin: 9px 0; }
    .change-value { min-width: 0; padding: 8px; border: 1px solid var(--line); background: rgba(5, 7, 10, .45); color: #bdc9cd; font-size: 12px; overflow-wrap: anywhere; }
    .change-value strong { display: block; margin-bottom: 4px; color: var(--muted); font: 700 9px/1.2 ui-monospace, SFMono-Regular, Consolas, monospace; letter-spacing: .06em; text-transform: uppercase; }
    details { color: var(--muted); font-size: 12px; }
    details p { color: #bdc9cd; }
    .feedback-actions { display: flex; gap: 7px; margin-top: 11px; }
    .feedback-actions button { flex: 1; }
    .reopen-note { min-height: 74px; margin-top: 11px; }
    .review-items { margin-top: 15px; padding-top: 13px; border-top: 1px solid var(--line); }
    .pane-section-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; color: var(--muted); font: 700 10px/1.2 ui-monospace, SFMono-Regular, Consolas, monospace; letter-spacing: .075em; text-transform: uppercase; }
    .history-intro { margin-bottom: 13px; color: var(--muted); font-size: 12px; }
    .history-cycle { margin-bottom: 11px; border: 1px solid var(--line); border-radius: 2px; background: rgba(14, 21, 29, .93); }
    .history-cycle-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 11px; border-bottom: 1px solid var(--line); }
    .history-cycle-title { color: var(--ink); font: 700 11px/1.25 ui-monospace, SFMono-Regular, Consolas, monospace; letter-spacing: .035em; }
    .history-cycle-time { color: var(--faint); font: 700 9px/1.2 ui-monospace, SFMono-Regular, Consolas, monospace; }
    .history-event { display: grid; grid-template-columns: 66px minmax(0, 1fr); gap: 9px; padding: 10px 11px; border-top: 1px solid var(--line); }
    .history-cycle-head + .history-event { border-top: 0; }
    .history-event-type { color: var(--faint); font: 700 9px/1.35 ui-monospace, SFMono-Regular, Consolas, monospace; letter-spacing: .04em; text-transform: uppercase; }
    .history-event-body { min-width: 0; color: #bdc9cd; font-size: 12px; overflow-wrap: anywhere; }
    .history-event-body .change-pair { margin-bottom: 0; }
    .history-event-state { margin-top: 7px; color: var(--muted); font: 700 9px/1.3 ui-monospace, SFMono-Regular, Consolas, monospace; text-transform: uppercase; }
    .banner { margin-bottom: 12px; padding: 10px 11px; border: 1px solid #6c522d; border-radius: 2px; background: rgba(255, 189, 92, .08); color: var(--warn); font-size: 12px; }
    .banner button { margin-top: 8px; }
    .revision-progress { display: grid; grid-template-columns: 10px minmax(0, 1fr); gap: 10px; margin-bottom: 12px; padding: 11px 12px; border: 1px solid var(--line-strong); border-radius: 2px; background: rgba(14, 21, 29, .94); }
    .revision-progress-dot { width: 8px; height: 8px; margin-top: 5px; border-radius: 50%; background: var(--warn); box-shadow: 0 0 0 3px rgba(255, 189, 92, .1); }
    .revision-progress.working { border-color: rgba(67, 229, 221, .45); }
    .revision-progress.working .revision-progress-dot { background: var(--accent); box-shadow: 0 0 0 3px rgba(67, 229, 221, .1); animation: working-pulse 1.8s ease-in-out infinite; }
    .revision-progress-title { color: var(--ink); font: 700 11px/1.35 ui-monospace, SFMono-Regular, Consolas, monospace; letter-spacing: .035em; }
    .revision-progress-detail { margin-top: 3px; color: var(--muted); font-size: 12px; }
    .feedback-sent-at { margin-top: 8px; color: var(--faint); font: 700 9px/1.3 ui-monospace, SFMono-Regular, Consolas, monospace; letter-spacing: .035em; text-transform: uppercase; }
    .badge.sent { border-color: rgba(67, 229, 221, .42); background: rgba(67, 229, 221, .07); color: var(--accent); }
    .toast-overlay { position: fixed; z-index: 60; inset: 0; display: grid; padding: 16px; opacity: 0; pointer-events: none; transition: opacity .4s ease; }
    .toast-overlay.show { opacity: 1; }
    .toast-overlay.prominent { place-items: center; padding: 24px; background: rgba(3, 5, 8, .68); backdrop-filter: blur(3px); }
    .toast { justify-self: start; align-self: end; max-width: min(440px, calc(100vw - 32px)); padding: 9px 12px; border: 1px solid var(--line-strong); border-left: 3px solid var(--accent); border-radius: 2px; background: #0b1219; box-shadow: 0 16px 45px rgba(0,0,0,.42); color: var(--ink); opacity: 0; transform: translateY(8px); transition: opacity .4s ease, transform .4s ease; }
    .toast-overlay.prominent .toast { justify-self: center; align-self: center; width: min(480px, 100%); max-width: none; padding: 21px 24px; border: 1px solid var(--accent); border-top: 4px solid var(--accent); font-size: 14px; line-height: 1.5; text-align: center; transform: translateY(10px) scale(.985); }
    .toast-overlay.show .toast { opacity: 1; transform: translateY(0) scale(1); }
    .toast.error { border-color: #773d43; border-left-color: var(--danger); color: #ffb4b9; }
    .toast-overlay.prominent .toast.error { border-top-color: var(--danger); }
    .count { margin-left: 4px; color: var(--faint); }
    .revision-curtain { position: fixed; z-index: 40; inset: 0; display: grid; place-items: center; padding: 24px; background: rgba(3, 5, 8, .92); backdrop-filter: blur(8px); }
    .revision-dialog { width: min(520px, 100%); padding: 28px; border: 1px solid var(--accent); border-top: 4px solid var(--accent); border-radius: 2px; background: var(--panel); box-shadow: 0 28px 100px rgba(0, 0, 0, .7); text-align: center; }
    .revision-kicker { margin-bottom: 8px; color: var(--accent); font: 700 10px/1.2 ui-monospace, SFMono-Regular, Consolas, monospace; letter-spacing: .12em; text-transform: uppercase; }
    .revision-dialog h1 { margin: 0 0 8px; font-size: clamp(24px, 5vw, 38px); line-height: 1.08; }
    .revision-dialog p { margin: 0 auto 20px; max-width: 42ch; color: var(--muted); }
    .revision-dialog .primary { width: 100%; min-height: 42px; }
    .ended-curtain { position: fixed; z-index: 80; inset: 0; display: grid; place-items: center; padding: 24px; background-color: var(--canvas); background-image: linear-gradient(rgba(185, 199, 207, .05) 1px, transparent 1px), linear-gradient(90deg, rgba(185, 199, 207, .05) 1px, transparent 1px); background-size: 24px 24px; }
    .ended-dialog { width: min(480px, 100%); padding: 30px; border: 1px solid var(--line-strong); border-top: 4px solid var(--ok); border-radius: 2px; background: var(--panel); box-shadow: 0 28px 100px rgba(0, 0, 0, .72); text-align: center; }
    .ended-kicker { margin-bottom: 8px; color: var(--ok); font: 700 10px/1.2 ui-monospace, SFMono-Regular, Consolas, monospace; letter-spacing: .12em; text-transform: uppercase; }
    .ended-dialog h1 { margin: 0 0 9px; font-size: clamp(24px, 5vw, 38px); line-height: 1.08; }
    .ended-dialog h1:focus { outline: none; }
    .ended-dialog p { margin: 0 auto; max-width: 42ch; color: var(--muted); }
    .ended-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 22px; }
    .ended-actions button { min-height: 42px; }
    .ended-close-help { margin-top: 12px !important; color: var(--warn) !important; font-size: 12px; }
    .readonly-status { display: inline-flex; align-items: center; margin-top: 6px; padding: 2px 6px; border: 1px solid rgba(116, 233, 150, .42); border-radius: 999px; color: var(--ok); font: 700 9px/1.3 ui-monospace, SFMono-Regular, Consolas, monospace; letter-spacing: .075em; text-transform: uppercase; }
    .readonly-back { min-height: 32px; }
    .app.read-only .tabs { grid-template-columns: 1fr; }
    .app.read-only #feedback-tab, .app.read-only .collapse-action, .app.read-only .rail { display: none; }
    .app.read-only #history-pane { padding-bottom: 14px; }
    @keyframes working-pulse { 0%, 100% { opacity: .55; } 50% { opacity: 1; } }
    @media (prefers-reduced-motion: reduce) {
      .revision-progress.working .revision-progress-dot { animation: none; }
      .toast-overlay, .toast { transition-duration: .01ms; }
    }
    [hidden] { display: none !important; }
    @media (max-width: 800px) {
      :root { --inspector: 0px; }
      .app { grid-template-columns: minmax(0,1fr) 0 0; }
      .app.inspector-closed { grid-template-columns: minmax(0,1fr) 0 var(--rail); }
      .inspector { position: fixed; z-index: 4; left: 0; right: 0; bottom: 0; height: min(62vh, 560px); border: 1px solid var(--line-strong); border-width: 1px 0 0; border-radius: 4px 4px 0 0; box-shadow: 0 -24px 70px rgba(0,0,0,.52); transform: translateY(0); transition: transform .18s; }
      .inspector-closed .inspector { transform: translateY(105%); }
      .sticky-action { right: 0; }
    }
    @media (max-width: 460px) {
      .ended-actions { grid-template-columns: 1fr; }
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
            <div class="readonly-status" id="readonly-status" hidden>Read only</div>
          </div>
          <div class="inspector-actions">
            <button class="secondary readonly-back" id="readonly-back" type="button" hidden>Back to completion</button>
            <button class="inspector-action collapse-action" id="collapse-inspector" type="button" title="Collapse inspector" aria-label="Collapse inspector">›</button>
          </div>
        </div>
        <div class="tabs" role="tablist">
          <button class="tab active" id="feedback-tab" type="button">Feedback <span class="count" id="feedback-count">0</span></button>
          <button class="tab" id="history-tab" type="button">History <span class="count" id="history-count">0</span></button>
        </div>
      </header>
      <section class="pane" id="feedback-pane">
        <div class="meta-band">Hold Alt/Option and click any element to leave feedback.</div>
        <div class="banner" id="recovery-banner" hidden>Feedback delivery has not been acknowledged. Your comments remain saved locally.<br><button class="secondary" id="copy-recovery" type="button">Copy feedback</button></div>
        <section class="revision-progress" id="revision-progress" aria-live="polite" hidden>
          <span class="revision-progress-dot" aria-hidden="true"></span>
          <div><div class="revision-progress-title" id="revision-progress-title"></div><div class="revision-progress-detail" id="revision-progress-detail"></div></div>
        </section>
        <section class="draft-section" id="decision-drafts" aria-labelledby="decision-drafts-title" hidden>
          <div class="pane-section-head"><span id="decision-drafts-title">Decision responses</span><span id="decision-draft-count">0</span></div>
          <div id="decision-draft-list"></div>
        </section>
        <section class="draft-section" id="feedback-drafts" aria-labelledby="feedback-drafts-title" hidden>
          <div class="pane-section-head"><span id="feedback-drafts-title">Private feedback</span><span id="feedback-draft-count">0</span></div>
          <div id="draft-list"></div>
        </section>
        <section class="review-items" id="review-items" aria-labelledby="review-items-title" hidden>
          <div class="pane-section-head"><span id="review-items-title">Submitted feedback</span><span id="review-item-count">0</span></div>
          <div id="feedback-list"></div>
        </section>
        <textarea class="additional-feedback" id="additional-feedback" aria-label="Additional feedback" aria-keyshortcuts="Enter" placeholder="Additional feedback"></textarea>
      </section>
      <section class="pane" id="history-pane" hidden>
        <div class="history-intro">Read-only history of revealed revisions, decision responses, submitted comments, and reported amendments.</div>
        <div id="history-list"></div>
      </section>
      <div class="sticky-action" id="send-area">
        <button class="primary" id="approve-review" type="button">Approve</button>
        <button class="secondary" id="revise-review" type="button" hidden>Revise using feedback</button>
        <button class="danger end-action" id="end-review" type="button" title="End review" aria-label="End review">■</button>
      </div>
    </aside>

    <button class="rail" id="expand-inspector" type="button" title="Expand inspector" aria-label="Expand inspector">‹</button>
  </main>
  <section class="revision-curtain" id="revision-curtain" role="dialog" aria-modal="true" aria-labelledby="revision-title" hidden>
    <div class="revision-dialog">
      <div class="revision-kicker">Blueprint update</div>
      <h1 id="revision-title">Revision is ready</h1>
      <p id="revision-message">The current artifact will remain visible until you choose to reveal the new revision.</p>
      <button class="primary" id="see-latest-revision" type="button">See latest revision</button>
    </div>
  </section>
  <section class="ended-curtain" id="ended-curtain" role="dialog" aria-modal="true" aria-labelledby="ended-title" hidden>
    <div class="ended-dialog">
      <div class="ended-kicker">Blueprint review</div>
      <h1 id="ended-title" tabindex="-1">Review closed</h1>
      <p id="ended-message">This review session has ended. Return to your agent to continue.</p>
      <div class="ended-actions" id="ended-actions" hidden>
        <button class="primary" id="close-review-tab" type="button">Close tab</button>
        <button class="secondary" id="view-approved-review" type="button">View approved review</button>
      </div>
      <p class="ended-close-help" id="ended-close-help" role="status" aria-live="polite" hidden>Your browser kept this tab open. You can close it manually.</p>
    </div>
  </section>
  <div class="toast-overlay" id="toast-overlay" hidden><div class="toast" id="toast" role="status" aria-live="polite"></div></div>

  <script nonce="${nonce}">
  (() => {
    "use strict";
    const reviewToken = ${tokenLiteral};
    const base = "/api/session/" + encodeURIComponent(reviewToken);
    const app = document.getElementById("app");
    const frame = document.getElementById("artifact");
    const feedbackPane = document.getElementById("feedback-pane");
    const historyPane = document.getElementById("history-pane");
    const sendArea = document.getElementById("send-area");
    const feedbackTab = document.getElementById("feedback-tab");
    const historyTab = document.getElementById("history-tab");
    const additionalFeedbackField = document.getElementById("additional-feedback");
    const approveButton = document.getElementById("approve-review");
    const reviseButton = document.getElementById("revise-review");
    const revisionCurtain = document.getElementById("revision-curtain");
    const revealButton = document.getElementById("see-latest-revision");
    const endedCurtain = document.getElementById("ended-curtain");
    const endedTitle = document.getElementById("ended-title");
    const endedMessage = document.getElementById("ended-message");
    const endedActions = document.getElementById("ended-actions");
    const endedCloseHelp = document.getElementById("ended-close-help");
    const closeReviewTabButton = document.getElementById("close-review-tab");
    const viewApprovedReviewButton = document.getElementById("view-approved-review");
    const readonlyStatus = document.getElementById("readonly-status");
    const readonlyBackButton = document.getElementById("readonly-back");
    const toastOverlay = document.getElementById("toast-overlay");
    const toastElement = document.getElementById("toast");
    let state;
    let reviewHistory;
    let historyUpdatedAt = null;
    let historyLoading = false;
    let activePane = "feedback";
    let dirty = false;
    let saving;
    let saveTimer;
    let sending = false;
    let disconnected = false;
    let toastTimer;
    let toastHideTimer;
    let pollTimer;
    let reviewRetired = false;
    let readOnlyViewer = false;
    let focusedCurtainRevisionId = null;
    let lastAnnotation = "";
    let lastAnnotationAt = 0;
    let reopenEditingId = null;

    function toast(message, isError = false, prominent = false) {
      clearTimeout(toastTimer);
      clearTimeout(toastHideTimer);
      toastElement.textContent = message;
      toastElement.className = "toast" + (isError ? " error" : "");
      toastOverlay.className = "toast-overlay" + (prominent ? " prominent" : "");
      toastOverlay.hidden = false;
      requestAnimationFrame(() => toastOverlay.classList.add("show"));
      toastTimer = setTimeout(() => {
        toastOverlay.classList.remove("show");
        toastHideTimer = setTimeout(() => { toastOverlay.hidden = true; }, 420);
      }, 2800);
    }

    function isApprovedReview() {
      return state?.status === "ended" && state.latestPacket?.intent === "approve";
    }

    function retireReview(title = "Review closed", message = "This review session has ended. Return to your agent to continue.", approved = false) {
      endedTitle.textContent = title;
      endedMessage.textContent = message;
      endedActions.hidden = !approved;
      endedCloseHelp.hidden = true;
      endedCurtain.hidden = false;
      if (!reviewRetired) {
        postAnnotationModifier(false);
        reviewRetired = true;
        clearInterval(pollTimer);
        clearTimeout(saveTimer);
        clearTimeout(toastTimer);
        clearTimeout(toastHideTimer);
        toastOverlay.hidden = true;
        revisionCurtain.hidden = true;
      }
      readOnlyViewer = false;
      app.classList.remove("read-only", "inspector-closed");
      app.inert = true;
      app.hidden = true;
      frame.src = "about:blank";
      delete frame.dataset.revision;
      requestAnimationFrame(() => endedTitle.focus());
    }

    function showApprovedCompletion() {
      retireReview(
        "Review approved",
        "Your final review submission is queued for the agent. This review is now read-only.",
        true,
      );
    }

    function openApprovedReview() {
      if (!isApprovedReview() || !state.visibleRevision) return;
      readOnlyViewer = true;
      endedCurtain.hidden = true;
      app.hidden = false;
      app.inert = false;
      app.classList.remove("inspector-closed");
      app.classList.add("read-only");
      readonlyStatus.hidden = false;
      readonlyBackButton.hidden = false;
      activePane = "history";
      frame.src = revisionUrl(state.visibleRevision, true);
      frame.dataset.revision = state.visibleRevision.id;
      renderHistory();
      setPane("history");
      requestAnimationFrame(() => readonlyBackButton.focus());
    }

    function closeReviewTab() {
      window.close();
      setTimeout(() => {
        if (window.closed) return;
        endedCloseHelp.hidden = false;
      }, 150);
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

    function revisionUrl(revision, readOnly = false) {
      const url = "/artifact/" + encodeURIComponent(state.artifactToken)
        + "/revision/" + encodeURIComponent(revision.id);
      return readOnly ? url + "?mode=readonly" : url;
    }

    function postAnnotationModifier(active) {
      if (reviewRetired && active) return;
      frame.contentWindow?.postMessage({ type: "blueprint:modifier", version: 1, active }, "*");
    }

    function changeMapItems() {
      if (!state?.visibleRevision) return [];
      return state.feedback.flatMap((feedback, index) => {
        const report = feedback.latestReport;
        if (feedback.state === "accepted"
          || !report
          || report.revisionId !== state.visibleRevision.id
          || !report.selector) return [];
        return [{ number: index + 1, feedbackId: feedback.id, selector: report.selector }];
      });
    }

    function postChangeMap() {
      frame.contentWindow?.postMessage({ type: "blueprint:change-map", version: 1, items: changeMapItems() }, "*");
    }

    function focusChange(selector) {
      frame.contentWindow?.postMessage({ type: "blueprint:focus-change", version: 1, selector }, "*");
    }

    function navigationAnchor(label, selector, className = "anchor") {
      if (!selector) {
        const text = document.createElement("span");
        text.className = className;
        text.textContent = label;
        return text;
      }
      const button = document.createElement("button");
      button.type = "button";
      button.className = className + " anchor-navigation";
      button.textContent = label;
      button.title = "Show this element in the artifact";
      button.setAttribute("aria-label", "Show element: " + label);
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        focusChange(selector);
      });
      return button;
    }

    function setPane(next) {
      if (readOnlyViewer) next = "history";
      activePane = next;
      const feedbackActive = next === "feedback";
      feedbackPane.hidden = !feedbackActive;
      historyPane.hidden = feedbackActive;
      sendArea.hidden = !feedbackActive || state?.status === "ended";
      feedbackTab.classList.toggle("active", feedbackActive);
      historyTab.classList.toggle("active", !feedbackActive);
      if (feedbackActive) requestAnimationFrame(sizeFeedbackEditors);
      else if (!historyLoading && historyUpdatedAt !== state?.updatedAt) void loadHistory();
    }

    function invalidateHistory() {
      reviewHistory = undefined;
      historyUpdatedAt = null;
    }

    function isPlainEnter(event) {
      return event.key === "Enter" && !event.shiftKey && !event.isComposing && !event.repeat;
    }

    function queueDraftOnEnter(event) {
      if (!isPlainEnter(event)) return;
      event.preventDefault();
      event.currentTarget.blur();
      void saveDrafts();
    }

    function queueAdditionalFeedback() {
      const body = additionalFeedbackField.value.trim();
      if (!body || !state || state.status !== "active") return false;
      state.drafts.push({
        id: "feedback-" + crypto.randomUUID(),
        kind: "initial",
        body,
        createdAt: new Date().toISOString(),
        sourceRevisionId: state.visibleRevision.id,
        anchor: {
          type: "general",
          quote: "General feedback",
          prefix: "",
          suffix: "",
          selector: "",
        },
      });
      state.packetNote = "";
      additionalFeedbackField.value = "";
      sizeAdditionalFeedback();
      changed(true);
      requestAnimationFrame(() => additionalFeedbackField.focus({ preventScroll: true }));
      return true;
    }

    function queueAdditionalFeedbackOnEnter(event) {
      if (!isPlainEnter(event)) return;
      event.preventDefault();
      queueAdditionalFeedback();
    }

    function artifactResponseDraftId(responseId) {
      const base = "response-" + state.visibleRevision.sequence + "-" + responseId;
      const existing = state.drafts.find((draft) =>
        draft.kind === "decision" && (draft.id === base || draft.id.startsWith(base + ":")));
      if (existing) return existing.id;
      const alreadySubmitted = state.feedback.some((feedback) =>
        feedback.id === base || feedback.id.startsWith(base + ":"))
        || state.packets.some((packet) =>
          (packet.decisionIds ?? []).some((id) => id === base || id.startsWith(base + ":")));
      if (!alreadySubmitted) return base;
      return base + ":" + crypto.randomUUID().slice(0, 8);
    }

    function queueArtifactResponse(detail) {
      if (!state || state.status !== "active" || !state.visibleRevision) return;
      const responseId = typeof detail.responseId === "string" ? detail.responseId : "";
      const prompt = typeof detail.prompt === "string" ? detail.prompt.trim().slice(0, 180) : "";
      const body = typeof detail.body === "string" ? detail.body.trim().slice(0, 10000) : "";
      const selector = typeof detail.selector === "string" ? detail.selector.slice(0, 1000) : "";
      if (!/^[a-zA-Z0-9._:-]{1,60}$/.test(responseId) || !prompt || !body || !selector) return;
      const id = artifactResponseDraftId(responseId);
      const existingIndex = state.drafts.findIndex((draft) => draft.id === id);
      const existing = existingIndex >= 0 ? state.drafts[existingIndex] : null;
      const draft = {
        id,
        kind: "decision",
        body,
        createdAt: existing?.createdAt ?? new Date().toISOString(),
        sourceRevisionId: state.visibleRevision.id,
        anchor: { type: "element", quote: prompt, prefix: "", suffix: "", selector },
      };
      if (existingIndex >= 0) state.drafts.splice(existingIndex, 1, draft);
      else state.drafts.push(draft);
      activePane = "feedback";
      app.classList.remove("inspector-closed");
      changed(true);
      void saveDrafts();
      toast(existing ? "Queued decision response updated." : "Decision response queued.");
    }

    function updateSubmissionActions() {
      const draftsValid = state.drafts.every((draft) => draft.body.trim());
      const hasFeedback = state.drafts.some((draft) => draft.kind !== "decision") || !!additionalFeedbackField.value.trim();
      const active = !sending && state.status === "active" && !!state.visibleRevision;
      const approvalBlocked = pendingRevisionRequest().packets.length > 0 || !!state.stagedRevision;
      sendArea.classList.toggle("has-feedback", hasFeedback);
      approveButton.textContent = hasFeedback ? "Approve with feedback" : "Approve";
      approveButton.disabled = !active || !draftsValid || approvalBlocked;
      approveButton.title = approvalBlocked
        ? "Approval is unavailable until the requested revision is revealed."
        : "";
      if (approvalBlocked) approveButton.setAttribute("aria-describedby", "revision-progress-detail");
      else approveButton.removeAttribute("aria-describedby");
      reviseButton.hidden = !hasFeedback;
      reviseButton.disabled = !active || !draftsValid || !hasFeedback;
    }

    function updateFeedbackCount() {
      const reviewItemCount = state.feedback.filter((feedback) => feedback.state !== "accepted").length;
      const draftCount = state.drafts.filter((draft) => draft.kind !== "decision").length;
      document.getElementById("feedback-count").textContent = draftCount + reviewItemCount;
    }

    function sizeDraftEditor(textarea) {
      textarea.style.height = "0px";
      textarea.style.height = Math.max(20, textarea.scrollHeight) + "px";
    }

    function sizeDraftEditors() {
      document.querySelectorAll(".draft textarea").forEach(sizeDraftEditor);
    }

    function sizeAdditionalFeedback() {
      additionalFeedbackField.style.height = "0px";
      additionalFeedbackField.style.height = Math.max(70, additionalFeedbackField.scrollHeight) + "px";
    }

    function sizeFeedbackEditors() {
      sizeDraftEditors();
      sizeAdditionalFeedback();
    }

    function renderDrafts() {
      const activeEditor = document.activeElement?.dataset?.draftId ? document.activeElement : null;
      const activeDraftId = activeEditor?.dataset.draftId;
      const selectionStart = activeEditor?.selectionStart;
      const selectionEnd = activeEditor?.selectionEnd;
      const decisionDrafts = state.drafts.filter((draft) => draft.kind === "decision");
      const feedbackDrafts = state.drafts.filter((draft) => draft.kind !== "decision");
      const decisionSection = document.getElementById("decision-drafts");
      const feedbackSection = document.getElementById("feedback-drafts");
      const decisionList = document.getElementById("decision-draft-list");
      const feedbackList = document.getElementById("draft-list");
      decisionSection.hidden = decisionDrafts.length === 0;
      feedbackSection.hidden = feedbackDrafts.length === 0;
      document.getElementById("decision-draft-count").textContent = decisionDrafts.length;
      document.getElementById("feedback-draft-count").textContent = feedbackDrafts.length;
      decisionList.replaceChildren();
      feedbackList.replaceChildren();

      function renderDraft(draft, list) {
        const card = document.createElement("article");
        card.className = "draft" + (draft.kind === "decision" ? " decision" : "");
        const rail = document.createElement("span");
        rail.className = "draft-rail";
        rail.setAttribute("aria-hidden", "true");
        const content = document.createElement("div");
        content.className = "draft-content";
        const top = document.createElement("div");
        top.className = "draft-top";
        const anchorLabel = draft.kind === "decision"
          ? "Decision · " + draft.anchor.quote
          : draft.kind === "reopen"
          ? "Reopen · " + draft.anchor.quote
          : draft.anchor.type === "general"
            ? "General feedback"
            : draft.anchor.quote || draft.anchor.selector || "Element";
        const anchor = navigationAnchor(anchorLabel, draft.anchor.selector);
        const remove = iconButton("", draft.kind === "decision" ? "Delete decision response" : "Delete draft", () => {
          const index = state.drafts.findIndex((item) => item.id === draft.id);
          if (index >= 0) state.drafts.splice(index, 1);
          changed(true);
        });
        remove.classList.add("draft-delete");
        remove.append(trashIcon());
        top.append(anchor);
        const textarea = document.createElement("textarea");
        textarea.value = draft.body;
        textarea.placeholder = draft.kind === "decision"
          ? "Edit the queued decision response"
          : draft.kind === "reopen" ? "What still needs to change?" : "Write a private draft comment";
        textarea.rows = 1;
        textarea.dataset.draftId = draft.id;
        textarea.setAttribute("aria-keyshortcuts", "Enter");
        textarea.addEventListener("input", () => { sizeDraftEditor(textarea); draft.body = textarea.value; changed(); });
        textarea.addEventListener("keydown", queueDraftOnEnter);
        content.append(top, textarea);
        card.append(rail, content, remove);
        list.append(card);
      }

      decisionDrafts.forEach((draft) => renderDraft(draft, decisionList));
      feedbackDrafts.forEach((draft) => renderDraft(draft, feedbackList));
      updateFeedbackCount();
      updateSubmissionActions();
      requestAnimationFrame(sizeDraftEditors);
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
      button.setAttribute("aria-label", title);
      button.addEventListener("click", action);
      return button;
    }

    function trashIcon() {
      const namespace = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(namespace, "svg");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("aria-hidden", "true");
      const paths = ["M3 6h18", "M8 6V4h8v2", "M19 6l-1 14H6L5 6", "M10 11v5", "M14 11v5"];
      paths.forEach((data) => {
        const path = document.createElementNS(namespace, "path");
        path.setAttribute("d", data);
        svg.append(path);
      });
      return svg;
    }

    function changePair(beforeValue, afterValue) {
      const pair = document.createElement("div");
      pair.className = "change-pair";
      const before = document.createElement("div");
      before.className = "change-value";
      const beforeLabel = document.createElement("strong");
      beforeLabel.textContent = "Before";
      before.append(beforeLabel, document.createTextNode(beforeValue || "Not reported"));
      const after = document.createElement("div");
      after.className = "change-value";
      const afterLabel = document.createElement("strong");
      afterLabel.textContent = "After";
      after.append(afterLabel, document.createTextNode(afterValue || "Not reported"));
      pair.append(before, after);
      return pair;
    }

    function pendingRevisionRequest() {
      const visibleSequence = state.visibleRevision?.sequence ?? 0;
      const basisPacketIds = new Set(
        state.revisions
          .filter((revision) => revision.sequence <= visibleSequence)
          .flatMap((revision) => revision.basisPacketIds ?? []),
      );
      const packets = state.packets.filter((packet) => packet.intent === "revise" && !basisPacketIds.has(packet.id));
      const packetIds = new Set(packets.map((packet) => packet.id));
      const commentCount = state.feedback.filter((feedback) => feedback.history.some((entry) => packetIds.has(entry.packetId))).length;
      return {
        packets,
        queued: packets.filter((packet) => packet.status === "queued"),
        delivered: packets.filter((packet) => packet.status === "delivered"),
        commentCount,
      };
    }

    function renderRevisionProgress() {
      const progress = document.getElementById("revision-progress");
      const request = pendingRevisionRequest();
      progress.hidden = state.status !== "active" || request.packets.length === 0;
      if (progress.hidden) return;
      const title = document.getElementById("revision-progress-title");
      const detail = document.getElementById("revision-progress-detail");
      const latest = request.packets.at(-1);
      const comments = request.commentCount + " " + (request.commentCount === 1 ? "comment" : "comments");
      const submitted = formatHistoryTime(latest.createdAt);
      const working = request.delivered.length > 0;
      progress.classList.toggle("working", working);
      if (!working) {
        title.textContent = "Revision requested · Waiting for agent";
        detail.textContent = comments + " sent " + submitted + ". They remain listed below while you continue reviewing. Approval returns after you reveal the revision.";
        return;
      }
      title.textContent = "Agent working on revision";
      detail.textContent = request.queued.length
        ? "The agent received earlier feedback; " + request.queued.length + " newer " + (request.queued.length === 1 ? "batch is" : "batches are") + " waiting. All sent comments remain below."
        : "The agent received " + comments + ". You can keep reviewing; Blueprint will interrupt when the revision is ready. Approval returns after you reveal it.";
    }

    function renderReviewItems() {
      const list = document.getElementById("feedback-list");
      const section = document.getElementById("review-items");
      const items = state.feedback.filter((feedback) => feedback.state !== "accepted");
      list.replaceChildren();
      section.hidden = items.length === 0;
      document.getElementById("review-item-count").textContent = items.length;
      items.forEach((feedback) => {
        const card = document.createElement("article");
        card.className = "feedback";
        const currentReportSelector = feedback.latestReport?.revisionId === state.visibleRevision?.id
          ? feedback.latestReport.selector
          : "";
        const targetSelector = currentReportSelector || feedback.anchor.selector;
        if (targetSelector) {
          card.classList.add("navigable");
          card.title = "Show this feedback's element in the artifact";
          card.addEventListener("click", (event) => {
            if (event.target.closest("button, a, input, textarea, select, summary, details")) return;
            focusChange(targetSelector);
          });
        }
        const head = document.createElement("div");
        head.className = "feedback-head";
        const badge = document.createElement("span");
        const status = feedback.latestReport?.status || (feedback.state === "open" ? "sent" : feedback.state);
        badge.className = "badge " + status;
        badge.textContent = status === "sent" ? "Sent to agent" : status.replace("-", " ");
        const quoteLabel = feedback.anchor.quote || feedback.anchor.selector || feedback.id;
        const quote = navigationAnchor(quoteLabel, targetSelector, "feedback-quote anchor");
        head.append(badge, quote);
        card.append(head);
        const latestRequest = feedback.history.at(-1);
        const request = document.createElement("div");
        request.className = "feedback-quote";
        request.textContent = latestRequest?.body || "";
        card.append(request);
        if (latestRequest) {
          const sentAt = document.createElement("div");
          sentAt.className = "feedback-sent-at";
          const packet = state.packets.find((item) => item.id === latestRequest.packetId);
          const delivery = !feedback.latestReport && packet
            ? (packet.status === "delivered" ? " · received by agent" : " · waiting for agent")
            : "";
          sentAt.textContent = "Sent " + formatHistoryTime(latestRequest.createdAt) + delivery;
          card.append(sentAt);
        }
        if (feedback.latestReport) {
          const summary = document.createElement("div");
          summary.className = "feedback-summary";
          summary.textContent = feedback.latestReport.summary;
          card.append(summary);
          if (feedback.latestReport.before || feedback.latestReport.after) {
            card.append(changePair(feedback.latestReport.before, feedback.latestReport.after));
          }
          if (feedback.latestReport.evidence) {
            const details = document.createElement("details");
            const label = document.createElement("summary");
            label.textContent = "Show evidence";
            const evidence = document.createElement("p");
            evidence.textContent = feedback.latestReport.evidence;
            details.append(label, evidence);
            card.append(details);
          }
          if (feedback.latestReport.selector && feedback.latestReport.revisionId === state.visibleRevision?.id) {
            const showChange = document.createElement("button");
            showChange.type = "button";
            showChange.className = "secondary";
            showChange.textContent = "Show amended element";
            showChange.addEventListener("click", () => focusChange(feedback.latestReport.selector));
            card.append(showChange);
          }
        }
        if (state.status === "active" && feedback.latestReport && feedback.state !== "reopen-draft") {
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
            cancel.addEventListener("click", () => { reopenEditingId = null; renderReviewItems(); });
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
          accept.addEventListener("click", () => acceptFeedback(feedback.id));
          const reopen = document.createElement("button");
          reopen.type = "button";
          reopen.className = "secondary";
          reopen.textContent = "Reopen";
          reopen.addEventListener("click", () => { reopenEditingId = feedback.id; renderReviewItems(); });
          actions.append(accept, reopen);
          card.append(actions);
        }
        list.append(card);
      });
      updateFeedbackCount();
    }

    function historyCycleTitle(cycle) {
      if (cycle.kind === "initial") return "Initial artifact";
      if (cycle.kind === "approval") return "Final approval";
      if (cycle.kind === "feedback") return "Feedback submitted";
      return "Revision " + cycle.revision.sequence;
    }

    function formatHistoryTime(value) {
      if (!value) return "";
      return new Intl.DateTimeFormat(undefined, {
        month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
      }).format(new Date(value));
    }

    function appendHistoryEvent(card, type, contents) {
      const event = document.createElement("div");
      event.className = "history-event";
      const label = document.createElement("div");
      label.className = "history-event-type";
      label.textContent = type;
      const body = document.createElement("div");
      body.className = "history-event-body";
      if (contents instanceof Node) body.append(contents);
      else body.textContent = contents;
      event.append(label, body);
      card.append(event);
    }

    function visibleHistoryCount() {
      const visibleSequence = state.visibleRevision?.sequence ?? 0;
      const visibleRevisions = state.revisions.filter((revision) => revision.sequence <= visibleSequence);
      const usedPacketIds = new Set(visibleRevisions.flatMap((revision) => revision.basisPacketIds ?? []));
      const pendingCount = state.packets.filter((packet) => !usedPacketIds.has(packet.id)).length;
      return visibleRevisions.length + pendingCount;
    }

    function renderHistory() {
      const list = document.getElementById("history-list");
      list.replaceChildren();
      document.getElementById("history-count").textContent = reviewHistory?.cycles.length ?? visibleHistoryCount();
      if (historyLoading && !reviewHistory) {
        const loading = document.createElement("div");
        loading.className = "empty";
        loading.textContent = "Loading history…";
        list.append(loading);
        return;
      }
      if (!reviewHistory?.cycles.length) {
        const empty = document.createElement("div");
        empty.className = "empty";
        empty.textContent = "History will appear as decisions, comments, and revisions are recorded.";
        list.append(empty);
        return;
      }
      reviewHistory.cycles.forEach((cycle) => {
        const card = document.createElement("article");
        card.className = "history-cycle";
        const head = document.createElement("div");
        head.className = "history-cycle-head";
        const title = document.createElement("span");
        title.className = "history-cycle-title";
        title.textContent = historyCycleTitle(cycle);
        const time = document.createElement("span");
        time.className = "history-cycle-time";
        time.textContent = formatHistoryTime(cycle.createdAt);
        head.append(title, time);
        card.append(head);

        if (cycle.kind === "initial") appendHistoryEvent(card, "Snapshot", "Initial artifact displayed.");
        (cycle.decisions ?? []).forEach((decision) => {
          appendHistoryEvent(card, "Decision", decision.body);
        });
        cycle.comments.forEach((comment) => {
          appendHistoryEvent(card, comment.kind === "reopen" ? "Reopen" : "Comment", comment.body);
        });
        cycle.amendments.forEach((amendment) => {
          const content = document.createElement("div");
          const summary = document.createElement("div");
          summary.textContent = amendment.summary;
          content.append(summary);
          if (amendment.before || amendment.after) content.append(changePair(amendment.before, amendment.after));
          if (amendment.evidence) {
            const details = document.createElement("details");
            const label = document.createElement("summary");
            label.textContent = "Show evidence";
            const evidence = document.createElement("p");
            evidence.textContent = amendment.evidence;
            details.append(label, evidence);
            content.append(details);
          }
          const status = document.createElement("div");
          status.className = "history-event-state";
          status.textContent = amendment.feedbackState === "accepted"
            ? "Accepted by reviewer"
            : amendment.feedbackState.replace("-", " ");
          content.append(status);
          appendHistoryEvent(card, amendment.status, content);
        });
        if (cycle.kind !== "initial" && (cycle.decisions ?? []).length === 0
          && cycle.comments.length === 0 && cycle.amendments.length === 0) {
          appendHistoryEvent(card, "Snapshot", "Revision recorded without linked feedback evidence.");
        }
        list.append(card);
      });
    }

    function captureFeedbackScroll() {
      if (feedbackPane.hidden) return null;
      const maxScroll = Math.max(0, feedbackPane.scrollHeight - feedbackPane.clientHeight);
      return {
        scrollTop: feedbackPane.scrollTop,
        distanceFromBottom: maxScroll - feedbackPane.scrollTop,
        nearBottom: maxScroll - feedbackPane.scrollTop < 8,
        additionalFeedbackFocused: document.activeElement === additionalFeedbackField,
        selectionStart: additionalFeedbackField.selectionStart,
        selectionEnd: additionalFeedbackField.selectionEnd,
      };
    }

    function restoreFeedbackScroll(snapshot) {
      if (!snapshot) return;
      requestAnimationFrame(() => {
        const maxScroll = Math.max(0, feedbackPane.scrollHeight - feedbackPane.clientHeight);
        feedbackPane.scrollTop = snapshot.additionalFeedbackFocused || snapshot.nearBottom
          ? Math.max(0, maxScroll - snapshot.distanceFromBottom)
          : Math.min(snapshot.scrollTop, maxScroll);
        if (!snapshot.additionalFeedbackFocused) return;
        additionalFeedbackField.focus({ preventScroll: true });
        if (Number.isInteger(snapshot.selectionStart) && Number.isInteger(snapshot.selectionEnd)) {
          additionalFeedbackField.setSelectionRange(snapshot.selectionStart, snapshot.selectionEnd);
        }
      });
    }

    function renderRecoveryState() {
      const queued = state?.packets.find((packet) => packet.status === "queued");
      const trouble = disconnected || (queued && Date.now() - Date.parse(queued.createdAt) > 15000);
      document.getElementById("recovery-banner").hidden = !trouble;
    }

    function render() {
      const feedbackScroll = captureFeedbackScroll();
      document.getElementById("artifact-name").textContent = state.artifactName;
      if (state.status === "ended") {
        if (isApprovedReview()) showApprovedCompletion();
        else retireReview();
        return;
      }
      if (state.visibleRevision && !frame.dataset.revision) {
        frame.src = revisionUrl(state.visibleRevision);
        frame.dataset.revision = state.visibleRevision.id;
      }
      additionalFeedbackField.value = state.packetNote;
      renderDrafts();
      renderRevisionProgress();
      renderReviewItems();
      renderHistory();
      setPane(activePane);
      renderRecoveryState();
      const stagedRevisionId = state.stagedRevision?.id ?? null;
      revisionCurtain.hidden = !stagedRevisionId;
      app.inert = !!stagedRevisionId;
      if (stagedRevisionId) {
        const decisionCount = state.drafts.filter((draft) => draft.kind === "decision").length;
        const feedbackCount = state.drafts.filter((draft) => draft.kind !== "decision").length
          + (additionalFeedbackField.value.trim() ? 1 : 0);
        const preserved = [];
        if (decisionCount) preserved.push(decisionCount + " decision " + (decisionCount === 1 ? "response" : "responses"));
        if (feedbackCount) preserved.push(feedbackCount + " " + (feedbackCount === 1 ? "comment" : "comments"));
        const preservedCount = decisionCount + feedbackCount;
        document.getElementById("revision-message").textContent = preserved.length
          ? "Your unsent " + preserved.join(" and ") + (preservedCount === 1 ? " is" : " are") + " preserved. Reveal the revision to inspect what changed."
          : "Reveal the revision to inspect the changes linked to your feedback.";
        if (focusedCurtainRevisionId !== stagedRevisionId) {
          focusedCurtainRevisionId = stagedRevisionId;
          requestAnimationFrame(() => revealButton.focus());
        }
      } else {
        focusedCurtainRevisionId = null;
      }
      postChangeMap();
      restoreFeedbackScroll(feedbackScroll);
    }

    function changed(rerender = false) {
      dirty = true;
      clearTimeout(saveTimer);
      saveTimer = setTimeout(saveDrafts, 350);
      if (rerender) renderDrafts();
      else updateSubmissionActions();
    }

    async function saveDrafts() {
      clearTimeout(saveTimer);
      saveTimer = null;
      const payload = { drafts: state.drafts, packetNote: additionalFeedbackField.value };
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
        renderRecoveryState();
        updateSubmissionActions();
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
        const nextState = await api("/state");
        if (state?.updatedAt === nextState.updatedAt) {
          disconnected = false;
          renderRecoveryState();
          return;
        }
        if (state?.updatedAt && state.updatedAt !== nextState.updatedAt) {
          invalidateHistory();
        }
        state = nextState;
        disconnected = false;
        render();
      } catch (error) {
        disconnected = true;
        if (!quiet) toast(error.message, true);
        if (state) renderRecoveryState();
      }
    }

    async function loadHistory() {
      if (historyLoading) return;
      historyLoading = true;
      renderHistory();
      try {
        reviewHistory = await api("/history");
        historyUpdatedAt = reviewHistory.updatedAt;
      } catch (error) {
        toast(error.message, true);
      } finally {
        historyLoading = false;
        renderHistory();
      }
    }

    async function reveal() {
      try {
        state = await api("/reveal", { method: "POST", body: "{}" });
        const revision = state.visibleRevision;
        frame.src = revisionUrl(revision) + "?revealed=" + Date.now();
        frame.dataset.revision = revision.id;
        invalidateHistory();
        activePane = "feedback";
        render();
        toast("Latest revision revealed. Amended elements are marked in the artifact.");
      } catch (error) { toast(error.message, true); }
    }

    async function submitReview(intent) {
      if (sending) return;
      const sendButton = intent === "approve" ? approveButton : reviseButton;
      if (sendButton.disabled || sendButton.hidden) return;
      queueAdditionalFeedback();
      sending = true;
      const finalApproval = intent === "approve";
      if (finalApproval) app.inert = true;
      approveButton.disabled = true;
      reviseButton.disabled = true;
      try {
        await flushDrafts();
        const packet = await api("/send", { method: "POST", body: JSON.stringify({ intent }) });
        if (finalApproval) {
          state.status = "ended";
          state.latestPacket = packet;
          showApprovedCompletion();
        } else {
          await loadState();
          toast("Revision requested. Your sent feedback will stay visible while the agent works.", false, true);
        }
      } catch (error) {
        if (finalApproval && !reviewRetired) app.inert = false;
        toast(error.message, true);
      } finally {
        sending = false;
        if (state?.status === "active") renderDrafts();
      }
    }

    async function acceptFeedback(id) {
      try {
        state = await api("/feedback/" + encodeURIComponent(id) + "/accept", { method: "POST", body: "{}" });
        invalidateHistory();
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
        invalidateHistory();
        activePane = "feedback";
        render();
        toast("Reopen note saved as a private draft.");
      } catch (error) { toast(error.message, true); }
    }

    async function copyLatestPacket() {
      if (!state?.latestPacket) { toast("No sent review submission to copy yet."); return; }
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
      toast("Review submission copied.");
    }

    additionalFeedbackField.addEventListener("input", () => {
      sizeAdditionalFeedback();
      state.packetNote = additionalFeedbackField.value;
      changed();
    });
    additionalFeedbackField.addEventListener("keydown", queueAdditionalFeedbackOnEnter);
    frame.addEventListener("load", () => { if (!readOnlyViewer) postChangeMap(); });
    feedbackTab.addEventListener("click", () => setPane("feedback"));
    historyTab.addEventListener("click", () => setPane("history"));
    document.getElementById("collapse-inspector").addEventListener("click", () => app.classList.add("inspector-closed"));
    document.getElementById("expand-inspector").addEventListener("click", () => app.classList.remove("inspector-closed"));
    revealButton.addEventListener("click", reveal);
    closeReviewTabButton.addEventListener("click", closeReviewTab);
    viewApprovedReviewButton.addEventListener("click", openApprovedReview);
    readonlyBackButton.addEventListener("click", showApprovedCompletion);
    approveButton.addEventListener("click", () => submitReview("approve"));
    reviseButton.addEventListener("click", () => submitReview("revise"));
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
      try {
        state = await api("/end", { method: "POST", body: "{}" });
        retireReview("Review ended", "This review session is closed. Return to your agent to continue.");
      }
      catch (error) { toast(error.message, true); }
    });

    window.addEventListener("message", (event) => {
      if (event.source !== frame.contentWindow || event.data?.type !== "blueprint:annotation" || event.data?.version !== 1) return;
      if (!state || state.status !== "active" || reviewRetired || sending) return;
      const detail = event.data.detail;
      if (detail?.type === "response") {
        queueArtifactResponse(detail);
        return;
      }
      if (!detail || detail.type !== "element" || typeof detail.selector !== "string") return;
      const signature = JSON.stringify(detail);
      if (signature === lastAnnotation && Date.now() - lastAnnotationAt < 800) return;
      lastAnnotation = signature;
      lastAnnotationAt = Date.now();
      const draft = {
        id: "feedback-" + crypto.randomUUID(), kind: "initial", body: "",
        createdAt: new Date().toISOString(),
        sourceRevisionId: state.visibleRevision.id,
        anchor: {
          type: "element",
          quote: typeof detail.quote === "string" ? detail.quote.slice(0, 1000) : "",
          prefix: typeof detail.prefix === "string" ? detail.prefix.slice(0, 500) : "",
          suffix: typeof detail.suffix === "string" ? detail.suffix.slice(0, 500) : "",
          selector: detail.selector.slice(0, 1000),
        },
      };
      state.drafts.push(draft);
      activePane = "feedback";
      app.classList.remove("inspector-closed");
      changed(true);
      requestAnimationFrame(() => {
        document.querySelector('[data-draft-id="' + CSS.escape(draft.id) + '"]')?.focus({ preventScroll: false });
      });
    });

    loadState();
    pollTimer = setInterval(() => loadState({ quiet: true }), 2000);
  })();
  </script>
</body>
</html>`;
}
