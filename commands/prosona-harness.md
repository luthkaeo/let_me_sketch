---
description: Audit the loop's own run — model drift, unplanned stops, cost, closure
argument-hint: "[.prosona dir]"
---

Run `node scripts/harness.mjs $1` and show the findings. Reads only.

Every finding names its fix. Exit 1 means the run had defects worth acting on — the
product may still be fine; this is about how the loop itself executed.
