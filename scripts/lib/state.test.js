'use strict';
// Prosona state layer tests. Run: node --test scripts/lib/

const { test } = require('node:test');
const assert = require('node:assert');
const os = require('os');
const fs = require('fs');
const path = require('path');

const {
  PHASES,
  STOP_CODES,
  initState,
  readState,
  writeState,
  advancePhase,
  recordStop,
  appendLedger,
  resolveWorkspace,
} = require('./state');

function tmpWorkspace() {
  return path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'prosona-')), '.prosona');
}

test('PHASES is the single ordered definition of the loop', () => {
  assert.deepStrictEqual(PHASES, [
    '10_frame',
    '30_journey',
    '40_reference',
    '50_screens',
    '60_review',
    '90_handoff',
  ]);
});

test('initState seeds every phase as pending and starts at the first', () => {
  const ws = tmpWorkspace();
  const s = initState(ws, { slug: 'demo', language: 'ko', intensity: 'full' });
  for (const p of PHASES) {
    assert.strictEqual(s.phases[p].status, 'pending', p + ' should start pending');
    assert.strictEqual(s.phases[p].file, null);
  }
  assert.strictEqual(s.currentPhase, '10_frame');
  assert.strictEqual(s.nextPhase, '30_journey');
  assert.strictEqual(s.slug, 'demo');
  assert.strictEqual(s.intensity, 'full');
});

test('advancePhase does not mutate its input', () => {
  const ws = tmpWorkspace();
  const s = initState(ws, { slug: 'demo', language: 'ko', intensity: 'full' });
  const next = advancePhase(s, '10_frame', { status: 'approved', file: 'x.md' });

  assert.strictEqual(s.phases['10_frame'].status, 'pending', 'input must be untouched');
  assert.strictEqual(next.phases['10_frame'].status, 'approved');
  assert.strictEqual(next.phases['10_frame'].file, 'x.md');
  assert.ok(next.phases['10_frame'].approvedAt, 'approval stamps a timestamp');
  assert.strictEqual(next.currentPhase, '30_journey');
  assert.strictEqual(next.nextPhase, '40_reference');
});

test('advancePhase on a non-approving status keeps currentPhase put', () => {
  const ws = tmpWorkspace();
  const s = initState(ws, { slug: 'demo', language: 'ko', intensity: 'full' });
  const next = advancePhase(s, '10_frame', { status: 'awaiting_approval', file: 'x.md' });

  assert.strictEqual(next.phases['10_frame'].status, 'awaiting_approval');
  assert.strictEqual(next.currentPhase, '10_frame', 'a gate that has not been approved does not advance');
  assert.strictEqual(next.phases['10_frame'].approvedAt, null);
});

test('advancePhase on the terminal phase leaves nextPhase null', () => {
  const ws = tmpWorkspace();
  let s = initState(ws, { slug: 'demo', language: 'ko', intensity: 'full' });
  for (const p of PHASES) s = advancePhase(s, p, { status: 'approved', file: p + '.md' });

  assert.strictEqual(s.currentPhase, '90_handoff');
  assert.strictEqual(s.nextPhase, null);
});

test('advancePhase rejects an unknown phase', () => {
  const ws = tmpWorkspace();
  const s = initState(ws, { slug: 'demo', language: 'ko', intensity: 'full' });
  assert.throws(() => advancePhase(s, '99_nope', { status: 'approved' }), /unknown phase/i);
});

test('readState returns null when no state file exists', () => {
  assert.strictEqual(readState(tmpWorkspace()), null);
});

test('writeState then readState round-trips and returns the written path', () => {
  const ws = tmpWorkspace();
  const s = initState(ws, { slug: 'demo', language: 'ko', intensity: 'full' });
  const written = writeState(ws, s);

  assert.strictEqual(written, path.join(ws, 'state.json'));
  assert.ok(fs.existsSync(written), 'writeState must verify the file exists');
  assert.strictEqual(readState(ws).slug, 'demo');
});

test('readState survives a corrupted state file instead of throwing', () => {
  const ws = tmpWorkspace();
  fs.mkdirSync(ws, { recursive: true });
  fs.writeFileSync(path.join(ws, 'state.json'), '{ not json');
  assert.strictEqual(readState(ws), null, 'a broken state file must not stop the loop');
});

test('appendLedger appends without clobbering earlier lines', () => {
  const ws = tmpWorkspace();
  appendLedger(ws, 'demo', '10_frame 승인');
  const ledger = appendLedger(ws, 'demo', '30_journey 승인');
  const body = fs.readFileSync(ledger, 'utf8');

  assert.ok(body.includes('10_frame 승인'), 'earlier entries survive');
  assert.ok(body.includes('30_journey 승인'));
  assert.ok(body.startsWith('# 진행 원장'), 'ledger carries its header');
});

test('resolveWorkspace hangs .prosona off the given directory', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'prosona-cwd-'));
  assert.strictEqual(resolveWorkspace(dir), path.join(dir, '.prosona'));
});

// --- runway accounting: the project's primary metric lives here, not in prose ---

test('an autonomous phase pass extends the runway', () => {
  const ws = tmpWorkspace();
  let s = initState(ws, { slug: 'demo', language: 'ko', intensity: 'ultra' });
  assert.strictEqual(s.runway.current, 0);

  s = advancePhase(s, '10_frame', { status: 'approved', file: 'a.md' });
  s = advancePhase(s, '30_journey', { status: 'approved', file: 'b.md' });

  assert.strictEqual(s.runway.current, 2, 'each unattended pass adds one');
  assert.strictEqual(s.runway.best, 2);
});

test('a gate stop banks the runway and resets the counter', () => {
  const ws = tmpWorkspace();
  let s = initState(ws, { slug: 'demo', language: 'ko', intensity: 'ultra' });
  s = advancePhase(s, '10_frame', { status: 'approved', file: 'a.md' });
  s = advancePhase(s, '30_journey', { status: 'approved', file: 'b.md' });
  s = recordStop(s, { phase: '30_journey', code: 'GATE_APPROVED' });

  assert.strictEqual(s.runway.best, 2, 'best is banked before the reset');
  assert.strictEqual(s.runway.current, 0, 'a human touch ends the runway');
  assert.strictEqual(s.stops.at(-1).code, 'GATE_APPROVED');
});

test('a later shorter run does not lower the best runway', () => {
  const ws = tmpWorkspace();
  let s = initState(ws, { slug: 'demo', language: 'ko', intensity: 'ultra' });
  s = advancePhase(s, '10_frame', { status: 'approved', file: 'a.md' });
  s = advancePhase(s, '30_journey', { status: 'approved', file: 'b.md' });
  s = recordStop(s, { phase: '30_journey', code: 'GATE_APPROVED' });
  s = advancePhase(s, '40_reference', { status: 'approved', file: 'c.md' });
  s = recordStop(s, { phase: '40_reference', code: 'GATE_APPROVED' });

  assert.strictEqual(s.runway.best, 2);
});

test('a BLOCK stop is recorded as a defect and also ends the runway', () => {
  const ws = tmpWorkspace();
  let s = initState(ws, { slug: 'demo', language: 'ko', intensity: 'ultra' });
  s = advancePhase(s, '10_frame', { status: 'approved', file: 'a.md' });
  s = recordStop(s, {
    phase: '30_journey',
    code: 'BLOCK_CONTEXT',
    detail: '페르소나 A의 이탈 조건이 비어 있음',
  });

  const last = s.stops.at(-1);
  assert.strictEqual(last.code, 'BLOCK_CONTEXT');
  assert.strictEqual(last.detail, '페르소나 A의 이탈 조건이 비어 있음');
  assert.strictEqual(s.runway.current, 0);
  assert.strictEqual(s.blockCount, 1, 'BLOCK stops are counted separately - they are the number to drive to zero');
});

test('recordStop does not mutate its input', () => {
  const ws = tmpWorkspace();
  const s = initState(ws, { slug: 'demo', language: 'ko', intensity: 'ultra' });
  const next = recordStop(s, { phase: '10_frame', code: 'GATE_APPROVED' });

  assert.strictEqual(s.stops.length, 0);
  assert.strictEqual(next.stops.length, 1);
});

test('recordStop rejects an unknown stop code', () => {
  const ws = tmpWorkspace();
  const s = initState(ws, { slug: 'demo', language: 'ko', intensity: 'ultra' });
  assert.throws(() => recordStop(s, { phase: '10_frame', code: 'MEH' }), /unknown stop code/i);
});

test('a BLOCK_CONTEXT stop requires a detail naming what was missing', () => {
  const ws = tmpWorkspace();
  const s = initState(ws, { slug: 'demo', language: 'ko', intensity: 'ultra' });
  assert.throws(
    () => recordStop(s, { phase: '30_journey', code: 'BLOCK_CONTEXT' }),
    /detail/i,
    'a block without a detail teaches nothing - the detail is the improvement signal'
  );
});

test('STOP_CODES separates designed gates from defects', () => {
  assert.deepStrictEqual(STOP_CODES, [
    'GATE_APPROVED',
    'GATE_REJECTED',
    'BLOCK_CONTEXT',
    'BLOCK_STATE',
    'BLOCK_INPUT',
    'BLOCK_LOOP',
  ]);
});
