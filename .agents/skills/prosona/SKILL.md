---
name: prosona
description: Use when planning a digital service, feature, or app - working out who it is for, mapping a user journey, choosing UI precedent, specifying screens, or reviewing a plan. Also use when resuming planning work started in an earlier session, and when the user says "prosona", "기획 시작", "여정 설계", or "화면 설계".
argument-hint: "[lite|full|ultra|off]"
license: MIT
---

# Prosona

Phases: `10_frame` → `30_journey` → `40_reference` → `50_screens` → `60_review` → `90_handoff`.

The metric is **runway** — phases cleared in a row with no human touch, quality held. Stopping costs runway, so the only stops kept are the four designed gates. Every other stop is a defect.

Mode `new` (idea only) or `improve` (something exists). `improve` requires the as-is before any to-be, and its constraints are measured from the source with a stated origin, never recalled.

## 1. Resume before you plan

Read `.prosona/state.json` and the phase files it names **before any planning question**. When state and files disagree, the files win. Say in two sentences where the loop stands, then continue. Never re-run a phase the ledger marks approved.

## 2. Completeness is checked, never claimed

<HARD-GATE>
Writing a section is not the same as clearing the phase.

The observed failure is not refusal and not stopping. It is **silent omission**. Unaided, an agent given this task produced measured constraints, a product definition, a journey and nine screens — and never named a target user or one persona. It did not ask and did not flag a gap. Those sections were simply absent, and the quality of what it wrote hid what it did not.

A phase passes only when `checkPhaseFile()` reports its markers present. Never approve from memory or confidence. Never write a screen before `10_frame` is approved.
</HARD-GATE>

## 3. The planning ladder

Stop at the first rung that holds.

1. Can this screen not exist? Cut it from the journey.
2. Does this product already have the pattern? Reuse it.
3. Does a platform convention answer it? Use the convention.
4. Same-domain precedent? Adopt it and cite the URL.
5. Only then: the minimum new screen.

The ladder shortens screens. It never shortens states.

## 4. Do not stop between gates

Missing evidence becomes a stated assumption, a line under `## 미해결`, and `recordStop(BLOCK_CONTEXT, detail)`. The detail names what was missing — that is what gets added to the persona file or constraint table so the next run goes further.

Before asking anything, ask yourself instead: can I proceed under an assumption a reader could overturn? If yes, proceed.

## 5. Gate format

```
━━━ GATE n ━━━
산출: <파일 경로>
내가 결정한 것:
  1. <결정> — <근거: 제약 ID 또는 페르소나 ID>
미해결:
  - <가정하고 넘어간 것>
승인 / 수정: <내용> / 이동: <페이즈> ?
```

Each listed decision also goes to the ledger via `addDecision` with `why` and `dependsOn`. One with no rationale, or hanging off nothing, is refused at write time: it could never be impact-analysed, which is why the ledger exists.

## 6. Never simplify away

Empty state · error state · permission and consent flow · undo path · accessibility basics (touch target, contrast, label).

Screens ship as a markdown/JSON pair. A heading with nothing under it is not a state, and the schema says so.
