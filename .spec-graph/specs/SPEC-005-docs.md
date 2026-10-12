# SPEC-005: Accurate README/docs
- Status: draft
- Phase: 01
- Owner-persona: po

## Goal
README describes THIS app with correct key setup (`VITE_GEMINI_API_KEY`, not
`.env.local`/`GEMINI_API_KEY`), working commands, and pointers to AGENTS.md.
Stale audit snapshots are marked superseded so agents don't trust them.

## Non-goals
- Rewriting ARCHITECTURE_AUDIT.md / DIAGNOSTIC_REPORT.md content (banner only).

## Acceptance Criteria
- [x] AC-001 (SPEC-005.AC-001): README lists correct env var, `npm run lint|test|build|dev|gate`, and test/CI notes — verified by: `grep` checks for `VITE_GEMINI_API_KEY`, `npm test`, absence of `.env.local`
- [x] AC-002 (SPEC-005.AC-002): stale docs carry a superseded banner pointing at code/AGENTS.md — verified by: `grep` for superseded banner in both audit files

## Graph atoms
| Atom | Kind | Verifies |
| SPEC-005.AC-001 | spec_atom | AC-001 |
| SPEC-005.AC-001.task | task | AC-001 |
| SPEC-005.AC-001.code | code | AC-001 |
| SPEC-005.AC-001.test | test | AC-001 |
| SPEC-005.AC-001.ev | evidence | AC-001 |
| SPEC-005.AC-002(.task/.code/.test/.ev) | * | AC-002 |

## Constraints
- Never document secret values; keep zero-backend claim.

## Evidence hooks
- `grep` content checks for AC-001/002
