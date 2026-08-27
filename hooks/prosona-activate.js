#!/usr/bin/env node
'use strict';
// Prosona SessionStart hook.
//
// Injects the master skill plus a one-line status of where the loop stands.
// The `compact` matcher is the point of this hook: context compaction is what
// caps how long the loop can run unattended, so the state has to be re-seeded
// the moment it happens.
//
// This hook never fails the session. Any error exits 0 with no output.

const fs = require('fs');
const path = require('path');

function pluginRoot() {
  const env = process.env.CLAUDE_PLUGIN_ROOT;
  if (env && env.trim()) return env.trim();
  return path.join(__dirname, '..');
}

function readSkill(root) {
  try {
    return fs.readFileSync(path.join(root, 'skills', 'prosona', 'SKILL.md'), 'utf8');
  } catch {
    return '';
  }
}

// Walk up from cwd looking for a .prosona workspace, so the hook works from a
// subdirectory of the planning project.
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

function statusLine(workspace) {
  if (!workspace) return '';
  let state;
  try {
    state = JSON.parse(fs.readFileSync(path.join(workspace, 'state.json'), 'utf8'));
  } catch {
    return '';
  }
  const phase = state.currentPhase || 'unknown';
  const status = (state.phases && state.phases[phase] && state.phases[phase].status) || 'unknown';
  const runway = state.runway || { current: 0, best: 0 };
  const blocks = state.blockCount || 0;

  return [
    '',
    '## Prosona — current run',
    `- project: ${state.slug || '(unnamed)'} · intensity: ${state.intensity || 'full'}`,
    `- phase: ${phase} (${status}) · next: ${state.nextPhase || 'none'}`,
    `- runway: ${runway.current} (best ${runway.best}) · unplanned stops: ${blocks}`,
    `- state file: ${path.join(workspace, 'state.json')}`,
    '',
    'Read the state and the phase files before asking anything. Files win when they disagree with state.',
  ].join('\n');
}

function emit(text) {
  const payload = JSON.stringify(text);
  const body = payload.slice(1, -1); // strip the quotes JSON.stringify added

  if (process.env.CURSOR_PLUGIN_ROOT) {
    process.stdout.write(`{\n  "additional_context": "${body}"\n}\n`);
  } else if (process.env.CLAUDE_PLUGIN_ROOT && !process.env.COPILOT_CLI) {
    process.stdout.write(
      `{\n  "hookSpecificOutput": {\n    "hookEventName": "SessionStart",\n    "additionalContext": "${body}"\n  }\n}\n`
    );
  } else {
    process.stdout.write(`{\n  "additionalContext": "${body}"\n}\n`);
  }
}

try {
  const root = pluginRoot();
  const skill = readSkill(root);
  const status = statusLine(findWorkspace(process.cwd()));
  const context = [skill, status].filter(Boolean).join('\n');
  if (context) emit(context);
} catch {
  // A hook that blocks the session is worse than a hook that does nothing.
}

process.exit(0);
