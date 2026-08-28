---
name: prosona-operate
description: Use when a shipped plan has produced real numbers and the success metrics written in the brief have not been checked against them, or when an operational measurement contradicts a design decision.
license: MIT
---

# Prosona Operate

Phase `95_operate`. Produces `95_operate.md`. The last phase, and the one that makes the
loop a loop.

A brief writes success metrics at the start. Without this phase nothing ever reads them
back, and the plan is judged on whether it was delivered rather than whether it worked.
polysona's publisher records an engagement target and updates the persona when the real
number lands; this is that return path.

## 1. Bring a real measurement

The phase needs a number from outside the plan — a load test artifact, an analytics
query, a support ticket count, a log. Name the source in the file. **A measurement with
no stated origin is a recollection**, and this whole loop treats those as unwritten.

No number available yet → say so, record `미측정` per metric, and stop. An honest empty
result beats an invented one.

## 2. Compare, then find who is responsible

`## 지표 대조` puts target beside actual, per metric, with the source. `측정 불가` is a
verdict too — a metric nobody can measure is a design defect to fix next round.

For each miss, find the decision that owned it in `.prosona/decisions.json` and run
`impactOf` on it. The decisions hanging off it were built on the same assumption the
measurement just broke.

## 3. Supersede, never edit

A decision the numbers contradict is replaced with a new one carrying
`supersedes: D-NNN`. Do not edit the old row. The point of the ledger is that six months
later someone can see the plan changed and why — an edited row looks like it was always
right, and the loop learns nothing.

Policy that changes goes through `25_policy.md` the same way: a new rule or a new
exception, with the measurement as its 근거.

## 4. Then audit the run itself

```bash
node scripts/harness.mjs
```

The product's numbers and the loop's own numbers are different questions. This phase
answers the first; the harness audit answers the second — model drift, unplanned stops,
cost outliers. Report both, because a plan that worked through an expensive, stopping
loop is only half a success.

## 5. Complete when

`checkPhaseFile('95_operate', '95_operate.md')` returns ok — `## 지표 대조`,
`## 다음 회차`, `## 미해결` — and every 미달 metric names a responsible decision.
