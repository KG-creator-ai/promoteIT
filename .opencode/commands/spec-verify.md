---
description: Verify one graph atom with an evidence command.
agent: build
---

Verify graph atom `$1`: implement/test-first if needed, then run
`node .spec-graph/ops/graph.mjs verify $1 --cmd "$2" --paths $3`.
On failure, follow the escalating repair loop (re-read spec → re-diagnose → redesign);
3rd consecutive failure → write `.spec-graph/ESCALATION-<date>-<topic>.md` and stop.
