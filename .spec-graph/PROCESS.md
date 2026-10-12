# SPEC-GRAPH Process — SDLC Phases 00–07

Each phase: entry criteria → work → exit gate (persona verdicts recorded). No phase skipped.

## 00 INTAKE
- Entry: repo exists.
- Work: read AGENTS.md/README/manifests/CI/config; harvest entrypoints, toolchain quirks, constraints. Record in `.spec-graph/INTAKE.md`.
- Exit: PO + Architect approve intake completeness.

## 01 SPEC
- Entry: intake approved.
- Work: gap audit → ROADMAP.md (ordered specs) → per-spec files with testable ACs (SPEC-FORMAT.md). Every AC gets atom ID.
- Exit: **HUMAN SIGN-OFF #1** (spec baseline) + all personas approve. No implementation before this.

## 02 ARCH
- Entry: specs baselined.
- Work: graph build (`graph.mjs init`), ADR-lite decisions (`.spec-graph/DECISIONS.md`), test strategy, gate profile.
- Exit: Architect + QA + Security approve.

## 03 PLAN
- Entry: graph built.
- Work: order atoms topologically (spec→task→code→test→evidence), assign batches.
- Exit: PO + Build Engineer approve ordering.

## 04 IMPLEMENT
- Entry: plan approved.
- Work: autonomous loop (§2 of plan): test-first per AC, focused gates, evidence nodes, freshness enforcement.
- Exit: zero open atoms in batch scope.

## 05 VERIFY
- Entry: batch implemented.
- Work: full gate chain (`gate.mjs`): typecheck, tests, build, secret scan, claim-audit. Red Team adversarial tests. Visual-audit smoke where UI touched.
- Exit: gate.mjs exit 0 + QA + Red Team approve.

## 06 HARDEN
- Entry: verify green.
- Work: dep audit, PWA/manifest validity, a11y spot-checks, docs sync (README/AGENTS.md/graph), perf sanity.
- Exit: Security + Architect approve.

## 07 RELEASE
- Entry: harden approved, CI green on remote.
- Work: tag, GitHub Release with artifact + report, graph snapshot.
- Exit: Release persona approve + human notification (touchpoint #2).

## Deadlock rule
Any gate failing 3 consecutive autonomous repair cycles → escalation card (`.spec-graph/ESCALATION-*.md`) → human. This is the only allowed interruption outside the two touchpoints.
