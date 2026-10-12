# SPEC-012: Orphan & honesty sweep (wire-or-delete)
- Status: draft
- Phase: 08
- Owner-persona: po

## Goal
No dead code, no mock controls: every `src/` module has ≥1 importer (or is deleted
with Architect rationale), and every interactive control in AudioStudio/ModelStudio
has a working handler (ModelStudio's fake download progress becomes the real
`initEngine` flow with live progress).

## Non-goals
- Refactoring working modules for style; touching wizard/player state machines.

## Acceptance Criteria
- [ ] AC-001 (SPEC-012.AC-001): orphan scan over `src/` reports zero zero-importer modules (test/config excluded; deletions recorded in DECISIONS.md) — verified by: `node .spec-graph/ops/orphan-scan.mjs` (new, zero-dep) exiting 0
- [ ] AC-002 (SPEC-012.AC-002): ModelStudio Download & Load calls the real engine init with live progress; no simulated timers or fake sizes remain in settings/audio views — verified by: `grep` for `setInterval` progress simulators == 0 in both views + `tsc`

## Graph atoms
| Atom | Kind | Verifies |
| SPEC-012.AC-001 | spec_atom | AC-001 |
| SPEC-012.AC-001.task | task | AC-001 |
| SPEC-012.AC-001.code | code | AC-001 |
| SPEC-012.AC-001.test | test | AC-001 |
| SPEC-012.AC-001.ev | evidence | AC-001 |
| SPEC-012.AC-002(.task/.code/.test/.ev) | * | AC-002 |

## Constraints
- Engine init must stay user-gesture-driven (WebGPU/AudioContext policies).
- Deletions need Architect verdict rationale in DECISIONS.md.

## Evidence hooks
- `node .spec-graph/ops/orphan-scan.mjs` for AC-001; grep + tsc for AC-002
