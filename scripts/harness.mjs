#!/usr/bin/env node
// Audit the loop's own execution: model routing, unplanned stops, cost, and
// whether the loop ever closed.
// Usage: node scripts/harness.mjs [.prosona dir]
//
// Reads only. Every finding names the fix, because a finding the next run
// cannot act on is a complaint.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const { auditRun, formatAudit } = createRequire(import.meta.url)('./lib/harness.js');

const ws = process.argv[2] || '.prosona';
let state;
try {
  state = JSON.parse(readFileSync(join(ws, 'state.json'), 'utf8'));
} catch {
  console.error(`cannot read ${join(ws, 'state.json')}`);
  process.exit(2);
}

const audit = auditRun(state);
console.log(formatAudit(audit));
// A defective harness is not a crashed one: exit 1 so a gate can act on it.
process.exit(audit.findings.length ? 1 : 0);
