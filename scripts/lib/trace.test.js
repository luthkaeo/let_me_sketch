'use strict';
// Trace tests. Run: node --test scripts/lib/trace.test.js

const { test } = require('node:test');
const assert = require('node:assert');

const { buildTrace, formatTrace } = require('./trace');

const ledger = {
  version: 1,
  nodes: { 'C-001': { kind: 'C', label: '무상태' }, 'D-001': { kind: 'D', label: '링크를 하단에' } },
  decisions: [
    { id: 'D-001', phase: '50_screens', what: '링크를 하단에', why: 'C-001 무상태', dependsOn: ['C-001'], affects: [], at: '2026-08-27T11:21:00.000Z' },
    { id: 'D-002', phase: '50_screens', what: '링크를 상단으로', why: 'P-A 이탈 조건', dependsOn: ['C-001'], affects: [], supersedes: 'D-001', at: '2026-08-27T11:26:00.000Z' },
  ],
};

const progress = [
  '# 진행 원장 — demo',
  '',
  '- 2026-08-27T11:24:00.000Z  60_review   루프백 회차1 — 치명 2건',
  '- 손으로 적은 줄 (타임스탬프 없음)',
].join('\n');

const history = [{ file: '50_screens/.history/01-home.v1.md', at: '2026-08-27T11:25:00.000Z' }];

test('all three sources merge into one ascending timeline', () => {
  // The trail exists in three places today and nowhere together, which is the
  // same as not existing when someone asks why a screen changed.
  const rows = buildTrace({ progress, ledger, history });
  assert.deepStrictEqual(rows.map((r) => r.at), [
    '2026-08-27T11:21:00.000Z',
    '2026-08-27T11:24:00.000Z',
    '2026-08-27T11:25:00.000Z',
    '2026-08-27T11:26:00.000Z',
  ]);
  assert.deepStrictEqual(rows.map((r) => r.kind), ['decision', 'progress', 'revision', 'decision']);
});

test('a superseding decision names what it replaced', () => {
  const rows = buildTrace({ progress, ledger, history });
  const last = rows[rows.length - 1];
  assert.match(last.text, /D-001/);
  assert.match(last.text, /P-A 이탈 조건/);
});

test('a progress line without a timestamp is skipped, not thrown', () => {
  const rows = buildTrace({ progress, ledger: { decisions: [], nodes: {} }, history: [] });
  assert.strictEqual(rows.length, 1);
});

test('nothing recorded says so instead of printing an empty table', () => {
  const out = formatTrace(buildTrace({ progress: '', ledger: { decisions: [], nodes: {} }, history: [] }));
  assert.match(out, /기록 없음/);
});

test('formatting puts the time first so the file reads as a timeline', () => {
  const out = formatTrace(buildTrace({ progress, ledger, history }));
  const first = out.split('\n').find((l) => l.includes('D-001'));
  assert.ok(first.startsWith('2026-08-27T11:21'), first);
});
