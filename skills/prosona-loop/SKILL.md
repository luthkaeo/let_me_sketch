---
name: prosona-loop
description: Use when the planner wants the full planning sequence run end to end with approval only at phase boundaries, or when resuming a planning project that was interrupted.
license: MIT
---

# Prosona Loop

Runs `10_frame` → `30_journey` → `40_reference` → `50_screens` → `60_review` →
`90_handoff`, stopping only at the designed gates.

The metric is runway: phases cleared in a row, unattended, with completeness checked.
Every stop that is not a gate is a defect with a name.

## 1. Ledger first

Start by reading `progress.md` and `.prosona/state.json`. Phases the ledger marks
approved are not re-run — not summarized, not "quickly verified", not re-run. After a
compaction your memory of this project is the least reliable source in the room; the
files are the most.

State and files disagree → the files win. Repair the state from the files and say in one
line what you repaired.

## 2. One subagent per phase

Never inherit the session context into a phase. The dispatch prompt carries exactly four
things:

1. one line on where this phase sits in the sequence
2. the input file **paths**
3. the output file path
4. the brief's `제약` table

**Do not paste a previous phase's output into a prompt.** Context decay is the real
ceiling on how long the loop can run; a file path costs nothing and a pasted document
costs the rest of the run.

**Do not preload.** A phase agent reads its own SKILL.md, its template, and the inputs
you named — not the other seven skills, not the libraries. Front-loading every file
"so it has context" puts eighteen documents in the first turn and pays for them on
every turn after.

## 3. Stop only at gates

No "계속할까요?" between phases. Every stop is recorded with `recordStop`, and any stop
whose code is not `GATE_*` is a defect to fix, not a judgment call that went well.

Missing input → state the assumption, write it under `## 미해결`, record
`BLOCK_CONTEXT` with what was missing, and continue. That detail is the learning signal:
it names what belongs in the persona file or the constraint table so the next run goes
further.

## 4. Models are assigned, not inherited

| phase | agent | model |
|---|---|---|
| `10_frame` | `service-framer` | opus |
| `30_journey` | `screen-designer` (mode=journey) | sonnet |
| `40_reference` | `reference-scout` | sonnet |
| `50_screens` | `screen-designer` (mode=screens) | sonnet |
| `60_review` | `virtual-user` × personas, parallel | opus |
| `90_handoff` | `handoff-packager` | sonnet |

Name the model in every dispatch. Omit it and the phase inherits the session model.

**Measured** (docs/tests/comparison.md): running all six phases inline in one opus
context cost 22 minutes and 220k tokens for four screens. The three sonnet phases do
most of the writing, so routing them correctly is the single largest lever — and the
isolation that saves the tokens is the same isolation that keeps the reviewer honest.
An inline run silently gives up both.

## 5. Stop conditions

Gate rejected · third review loopback (`BLOCK_LOOP`) · a required input file absent
(`BLOCK_INPUT`). Nothing else.

## 6. `ultra`

GATE 2 and GATE 3 are skipped; GATE 1 and GATE 4 never are. Direction and verification
are not runway costs, they are what keeps a long run from being a fast wrong answer.

Skipped gates still produce their `내가 결정한 것` block — it is appended to
`progress.md` instead of being presented. The pause is removed; the judgment trail is not.

## 7. Resume

Read the ledger, name the last approved phase, and start the next one. Report in two
sentences and continue — a resume that re-asks the framing questions has already lost the
thing this loop exists to protect.
