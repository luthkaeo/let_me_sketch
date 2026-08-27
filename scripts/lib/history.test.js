'use strict';
// Revision history tests. Run: node --test scripts/lib/history.test.js

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { archive, historyDir } = require('./history');

function tmpFile(name = '01-home.md', body = 'v1 본문\n') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'prosona-hist-'));
  const file = path.join(dir, name);
  fs.writeFileSync(file, body, 'utf8');
  return file;
}

test('archiving a file copies it into .history as v1', () => {
  // A review loopback rewrites a screen in place. Without this the QA round that
  // demanded the change survives and the version it judged does not.
  const file = tmpFile();
  const saved = archive(file);

  assert.strictEqual(path.basename(saved), '01-home.v1.md');
  assert.strictEqual(fs.readFileSync(saved, 'utf8'), 'v1 본문\n');
  assert.ok(fs.existsSync(file), 'the original stays where it is');
});

test('a second archive of the same file becomes v2', () => {
  const file = tmpFile();
  archive(file);
  fs.writeFileSync(file, 'v2 본문\n', 'utf8');
  const saved = archive(file);

  assert.strictEqual(path.basename(saved), '01-home.v2.md');
  assert.strictEqual(fs.readFileSync(saved, 'utf8'), 'v2 본문\n');
});

test('archiving a file that does not exist returns null instead of throwing', () => {
  // First write of a screen has nothing to preserve. That is not an error, and
  // making it one would put a try/catch in every caller.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'prosona-hist-'));
  assert.strictEqual(archive(path.join(dir, 'never-written.md')), null);
});

test('history lives beside the file it belongs to', () => {
  const file = tmpFile();
  assert.strictEqual(historyDir(file), path.join(path.dirname(file), '.history'));
});

test('the json half of a screen pair archives too', () => {
  const file = tmpFile('01-home.json', '{"id":"S-01"}\n');
  const saved = archive(file);
  assert.strictEqual(path.basename(saved), '01-home.v1.json');
});
