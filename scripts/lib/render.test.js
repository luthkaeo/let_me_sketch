'use strict';
// Wireframe render tests. Run: node --test scripts/lib/render.test.js

const { test } = require('node:test');
const assert = require('node:assert');

const { renderScreens, renderScreen } = require('./render');

function spec(overrides = {}) {
  const state = (content) => ({ tree: [{ type: 'text', role: 'title', content }] });
  return {
    id: 'S-01',
    name: '도감 홈',
    journey: 'J-001',
    states: {
      default: state('나의 동물도감'),
      empty: state('아직 채운 동물이 없어요'),
      error: state('기록을 불러오지 못했어요'),
    },
    ...overrides,
  };
}

test('all three states are rendered, labelled, in order', () => {
  const html = renderScreen(spec());
  assert.ok(html.includes('기본'));
  assert.ok(html.includes('빈 상태'));
  assert.ok(html.includes('에러'));
  assert.ok(html.indexOf('빈 상태') < html.indexOf('에러'));
});

test('only the words in the spec appear', () => {
  // A renderer that fills gaps with plausible copy makes an empty spec look
  // finished - the exact failure this project is built around.
  const html = renderScreen(spec());
  assert.ok(html.includes('아직 채운 동물이 없어요'));
  assert.ok(!/Lorem|샘플|예시 텍스트|placeholder text/i.test(html));
});

test('content is escaped, not interpreted', () => {
  const s = spec();
  s.states.default.tree = [{ type: 'text', content: '<script>alert(1)</script>' }];
  const html = renderScreen(s);
  assert.ok(!html.includes('<script>alert(1)</script>'));
  assert.ok(html.includes('&lt;script&gt;'));
});

test('an invalid spec is refused rather than drawn', () => {
  const broken = spec();
  broken.states.error = { tree: [] };
  assert.throws(() => renderScreen(broken), /invalid screen spec S-01/);
});

test('rendering is deterministic', () => {
  // No timestamps, no ids, no ordering by object key insertion. Two runs of the
  // same specs must diff clean, or the preview cannot be committed or compared.
  assert.strictEqual(renderScreens([spec()]), renderScreens([spec()]));
});

test('an image renders as a labelled box carrying its alt text', () => {
  const s = spec();
  s.states.default.tree = [{ type: 'image', alt: '고래 배지', aspect: '16:9' }];
  const html = renderScreen(s);
  assert.ok(html.includes('고래 배지'));
  assert.ok(html.includes('aspect-ratio:16/9'));
});

test('several screens render into one document', () => {
  const html = renderScreens([spec(), spec({ id: 'S-02', name: '코스 상세' })]);
  assert.ok(html.startsWith('<!doctype html>'));
  assert.ok(html.includes('S-01') && html.includes('S-02'));
});
