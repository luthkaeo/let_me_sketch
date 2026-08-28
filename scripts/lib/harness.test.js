'use strict';
// Harness self-audit tests. Run: node --test scripts/lib/harness.test.js

const { test } = require('node:test');
const assert = require('node:assert');

const { auditRun, PHASE_MODELS } = require('./harness');

function run(overrides = {}) {
  return {
    slug: 'demo',
    intensity: 'full',
    runway: { current: 2, best: 3 },
    blockCount: 0,
    stops: [],
    phases: {
      '10_frame': { status: 'approved', model: 'opus', tokens: 40000 },
      '20_policy': { status: 'approved', model: 'sonnet', tokens: 30000 },
      '30_journey': { status: 'approved', model: 'sonnet', tokens: 90000 },
      '40_reference': { status: 'approved', model: 'sonnet', tokens: 50000 },
      '50_screens': { status: 'approved', model: 'sonnet', tokens: 80000 },
      '60_review': { status: 'approved', model: 'opus', tokens: 70000 },
      '90_handoff': { status: 'pending' },
      '95_operate': { status: 'pending' },
    },
    ...overrides,
  };
}

test('a run that followed its own model assignment reports no drift', () => {
  const findings = auditRun(run()).findings.map((f) => f.code);
  assert.ok(!findings.includes('MODEL_DRIFT'), findings.join(' '));
});

test('a phase run on a costlier model than assigned is named, with the fix', () => {
  // The loop skill assigns sonnet to journey/reference/screens. Ignoring that
  // is what turned one measured run into 220k tokens; prose could not catch it.
  const s = run();
  s.phases['50_screens'].model = 'opus';
  const f = auditRun(s).findings.find((x) => x.code === 'MODEL_DRIFT');
  assert.ok(f, 'drift must be reported');
  assert.match(f.detail, /50_screens/);
  assert.match(f.detail, /sonnet/);
  assert.ok(f.fix, 'a finding without a fix is a complaint');
});

test('every unplanned stop becomes a finding carrying its own detail', () => {
  const s = run({
    blockCount: 1,
    stops: [
      { phase: '10_frame', code: 'GATE_APPROVED' },
      { phase: '30_journey', code: 'BLOCK_CONTEXT', detail: '페르소나 이탈 조건이 비어 판정 불가' },
    ],
  });
  const f = auditRun(s).findings.find((x) => x.code === 'UNPLANNED_STOP');
  assert.ok(f);
  assert.match(f.detail, /이탈 조건/);
});

test('a handoff with no operate phase is reported as an unclosed loop', () => {
  // polysona records an engagement target at publish and updates the persona
  // when the real number lands. Stopping at handoff leaves the 성공 지표 unread.
  const s = run();
  s.phases['90_handoff'] = { status: 'approved', model: 'sonnet', tokens: 20000 };
  const f = auditRun(s).findings.find((x) => x.code === 'LOOP_NOT_CLOSED');
  assert.ok(f, 'handoff without operate must be flagged');
});

test('a phase costing far more than the others is surfaced', () => {
  const s = run();
  s.phases['30_journey'].tokens = 600000;
  const f = auditRun(s).findings.find((x) => x.code === 'COST_OUTLIER');
  assert.ok(f);
  assert.match(f.detail, /30_journey/);
});

test('phases with no recorded model are reported as unmeasured, not as drift', () => {
  // A run that never wrote its models cannot be audited for cost, and saying
  // "no drift" there would be a false pass.
  const s = run();
  for (const p of Object.keys(s.phases)) delete s.phases[p].model;
  const codes = auditRun(s).findings.map((f) => f.code);
  assert.ok(codes.includes('UNMEASURED'), codes.join(' '));
  assert.ok(!codes.includes('MODEL_DRIFT'), codes.join(' '));
});

test('the model assignment is declared once and covers every phase', () => {
  const { PHASES } = require('./state');
  assert.deepStrictEqual(Object.keys(PHASE_MODELS).sort(), [...PHASES].sort());
});

test('a clean run still reports runway and cost so the number is always visible', () => {
  const a = auditRun(run());
  assert.strictEqual(a.runway.best, 3);
  assert.strictEqual(a.totalTokens, 360000);
});
