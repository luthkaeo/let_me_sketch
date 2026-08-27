'use strict';
// Figma conversion tests. Run: node --test scripts/lib/figma.test.js

const { test } = require('node:test');
const assert = require('node:assert');

const { toFigmaDocument } = require('./figma');

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

test('the three states become sibling frames on one page', () => {
  // Split across pages they stop being comparable, and comparison is why all
  // three are required in the first place.
  const doc = toFigmaDocument(spec());
  assert.deepStrictEqual(
    doc.page.children.map((c) => c.prosonaState),
    ['default', 'empty', 'error']
  );
  assert.deepStrictEqual(doc.page.children.map((c) => c.name), ['기본', '빈 상태', '에러']);
});

test('an invalid spec is refused rather than converted', () => {
  const broken = spec();
  broken.states.empty = { tree: [] };
  assert.throws(() => toFigmaDocument(broken), /invalid screen spec S-01/);
});

test('a stack becomes an auto-layout frame with its direction and spacing', () => {
  const doc = toFigmaDocument(
    spec({
      states: {
        default: {
          tree: [
            {
              type: 'stack',
              direction: 'horizontal',
              spacing: 24,
              children: [{ type: 'text', content: '가' }],
            },
          ],
        },
        empty: { tree: [{ type: 'text', content: '나' }] },
        error: { tree: [{ type: 'text', content: '다' }] },
      },
    })
  );
  const frame = doc.page.children[0].children[0];
  assert.strictEqual(frame.layoutMode, 'HORIZONTAL');
  assert.strictEqual(frame.itemSpacing, 24);
});

test('a grid keeps its column count for the plugin to size against', () => {
  const doc = toFigmaDocument(
    spec({
      states: {
        default: {
          tree: [{ type: 'grid', columns: 3, children: [{ type: 'image', alt: '배지' }] }],
        },
        empty: { tree: [{ type: 'text', content: '나' }] },
        error: { tree: [{ type: 'text', content: '다' }] },
      },
    })
  );
  const grid = doc.page.children[0].children[0];
  assert.strictEqual(grid.layoutWrap, 'WRAP');
  assert.strictEqual(grid.prosonaColumns, 3);
});

test('copy survives conversion verbatim', () => {
  // The words in the spec are the words the persona reads. A converter that
  // paraphrases would make the review of the render meaningless.
  const doc = toFigmaDocument(spec());
  assert.strictEqual(doc.page.children[1].children[0].characters, '아직 채운 동물이 없어요');
});

test('a button carries its label as a text child', () => {
  const doc = toFigmaDocument(
    spec({
      states: {
        default: { tree: [{ type: 'button', variant: 'primary', content: '코스 만들기' }] },
        empty: { tree: [{ type: 'text', content: '나' }] },
        error: { tree: [{ type: 'text', content: '다' }] },
      },
    })
  );
  const button = doc.page.children[0].children[0];
  assert.strictEqual(button.name, 'button/primary');
  assert.strictEqual(button.children[0].characters, '코스 만들기');
});

test('conversion is deterministic', () => {
  assert.deepStrictEqual(toFigmaDocument(spec()), toFigmaDocument(spec()));
});
