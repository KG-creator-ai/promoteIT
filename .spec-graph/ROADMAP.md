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

## Phase 08 — "100% REAL" product completion → v1.1.0 (user-approved 2026-10-12)

Honest finding: v1.0.0 certified the harness, not the product. AudioStudio was a
mock; `audioEngine`/`videoRenderer` were orphaned; ModelStudio faked downloads;
no E2E ever ran. This phase makes every control real (zero-backend, edge-compute)
and certifies L1–L4.

| # | Spec | Goal | ACs | Depends | State |
| 8 | SPEC-008 | Real TTS in AudioStudio (voices, progress, export) | 3 | — | open |
| 9 | SPEC-009 | VideoRenderer consolidation + webm-with-audio export | 3 | SPEC-008 | open |
| 10 | SPEC-010 | Multi-provider AI (Gemini/OpenRouter/NVIDIA) + Qwen default | 3 | — | open |
| 11 | SPEC-011 | E2E harness + L3 artifacts | 2 | SPEC-008–010 | open |
| 12 | SPEC-012 | Orphan/honesty sweep (incl. real ModelStudio downloads) | 2 | SPEC-008–010 | open |
| 13 | SPEC-013 | CERTIFICATION.md + v1.1.0 | 3 | SPEC-008–012 | open until release |

## Out of scope for v1.0.0 (non-goals)

- New product features beyond gap closure; SLM/Attempt-2 work (BLOCKED, see
  ATTEMPT-2-ASSESSMENT.md); server/backend of any kind (zero-backend constraint).
