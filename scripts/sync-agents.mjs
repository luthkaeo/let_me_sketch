#!/usr/bin/env node
// Mirror the skills into .agents/skills/ and inline the master skill into AGENTS.md.
// Usage: node scripts/sync-agents.mjs
//
// Codex has no hook injection, so the file itself is the injection point: whatever
// AGENTS.md says between the markers is what that harness knows about Prosona.
//
// Idempotent by construction - the mirror is rebuilt from scratch and the marker
// block is replaced, never appended to. Running it twice leaves the tree identical,
// which is what the plan's verification checks.

import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const BEGIN = '<!-- PROSONA:BEGIN -->';
const END = '<!-- PROSONA:END -->';

const skillsDir = join(root, 'skills');
const mirrorDir = join(root, '.agents', 'skills');
const masterSkill = join(skillsDir, 'prosona', 'SKILL.md');
const agentsFile = join(root, 'AGENTS.md');

if (!existsSync(masterSkill)) {
  console.error(`missing ${masterSkill} - nothing to mirror`);
  process.exit(1);
}

// Rebuild rather than merge: a skill deleted from skills/ must disappear from the
// mirror too, and a merge would keep serving it.
rmSync(mirrorDir, { recursive: true, force: true });
mkdirSync(dirname(mirrorDir), { recursive: true });
cpSync(skillsDir, mirrorDir, { recursive: true });

const master = readFileSync(masterSkill, 'utf8');
const doc = readFileSync(agentsFile, 'utf8');

const start = doc.indexOf(BEGIN);
const end = doc.indexOf(END);
if (start === -1 || end === -1 || end < start) {
  console.error(`AGENTS.md is missing the ${BEGIN} / ${END} markers`);
  process.exit(1);
}

const next =
  doc.slice(0, start + BEGIN.length) + '\n\n' + master.trim() + '\n\n' + doc.slice(end);

if (next !== doc) writeFileSync(agentsFile, next, 'utf8');

readFileSync(agentsFile, 'utf8'); // verify before claiming success
console.log(`mirrored ${skillsDir} -> ${mirrorDir}`);
console.log(`inlined master skill into ${agentsFile}`);
