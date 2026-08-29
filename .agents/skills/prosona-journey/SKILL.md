---
name: prosona-journey
description: Use when user personas are approved and the step-by-step path each persona takes through the service has not been mapped yet.
license: MIT
---

# Prosona Journey

Phase `30_journey`. Produces `30_journey.md`, then **GATE 3**.

## 1. Refuse to start before GATE 2

Read `.prosona/state.json` and call `gateOpen(state, '30_journey')`. Not open → stop and
send the caller to `prosona-frame`. Say which file is missing and why the order matters
— a journey drawn before its personas exist is a journey for nobody, and everything
downstream inherits that.

This is the master skill's HARD-GATE made mechanical. It fails closed: unreadable state
and an unapproved state are treated the same way.

State and files disagree → the files win. A present, complete `10_service-brief.md` +
`20_user-personas.md` pair that `checkPhaseFile` passes is an approved frame whose state
entry was lost; repair the state and continue rather than re-running the phase.

## 2. Run it

Dispatch `screen-designer` (sonnet) with `mode=journey`, the input paths, and the output
path. Paths, not contents.

Inputs: `10_service-brief.md`, `20_user-personas.md`, `.prosona/planner-persona.md`.

One journey per persona, in one file, each under its own heading.

## 3. IDs are the interface

Steps are `J-001`, `J-002`, … The reference phase queries per `J-NNN`, screen specs
carry `journey: "J-001"`, and the ledger hangs decisions off them. Renumbering later
breaks all three, so number once and keep the numbers even when a step is cut — a gap
in the sequence is cheaper than a shifted reference.

## 4. Complete when

`checkPhaseFile('30_journey', '30_journey.md', mode)` returns ok: `## 실패 경로`,
`## 내가 결정한 것`, `## 미해결` — and in `improve` mode `## as-is 여정`, `## 변경점`.

Also true before you call it done, and not checked by string matching:

- every **상** risk step has a failure-path row
- every decision row quotes a `C-NNN` or a `P-X`
- `addDecision` accepted each one (it refuses a decision that depends on nothing)

Then GATE 3 in the master skill's format.

## 5. `ultra`

GATE 3 is skipped, the phase is not. The `내가 결정한 것` block is written and appended
to `progress.md` instead of being presented, so the planner can reconstruct the
judgment trail afterwards. Skipping the gate removes the pause, never the record.
