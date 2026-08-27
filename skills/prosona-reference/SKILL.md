---
name: prosona-reference
description: Use when a user journey is approved and screen design needs same-domain UI precedent, or when a design decision needs evidence beyond the planner's intuition.
license: MIT
---

# Prosona Reference

Phase `40_reference`. Produces `40_references.md`. No gate — this phase gathers
evidence, and stopping to approve evidence costs runway without protecting anything.

The baseline wrote `"진행률 컴포넌트가 없으므로 진행률은 이미지(SVG)로 그려서 넣습니다"`
with no precedent and no uncertainty marker at all. An unsourced decision reads exactly
like a sourced one. This phase exists to make the difference visible.

## 1. Run it

Dispatch `reference-scout` (sonnet) with the journey path, the personas path, the
brief's domain, and the output path.

Only that agent touches Mobbin. Its responses carry images; keeping them out of the
planning context is the point of the isolation, so do not call the MCP tools here.

Query rules live in `references/query-recipes.md`. Give the scout the path.

## 2. Every entry cites a link

> Every entry cites a `mobbin_url` as a markdown link. An entry without a link is not a
> reference, it is a guess. If Mobbin returns nothing usable for a journey step, record
> that explicitly as `근거 없음 — 신규 설계` and move on; do not invent a precedent.

## 3. Rejections are required

A step with only adoptions was not compared. The rejection line — what was turned down
and which constraint or exit condition it collided with — is the design judgment the
screens phase actually reads.

## 4. No MCP is not a failure

Mobbin unavailable or unauthorized → write `MCP 미연결 — 신규 설계로 진행` for each step,
note it under `## 미해결`, record `BLOCK_CONTEXT`, and finish the file. Hard-failing here
would cost a whole runway for a phase that is not a gate.

## 5. Complete when

`checkPhaseFile('40_reference', '40_references.md')` returns ok — a cited URL or an
explicit no-precedent note, and a rejection or an explicit `기각 없음`.

Then continue straight to `prosona-screens`. Do not pause for approval.
