---
name: prosona-interview
description: Use when a planner has not yet captured their own decision principles, or when planning output keeps drifting from the planner's stated preferences across sessions.
license: MIT
---

# Prosona Interview

Produces `.prosona/planner-persona.md` — one file per planner, not per project. Every
later phase reads it, which is why it lives outside `projects/`.

The point is not a portrait. It is to stop the loop from asking the same question in
every project. A principle that does not change what a later phase does is not worth
the question that produced it.

## 1. Resume before you ask

1. Read `.prosona/planner-persona.md`. Missing → new interview.
2. Present → find the last framework tag in `## Raw` (`[F1 생애 서사]` … `[F5 실패 부검]`)
   and continue from the next one. Do not re-ask a framework that already has quotes.
3. If `판단 원칙` already meets the completion bar below, say so in two sentences and
   ask whether to extend it or move on to `prosona-frame`. Do not re-interview by default.

## 2. Run it

Dispatch `planner-profiler` (opus). The interview is long and quote-heavy; keeping it
out of the planning context is the reason the agent exists.

Give it the two reference files and the template path. Do not paste their contents
into the prompt.

- `skills/prosona-interview/references/frameworks.md` — the five frameworks
- `skills/prosona-interview/references/probing.md` — laddering, 5 Whys, projective, saturation
- `templates/planner-persona.md` — output shape

Five frameworks: 생애 서사 · 래더링 · 5 Whys · 대조 사례 · 실패 부검. F4 and F5 are not
optional — without them the file only records what the planner likes, and an agent that
only knows what you like will agree with you.

## 3. Intensity

`lite` runs F2, F4, F5 and marks F1/F3 under `## 미해결`. `full` and `ultra` run all
five. No level lowers the completion bar; a short interview produces a file that
declares itself short.

## 4. Complete when

- `판단 원칙` ≥ 5 rows, each with a `적용 지점` and a quote from `## Raw`
- `안티 골` ≥ 2
- `맹점` ≥ 1
- `## 미해결` present (`- 없음` if genuinely empty)

Anything less is a draft. Say which framework is thin rather than padding the table.

## 5. Then

Report the verified file path and hand off to `prosona-frame`. A row whose `적용 지점`
names a phase is a promise that phase will read it — `service-framer` reads the `frame`
rows, `screen-designer` the `journey`/`screens` rows, `virtual-user` reads none of it
by design.
