'use strict';
// Decision ledger — why a design is the way it is, and what breaks if you change it.
//
// Two jobs, both of which prose cannot do:
//   1. Recover rationale months later ("why is onboarding three steps?").
//   2. Stop features from tangling. A decision names what it hangs off, so changing
//      a constraint surfaces every decision built on it instead of quietly
//      invalidating them.
//
// A decision must carry evidence (why) and at least one dependency. A decision
// grounded in nothing cannot be impact-analysed later, so it is refused at write
// time rather than discovered as a gap at review time.

const fs = require('fs');

const ID_KINDS = {
  C: '제약',
  P: '페르소나',
  J: '여정단계',
  S: '화면',
  D: '결정',
};

// Shape and kind are checked separately so the error tells you which mistake you
// made: a garbled id ("C3") versus a letter that is not a kind ("X-1").
const ID_SHAPE = /^([A-Za-z])-([A-Za-z0-9]+)$/;

function parseId(id) {
  const m = typeof id === 'string' && id.match(ID_SHAPE);
  if (!m) throw new Error(`malformed id: ${id} (expected e.g. C-003, P-A, S-01)`);
  const kind = m[1].toUpperCase();
  if (!ID_KINDS[kind]) {
    throw new Error(`unknown id kind: ${id} (kinds: ${Object.keys(ID_KINDS).join(', ')})`);
  }
  return { kind, key: m[2] };
}

function emptyLedger() {
  return { version: 1, nodes: {}, decisions: [] };
}

function registerNode(ledger, id, labelText) {
  const { kind } = parseId(id);
  return {
    ...ledger,
    nodes: { ...ledger.nodes, [id]: { kind, label: labelText } },
  };
}

function nextDecisionId(ledger) {
  const n = ledger.decisions.length + 1;
  return 'D-' + String(n).padStart(3, '0');
}

function addDecision(ledger, { phase, what, why, dependsOn = [], affects = [], alternatives = [] } = {}) {
  if (!what) throw new Error('a decision needs `what`');
  if (!why) throw new Error('a decision needs `why` — rationale is the point of the ledger');
  if (!Array.isArray(dependsOn) || dependsOn.length === 0) {
    throw new Error('a decision needs at least one `dependsOn` — otherwise it cannot be impact-analysed');
  }

  for (const ref of [...dependsOn, ...affects]) {
    parseId(ref);
    if (!ledger.nodes[ref]) {
      throw new Error(`unknown reference ${ref} — register it before depending on it`);
    }
  }

  const id = nextDecisionId(ledger);
  const decision = {
    id,
    phase,
    what,
    why,
    dependsOn: [...dependsOn],
    affects: [...affects],
    alternatives: alternatives.map((a) => ({ ...a })),
    at: new Date().toISOString(),
  };

  return {
    id,
    ledger: {
      ...ledger,
      // A decision is itself a node, so later decisions can build on it.
      nodes: { ...ledger.nodes, [id]: { kind: 'D', label: what } },
      decisions: [...ledger.decisions, decision],
    },
  };
}

// Everything that would need rethinking if `id` changed, following the chain:
// a decision that depends on a decision that depends on `id` is also affected.
// Visited-set guards a cycle, which the API prevents but a hand-edited file may not.
function impactOf(ledger, id) {
  const hit = [];
  const seen = new Set([id]);
  const frontier = [id];

  while (frontier.length) {
    const current = frontier.shift();
    for (const d of ledger.decisions) {
      if (seen.has(d.id)) continue;
      if (!d.dependsOn.includes(current)) continue;
      seen.add(d.id);
      hit.push(d);
      frontier.push(d.id);
    }
  }

  return hit.sort((a, b) => a.id.localeCompare(b.id));
}

function validateLedger(ledger) {
  const errors = [];
  for (const d of ledger.decisions) {
    for (const ref of [...d.dependsOn, ...d.affects]) {
      if (!ledger.nodes[ref]) errors.push(`${d.id}: dangling reference ${ref}`);
    }
    if (!d.why) errors.push(`${d.id}: missing why`);
  }
  return { ok: errors.length === 0, errors };
}

function readLedger(file) {
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!parsed || !Array.isArray(parsed.decisions)) return emptyLedger();
    return parsed;
  } catch {
    return emptyLedger();
  }
}

function writeLedger(file, ledger) {
  fs.writeFileSync(file, JSON.stringify(ledger, null, 2) + '\n', 'utf8');
  fs.readFileSync(file, 'utf8'); // verify before returning
  return file;
}

module.exports = {
  ID_KINDS,
  parseId,
  emptyLedger,
  registerNode,
  addDecision,
  impactOf,
  validateLedger,
  readLedger,
  writeLedger,
};
