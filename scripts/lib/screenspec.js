'use strict';
// Screen spec schema — the machine-readable half of a screen.
//
// Each screen ships as a pair: a markdown file a person reads, and this JSON a
// machine checks and (later) converts. Prose lets "빈 상태" be a heading with
// nothing under it; the schema does not.
//
// Node types are chosen to map onto Figma auto-layout without translation loss:
//   stack{direction,spacing,children}  -> auto-layout frame
//   grid{columns,children}             -> wrapped auto-layout
//   text/image/button/input/divider    -> leaf nodes
// Keeping the shape Figma-compatible now means the exporter is a later, separate
// script rather than a rewrite of every spec already written.

const NODE_TYPES = ['stack', 'grid', 'text', 'image', 'button', 'input', 'divider'];
const REQUIRED_STATES = ['default', 'empty', 'error'];
const CONTAINER_TYPES = ['stack', 'grid'];
const CONTENT_TYPES = ['text', 'button', 'input'];

const SCREEN_ID = /^S-[A-Za-z0-9]+$/;
const JOURNEY_ID = /^J-[A-Za-z0-9]+$/;

function validateScreenSpec(spec) {
  const errors = [];

  if (!spec || typeof spec !== 'object') return { ok: false, errors: ['states: spec is not an object'] };
  if (!SCREEN_ID.test(spec.id || '')) errors.push(`id: "${spec.id}" must look like S-01`);
  if (!spec.name) errors.push('name: required');
  if (!JOURNEY_ID.test(spec.journey || '')) errors.push(`journey: "${spec.journey}" must look like J-003`);

  const states = spec.states || {};
  for (const key of REQUIRED_STATES) {
    const state = states[key];
    if (!state) {
      errors.push(`${key}: state is required — the ladder shortens screens, never states`);
      continue;
    }
    if (!Array.isArray(state.tree) || state.tree.length === 0) {
      errors.push(`${key}: tree is empty — a declared state with no content is not a state`);
      continue;
    }
    state.tree.forEach((node, i) => walk(node, `${key}.tree[${i}]`, errors));
  }

  return { ok: errors.length === 0, errors };
}

function walk(node, where, errors) {
  if (!node || typeof node !== 'object') {
    errors.push(`${where}: not a node`);
    return;
  }
  if (!NODE_TYPES.includes(node.type)) {
    errors.push(`${where}: unknown node type "${node.type}"`);
    return;
  }

  if (node.type === 'stack' && !['vertical', 'horizontal'].includes(node.direction)) {
    errors.push(`${where}: stack needs direction (vertical|horizontal)`);
  }
  if (node.type === 'grid' && !(node.columns > 0)) {
    errors.push(`${where}: grid needs a positive columns count`);
  }
  if (CONTENT_TYPES.includes(node.type) && !node.content) {
    errors.push(`${where}: ${node.type} needs content — a node with no words is a placeholder`);
  }

  if (CONTAINER_TYPES.includes(node.type)) {
    if (!Array.isArray(node.children) || node.children.length === 0) {
      errors.push(`${where}: ${node.type} has no children`);
      return;
    }
    node.children.forEach((child, i) => walk(child, `${where}.children[${i}]`, errors));
  }
}

module.exports = { NODE_TYPES, REQUIRED_STATES, validateScreenSpec };
