# SPEC-019: CERTIFICATION.md refresh + v1.2.0 release
- Status: in_progress
- Phase: 09
- Owner-persona: releaser
- Domains: docs, security

## Goal
Close Phase 09 with a truthful, reproducible certification and a real
release. Refresh `CERTIFICATION.md` from `.spec-graph/templates/CERTIFICATION.md`
so it carries L1–L4 verdicts, the artifact index with hashes, the L3-vision
reviewer + findings, the Phase-09 assurance results, and an explicit
known-limits list — with no claim outrunning its evidence (D11: the local
`manifest.json` is a working copy; this document is the durable record).
Record the tiered-quorum consent for the phase (core6 + the five domain
auditors + the discovery analyst = 12 personas, all approving with cited
evidence), then publish v1.2.0: tag, GitHub Release with the certification
asset, and a release report.

## Non-goals
- Re-running the headless E2E in CI (environment-bound, D11); claiming WebGPU
  local-model output without a provider path; changing product scope.

## Acceptance Criteria
- [x] AC-001 (SPEC-019.AC-001): `CERTIFICATION.md` refreshed to v1.2.0 from
  `.spec-graph/templates/CERTIFICATION.md` — L1–L4 verdicts, artifact index
  with sha256 prefixes, L3-vision reviewer/date/findings, Assurance section
  (SAST / dep-audit / budget / a11y / resilience), Known limits, and the D11
  wording that the durable L2 record is this document — verified by: grep
  chain over `CERTIFICATION.md`
- [x] AC-002 (SPEC-019.AC-002): Phase-09 tiered quorum recorded — 12 persona
  verdicts in `.spec-graph/personas/verdicts/phase-09-*.json` (core6 +
  security-auditor, perf-engineer, design-reviewer, resilience-engineer,
  docs-reviewer, analyst), each `approve` with cited evidence and `specs`
  covering SPEC-014–SPEC-019;
  `node .spec-graph/ops/quorum.mjs --phase 09 --specs SPEC-014,SPEC-015,SPEC-016,SPEC-017,SPEC-018,SPEC-019`
  exits 0 (the gate's claim-audit runs the same quorum rule; D13 keeps the
  auditor out of evidence commands) — verified by: quorum CLI
- [ ] AC-003 (SPEC-019.AC-003): v1.2.0 released — annotated tag `v1.2.0`
  pushed to the release remote, GitHub Release published with `CERTIFICATION.md`
  attached, and `RELEASE-REPORT.md` written (tag, commit, release URL,
  certification hash, scope + honest limits) — verified by:
  `node scripts/release-assert.mjs` (asserts when the release exists; prints
  `RELEASE-ABSENT` exit 0 in checkouts without it, D11-style)

## Graph atoms
| Atom | Kind | Verifies |
| --- | --- | --- |
| SPEC-019.AC-001 | spec_atom | AC-001 |
| SPEC-019.AC-001.task | task | AC-001 |
| SPEC-019.AC-001.code | code | AC-001 |
| SPEC-019.AC-001.test | test | AC-001 |
| SPEC-019.AC-001.ev | evidence | AC-001 |
| SPEC-019.AC-002(.task/.code/.test/.ev) | * | AC-002 |
| SPEC-019.AC-003(.task/.code/.test/.ev) | * | AC-003 |

## Constraints
- No self-referential evidence (D10): the certification may cite a CI run that
  validated the certified commit, never the run triggered by the certification
  commit itself.
- Verdict files must cite real, re-runnable evidence (gate, claim-audit,
  graph status, scanner outputs); a persona never approves on prose alone.
- Release tags are `v1.x.y` (never `v1.0.0-prod`-style, GUARDRAILS).

## Evidence hooks
- grep chain over `CERTIFICATION.md` for AC-001
- `node .spec-graph/ops/quorum.mjs --phase 09 --specs ...` + `claim-audit.mjs` for AC-002
- `node scripts/release-assert.mjs` for AC-003
