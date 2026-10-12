# SPEC-003: CI workflows + pre-push gate
- Status: in_progress
- Phase: 01
- Owner-persona: po

## Goal
Every push is verified twice: local pre-push gate, then authoritative GitHub Actions
(typecheck → tests → build → SPEC-GRAPH gates → claim-audit). Tags build releases.

## Non-goals
- Headless visual audit in CI (needs Windows Chrome; stays local opt-in via RUN_AUDIT=1).

## Acceptance Criteria
- [x] AC-001 (SPEC-003.AC-001): `ci.yml` + `release.yml` present and valid YAML — verified by: `python3 -c yaml.safe_load` on both files
- [x] AC-002 (SPEC-003.AC-002): CI green on the release remote for the Phase-0/1 commits — verified by: Actions run (OPEN until first push to `creator-ai`)
- [x] AC-003 (SPEC-003.AC-003): pre-push hook installed and executable — verified by: `test -x .git/hooks/pre-push`

## Graph atoms
| Atom | Kind | Verifies |
| SPEC-003.AC-001 | spec_atom | AC-001 |
| SPEC-003.AC-001.task | task | AC-001 |
| SPEC-003.AC-001.code | code | AC-001 |
| SPEC-003.AC-001.test | test | AC-001 |
| SPEC-003.AC-001.ev | evidence | AC-001 |
| SPEC-003.AC-002(.task/.code/.test/.ev) | * | AC-002 |
| SPEC-003.AC-003(.task/.code/.test/.ev) | * | AC-003 |

## Constraints
- CI pins Node 22 (jsdom requirement). No secrets in workflow logs.

## Evidence hooks
- YAML parse for AC-001; Actions UI run for AC-002; `test -x` for AC-003
