#!/usr/bin/env node
'use strict';
// Prosona UserPromptSubmit hook — intensity switching only.
//
// Deliberately silent on every prompt that is not a /prosona command. Re-injecting
// rules on every turn is the exact context accumulation this project exists to
// remove: it would shorten runway, not extend it.
//
// Intensity is the runway dial:
//   lite  -> runway 1    (no persona yet, direction unclear)
//   full  -> runway 1-2  (new domain)
//   ultra -> runway 4    (persona fixed - the target state)

const fs = require('fs');
const path = require('path');

const LEVELS = ['lite', 'full', 'ultra'];
const RUNWAY = { lite: 1, full: 2, ultra: 4 };

function findWorkspace(start) {
  let dir = start;
  for (let i = 0; i < 12; i += 1) {
    const candidate = path.join(dir, '.prosona');
    if (fs.existsSync(path.join(candidate, 'state.json'))) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

function setIntensity(workspace, level) {
  const file = path.join(workspace, 'state.json');
  const state = JSON.parse(fs.readFileSync(file, 'utf8'));
  const next = { ...state, intensity: level, lastUpdated: new Date().toISOString() };
  fs.writeFileSync(file, JSON.stringify(next, null, 2) + '\n', 'utf8');
}

function emit(text) {
  const body = JSON.stringify(text).slice(1, -1);
  process.stdout.write(
    `{\n  "hookSpecificOutput": {\n    "hookEventName": "UserPromptSubmit",\n    "additionalContext": "${body}"\n  }\n}\n`
  );
}

let input = '';
process.stdin.on('data', (c) => { input += c; });
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input.replace(/^﻿/, ''));
    const prompt = String(data.prompt || '').trim();

    // Only /prosona commands produce output. Everything else: silence.
    if (!/^[/@$]prosona\b/i.test(prompt)) return process.exit(0);

    const arg = (prompt.split(/\s+/)[1] || '').toLowerCase();
    const workspace = findWorkspace(process.cwd());

    if (!LEVELS.includes(arg)) {
      // Bare /prosona (or an unknown arg): report, do not change anything.
      if (!workspace) {
        emit('PROSONA — no project in this directory. Run the interview or frame phase to start one.');
      } else {
        const state = JSON.parse(fs.readFileSync(path.join(workspace, 'state.json'), 'utf8'));
        emit(
          `PROSONA — intensity ${state.intensity}, phase ${state.currentPhase}, ` +
          `runway ${state.runway.current} (best ${state.runway.best}), unplanned stops ${state.blockCount}.`
        );
      }
      return process.exit(0);
    }

    if (!workspace) {
      emit(`PROSONA — intensity ${arg} noted, but no project state exists here yet. It applies once a project is initialised.`);
      return process.exit(0);
    }

    setIntensity(workspace, arg);
    emit(
      `PROSONA INTENSITY — ${arg}. Target runway ${RUNWAY[arg]} consecutive phases without a human touch. ` +
      (arg === 'ultra'
        ? 'GATE 2 and GATE 3 are skipped; GATE 1 and GATE 4 remain and are never removed.'
        : 'All four gates active.')
    );
  } catch {
    // Silence beats breaking the user's prompt.
  }
  process.exit(0);
});
