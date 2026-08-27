'use strict';
// Screen spec schema tests. Run: node --test scripts/lib/screenspec.test.js

const { test } = require('node:test');
const assert = require('node:assert');

const { NODE_TYPES, REQUIRED_STATES, validateScreenSpec } = require('./screenspec');

function spec(overrides = {}) {
  const state = () => ({
    tree: [
      {
        type: 'stack',
        direction: 'vertical',
        spacing: 16,
        children: [{ type: 'text', role: 'title', content: '나의 동물도감' }],
      },
    ],
  });
  return {
    id: 'S-01',
    name: '도감 홈',
    journey: 'J-003',
    states: { default: state(), empty: state(), error: state() },
    ...overrides,
  };
}

test('REQUIRED_STATES is the three the planning ladder never simplifies away', () => {
  assert.deepStrictEqual(REQUIRED_STATES, ['default', 'empty', 'error']);
});

test('NODE_TYPES map onto Figma auto-layout primitives', () => {
  for (const t of ['stack', 'grid', 'text', 'image', 'button', 'input', 'divider']) {
    assert.ok(NODE_TYPES.includes(t), 'missing node type: ' + t);
  }
});

test('a complete spec validates', () => {
  assert.deepStrictEqual(validateScreenSpec(spec()), { ok: true, errors: [] });
});

test('a missing empty state is named as the gap', () => {
  const s = spec();
  delete s.states.empty;
  const r = validateScreenSpec(s);
  assert.strictEqual(r.ok, false);
  assert.ok(r.errors.some((e) => e.includes('empty')));
});

test('a state present but with an empty tree does not count as present', () => {
  const s = spec();
  s.states.error = { tree: [] };
  const r = validateScreenSpec(s);
  assert.strictEqual(r.ok, false);
  assert.ok(
    r.errors.some((e) => e.includes('error')),
    'a declared-but-empty state is the loophole a string check would miss'
  );
});

test('ids must follow the registry scheme so the decision graph can link them', () => {
  assert.strictEqual(validateScreenSpec(spec({ id: 'screen-1' })).ok, false);
  assert.strictEqual(validateScreenSpec(spec({ journey: 'onboarding' })).ok, false);
});

test('an unknown node type is rejected', () => {
  const s = spec();
  s.states.default.tree[0].children.push({ type: 'carousel', content: 'x' });
  const r = validateScreenSpec(s);
  assert.strictEqual(r.ok, false);
  assert.ok(r.errors.some((e) => e.includes('carousel')));
});

test('a stack without a direction cannot be laid out', () => {
  const s = spec();
  delete s.states.default.tree[0].direction;
  const r = validateScreenSpec(s);
  assert.strictEqual(r.ok, false);
  assert.ok(r.errors.some((e) => e.includes('direction')));
});

test('a text node without content is a placeholder, not a spec', () => {
  const s = spec();
  s.states.default.tree[0].children = [{ type: 'text', role: 'title' }];
  const r = validateScreenSpec(s);
  assert.strictEqual(r.ok, false);
  assert.ok(r.errors.some((e) => e.includes('content')));
});

test('nested violations are found, not just top-level ones', () => {
  const s = spec();
  s.states.default.tree[0].children = [
    { type: 'stack', direction: 'horizontal', children: [{ type: 'button' }] },
  ];
  const r = validateScreenSpec(s);
  assert.strictEqual(r.ok, false);
  assert.ok(r.errors.some((e) => e.includes('content')), 'a button with no label is not shippable');
});

test('every error names the state it came from', () => {
  const s = spec();
  s.states.empty.tree[0].children = [{ type: 'text', role: 'title' }];
  const r = validateScreenSpec(s);
  assert.ok(r.errors.every((e) => /^(id|name|journey|states|empty|default|error)/.test(e)), r.errors.join(' | '));
});
