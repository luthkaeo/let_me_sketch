# Prosona

> A service-planning loop for Claude Code. It interviews you in plain language, writes
> the policy, maps the journey, cites real UI precedent, specifies the screens — and
> then reads the operational numbers back to see whether any of it worked.

**Prosona plans; it never codes.** The deliverable is the planner's own: the service
definition, the rules and their exceptions, the flows, the process-level screen specs.

Korean documentation: [README.ko.md](README.ko.md)

## Install

```bash
claude plugin marketplace add luthkaeo/let_me_sketch
```

```bash
claude plugin install prosona@prosona
```

## The loop

```
  10 frame       plain-language interview -> brief + user personas   [GATE 1]
  20 policy      rules, exceptions, decision rights                  [GATE 2]
  30 journey     per-persona journey + failure paths                 [GATE 3]
  40 reference   same-domain Mobbin precedent, adopt/reject with URLs
  50 screens     screen specs (.md + .json), three states each       [GATE 4]
  60 review      isolated persona QA, loop back to 50, max 2         [GATE 5]
  90 handoff     implementation task list, grouped by journey
  95 operate     target vs measured actual -> supersede what missed
```

Between gates the loop does not ask questions. Missing evidence becomes a stated
assumption, a line under `## 미해결`, and a named stop in the state file.

## What makes it different

**Completeness is checked, not claimed.** A phase passes only when its output file
actually contains its required sections. The baseline that motivated this wrote a
journey and nine screens without ever naming a target user — and never mentioned the
gap. Models do not defy the rule; they forget the section exists.

**Every decision is a node, not a sentence.** `why` and `dependsOn` are refused empty at
write time, so `impactOf(C-003)` can walk the chain and show which decisions collapse
when a constraint moves — including the ones that never mention it.

**Changes keep their reason.** A decision that replaces another carries `supersedes`;
a rewritten screen is archived first. `/prosona-trace` prints the three sources as one
timeline.

**The loop audits itself.** `/prosona-harness` reports model drift, unplanned stops,
cost outliers, and whether the loop ever closed. Every finding names its fix, because a
finding the next run cannot act on is a complaint.

**Nothing is simplified away.** Empty state, error state, undo path, accessibility
basics, and the policy exception nobody wants to write down.

## Commands

| Command | Phase |
|---|---|
| `/prosona` | start or resume at the right phase |
| `/prosona-frame` | 10 — interview, brief, personas |
| `/prosona-policy` | 20 — rules, exceptions, decision rights |
| `/prosona-journey` | 30 — journeys and failure paths |
| `/prosona-reference` | 40 — Mobbin precedent |
| `/prosona-screens` | 50 — screen specs |
| `/prosona-review` | 60 — persona QA |
| `/prosona-handoff` | 90 — implementation task list |
| `/prosona-operate` | 95 — metrics vs reality |
| `/prosona-loop` | run the sequence end to end |
| `/prosona-trace` | one timeline of decisions and revisions |
| `/prosona-harness` | audit the run itself |

## Scripts

```bash
node scripts/check-screens.mjs <50_screens dir>    # schema-validate screen specs
node scripts/render-screens.mjs <50_screens dir>   # wireframe preview, three states side by side
node scripts/to-figma.mjs <50_screens dir>         # Figma-importable document
node scripts/trace.mjs <project dir>               # decision + revision timeline
node scripts/harness.mjs [.prosona dir]            # audit model routing, stops, cost
node --test scripts/lib/*.test.js                  # 107 tests, zero dependencies
```

## Requires

Node 20+. Mobbin MCP is optional — without it the reference phase records
`근거 없음 — 신규 설계` and continues rather than failing.

## Credits

Ported from three sources, with the reasoning kept: interview frameworks and the
publish→measure→feed-back loop from [Polysona](https://github.com/LilMGenius/polysona),
the laziness ladder and debt-marker pattern from
[Ponytail](https://github.com/DietrichGebert/ponytail), and hard gates, file handoffs,
and skill-TDD discipline from Superpowers and ECC.

## License

MIT
