# Prosona

> Metacognition-driven multi-persona service planning loop. Interview once; the loop runs itself after that.

Prosona extracts a planner's decision principles into a file, then runs the planning
sequence — brief, user personas, journey, references, screens, QA — with human approval
at four phase boundaries only.

Korean documentation: [README.ko.md](README.ko.md)

## Install

```bash
claude plugin marketplace add ./.claude-plugin/marketplace.json
claude plugin install prosona
```

## Loop

```
  00 interview   -> .prosona/planner-persona.md        (once per planner)
  10 frame       brief + user personas        [GATE 1]
  30 journey     per-persona user journey     [GATE 2]
  40 reference   same-domain Mobbin precedent
  50 screens     screen specs                 [GATE 3]
  60 review      persona-driven QA            [GATE 4]  -> loop back to 50, max 2
  90 handoff     packaged output
```

Between gates the agent does not ask questions. Ambiguity is recorded as a stated
assumption and raised at the next gate.

GATE 1 (direction) and GATE 4 (verification) are never removed, at any intensity level.

## License

MIT
