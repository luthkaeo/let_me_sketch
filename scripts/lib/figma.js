'use strict';
// Screen spec -> a document a Figma plugin can build.
//
// Not the REST API. REST needs a file key, a personal token, and team permissions,
// which is state and secrets - both of which this project refuses to hold. A plugin
// reads a JSON file the user drops in, so the same conversion works offline, in CI,
// and on someone else's machine.
//
// The schema was already shaped for auto-layout (scripts/lib/screenspec.js), so this
// is a mapping, not an interpretation. Anything that would require inventing a value
// the spec does not carry belongs in the renderer's defaults, not here.

const { validateScreenSpec, REQUIRED_STATES } = require('./screenspec');

// Korean labels: this document is opened by a person reading a Korean plan.
const STATE_LABELS = { default: '기본', empty: '빈 상태', error: '에러' };

const SCREEN_WIDTH = 375; // iPhone-class width; the specs are mobile-first
const STATE_GAP = 64;
const DEFAULT_SPACING = 8;

// Text roles carry hierarchy, not styling. Two sizes apart is enough to read a
// hierarchy in a wireframe, and picking brand type here would be inventing design.
const TEXT_ROLES = {
  title: { fontSize: 24, fontWeight: 600 },
  body: { fontSize: 16, fontWeight: 400 },
  caption: { fontSize: 13, fontWeight: 400 },
  label: { fontSize: 14, fontWeight: 500 },
};

function toFigmaDocument(spec) {
  const { ok, errors } = validateScreenSpec(spec);
  if (!ok) {
    // The converter is a consumer of the schema, not a second validator. An invalid
    // spec must fail here rather than produce a frame that looks finished.
    throw new Error(`invalid screen spec ${spec && spec.id}: ${errors.join('; ')}`);
  }

  return {
    prosona: 1,
    screen: spec.id,
    name: spec.name,
    journey: spec.journey,
    page: {
      type: 'FRAME',
      name: `${spec.id} ${spec.name}`,
      layoutMode: 'HORIZONTAL',
      itemSpacing: STATE_GAP,
      // States sit side by side on one page. Split across pages they stop being
      // comparable, and comparing them is the whole reason they are all required.
      children: REQUIRED_STATES.map((key) => stateFrame(key, spec.states[key])),
    },
  };
}

function stateFrame(key, state) {
  return {
    type: 'FRAME',
    name: STATE_LABELS[key] || key,
    prosonaState: key,
    width: SCREEN_WIDTH,
    layoutMode: 'VERTICAL',
    itemSpacing: 16,
    children: state.tree.map(node),
  };
}

function node(n) {
  switch (n.type) {
    case 'stack':
      return {
        type: 'FRAME',
        name: 'stack',
        layoutMode: n.direction === 'horizontal' ? 'HORIZONTAL' : 'VERTICAL',
        itemSpacing: n.spacing ?? DEFAULT_SPACING,
        ...(n.padding ? { padding: n.padding } : {}),
        children: n.children.map(node),
      };
    case 'grid':
      // Figma has no grid primitive; a wrapping auto-layout is the lossless form.
      // The column count is kept so the plugin can set widths instead of guessing.
      return {
        type: 'FRAME',
        name: `grid x${n.columns}`,
        layoutMode: 'HORIZONTAL',
        layoutWrap: 'WRAP',
        itemSpacing: n.spacing ?? DEFAULT_SPACING,
        prosonaColumns: n.columns,
        children: n.children.map(node),
      };
    case 'text':
      return {
        type: 'TEXT',
        name: n.role ? `text/${n.role}` : 'text',
        characters: n.content,
        ...(TEXT_ROLES[n.role] || TEXT_ROLES.body),
      };
    case 'button':
      return {
        type: 'FRAME',
        name: `button/${n.variant || 'primary'}`,
        layoutMode: 'HORIZONTAL',
        cornerRadius: 8,
        padding: { top: 12, right: 16, bottom: 12, left: 16 },
        children: [{ type: 'TEXT', name: 'label', characters: n.content, ...TEXT_ROLES.label }],
      };
    case 'input':
      return {
        type: 'FRAME',
        name: 'input',
        layoutMode: 'HORIZONTAL',
        cornerRadius: 6,
        stroke: 1,
        padding: { top: 12, right: 12, bottom: 12, left: 12 },
        children: [{ type: 'TEXT', name: 'placeholder', characters: n.content, ...TEXT_ROLES.body }],
      };
    case 'image':
      return {
        type: 'RECTANGLE',
        name: n.alt ? `image: ${n.alt}` : 'image',
        ...(n.aspect ? { prosonaAspect: n.aspect } : {}),
      };
    case 'divider':
      return { type: 'RECTANGLE', name: 'divider', height: 1 };
    default:
      // Unreachable while validateScreenSpec runs first; kept so a schema change
      // that adds a node type fails loudly here instead of dropping it silently.
      throw new Error(`no Figma mapping for node type "${n.type}"`);
  }
}

module.exports = { toFigmaDocument, STATE_LABELS, TEXT_ROLES };
