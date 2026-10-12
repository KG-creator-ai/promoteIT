# SPEC-002: npm scripts work in WSL + CI
- Status: in_progress
- Phase: 01
- Owner-persona: po

## Goal
`npm run lint|test|build|dev` work from WSL (Windows npm, POSIX shims) and in CI,
via node-direct script form. No `.cmd` shims required.

## Non-goals
- PowerShell-native execution (WSL is the supported shell; CI is linux).

## Acceptance Criteria
- [x] AC-001 (SPEC-002.AC-001): `npm run lint` exits 0 from WSL — verified by: `npm run lint`
- [x] AC-002 (SPEC-002.AC-002): `npm test` exits 0 from WSL — verified by: `npm test`
- [ ] AC-003 (SPEC-002.AC-003): `npm run build` exits 0 from WSL (no regression from lockfile changes) — verified by: `npm run build`

## Graph atoms
| Atom | Kind | Verifies |
| SPEC-002.AC-001 | spec_atom | AC-001 |
| SPEC-002.AC-001.task | task | AC-001 |
| SPEC-002.AC-001.code | code | AC-001 |
| SPEC-002.AC-001.test | test | AC-001 |
| SPEC-002.AC-001.ev | evidence | AC-001 |
| SPEC-002.AC-002(.task/.code/.test/.ev) | * | AC-002 |
| SPEC-002.AC-003(.task/.code/.test/.ev) | * | AC-003 |

## Constraints
- Scripts must stay shell-agnostic (`node ./node_modules/...`, `rm -rf` only in `clean`).

## Evidence hooks
- `npm run lint` / `npm test` / `npm run build` for AC-001/002/003
