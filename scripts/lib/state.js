'use strict';
// Prosona state layer.
//
// The primary metric of this project is runway: how many phases the loop clears
// without a human touch, while holding quality. That number is computed here and
// nowhere else - prose in a SKILL.md cannot be trusted to count.
//
// No dependencies beyond node builtins, on purpose: install friction is a stop,
// and stops are the thing we are removing.

const fs = require('fs');
const path = require('path');

const PHASES = [
  '10_frame',
  '30_journey',
  '40_reference',
  '50_screens',
  '60_review',
  '90_handoff',
];

const STOP_CODES = [
  'GATE_APPROVED',
  'GATE_REJECTED',
  'BLOCK_CONTEXT',
  'BLOCK_STATE',
  'BLOCK_INPUT',
  'BLOCK_LOOP',
];

// What a phase's output file must actually contain before the phase counts as
// passed. This exists because of the RED baseline (docs/tests/baseline-result.md):
// the unaided agent did not stop to ask for a target user or personas - it wrote
// neither and moved on in silence. Silent omission leaves no trace in a stop log,
// so completeness has to be a checked fact, not a claim.
//
// Alternatives (arrays inside the array) mean "any one of these satisfies it".
const PHASE_REQUIREMENTS = {
  '10_frame': ['누구를 위한 것인가', '## 제약', '이탈 조건', '## 미해결'],
  '30_journey': ['## 실패 경로', '## 내가 결정한 것', '## 미해결'],
  '40_reference': [['mobbin.com', '근거 없음'], ['기각', '기각 없음']],
  '50_screens': ['## 근거', '빈 상태', '에러', '## 되돌리기', '## 미해결'],
  '60_review': ['## 통과 여부', '## 이탈 조건 대조', '## 치명 결함'],
  '90_handoff': ['## 미해결'],
};

const MODES = ['new', 'improve'];

// Improving an existing product is a different job from planning a new one, and
// the difference is not tone - it is evidence. A new idea's constraints come only
// from what the planner says. An existing product's constraints are already in its
// code, and the RED baseline showed an agent can measure them far better than a
// person can recall them (token length by run count, preset counts per animal).
//
// So improve mode demands the as-is before it will accept a to-be. Designing a
// new journey without reconstructing the current one is not an improvement, it is
// a different product wearing the same name.
const MODE_EXTRA_REQUIREMENTS = {
  improve: {
    '10_frame': ['## 현재 상태', '## 바꾸려는 이유', '출처'],
    '30_journey': ['## as-is 여정', '## 변경점'],
  },
};

function requirementsFor(phase, mode = 'new') {
  const base = PHASE_REQUIREMENTS[phase];
  if (!base) throw new Error(`unknown phase: ${phase}`);
  if (!MODES.includes(mode)) throw new Error(`unknown mode: ${mode}`);
  const extra = (MODE_EXTRA_REQUIREMENTS[mode] || {})[phase] || [];
  return [...base, ...extra];
}

const STATE_FILE = 'state.json';
const SCHEMA_VERSION = 1;

// Returns { ok, missing } - never throws. A file that cannot be read is
// incomplete, not an error: the loop keeps going and the gap is reported.
//
// Takes one path or several. One phase can produce more than one file - 10_frame
// writes the brief and the personas, and the target user lives in the first while
// the exit conditions live in the second. Checking them one at a time would fail a
// phase that is actually complete, and the fix for that (duplicating the persona
// table into the brief) puts the same fact in two files, where they drift.
function checkPhaseFile(phase, filePath, mode = "new") {
  const required = requirementsFor(phase, mode);
  const paths = Array.isArray(filePath) ? filePath : [filePath];

  const bodies = [];
  let unreadable = false;
  for (const p of paths) {
    try {
      bodies.push(fs.readFileSync(p, 'utf8'));
    } catch {
      unreadable = true;
    }
  }

  if (bodies.length === 0) {
    return { ok: false, missing: ['(file not found)', ...required.map(label)] };
  }

  const body = bodies.join('\n');
  const missing = required.filter((r) => !satisfied(r, body)).map(label);
  // A declared output that is absent leaves the phase incomplete even when the
  // markers all happen to appear in its sibling.
  if (unreadable) missing.unshift('(file not found)');
  return { ok: missing.length === 0, missing };
}

function satisfied(requirement, body) {
  return Array.isArray(requirement)
    ? requirement.some((alt) => body.includes(alt))
    : body.includes(requirement);
}

function label(requirement) {
  return Array.isArray(requirement) ? requirement.join(' 또는 ') : requirement;
}

function resolveWorkspace(cwd) {
  return path.join(cwd, '.prosona');
}

function now() {
  return new Date().toISOString();
}

function nextOf(phase) {
  const i = PHASES.indexOf(phase);
  return i === -1 || i === PHASES.length - 1 ? null : PHASES[i + 1];
}

function initState(workspace, { slug, language = 'ko', intensity = 'full', mode = 'new' } = {}) {
  if (!MODES.includes(mode)) throw new Error(`unknown mode: ${mode}`);
  const phases = {};
  for (const p of PHASES) {
    phases[p] = { status: 'pending', file: null, approvedAt: null };
  }
  return {
    version: SCHEMA_VERSION,
    slug,
    language,
    intensity,
    mode,
    plannerPersona: '.prosona/planner-persona.md',
    workspace,
    phases,
    currentPhase: PHASES[0],
    nextPhase: nextOf(PHASES[0]),
    openQuestions: [],
    runway: { current: 0, best: 0 },
    stops: [],
    blockCount: 0,
    lastUpdated: now(),
  };
}

function readState(workspace) {
  const file = path.join(workspace, STATE_FILE);
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    // Missing or corrupted state must not stop the loop - the caller falls back
    // to the files on disk, which are the authority when the two disagree.
    return null;
  }
}

function writeState(workspace, state) {
  fs.mkdirSync(workspace, { recursive: true });
  const file = path.join(workspace, STATE_FILE);
  const next = { ...state, lastUpdated: now() };
  fs.writeFileSync(file, JSON.stringify(next, null, 2) + '\n', 'utf8');
  fs.readFileSync(file, 'utf8'); // verify before returning - no unverified success claims
  return file;
}

// Advancing a phase means it cleared unattended, so it extends the runway.
// A human touch is recorded separately, by recordStop.
function advancePhase(state, phase, { status, file = null, completeness = null } = {}) {
  if (!PHASES.includes(phase)) {
    throw new Error(`unknown phase: ${phase}`);
  }
  const approved = status === 'approved';

  // Fail closed. Approving without a completeness result is the silent
  // phase-skip the baseline demonstrated, so it is not allowed to be implicit.
  if (approved) {
    if (!completeness) {
      throw new Error(
        `cannot approve ${phase}: completeness not verified - run checkPhaseFile first`
      );
    }
    if (!completeness.ok) {
      throw new Error(
        `cannot approve ${phase}: missing ${(completeness.missing || []).join(', ')}`
      );
    }
  }

  const entry = {
    ...state.phases[phase],
    status,
    file,
    approvedAt: approved ? now() : null,
  };
  const runway = approved
    ? { current: state.runway.current + 1, best: Math.max(state.runway.best, state.runway.current + 1) }
    : { ...state.runway };

  return {
    ...state,
    phases: { ...state.phases, [phase]: entry },
    currentPhase: approved ? nextOf(phase) || phase : state.currentPhase,
    nextPhase: approved ? nextOf(nextOf(phase) || phase) : state.nextPhase,
    runway,
    lastUpdated: now(),
  };
}

// Every stop ends a runway. GATE_* stops are the four we designed and kept;
// BLOCK_* stops are defects, and their detail names the missing input that
// caused them - that detail is the improvement signal for the next run.
function recordStop(state, { phase, code, detail = null } = {}) {
  if (!STOP_CODES.includes(code)) {
    throw new Error(`unknown stop code: ${code}`);
  }
  const isBlock = code.startsWith('BLOCK_');
  if (isBlock && !detail) {
    throw new Error(`${code} requires a detail naming what was missing`);
  }
  const stop = { at: now(), phase, code, ...(detail ? { detail } : {}) };

  return {
    ...state,
    stops: [...state.stops, stop],
    blockCount: state.blockCount + (isBlock ? 1 : 0),
    runway: { current: 0, best: Math.max(state.runway.best, state.runway.current) },
    lastUpdated: now(),
  };
}

// Is the phase before this one approved? Fail closed - a missing state file, an
// unknown phase, or a phase whose predecessor is anything other than approved all
// return not-open. The journey phase asks this before it will run, which is the
// master skill's HARD-GATE expressed as a check rather than as a sentence a model
// can forget: the baseline agent did not defy the order, it simply moved on.
//
// The first phase has no predecessor, so it is always open.
function gateOpen(state, phase) {
  if (!PHASES.includes(phase)) return { ok: false, reason: `unknown phase: ${phase}` };
  const i = PHASES.indexOf(phase);
  if (i === 0) return { ok: true, reason: null };
  if (!state || !state.phases) return { ok: false, reason: 'no state - cannot confirm the previous phase' };

  const prior = PHASES[i - 1];
  const status = (state.phases[prior] || {}).status;
  return status === 'approved'
    ? { ok: true, reason: null }
    : { ok: false, reason: `${prior} is ${status || 'unknown'} - approve it first` };
}

function appendLedger(workspace, slug, line) {
  const dir = path.join(workspace, 'projects', slug);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'progress.md');
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, `# 진행 원장 — ${slug}\n\n`, 'utf8');
  }
  fs.appendFileSync(file, `- ${now()}  ${line}\n`, 'utf8');
  return file;
}

module.exports = {
  PHASES,
  STOP_CODES,
  PHASE_REQUIREMENTS,
  MODES,
  requirementsFor,
  label,
  resolveWorkspace,
  initState,
  readState,
  writeState,
  advancePhase,
  recordStop,
  checkPhaseFile,
  gateOpen,
  appendLedger,
};
