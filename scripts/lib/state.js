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

const STATE_FILE = 'state.json';
const SCHEMA_VERSION = 1;

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

function initState(workspace, { slug, language = 'ko', intensity = 'full' } = {}) {
  const phases = {};
  for (const p of PHASES) {
    phases[p] = { status: 'pending', file: null, approvedAt: null };
  }
  return {
    version: SCHEMA_VERSION,
    slug,
    language,
    intensity,
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
function advancePhase(state, phase, { status, file = null } = {}) {
  if (!PHASES.includes(phase)) {
    throw new Error(`unknown phase: ${phase}`);
  }
  const approved = status === 'approved';
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
  resolveWorkspace,
  initState,
  readState,
  writeState,
  advancePhase,
  recordStop,
  appendLedger,
};
