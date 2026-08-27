#!/usr/bin/env node
// Preserve the current version of a file before it is rewritten.
// Usage: node scripts/revise.mjs <file> [<file>...]
//
// Run this before a loopback rewrites a screen. The QA round that demanded the
// change keeps its iteration file; without this the version it judged is gone.

import { createRequire } from 'node:module';
const { archive } = createRequire(import.meta.url)('./lib/history.js');

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('usage: node scripts/revise.mjs <file> [<file>...]');
  process.exit(2);
}

let saved = 0;
for (const f of files) {
  const target = archive(f);
  if (target) {
    saved += 1;
    console.log(`${f} -> ${target}`);
  } else {
    console.log(`${f} (없음 — 첫 작성, 보존할 것 없음)`);
  }
}
console.log(`${saved}/${files.length} archived`);
