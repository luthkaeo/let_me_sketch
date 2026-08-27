#!/usr/bin/env node
// Render every screen spec in a directory into one reviewable HTML file.
// Usage: node scripts/render-screens.mjs <50_screens dir> [out.html]
//
// Default output: <dir>/preview.html. Zero dependencies, single file, opens in a
// browser - a preview that needs a build step is a preview nobody looks at.

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const { renderScreens } = createRequire(import.meta.url)('./lib/render.js');

const dir = process.argv[2];
if (!dir) {
  console.error('usage: node scripts/render-screens.mjs <50_screens dir> [out.html]');
  process.exit(2);
}
const out = process.argv[3] || join(dir, 'preview.html');

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

const specs = [];
let failed = 0;
for (const f of files) {
  try {
    specs.push(JSON.parse(readFileSync(join(dir, f), 'utf8')));
  } catch (e) {
    failed += 1;
    console.log(`${f}\n   not valid JSON: ${e.message}`);
  }
}

let html;
try {
  html = renderScreens(specs);
} catch (e) {
  console.error(e.message);
  process.exit(1);
}

writeFileSync(out, html, 'utf8');
readFileSync(out, 'utf8'); // verify before claiming success
console.log(failed ? `${specs.length} screens -> ${out} (${failed} unreadable)` : `${specs.length} screens -> ${out}`);
process.exit(failed ? 1 : 0);
