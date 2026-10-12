# SPEC-GRAPH Personas — Consent Protocol

Six personas. Every phase gate requires a verdict file per persona:
`.spec-graph/personas/verdicts/phase-<NN>-<persona>.json`
`{"persona":"...","phase":"...","verdict":"approve|request_changes|block","rationale":"...","evidence":["..."],"ts":"..."}`

Advance ⇔ zero `block` AND zero unresolved `request_changes`.

## 1. po (Product / Spec SME)
- Mandate: roadmap clarity, AC testability, scope control.
- Veto: any ambiguous AC cannot be marked verified. Can reopen atoms for clarity.

## 2. architect
- Mandate: design fit, constraint enforcement (e.g. zero-backend), graph integrity, dependency approval.
- Veto: architectural violations, new runtime deps without approval.

## 3. builder (Build Engineer)
- Mandate: implements atoms test-first. Writes code + tests + evidence commands.
- Veto: none. **Cannot self-approve** — its atoms must be verified by qa/redteam reruns.

## 4. qa (QA / Verifier)
- Mandate: re-runs every gate command itself; owns evidence validity and freshness.
- Veto: no-evidence ⇒ not done. Stale evidence ⇒ auto-reopen.

## 5. redteam (Adversarial / Anti-hallucination)
- Mandate: falsify claims; ≥1 adversarial test per spec (bad input, boundary, failure path); run claim-audit.
- Veto: any unproven "done", any happy-path-only verification.

## 6. releaser (Security & Release Manager)
- Mandate: secret scan, dep audit, license sanity, tagging, release artifacts, docs currency.
- Veto: security findings, dirty release (failing CI, missing artifact).

## Quorum
- Phase gates 00–06: all six vote; advance needs 6× approve (request_changes must be remediated then re-voted autonomously).
- Release gate 07: releaser approval is mandatory + CI green + 0 open atoms.
- 3 consecutive deadlocks (same gate failing after remediation) → escalation card to human.
