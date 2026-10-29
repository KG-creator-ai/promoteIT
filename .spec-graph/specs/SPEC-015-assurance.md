# SPEC-015: Assurance tooling (evidence-backed auditors)
- Status: done
- Phase: 09
- Owner-persona: security-auditor
- Domains: security, perf, ux, resilience

## Goal
Give the four Tier-2 auditors CI-runnable evidence: SAST-lite scanner +
dependency audit (security), bundle budget (perf), axe a11y scan (ux),
migration + archive round-trip tests (resilience) — all wired into
`gate.mjs`/`local-profile.json`/CI. No prose-only verdicts.

## Non-goals
- Full pentest or DAST appliance (D17: honest equivalent only); Web Vitals
  field data (no telemetry by design); fixing every contrast nit app-wide
  (scoped to axe-clean render paths + recorded follow-ups).

## Acceptance Criteria
- [x] AC-001 (SPEC-015.AC-001): `scripts/sast.mjs` (unsafe sinks, secret
  patterns, crypto misuse) + `scripts/dep-audit.mjs` (npm audit with D9
  GHSA allowlist) pass; `.spec-graph/THREAT-MODEL.md` (VAPT-lite) exists;
  auth-tamper unit tests (bit-flipped ciphertext, wrong-salt unwrap,
  malformed bundle) green; both scripts in gate chain — verified by: `node scripts/sast.mjs`, `node scripts/dep-audit.mjs`, `vitest run tests/unit/security-tamper.test.ts`
- [x] AC-002 (SPEC-015.AC-002): `.spec-graph/budgets.json` + `scripts/budget.mjs`
  fail on bundle growth beyond ratchet; wired post-build in `gate.mjs --full` — verified by: `npm run build && node scripts/budget.mjs`
- [x] AC-003 (SPEC-015.AC-003): axe-core scan on a real render path
  (ProjectWorkspace) with zero violations; gate via component tests in CI — verified by: `vitest run tests/component/a11y.test.tsx` (CI Node 22)
- [x] AC-004 (SPEC-015.AC-004): Dexie v2→v4 migration test (legacy avScript →
  sceneGraph) with fake-indexeddb + archival bundle round-trip/validation
  tests (pure `buildArchiveBundle`/`parseArchiveBundle` seam) green — verified by: `vitest run tests/unit/migration.test.ts tests/unit/archival.test.ts`

## Graph atoms
| Atom | Kind | Verifies |
| SPEC-015.AC-001 | spec_atom | AC-001 |
| SPEC-015.AC-001.task | task | AC-001 |
| SPEC-015.AC-001.code | code | AC-001 |
| SPEC-015.AC-001.test | test | AC-001 |
| SPEC-015.AC-001.ev | evidence | AC-001 |
| SPEC-015.AC-002(.task/.code/.test/.ev) | * | AC-002 |
| SPEC-015.AC-003(.task/.code/.test/.ev) | * | AC-003 |
| SPEC-015.AC-004(.task/.code/.test/.ev) | * | AC-004 |

## Constraints
- Zero new runtime deps; scanners are devDeps or zero-dep scripts (D1).
- D9 advisories stay allowlisted by GHSA with rationale, never silently.
- WSL natives trap: re-run `scripts/fix-wsl-natives.sh` after any npm install.

## Evidence hooks
- AC-001: `node scripts/sast.mjs` + `node scripts/dep-audit.mjs` + tamper tests
- AC-002: build + `node scripts/budget.mjs`
- AC-003: `vitest run tests/component/a11y.test.tsx`
- AC-004: `vitest run tests/unit/migration.test.ts tests/unit/archival.test.ts`
