# SPEC-001: Test suite runs green locally + CI
- Status: in_progress
- Phase: 01
- Owner-persona: po

## Goal
Vitest suite covers pure logic first (security, storage), runs green via `npm test`
in WSL and in CI (Node 22, where jsdom component tests also run).

## Non-goals
- Full component coverage in v1.0.0; E2E beyond the existing visual-audit smoke.

## Acceptance Criteria
- [x] AC-001 (SPEC-001.AC-001): `npm test` passes 10/10 (security roundtrips, storage format) — verified by: `node ./node_modules/vitest/vitest.mjs run`
- [x] AC-002 (SPEC-001.AC-002): WSL native-binary trap fixed repeatably — verified by: `bash scripts/fix-wsl-natives.sh` ending in green test tail
- [ ] AC-003 (SPEC-001.AC-003): jsdom component tests execute green in CI (Node 22) — verified by: CI run of `npm test` on push (OPEN until CI proves it; local Node is v20)

## Graph atoms
| Atom | Kind | Verifies |
| SPEC-001.AC-001 | spec_atom | AC-001 |
| SPEC-001.AC-001.task | task | AC-001 |
| SPEC-001.AC-001.code | code | AC-001 |
| SPEC-001.AC-001.test | test | AC-001 |
| SPEC-001.AC-001.ev | evidence | AC-001 |
| SPEC-001.AC-002(.task/.code/.test/.ev) | * | AC-002 |
| SPEC-001.AC-003(.task/.code/.test/.ev) | * | AC-003 |

## Constraints
- Zero new runtime deps (vitest stack is dev-only). Node-env unit tests must pass on Node 20.

## Evidence hooks
- `node ./node_modules/vitest/vitest.mjs run` for AC-001
- `bash scripts/fix-wsl-natives.sh` for AC-002
