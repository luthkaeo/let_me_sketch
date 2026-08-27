---
name: prosona-handoff
description: Use when screens have passed persona review and the plan needs to be packaged for implementation, or when handing planning output to a build skill.
license: MIT
---

# Prosona Handoff

Phase `90_handoff`. Produces `90_handoff.md`. Last phase, no gate — GATE 4 already
decided whether the plan is sound, and asking again here only costs runway.

## 1. Gate first

`gateOpen(state, '90_handoff')` — `60_review` must be approved. A handoff assembled from
screens that failed review packages the failure and hands it on.

## 2. Run it

Dispatch `handoff-packager` (sonnet) with the paths of every phase output and
`.prosona/decisions.json`. Paths, not contents — this phase reads the most files of any,
which is exactly why nothing gets pasted.

## 3. Index, do not decide

Nothing new is decided here. A requirement that first appears in the handoff is one no
persona tested and no gate approved; it belongs under `## 미해결`.

Tasks group by journey. A screen-list handoff makes the implementer rediscover the three
states on every screen — the journey already carries them in the order a user meets them.

## 4. What ships with it

- `50_screens/preview.html` — the three states side by side (`scripts/render-screens.mjs`)
- `50_screens/figma/` — the Figma-importable document (`scripts/to-figma.mjs`)
- `.prosona/decisions.json` — so the implementer can run `impactOf` on a constraint
  before changing it, instead of finding out afterwards

Generate the first two before writing the 산출물 table; the table states what is on disk,
not what should be.

## 5. Complete when

`checkPhaseFile('90_handoff', '90_handoff.md')` returns ok — `## 구현 태스크`,
`## 산출물`, `## 미해결` — and `validateLedger()` reports no dangling reference.

Then report the loop's runway from `state.json` and stop. The next step is a build skill,
and it should be able to start from this one file.
