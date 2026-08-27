---
name: prosona-frame
description: Use when a service or feature idea exists but its target user, core pain, constraints, and success metric are not written down yet.
license: MIT
---

# Prosona Frame

Phase `10_frame`. Produces `10_service-brief.md` and `20_user-personas.md`, then
**GATE 1**.

This is the phase the unaided baseline skipped. It wrote measured constraints, a
product definition, a journey and nine screens — and never named a target user or a
single persona. It did not ask and did not flag the gap. That is why completeness here
is checked by code, not claimed in prose.

## 1. Resume first

Read `.prosona/state.json` and the two output files. Present and complete → report
where the loop stands and move on to `prosona-journey`. Present and partial → continue
that file; do not start over.

## 2. Mode decides what evidence counts

`new` — constraints come from what the planner says.

`improve` — constraints are in the product already. Reconstruct the as-is *before* any
to-be: `## 현재 상태`, `## 바꾸려는 이유`, and a source for every measured number. A new
journey drawn without the current one is not an improvement, it is a different product
wearing the same name.

## 3. Run it

Dispatch `service-framer` (opus) with the template paths, the output paths, and the
mode. Do not paste template contents into the prompt.

The brief's seven questions come from `templates/service-brief.md`. `lite` asks 1, 2,
5, 7 and fills the rest as stated assumptions under `## 미해결`. `full` and `ultra` ask
all seven. **No level removes GATE 1** — direction is the one thing a long runway
cannot fix later.

## 4. Do not stop here

Between phases there are no questions. Missing input becomes a stated assumption, a
line under `## 미해결`, and `recordStop(BLOCK_CONTEXT, <what was missing>)`. That detail
is the improvement signal: it names what to add to the persona file or the constraint
table so the next run goes further without asking.

## 5. Complete when

`checkPhaseFile('10_frame', ['10_service-brief.md', '20_user-personas.md'], mode)`
returns ok. The two files are checked as a pair — the target user lives in the first,
the exit conditions in the second.

Then GATE 1, in the master skill's format: the two paths, three decisions with the
constraint or persona ID each hangs off, and the open questions.

## 6. What the next phases will hold you to

- `제약` table → every later phase checks itself against it
- `이탈 조건` → the QA phase scores screens against these sentences literally
- Constraint and persona IDs (`C-001`, `P-A`) → every downstream decision's `dependsOn`

An empty exit condition cannot be fixed in the review phase. It can only be fixed here.
