---
description: Run the full SPEC-GRAPH gate chain and claim audit.
---

Run `node .spec-graph/ops/gate.mjs $ARGUMENTS` then
`node .spec-graph/ops/claim-audit.mjs`. Report PASS/FAIL per gate with the failing
tail output. On failure, diagnose root cause from the spec and graph evidence — do not
mark anything done.
