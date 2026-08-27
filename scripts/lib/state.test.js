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
  PHASE_REQUIREMENTS,
  MODES,
  requirementsFor,
  label,
  initState,
  readState,
  writeState,
  advancePhase,
  recordStop,
  checkPhaseFile,
  appendLedger,
  resolveWorkspace,
} = require('./state');

const OK = { ok: true, missing: [] };

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
  const next = advancePhase(s, '10_frame', { status: 'approved', file: 'x.md', completeness: OK });

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
  for (const p of PHASES) s = advancePhase(s, p, { status: 'approved', file: p + '.md', completeness: OK });

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

  s = advancePhase(s, '10_frame', { status: 'approved', file: 'a.md', completeness: OK });
  s = advancePhase(s, '30_journey', { status: 'approved', file: 'b.md', completeness: OK });

  assert.strictEqual(s.runway.current, 2, 'each unattended pass adds one');
  assert.strictEqual(s.runway.best, 2);
});

test('a gate stop banks the runway and resets the counter', () => {
  const ws = tmpWorkspace();
  let s = initState(ws, { slug: 'demo', language: 'ko', intensity: 'ultra' });
  s = advancePhase(s, '10_frame', { status: 'approved', file: 'a.md', completeness: OK });
  s = advancePhase(s, '30_journey', { status: 'approved', file: 'b.md', completeness: OK });
  s = recordStop(s, { phase: '30_journey', code: 'GATE_APPROVED' });

  assert.strictEqual(s.runway.best, 2, 'best is banked before the reset');
  assert.strictEqual(s.runway.current, 0, 'a human touch ends the runway');
  assert.strictEqual(s.stops.at(-1).code, 'GATE_APPROVED');
});

test('a later shorter run does not lower the best runway', () => {
  const ws = tmpWorkspace();
  let s = initState(ws, { slug: 'demo', language: 'ko', intensity: 'ultra' });
  s = advancePhase(s, '10_frame', { status: 'approved', file: 'a.md', completeness: OK });
  s = advancePhase(s, '30_journey', { status: 'approved', file: 'b.md', completeness: OK });
  s = recordStop(s, { phase: '30_journey', code: 'GATE_APPROVED' });
  s = advancePhase(s, '40_reference', { status: 'approved', file: 'c.md', completeness: OK });
  s = recordStop(s, { phase: '40_reference', code: 'GATE_APPROVED' });

  assert.strictEqual(s.runway.best, 2);
});

test('a BLOCK stop is recorded as a defect and also ends the runway', () => {
  const ws = tmpWorkspace();
  let s = initState(ws, { slug: 'demo', language: 'ko', intensity: 'ultra' });
  s = advancePhase(s, '10_frame', { status: 'approved', file: 'a.md', completeness: OK });
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

// --- phase completeness: the RED baseline skipped whole phases in silence, so
// --- passing a phase is a checked fact, not a claim. See docs/tests/baseline-result.md

test('every phase declares what its file must contain', () => {
  for (const p of PHASES) {
    assert.ok(Array.isArray(PHASE_REQUIREMENTS[p]), p + ' must declare requirements');
    assert.ok(PHASE_REQUIREMENTS[p].length > 0, p + ' requirements must not be empty');
  }
});

test('checkPhaseFile reports every missing marker, not just the first', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'prosona-chk-'));
  const file = path.join(dir, '10_service-brief.md');
  fs.writeFileSync(file, '# 브리프\n\n내용만 있고 필수 절이 없다.\n', 'utf8');

  const result = checkPhaseFile('10_frame', file);
  assert.strictEqual(result.ok, false);
  assert.deepStrictEqual(result.missing, PHASE_REQUIREMENTS['10_frame']);
});

test('checkPhaseFile passes when every marker is present', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'prosona-chk-'));
  const file = path.join(dir, '10_service-brief.md');
  fs.writeFileSync(file, PHASE_REQUIREMENTS['10_frame'].join('\n\n') + '\n', 'utf8');

  assert.deepStrictEqual(checkPhaseFile('10_frame', file), { ok: true, missing: [] });
});

test('checkPhaseFile treats a missing file as incomplete, not as an error', () => {
  const result = checkPhaseFile('10_frame', path.join(os.tmpdir(), 'does-not-exist-' + Date.now() + '.md'));
  assert.strictEqual(result.ok, false);
  assert.ok(result.missing.includes('(file not found)'));
});

test('a phase cannot be approved without a completeness result', () => {
  const ws = tmpWorkspace();
  const s = initState(ws, { slug: 'demo', language: 'ko', intensity: 'ultra' });
  assert.throws(
    () => advancePhase(s, '10_frame', { status: 'approved', file: 'a.md' }),
    /completeness/i,
    'approving without a check is exactly the silent phase-skip the baseline showed'
  );
});

test('a phase cannot be approved when sections are missing', () => {
  const ws = tmpWorkspace();
  const s = initState(ws, { slug: 'demo', language: 'ko', intensity: 'ultra' });
  assert.throws(
    () => advancePhase(s, '10_frame', {
      status: 'approved',
      file: 'a.md',
      completeness: { ok: false, missing: ['누구를 위한 것인가'] },
    }),
    /누구를 위한 것인가/,
    'the error must name what is missing so the fix is obvious'
  );
});

test('a verified phase approves and extends the runway', () => {
  const ws = tmpWorkspace();
  const s = initState(ws, { slug: 'demo', language: 'ko', intensity: 'ultra' });
  const next = advancePhase(s, '10_frame', {
    status: 'approved',
    file: 'a.md',
    completeness: { ok: true, missing: [] },
  });
  assert.strictEqual(next.phases['10_frame'].status, 'approved');
  assert.strictEqual(next.runway.current, 1);
});

test('a non-approving status needs no completeness check', () => {
  const ws = tmpWorkspace();
  const s = initState(ws, { slug: 'demo', language: 'ko', intensity: 'ultra' });
  const next = advancePhase(s, '10_frame', { status: 'in_progress', file: null });
  assert.strictEqual(next.phases['10_frame'].status, 'in_progress');
  assert.strictEqual(next.runway.current, 0);
});

test('screen specs must require the three states and the undo path', () => {
  const req = PHASE_REQUIREMENTS['50_screens'];
  for (const marker of ['빈 상태', '에러', '되돌리기', '## 근거']) {
    assert.ok(req.some((r) => r.includes(marker)), '50_screens must require: ' + marker);
  }
});

test('reference phase must require either a cited URL or an explicit no-precedent note', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'prosona-ref-'));

  const cited = path.join(dir, 'cited.md');
  fs.writeFileSync(cited, '### J1\n- 채택 [Toss](https://mobbin.com/x) — 이유\n- 기각 [Strava](https://mobbin.com/y) — 이유\n', 'utf8');
  assert.strictEqual(checkPhaseFile('40_reference', cited).ok, true);

  const declared = path.join(dir, 'declared.md');
  fs.writeFileSync(declared, '### J1\n- 근거 없음 — 신규 설계: 국내 선례 없음\n- 기각 없음\n', 'utf8');
  assert.strictEqual(checkPhaseFile('40_reference', declared).ok, true, 'an honest "no precedent" is a valid result');

  const silent = path.join(dir, 'silent.md');
  fs.writeFileSync(silent, '### J1\n- 이런 화면이 일반적입니다.\n', 'utf8');
  assert.strictEqual(checkPhaseFile('40_reference', silent).ok, false, 'an unsourced assertion must not pass');
});

// --- project mode: a new idea and an existing product are not the same interview.
// --- improve mode must reconstruct as-is before it is allowed to design to-be.

test('MODES declares exactly the two project kinds', () => {
  assert.deepStrictEqual(MODES, ['new', 'improve']);
});

test('initState defaults to new and records the chosen mode', () => {
  const ws = tmpWorkspace();
  assert.strictEqual(initState(ws, { slug: 'a' }).mode, 'new');
  assert.strictEqual(initState(ws, { slug: 'a', mode: 'improve' }).mode, 'improve');
});

test('initState rejects an unknown mode', () => {
  const ws = tmpWorkspace();
  assert.throws(() => initState(ws, { slug: 'a', mode: 'refactor' }), /unknown mode/i);
});

test('improve mode requires the current state and the reason for changing it', () => {
  const base = requirementsFor('10_frame', 'new');
  const improve = requirementsFor('10_frame', 'improve');

  assert.ok(improve.length > base.length, 'improve asks for more, never less');
  for (const marker of ['## 현재 상태', '## 바꾸려는 이유']) {
    assert.ok(improve.some((r) => label(r).includes(marker)), 'improve 10_frame must require ' + marker);
    assert.ok(!base.some((r) => label(r).includes(marker)), 'new 10_frame must not require ' + marker);
  }
});

test('improve mode requires an as-is journey and an explicit delta', () => {
  const improve = requirementsFor('30_journey', 'improve');
  for (const marker of ['## as-is 여정', '## 변경점']) {
    assert.ok(improve.some((r) => label(r).includes(marker)), 'improve 30_journey must require ' + marker);
  }
});

test('a brief that skips as-is is blocked in improve mode but passes in new mode', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'prosona-mode-'));
  const file = path.join(dir, '10_service-brief.md');
  fs.writeFileSync(file, requirementsFor('10_frame', 'new').map(label).join('\n\n'), 'utf8');

  assert.strictEqual(checkPhaseFile('10_frame', file, 'new').ok, true);

  const blocked = checkPhaseFile('10_frame', file, 'improve');
  assert.strictEqual(blocked.ok, false);
  assert.ok(blocked.missing.includes('## 현재 상태'), 'improve must name as-is as the gap');
});

test('measured values in improve mode need a stated source', () => {
  // The baseline's strongest move was measuring the codebase instead of guessing.
  // Institutionalise it rather than letting the skill regress to prose.
  assert.ok(
    requirementsFor('10_frame', 'improve').some((r) => label(r).includes('출처')),
    'improve 10_frame must require sources for measured constraints'
  );
});

test('checkPhaseFile accepts several files for one phase', () => {
  // 10_frame writes two files: the target user is in the brief, the exit
  // conditions are in the personas. Neither file alone can pass the phase.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'prosona-pair-'));
  const brief = path.join(dir, '10_service-brief.md');
  const personas = path.join(dir, '20_user-personas.md');
  fs.writeFileSync(brief, '## 1. 누구를 위한 것인가\n\n## 제약\n\n## 미해결\n', 'utf8');
  fs.writeFileSync(personas, '- 이탈 조건: 4단계 이상이면 닫는다\n', 'utf8');

  assert.strictEqual(checkPhaseFile('10_frame', brief).ok, false, 'brief alone is not the phase');
  assert.deepStrictEqual(checkPhaseFile('10_frame', [brief, personas]), { ok: true, missing: [] });
});

test('checkPhaseFile fails a pair when one of the files is absent', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'prosona-pair-'));
  const brief = path.join(dir, '10_service-brief.md');
  fs.writeFileSync(brief, PHASE_REQUIREMENTS['10_frame'].join('\n\n') + '\n', 'utf8');

  const result = checkPhaseFile('10_frame', [brief, path.join(dir, '20_user-personas.md')]);
  assert.strictEqual(result.ok, false, 'a declared output that does not exist is not complete');
  assert.ok(result.missing.includes('(file not found)'));
});
