# SPEC-006: SPEC-GRAPH harness functional
- Status: in_progress
- Phase: 01
- Owner-persona: po

## Goal
The framework is self-hosting: all five ops CLIs run, persona agents/commands exist,
`opencode.json` parses, and this graph builds from these very spec files.

## Non-goals
- Portability testing in other repos (v1.0.0 scope is this repo only).

## Acceptance Criteria
- [x] AC-001 (SPEC-006.AC-001): `init` + `graph init` + `status` + `gate` + `claim-audit` + `report` all execute without crashing — verified by: running each (this Phase-1 session)
- [x] AC-002 (SPEC-006.AC-002): 6 persona agents + 3 commands + valid `opencode.json` — verified by: file list + `node -e JSON.parse(opencode.json)`
- [x] AC-003 (SPEC-006.AC-003): graph.json contains all 7 specs' AC atoms — verified by: `graph.mjs status` atom count = 20

## Graph atoms
| Atom | Kind | Verifies |
| SPEC-006.AC-001 | spec_atom | AC-001 |
| SPEC-006.AC-001.task | task | AC-001 |
| SPEC-006.AC-001.code | code | AC-001 |
| SPEC-006.AC-001.test | test | AC-001 |
| SPEC-006.AC-001.ev | evidence | AC-001 |
| SPEC-006.AC-002(.task/.code/.test/.ev) | * | AC-002 |
| SPEC-006.AC-003(.task/.code/.test/.ev) | * | AC-003 |

## Constraints
- Ops CLIs use node builtins only (zero-dep, drop-in portable).

## Evidence hooks
- CLI runs for AC-001; file/JSON checks for AC-002; status count for AC-003
