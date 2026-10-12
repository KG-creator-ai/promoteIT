# SPEC-007: Release mechanics to v1.0.0
- Status: draft
- Phase: 01
- Owner-persona: po

## Goal
Push to `creator-ai`, CI green, tag `v1.0.0`, GitHub Release with dist artifact +
report, graph snapshot archived. (Executes in Phase 07 after human baseline sign-off.)

## Non-goals
- Publishing to any store; changing `origin` before the releaser's Phase-07 verdict.

## Acceptance Criteria
- [x] AC-001 (SPEC-007.AC-001): `creator-ai` remote configured — verified by: `git remote -v` (DONE Phase 0, evidence recorded at close)
- [ ] AC-002 (SPEC-007.AC-002): tag `v1.0.0` + GitHub Release with zipped dist + report — verified by: release asset listing (OPEN until Phase 07)
- [ ] AC-003 (SPEC-007.AC-003): DoD report shows 0 open atoms, gates PASS, 6/6 approvals — verified by: `report.mjs PHASE-07` (OPEN until Phase 07)

## Graph atoms
| Atom | Kind | Verifies |
| SPEC-007.AC-001 | spec_atom | AC-001 |
| SPEC-007.AC-001.task | task | AC-001 |
| SPEC-007.AC-001.code | code | AC-001 |
| SPEC-007.AC-001.test | test | AC-001 |
| SPEC-007.AC-001.ev | evidence | AC-001 |
| SPEC-007.AC-002(.task/.code/.test/.ev) | * | AC-002 |
| SPEC-007.AC-003(.task/.code/.test/.ev) | * | AC-003 |

## Constraints
- No tag/Release without Phase-07 verdicts + green CI (GUARDRAILS hard stop).

## Evidence hooks
- `git remote -v` for AC-001; release assets + report for AC-002/003
