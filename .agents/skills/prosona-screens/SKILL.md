---
name: prosona-screens
description: Use when a journey and its references are approved and the concrete screens, their states, and their copy structure need to be specified.
license: MIT
---

# Prosona Screens

Phase `50_screens`. Produces `50_screens/<NN>-<slug>.md` **and its `.json`**, then
**GATE 3**.

## 1. Gate first

`gateOpen(state, '50_screens')` — the journey must be approved. Not open → back to
`prosona-journey`. Files win over state when they disagree.

## 2. Run it

Dispatch `screen-designer` (sonnet) with `mode=screens`, the input paths
(`30_journey.md`, `40_references.md`, `10_service-brief.md`), the template path, and the
output directory. Paths, not contents.

## 3. Two rules the agent is held to

> Climb the planning ladder before every screen. If a journey step is served by an
> existing screen, a platform convention, or a reference you already adopted, say so and
> do not add a screen.

> If the `## 근거` section is longer than the `## 구조` section, the screen is
> under-designed and the rationale is over-written. Rewrite the screen.

## 4. The pair is the deliverable

Markdown for a person, JSON for the schema. Prose lets `빈 상태` be a heading with
nothing under it; `validateScreenSpec()` does not. A screen with no JSON is not a
finished screen, and JSON with an empty `states.empty.tree` is rejected at check time.

`id` (`S-01`) and `journey` (`J-001`) are what connect a screen to the ledger. Register
the screen, then record its design decisions with `addDecision`, hanging each off the
reference you adopted or the journey step it serves.

## 5. Complete when

```bash
node scripts/check-screens.mjs .prosona/projects/<slug>/50_screens
```

Expected: `all screen specs valid`. Then `checkPhaseFile('50_screens', <md paths>)`
for `## 근거`, `빈 상태`, `에러`, `## 되돌리기`, `## 미해결`.

```bash
node scripts/render-screens.mjs .prosona/projects/<slug>/50_screens
```

The preview is part of the phase, not a nicety. The reference phase gathered precedent
and this phase fixed structure — both stop at text, and a plan whose empty state was
never looked at was never reviewed. GATE 3 presents the preview path alongside the specs.

**Count the screens.** More screens than journey steps means the ladder was skipped —
that is a defect in this phase, not a scope discovery. Go back to rung 1.

Then GATE 3. Under `ultra` the gate is skipped and the decision block is appended to
`progress.md` instead; the checks are not skipped at any level.

## 6. Never simplify away

Empty state · error state · permission and consent flow · undo path · accessibility
basics. The ladder shortens screens, never states.
