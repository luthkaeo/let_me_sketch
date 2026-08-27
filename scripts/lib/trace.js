'use strict';
// One timeline out of the three places the trail already lives.
//
// progress.md says when a phase passed and why a loopback happened. decisions.json
// says what was decided and on what it hangs. .history/ holds the versions a review
// judged. Each is complete on its own terms and useless for the question people
// actually ask - "why does this screen look like this now, and what did it look
// like before?" - because that answer spans all three.
//
// Reads nothing and writes nothing: callers supply the parsed inputs, which keeps
// this a pure function and the CLI a thin shell around it.

const PROGRESS_LINE = /^-\s+(\d{4}-\d{2}-\d{2}T[\d:.]+Z)\s+(.*)$/;

function buildTrace({ progress = '', ledger = { decisions: [] }, history = [] } = {}) {
  const rows = [];

  for (const line of String(progress).split('\n')) {
    const m = line.match(PROGRESS_LINE);
    // A hand-written line without a timestamp is skipped rather than fatal: the
    // ledger is append-only prose and people do edit it.
    if (m) rows.push({ at: m[1], kind: 'progress', text: m[2].trim() });
  }

  for (const d of ledger.decisions || []) {
    const replaced = d.supersedes ? ` (${d.supersedes} 대체)` : '';
    rows.push({ at: d.at, kind: 'decision', text: `${d.id}${replaced} ${d.what} — ${d.why}` });
  }

  for (const h of history) {
    rows.push({ at: h.at, kind: 'revision', text: `개정 보존 ${h.file}` });
  }

  return rows.sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0));
}

const KIND_LABEL = { progress: '진행', decision: '결정', revision: '개정' };

function formatTrace(rows) {
  if (rows.length === 0) return '기록 없음.';
  return rows.map((r) => `${r.at}  ${KIND_LABEL[r.kind]}  ${r.text}`).join('\n');
}

module.exports = { buildTrace, formatTrace };
