# SPEC-011: E2E functional certification harness
- Status: draft
- Phase: 08
- Owner-persona: po

## Goal
`scripts/e2e-av.mjs` proves the product works headless: signup → campaign →
wizard brief → AI generate → script table → TTS speak fired → player plays →
**real `.webm` export artifact** → per-view screenshots. Artifacts feed human L3.

## Non-goals
- Replacing CI unit gates; subjective quality scoring (L3 is human).

## Acceptance Criteria
- [x] AC-001 (SPEC-011.AC-001): e2e exits 0 with all legs green against local dev server + Windows Chrome — verified by: the run itself + artifact manifest
- [x] AC-002 (SPEC-011.AC-002): `audit-artifacts/` contains per-view screenshots + exported `.webm` + voiceover EDL, all non-empty and indexed in `manifest.json` — verified by: manifest check (sizes > 0)

## Graph atoms
| Atom | Kind | Verifies |
| SPEC-011.AC-001 | spec_atom | AC-001 |
| SPEC-011.AC-001.task | task | AC-001 |
| SPEC-011.AC-001.code | code | AC-001 |
| SPEC-011.AC-001.test | test | AC-001 |
| SPEC-011.AC-001.ev | evidence | AC-001 |
| SPEC-011.AC-002(.task/.code/.test/.ev) | * | AC-002 |

## Constraints
- `audit-artifacts/` is gitignored (binary outputs never committed).
- No key material in logs/manifest (sizes/hashes only).

## Evidence hooks
- `node scripts/e2e-av.mjs` for AC-001; manifest size check for AC-002
