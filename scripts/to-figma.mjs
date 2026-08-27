#!/usr/bin/env node
// Convert every screen spec in a directory into Figma-importable documents.
// Usage: node scripts/to-figma.mjs <50_screens dir>
//
// Output: <dir>/figma/<name>.figma.json, one per screen. A Figma plugin reads
// these; there is no API call, no token, and no account state involved.

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, basename } from 'node:path';
import { createRequire } from 'node:module';

const { toFigmaDocument } = createRequire(import.meta.url)('./lib/figma.js');

const dir = process.argv[2];
if (!dir) {
  console.error('usage: node scripts/to-figma.mjs <50_screens dir>');
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
  console.error(`no screen spec JSON in ${dir}`);
  process.exit(1);
}

const outDir = join(dir, 'figma');
mkdirSync(outDir, { recursive: true });

let failed = 0;
let written = 0;
for (const f of files) {
  try {
    const doc = toFigmaDocument(JSON.parse(readFileSync(join(dir, f), 'utf8')));
    const out = join(outDir, `${basename(f, '.json')}.figma.json`);
    writeFileSync(out, JSON.stringify(doc, null, 2) + '\n', 'utf8');
    readFileSync(out, 'utf8'); // verify before counting it
    written += 1;
  } catch (e) {
    failed += 1;
    console.log(`${f}\n   ${e.message}`);
  }
}

console.log(failed ? `${written} converted, ${failed} failed` : `${written} screens -> ${outDir}`);
process.exit(failed ? 1 : 0);
