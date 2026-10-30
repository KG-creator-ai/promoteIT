# SPEC-GRAPH — Spec-Driven Autonomous Agentic SDLC

Bespoke hybrid framework: **Graph Engineering loop harness + SDLC phase gates + CI/CD + multi-persona consent + anti-hallucination controls.**

Framework version: **1.0.0** (single source: `.spec-graph/VERSION` — distinct from any product release tag).

## Quickstart (any repo)

1. Copy `.spec-graph/` + `.opencode/` (persona agents) + `opencode.json` into repo root.
2. `node .spec-graph/ops/init.mjs` — detects toolchain, writes `.spec-graph/local-profile.json`.
3. Author roadmap: `.spec-graph/templates/ROADMAP.md` → `.spec-graph/ROADMAP.md`, specs in `.spec-graph/specs/*.md`.
4. `node .spec-graph/ops/graph.mjs init` — builds traceability graph from specs.
5. Loop: `node .spec-graph/ops/graph.mjs open` → implement + test → `node .spec-graph/ops/graph.mjs verify <atom> --evidence <cmd>` → repeat until `status` shows 0 open.
6. Gates: `node .spec-graph/ops/gate.mjs` (exit 0 = all green). `node .spec-graph/ops/claim-audit.mjs` (anti-hallucination). `node .spec-graph/ops/quorum.mjs --phase <NN> --specs <SPEC-IDs>` (tiered persona quorum). `node .spec-graph/ops/report.mjs PHASE-<NN>` (phase/release report + DoD checklist).

## Single source of truth

`.spec-graph/graph.json` (schema v3.1.0, see GRAPH-SCHEMA.md). Progress = verified/total. Release-ready ⇔ zero open/blocked atoms ∧ gates green ∧ all persona verdicts approve.

## Human touchpoints (default: 2)

1. Spec-baseline sign-off (after Phase 01).
2. Final release notification.
Escalation cards only on hard blockers (3 consecutive gate deadlocks).

## Docs

- PROCESS.md — SDLC phases 00–07, entry/exit criteria.
- PERSONAS.md — 12 personas (core6 + 5 domain auditors + discovery analyst), mandates, vetoes, quorum.
- SPEC-FORMAT.md — how to write a spec with testable ACs.
- GRAPH-SCHEMA.md — graph.json schema v3.1.0 (spec-level `domains` metadata).
- GUARDRAILS.md — autonomy bounds, hard stops, secrets.
