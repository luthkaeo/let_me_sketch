---
description: Print one timeline of decisions, phase events, and preserved revisions
argument-hint: "<project dir>"
---

Run `node scripts/trace.mjs $1` and show the timeline. Reads only, changes nothing.

`$1` is a project directory under `.prosona/projects/`. Add `--ledger <path>` when the
decision registry is not at the default `.prosona/decisions.json`.
