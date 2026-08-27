#!/usr/bin/env node
// Validate every screen spec JSON in a directory.
// Usage: node scripts/check-screens.mjs <50_screens dir>
//
// Kept as a file rather than an inline `node -e` because the paths contain
// angle-bracket placeholders and quotes that shells mangle.

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const { validateScreenSpec } = createRequire(import.meta.url)('./lib/screenspec.js');

const dir = process.argv[2];
if (!dir) {
  console.error('usage: node scripts/check-screens.mjs <50_screens dir>');
  process.exit(2);
}

let files;
try {
  files = readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
} catch {
  console.error(`cannot read ${dir}`);
  process.exit(2);
}

if (files.length === 0) {
  console.error(`no screen spec JSON in ${dir} — markdown alone is not a complete screen phase`);
  process.exit(1);
}

let invalid = 0;
for (const f of files) {
  let spec;
  try {
    spec = JSON.parse(readFileSync(join(dir, f), 'utf8'));
  } catch (e) {
    invalid += 1;
    console.log(`${f}\n   not valid JSON: ${e.message}`);
    continue;
  }
  const { ok, errors } = validateScreenSpec(spec);
  if (!ok) {
    invalid += 1;
    console.log(f);
    for (const e of errors) console.log('  ', e);
  }
}

console.log(invalid ? `${invalid} of ${files.length} invalid` : 'all screen specs valid');
process.exit(invalid ? 1 : 0);
