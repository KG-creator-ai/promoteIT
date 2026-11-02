# SPEC-025: CERTIFICATION.md refresh + v1.3.0 release
- Status: draft
- Phase: 10
- Owner-persona: releaser
- Domains: docs, security

## Goal
Close Phase 10 with a truthful certification that covers the new rung — L5
human-grade AV — and publish v1.3.0 with the same mechanics as v1.2.0: tag,
GitHub Release, release report, pinned CI evidence.

## Non-goals
- No re-running the headless E2E in CI (environment-bound, D11).
- No claim of a human AV review that did not happen.
- No product-scope changes beyond what Phase 10 shipped.

## Acceptance Criteria
- [ ] AC-001 (SPEC-025.AC-001): `CERTIFICATION.md` is refreshed to v1.3.0 from
  `.spec-graph/templates/CERTIFICATION.md` — L1–L5 verdicts (L5 = human-grade
  AV with its achieved review level), the AV machine facts, the decision-gate
  records, the artifact index with sha256 prefixes, the known-limits list and
  the D11 wording that the durable record is this document — every claim
  re-derivable by the claims test — verified by:
  `node ./node_modules/vitest/vitest.mjs run tests/unit/certification-claims.test.ts`
- [ ] AC-002 (SPEC-025.AC-002): the tiered quorum for Phase 10 is recorded and
  complete (core6 + the domain auditors the phase's specs require + the
  discovery analyst + the AV reviewer), `claim-audit.mjs` PASSes, `gate.mjs`
  PASSes and 0 atoms are open — verified by:
  `node .spec-graph/ops/quorum.mjs --phase 10 --specs SPEC-020,SPEC-021,SPEC-022,SPEC-023,SPEC-024,SPEC-025`
- [ ] AC-003 (SPEC-025.AC-003): annotated tag `v1.3.0` is pushed to the release
  remote, the GitHub Release is published with `CERTIFICATION.md` attached, and
  `RELEASE-REPORT.md` records the tag, commit, release URL, certification hash,
  scope and honest limits — verified by: `node scripts/release-assert.mjs`

## Graph atoms
| Atom | Kind | Verifies |
| --- | --- | --- |
| SPEC-025.AC-001 | spec_atom | AC-001 |
| SPEC-025.AC-001(.task/.code/.test/.ev) | * | AC-001 |
| SPEC-025.AC-002 | spec_atom | AC-002 |
| SPEC-025.AC-002(.task/.code/.test/.ev) | * | AC-002 |
| SPEC-025.AC-003 | spec_atom | AC-003 |
| SPEC-025.AC-003(.task/.code/.test/.ev) | * | AC-003 |

## Constraints
- No self-referential evidence (D10): the certification may cite a CI run that
  validated the certified commit, never the run triggered by the certification
  commit itself.
- Verdict files must cite real, re-runnable evidence; a persona never approves
  on prose alone.
- Release tags are `v1.x.y` (never `v1.0.0-prod`-style, GUARDRAILS).
- The decision gate's release action must pass before the tag is created
  (SPEC-023.AC-003).

## Evidence hooks
- `node ./node_modules/vitest/vitest.mjs run tests/unit/certification-claims.test.ts` for AC-001
- `node .spec-graph/ops/quorum.mjs --phase 10 --specs SPEC-020,SPEC-021,SPEC-022,SPEC-023,SPEC-024,SPEC-025` for AC-002
- `node scripts/release-assert.mjs` for AC-003
