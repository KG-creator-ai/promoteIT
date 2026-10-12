# Roadmap — promote-IT AV Studio to v1.0.0

- Status: RELEASED v1.0.0 (2026-10-12)
- DoD: 0 open atoms ∧ `gate.mjs` PASS ∧ `claim-audit.mjs` PASS ∧ 6/6 persona approvals
  at every phase ∧ CI green on `creator-ai` remote ∧ tag `v1.0.0` + GitHub Release.
- Remote: release pushes go to `creator-ai` (https://github.com/KG-creator-ai/promoteIT.git).
  `origin` (KG-Strategist) left untouched until release phase releaser verdict.

## Ordered specs

| # | Spec | Goal | ACs | Depends | State |
| 1 | SPEC-001 | Test suite runs green locally + CI | 3 | — | DONE (3/3 verified) |
| 2 | SPEC-002 | npm scripts work in WSL + CI | 3 | — | DONE (3/3 verified) |
| 3 | SPEC-003 | CI workflows + pre-push gate | 3 | SPEC-002 | DONE (3/3 verified) |
| 4 | SPEC-004 | Real PWA assets (icons per manifest, og-image) | 3 | — | DONE (3/3 verified) |
| 5 | SPEC-005 | Accurate README/docs | 2 | — | DONE (2/2 verified) |
| 6 | SPEC-006 | SPEC-GRAPH harness functional | 3 | — | DONE (3/3 verified) |
| 7 | SPEC-007 | Release mechanics to v1.0.0 | 3 | SPEC-001–006 | DONE (3/3 verified) |

## Milestones

- M1 Phase 0 bootstrap green — DONE (commits ec906a3, 10a67ae; gate PASS).
- M2 Spec baseline signed — DONE (user approval 2026-10-12; autonomous execution authorized to release).
- M3 All specs implemented + verified (graph closed).
- M4 Hardened, CI green, released v1.0.0 — DONE (tag + GitHub Release with dist zip + report).

## Out of scope for v1.0.0 (non-goals)

- New product features beyond gap closure; SLM/Attempt-2 work (BLOCKED, see
  ATTEMPT-2-ASSESSMENT.md); server/backend of any kind (zero-backend constraint).
