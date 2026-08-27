---
description: Run the whole planning sequence, stopping only at the gates
argument-hint: "<slug> [lite|full|ultra]"
---

Invoke the `prosona-loop` skill. It reads `progress.md` first and never re-runs an
approved phase, so an interrupted project resumes instead of restarting.

`$1` is the project slug. `$2` sets intensity; `ultra` keeps GATE 1 and GATE 4 only.
