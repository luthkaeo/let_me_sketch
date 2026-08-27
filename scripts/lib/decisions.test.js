'use strict';
// Decision ledger tests. Run: node --test scripts/lib/decisions.test.js

const { test } = require('node:test');
const assert = require('node:assert');
const os = require('os');
const fs = require('fs');
const path = require('path');

const {
  ID_KINDS,
  emptyLedger,
  registerNode,
  addDecision,
  impactOf,
  readLedger,
  writeLedger,
  validateLedger,
} = require('./decisions');

function seeded() {
  let l = emptyLedger();
  l = registerNode(l, 'C-003', '가입 마찰 최소화');
  l = registerNode(l, 'P-A', '수집형 러너');
  l = registerNode(l, 'J-002', '온보딩');
  l = registerNode(l, 'S-01', '도감 홈');
  l = registerNode(l, 'S-02', '기록 카드');
  return l;
}

test('ID_KINDS covers constraint, persona, journey step, screen and decision', () => {
  assert.deepStrictEqual(Object.keys(ID_KINDS).sort(), ['C', 'D', 'J', 'P', 'S']);
});

test('registerNode rejects an id that does not match the scheme', () => {
  assert.throws(() => registerNode(emptyLedger(), 'X-1', '뭔가'), /unknown id kind/i);
  assert.throws(() => registerNode(emptyLedger(), 'C3', '뭔가'), /malformed id/i);
});

test('addDecision assigns sequential D ids and does not mutate the ledger', () => {
  const before = seeded();
  const first = addDecision(before, {
    phase: '30_journey',
    what: '온보딩을 3단계로 압축',
    why: 'P-A 이탈조건: 4단계 이상이면 닫음',
    dependsOn: ['C-003', 'P-A'],
    affects: ['S-01', 'S-02'],
  });

  assert.strictEqual(first.id, 'D-001');
  assert.strictEqual(before.decisions.length, 0, 'input ledger must be untouched');
  assert.strictEqual(first.ledger.decisions.length, 1);

  const second = addDecision(first.ledger, {
    phase: '30_journey',
    what: '본인확인을 여정 후반으로',
    why: 'C-003 제약',
    dependsOn: ['C-003'],
  });
  assert.strictEqual(second.id, 'D-002');
});

test('a decision without evidence is not a decision', () => {
  assert.throws(
    () => addDecision(seeded(), { phase: '30_journey', what: '온보딩 압축', dependsOn: ['C-003'] }),
    /why/i,
    'the whole point of the ledger is recoverable rationale'
  );
});

test('a decision that depends on nothing is rejected', () => {
  assert.throws(
    () => addDecision(seeded(), { phase: '30_journey', what: 'X', why: 'Y', dependsOn: [] }),
    /dependsOn/i,
    'a decision grounded in nothing cannot be impact-analysed later'
  );
});

test('referencing an unregistered id fails closed', () => {
  assert.throws(
    () => addDecision(seeded(), { phase: '30_journey', what: 'X', why: 'Y', dependsOn: ['C-999'] }),
    /C-999/,
    'a typo must break the graph loudly, not silently'
  );
});

test('a decision becomes a node other decisions can depend on', () => {
  const l0 = seeded();
  const a = addDecision(l0, { phase: '30_journey', what: '온보딩 3단계', why: 'P-A', dependsOn: ['C-003'] });
  const b = addDecision(a.ledger, { phase: '50_screens', what: '진행바 제거', why: '3단계면 불필요', dependsOn: ['D-001'] });

  assert.strictEqual(b.id, 'D-002');
  assert.ok(b.ledger.nodes['D-001'], 'decisions register themselves as nodes');
});

test('impactOf finds decisions that depend on a node, transitively', () => {
  let l = seeded();
  l = addDecision(l, { phase: '30_journey', what: '온보딩 3단계', why: 'P-A', dependsOn: ['C-003'] }).ledger;
  l = addDecision(l, { phase: '50_screens', what: '진행바 제거', why: '3단계면 불필요', dependsOn: ['D-001'] }).ledger;
  l = addDecision(l, { phase: '50_screens', what: '지도 기본 축소', why: '무관', dependsOn: ['P-A'] }).ledger;

  const hit = impactOf(l, 'C-003').map((d) => d.id);
  assert.deepStrictEqual(hit, ['D-001', 'D-002'], 'the chain must surface, not just the direct dependant');
  assert.ok(!hit.includes('D-003'), 'unrelated decisions stay out');
});

test('impactOf on a node nothing depends on returns empty', () => {
  assert.deepStrictEqual(impactOf(seeded(), 'S-02'), []);
});

test('impactOf terminates on a dependency cycle', () => {
  let l = seeded();
  l = addDecision(l, { phase: '30_journey', what: 'A', why: 'r', dependsOn: ['C-003'] }).ledger;
  l = addDecision(l, { phase: '30_journey', what: 'B', why: 'r', dependsOn: ['D-001'] }).ledger;
  // Force a cycle the API would normally prevent, to prove traversal is safe.
  l = { ...l, decisions: l.decisions.map((d) => (d.id === 'D-001' ? { ...d, dependsOn: ['D-002'] } : d)) };

  const ids = impactOf(l, 'D-002').map((d) => d.id);
  assert.ok(ids.includes('D-001'), 'a cycle must not hide a real dependant');
  assert.ok(ids.length <= l.decisions.length, 'and must not loop forever');
});

test('validateLedger reports dangling references', () => {
  let l = seeded();
  l = addDecision(l, { phase: '30_journey', what: 'A', why: 'r', dependsOn: ['C-003'], affects: ['S-01'] }).ledger;
  const broken = { ...l, decisions: l.decisions.map((d) => ({ ...d, affects: ['S-99'] })) };

  const result = validateLedger(broken);
  assert.strictEqual(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes('S-99')));
});

test('writeLedger then readLedger round-trips', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'prosona-led-'));
  const file = path.join(dir, 'decisions.json');
  const l = addDecision(seeded(), { phase: '30_journey', what: 'A', why: 'r', dependsOn: ['C-003'] }).ledger;

  assert.strictEqual(writeLedger(file, l), file);
  assert.strictEqual(readLedger(file).decisions[0].what, 'A');
});

test('readLedger returns an empty ledger when the file is absent or broken', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'prosona-led-'));
  assert.deepStrictEqual(readLedger(path.join(dir, 'nope.json')), emptyLedger());

  const broken = path.join(dir, 'broken.json');
  fs.writeFileSync(broken, '{ not json');
  assert.deepStrictEqual(readLedger(broken), emptyLedger());
});

test('a decision can supersede an earlier one', () => {
  // Why: the ledger recovers "why is it this way" but not "why did it change".
  // A loopback that rewrites a screen leaves the original decision standing and
  // silently wrong.
  let l = registerNode(emptyLedger(), 'C-001', '무상태');
  const first = addDecision(l, { phase: '50_screens', what: '링크를 하단에', why: 'C-001', dependsOn: ['C-001'] });
  const second = addDecision(first.ledger, {
    phase: '50_screens',
    what: '링크를 상단으로',
    why: 'P-A 이탈 조건',
    dependsOn: ['C-001'],
    supersedes: first.id,
  });

  const d = second.ledger.decisions.find((x) => x.id === second.id);
  assert.strictEqual(d.supersedes, first.id);
});

test('superseding an id that is not a decision is refused', () => {
  let l = registerNode(emptyLedger(), 'C-001', '무상태');
  assert.throws(
    () => addDecision(l, { phase: '50_screens', what: 'x', why: 'y', dependsOn: ['C-001'], supersedes: 'C-001' }),
    /supersedes/
  );
});

test('validateLedger reports a dangling supersedes', () => {
  let l = registerNode(emptyLedger(), 'C-001', '무상태');
  const { ledger } = addDecision(l, { phase: '50_screens', what: 'x', why: 'y', dependsOn: ['C-001'] });
  ledger.decisions[0].supersedes = 'D-099'; // hand-edited file
  const r = validateLedger(ledger);
  assert.strictEqual(r.ok, false);
  assert.ok(r.errors.some((e) => /D-099/.test(e)), r.errors.join(' | '));
});
