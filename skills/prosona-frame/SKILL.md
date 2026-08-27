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
where the loop stands and move on to `prosona-journey`. Present and partial → read
`## 인터뷰 로그`, say which question you last got an answer to, and continue from the
next one. Never restart an interview that has a log.

## 2. Ask first, in one thread

This is the interview. The questions here are about **the project** — what is being
built, for whom, under what constraints. `.prosona/planner-persona.md` is optional
context about the planner; missing is the normal case, not a gap. Do not record a block
for its absence and do not interview for it here.

This is the only phase that interviews, and it is the reason the rest of the loop can
run without asking. Runway counts the stretch between gates; this sits before GATE 1,
so the questions here are free to the metric and expensive to skip.

**First, the planner picks the mode.** Present it as a choice, not an open question, and
do not proceed until one is picked — it decides what counts as evidence for every phase
after it, and guessing it from the phrasing of an idea gets it wrong in both directions.

```
어느 쪽인가요?

  1. 새로 만든다 — 아이디어에서 시작. 제약은 당신이 말하는 것이 전부다.
  2. 이미 있는 걸 고친다 — 코드 경로를 알려주세요. 제약을 기억이 아니라 코드에서 측정합니다.
```

This is the one blocking question in the loop. Everything after it proceeds on stated
assumptions instead of asking.

Then the brief's seven, one at a time, skipping what they already told you. Answers go
verbatim into `## 인터뷰 로그` as they arrive; contradictions get a `GAP:` tag naming
both sides.

Stop when the seven sections are filled and two or more personas have falsifiable exit
conditions — not when the user seems done answering.

## 3. Mode decides what evidence counts

`new` — constraints come from what the planner says.

`improve` — constraints are in the product already. Reconstruct the as-is *before* any
to-be: `## 현재 상태`, `## 바꾸려는 이유`, and a source for every measured number. A new
journey drawn without the current one is not an improvement, it is a different product
wearing the same name.

## 4. Run it

Dispatch `service-framer` (opus) with the template paths, the output paths, and the
mode. Do not paste template contents into the prompt.

The brief's seven questions come from `templates/service-brief.md`. `lite` asks 1, 2,
5, 7 and fills the rest as stated assumptions under `## 미해결`. `full` and `ultra` ask
all seven. **No level removes GATE 1** — direction is the one thing a long runway
cannot fix later.

## 5. Do not stop after this

Between phases there are no questions — the interview ends at GATE 1. Missing input becomes a stated assumption, a
line under `## 미해결`, and `recordStop(BLOCK_CONTEXT, <what was missing>)`. That detail
is the improvement signal: it names what to add to the persona file or the constraint
table so the next run goes further without asking.

## 6. Complete when

`checkPhaseFile('10_frame', ['10_service-brief.md', '20_user-personas.md'], mode)`
returns ok. The two files are checked as a pair — the target user lives in the first,
the exit conditions in the second.

Then GATE 1, in the master skill's format: the two paths, three decisions with the
constraint or persona ID each hangs off, and the open questions.

## 7. What the next phases will hold you to

- `제약` table → every later phase checks itself against it
- `이탈 조건` → the QA phase scores screens against these sentences literally
- Constraint and persona IDs (`C-001`, `P-A`) → every downstream decision's `dependsOn`

An empty exit condition cannot be fixed in the review phase. It can only be fixed here.
