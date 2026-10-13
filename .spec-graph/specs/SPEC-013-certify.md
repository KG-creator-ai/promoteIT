# SPEC-013: Certification report & v1.1.0
- Status: draft
- Phase: 08
- Owner-persona: po

## Goal
`CERTIFICATION.md` states four explicit levels (L1 automated, L2 headless E2E,
L3 human+vision QA on artifacts, L4 provider generation) with verdicts + artifact
links; CI green on the release commit; tag `v1.1.0` + GitHub Release carrying the
report (artifacts stay local for L3 review, never in git).

## Non-goals
- Committing binary artifacts or keys; claiming L3/L4 without their evidence.

## Acceptance Criteria
- [x] AC-001 (SPEC-013.AC-001): CERTIFICATION.md exists with L1–L4 verdicts, artifact index, and known limits — verified by: file + link check
- [ ] AC-002 (SPEC-013.AC-002): CI green on the v1.1.0 release commit — verified by: pinned successful run ID (D10 rule)
- [ ] AC-003 (SPEC-013.AC-003): tag `v1.1.0` + GitHub Release with CERTIFICATION.md — verified by: release API (tag + asset)

## Graph atoms
| Atom | Kind | Verifies |
| SPEC-013.AC-001 | spec_atom | AC-001 |
| SPEC-013.AC-001.task | task | AC-001 |
| SPEC-013.AC-001.code | code | AC-001 |
| SPEC-013.AC-001.test | test | AC-001 |
| SPEC-013.AC-001.ev | evidence | AC-001 |
| SPEC-013.AC-002(.task/.code/.test/.ev) | * | AC-002 |
| SPEC-013.AC-003(.task/.code/.test/.ev) | * | AC-003 |

## Constraints
- No tag/Release without Phase-08 verdicts + green CI (GUARDRAILS hard stop).

## Evidence hooks
- Link check for AC-001; pinned run for AC-002; release API for AC-003
