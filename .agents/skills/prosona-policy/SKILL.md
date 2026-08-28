---
name: prosona-policy
description: Use when the service brief is approved and the rules, exceptions, thresholds, and decision rights have not been written down, or when a flow keeps raising "what happens if" questions nobody can answer from a document.
license: MIT
---

# Prosona Policy

Phase `20_policy`. Produces `25_policy.md`, then **GATE 2**.

Policy comes before the journey. What the service allows, refuses, and excepts decides
which paths can exist; drawing the path first encodes rules nobody agreed to, and they
end up buried in screen copy where support cannot find them.

## 1. Gate first

`gateOpen(state, '20_policy')` — `10_frame` must be approved. Rules with no target user
are house style, not policy.

## 2. Run it

Dispatch `policy-designer` (opus) with the brief and persona paths. Paths, not contents.

Three sections carry the weight:

- `## 규칙` — observable statements. Someone can look at the running service and say
  whether the rule held.
- `## 예외` — the edges. **A policy with no exceptions has not met reality.** Every rule
  gets asked: what about the request outside the service area, the user who answers
  nothing, the case the constraint table forbids?
- `## 결정 권한` — who can change each threshold, and how. A number with no owner is
  either frozen or free-for-all.

## 3. Rules are the ancestors of everything downstream

Each rule is `R-NN`, registered in the ledger and hanging off a `C-NNN` or `P-X`. The
journey obeys them, the screens render them, the review scores against them, and
`95_operate` is where a measurement can overturn one — by superseding it, never by
quietly editing the row.

## 4. Complete when

`checkPhaseFile('20_policy', '25_policy.md', mode)` returns ok — `## 규칙`, `## 예외`,
`## 결정 권한`, `## 미해결`.

Then GATE 2. `ultra` skips the pause, not the phase: the decision block is appended to
`progress.md` instead of presented.
