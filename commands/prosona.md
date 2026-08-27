---
description: Start or resume Prosona service planning at the right phase
argument-hint: "[lite|full|ultra|off]"
---

Invoke the `prosona` skill. Read `.prosona/state.json` and the phase files it names
before asking anything, then report where the loop stands and continue.

`$1` sets intensity for this session: `lite` (most questions), `full` (default),
`ultra` (GATE 1 and GATE 4 only), `off` (stop applying Prosona).
