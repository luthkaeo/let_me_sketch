---
description: Check the brief's success metrics against a real measurement (phase 95)
argument-hint: "<slug> [측정 출처 경로]"
---

Invoke the `prosona-operate` skill. It compares target against actual, finds the
decisions the misses belong to, and supersedes them — it never edits an old row.

`$1` is the project slug. `$2` is where the real number comes from (a load-test
artifact, an analytics export, a log). No number yet → the phase records 미측정 and stops.
