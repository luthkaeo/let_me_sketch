'use strict';
// Screen spec -> a wireframe preview a person can open in a browser.
//
// The fidelity line: this renders what the spec says and nothing else. No invented
// copy, no invented colour, no filler. A renderer that prettifies gaps produces a
// screen that looks finished while its spec is empty - which is the silent omission
// this whole project exists to catch, reintroduced at the last step.
//
// Why render at all: the reference phase gathers precedent and the screen phase fixes
// structure and states, and both stop at text. A plan whose empty state was never
// looked at was never reviewed. Putting the three states side by side is the point;
// everything else here is scaffolding to make that readable.

const { validateScreenSpec, REQUIRED_STATES } = require('./screenspec');

const STATE_LABELS = { default: '기본', empty: '빈 상태', error: '에러' };
const DEFAULT_SPACING = 8;

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderScreens(specs) {
  const sections = specs.map(renderScreen).join('\n');
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>화면 시안 — Prosona</title>
${STYLE}
</head>
<body>
<h1>화면 시안</h1>
<p class="note">명세(<code>50_screens/*.json</code>)에서 생성됨. 명세에 없는 것은 그리지 않는다 — 빈 자리는 빈 명세다.</p>
${sections}
</body>
</html>
`;
}

function renderScreen(spec) {
  const { ok, errors } = validateScreenSpec(spec);
  if (!ok) throw new Error(`invalid screen spec ${spec && spec.id}: ${errors.join('; ')}`);

  const states = REQUIRED_STATES.map(
    (key) => `<figure class="state">
<figcaption>${escapeHtml(STATE_LABELS[key] || key)}</figcaption>
<div class="device">${spec.states[key].tree.map(node).join('')}</div>
</figure>`
  ).join('\n');

  return `<section class="screen">
<h2>${escapeHtml(spec.id)} ${escapeHtml(spec.name)} <span class="journey">${escapeHtml(spec.journey)}</span></h2>
<div class="states">
${states}
</div>
</section>`;
}

function node(n) {
  switch (n.type) {
    case 'stack': {
      const dir = n.direction === 'horizontal' ? 'row' : 'column';
      const pad = n.padding ? `padding:${n.padding}px;` : '';
      return `<div class="stack" style="flex-direction:${dir};gap:${n.spacing ?? DEFAULT_SPACING}px;${pad}">${n.children.map(node).join('')}</div>`;
    }
    case 'grid':
      return `<div class="grid" style="grid-template-columns:repeat(${n.columns},1fr);gap:${n.spacing ?? DEFAULT_SPACING}px;">${n.children.map(node).join('')}</div>`;
    case 'text':
      return `<p class="text ${escapeHtml(n.role || 'body')}">${escapeHtml(n.content)}</p>`;
    case 'button':
      return `<div class="button ${escapeHtml(n.variant || 'primary')}">${escapeHtml(n.content)}</div>`;
    case 'input':
      return `<div class="input">${escapeHtml(n.content)}</div>`;
    case 'image':
      // A labelled box, not a stock photo. The alt text is what the spec knows.
      return `<div class="image"${n.aspect ? ` style="aspect-ratio:${escapeHtml(String(n.aspect)).replace(':', '/')};"` : ''}>${escapeHtml(n.alt || 'image')}</div>`;
    case 'divider':
      return `<hr class="divider">`;
    default:
      throw new Error(`no render for node type "${n.type}"`);
  }
}

// Monochrome on purpose. Colour here would be a design decision the spec never made,
// and reviewers read an invented palette as an approved one.
const STYLE = `<style>
:root { color-scheme: light dark; --ink:#111; --muted:#767676; --line:#c9c9c9; --bg:#fff; --panel:#f4f4f4; }
@media (prefers-color-scheme: dark) { :root { --ink:#f2f2f2; --muted:#9a9a9a; --line:#4a4a4a; --bg:#141414; --panel:#1e1e1e; } }
* { box-sizing: border-box; }
body { margin:0; padding:32px; background:var(--bg); color:var(--ink);
  font-family: -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Segoe UI", sans-serif; }
h1 { font-size:20px; margin:0 0 4px; }
.note { color:var(--muted); font-size:13px; margin:0 0 32px; }
.screen { margin-bottom:48px; }
.screen h2 { font-size:15px; font-weight:600; margin:0 0 12px; }
.journey { color:var(--muted); font-weight:400; font-size:13px; }
.states { display:flex; gap:24px; overflow-x:auto; padding-bottom:8px; }
.state { margin:0; flex:0 0 auto; }
.state figcaption { font-size:12px; color:var(--muted); margin-bottom:6px; }
.device { width:375px; min-height:520px; border:1px solid var(--line); border-radius:12px;
  padding:16px; background:var(--panel); display:flex; flex-direction:column; gap:12px; }
.stack { display:flex; }
.grid { display:grid; }
.text { margin:0; }
.text.title { font-size:22px; font-weight:600; }
.text.body { font-size:15px; }
.text.caption { font-size:12px; color:var(--muted); }
.text.label { font-size:13px; font-weight:500; }
.button { border:1px solid var(--ink); border-radius:8px; padding:10px 14px; text-align:center; font-size:14px; }
.button.secondary { border-style:solid; opacity:.75; }
.button.ghost { border-style:dashed; }
.input { border:1px solid var(--line); border-radius:6px; padding:10px 12px; font-size:14px; color:var(--muted); }
.image { border:1px dashed var(--line); border-radius:6px; min-height:88px; display:flex;
  align-items:center; justify-content:center; font-size:12px; color:var(--muted); }
.divider { border:0; border-top:1px solid var(--line); margin:4px 0; width:100%; }
</style>`;

module.exports = { renderScreens, renderScreen, escapeHtml };
