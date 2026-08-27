#!/usr/bin/env node
// Print one timeline for a project: decisions, phase events, and preserved revisions.
// Usage: node scripts/trace.mjs <project dir> [--ledger <decisions.json>]
//
// Reads only. To keep it, redirect to a file.

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, sep } from 'node:path';
import { createRequire } from 'node:module';

const require_ = createRequire(import.meta.url);
const { buildTrace, formatTrace } = require_('./lib/trace.js');
const { readLedger } = require_('./lib/decisions.js');
const { HISTORY_DIR } = require_('./lib/history.js');

const dir = process.argv[2];
if (!dir) {
  console.error('usage: node scripts/trace.mjs <project dir> [--ledger <decisions.json>]');
  process.exit(2);
}

const flag = process.argv.indexOf('--ledger');
// Default: the registry sits outside projects/ so decisions carry across features.
const ledgerPath = flag !== -1 ? process.argv[flag + 1] : join(dir, '..', '..', 'decisions.json');

const progressPath = join(dir, 'progress.md');
const progress = existsSync(progressPath) ? readFileSync(progressPath, 'utf8') : '';

// mtime is the only timestamp an archived file carries; the name holds the version.
let history;
try {
  history = readdirSync(dir, { recursive: true })
    .filter((f) => f.includes(HISTORY_DIR + sep))
    .map((f) => ({ file: f, at: statSync(join(dir, f)).mtime.toISOString() }));
} catch {
  console.error(`cannot read ${dir}`);
  process.exit(2);
}

console.log(formatTrace(buildTrace({ progress, ledger: readLedger(ledgerPath), history })));
