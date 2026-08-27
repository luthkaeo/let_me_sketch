---
name: prosona-review
description: Use when screen specs are drafted and need to be tested against each target persona before handoff, or when a plan needs an adversarial read that the designer cannot give it.
license: MIT
---

# Prosona Review

Phase `60_review`. Produces `60_qa/<persona>-<iteration>.md`, then **GATE 4**.

GATE 4 survives every intensity level. A long runway in the wrong direction is not
runway, and this is the only phase that can tell the difference.

## 1. Three rounds, three lenses

Different lenses catch different defects, and each round the loop runs unattended is
runway earned.

**R1 · 페르소나 QA** — one `virtual-user` (opus) per persona, dispatched in parallel.
They are independent by construction: each plays one person and sees only that person's
row.

**R2 · 의존성 감사** — `validateLedger()` for dangling references, then `impactOf()` on
each constraint and persona to find decisions that contradict each other. This is the
round that catches features tangling. Prose review never finds it: a decision that never
mentions `C-003` still collapses when `C-003` moves, and only the transitive walk shows it.

**R3 · 레퍼런스 갭** — every adopted entry in `40_references.md` against the screens. An
adoption that left no trace in any screen was a citation, not a decision.

## 2. The evaluator is isolated

`virtual-user` does not read `.prosona/planner-persona.md` or `40_references.md`. Do not
paste their contents into its prompt as "context". A reviewer holding the designer's
reasons agrees with the design, and the phase produces a transcript of that agreement.

## 3. Loopback is bounded

One or more fatal defects → back to `50_screens`, **max 2 loopbacks**. A third failure
stops the loop and goes to a human with the three reports attached: at that point the
defect is in the frame or the journey, and another screen pass cannot reach it. An
unbounded loop is not autonomy, it is a hang.

Record every loopback in `progress.md` with the round number and the reason, and
`recordStop(BLOCK_LOOP, …)` on the third. The reason is what a human reads first.

**Preserve what the round judged.** Before the screens phase rewrites anything, run

```bash
node scripts/revise.mjs <the .md and .json about to change>
```

QA keeps its rounds as separate files; the screens they were about do not, so a report
ends up citing a file that no longer says what it said. A decision the round overturns is
re-recorded with `supersedes` naming the one it replaces — the ledger then answers why
it changed, not just why it is.

## 4. Complete when

`checkPhaseFile('60_review', <report paths>)` returns ok — `## 통과 여부`,
`## 이탈 조건 대조`, `## 치명 결함` — for every persona's latest report, and no report is
불합격.

Then GATE 4: verdicts per persona, the fatal defects fixed and how, and what was
knowingly left open.

## 5. Judge against the exit conditions

The `이탈 조건 대조` table quotes `20_user-personas.md` verbatim and answers per row. If a
persona's exit condition was vague enough that this table cannot be filled, that is a
`10_frame` defect surfacing late — record it under `## 미해결` rather than scoring on
taste.
