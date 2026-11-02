# SPEC-024: Discovery promotion — close D-005…D-010
- Status: draft
- Phase: 10
- Owner-persona: security-auditor
- Domains: security, resilience, docs, ux

## Goal
Promote the six standing discovery candidates into shipped fixes: a
Content-Security-Policy (D-005), PBKDF2 + throttling for the PIN path (D-006),
a console secret-leak scanner in the headless harness (D-007), self-hosted
fonts (D-008), row-by-row validation of restored campaigns (D-009) and a
lockfile-diff summary in the release report (D-010).

## Non-goals
- No server-side CSP delivery (zero-backend): the policy is a meta tag and/or
  the preview server header.
- No font redesign; the visual pass must still hold after the change.
- No lockfile churn beyond what the fixes require.

## Acceptance Criteria
- [ ] AC-001 (SPEC-024.AC-001): a Content-Security-Policy is configured that is
  compatible with the Vite build, the Web Workers and the blob/data URLs the app
  uses, and the headless probe asserts its presence and that the app still
  loads — verified by:
  `node ./node_modules/vitest/vitest.mjs run tests/unit/security-csp.test.ts`
- [ ] AC-002 (SPEC-024.AC-002): the PIN path uses **PBKDF2** with a per-vault
  salt and attempt throttling, and an existing PIN hash migrates on unlock —
  verified by: `node ./node_modules/vitest/vitest.mjs run tests/unit/security-pin.test.ts`
- [ ] AC-003 (SPEC-024.AC-003): the E2E harness scans captured console/page
  output for key-shaped strings and **fails the leg** on a hit, never printing
  the matched value — verified by:
  `node ./node_modules/vitest/vitest.mjs run tests/unit/e2e-leak-scan.test.ts`
- [ ] AC-004 (SPEC-024.AC-004): no third-party font origin is contacted — the
  font families are self-hosted or replaced by the system stack, and the visual
  pass is re-verified — verified by:
  `node ./node_modules/vitest/vitest.mjs run tests/unit/security-fonts.test.ts`
- [ ] AC-005 (SPEC-024.AC-005): *(redteam)* restored campaign rows are validated
  **row by row** against the v4 schema, and a malformed row is rejected with a
  per-row reason instead of being written to `db.campaigns` —
  verified by: `node ./node_modules/vitest/vitest.mjs run tests/unit/migration.test.ts`
- [ ] AC-006 (SPEC-024.AC-006): the release process emits a lockfile-diff
  summary (added/removed/updated packages) attached to the release report —
  verified by: `node ./node_modules/vitest/vitest.mjs run tests/unit/lockfile-diff.test.ts`

## Graph atoms
| Atom | Kind | Verifies |
| --- | --- | --- |
| SPEC-024.AC-001 | spec_atom | AC-001 |
| SPEC-024.AC-001(.task/.code/.test/.ev) | * | AC-001 |
| SPEC-024.AC-002 | spec_atom | AC-002 |
| SPEC-024.AC-002(.task/.code/.test/.ev) | * | AC-002 |
| SPEC-024.AC-003 | spec_atom | AC-003 |
| SPEC-024.AC-003(.task/.code/.test/.ev) | * | AC-003 |
| SPEC-024.AC-004 | spec_atom | AC-004 |
| SPEC-024.AC-004(.task/.code/.test/.ev) | * | AC-004 |
| SPEC-024.AC-005 | spec_atom | AC-005 |
| SPEC-024.AC-005(.task/.code/.test/.ev) | * | AC-005 |
| SPEC-024.AC-006 | spec_atom | AC-006 |
| SPEC-024.AC-006(.task/.code/.test/.ev) | * | AC-006 |

## Constraints
- Zero-backend and no new runtime dependency; the CSP must not break the
  workers, blob URLs or the media export path.
- The leak scanner must never print a matched secret value.
- Throttling must not lock a legitimate user out of their own vault.
- The font change must preserve the existing visual pass (L3 re-verification).

## Evidence hooks
- `node ./node_modules/vitest/vitest.mjs run tests/unit/security-csp.test.ts` for AC-001
- `node ./node_modules/vitest/vitest.mjs run tests/unit/security-pin.test.ts` for AC-002
- `node ./node_modules/vitest/vitest.mjs run tests/unit/e2e-leak-scan.test.ts` for AC-003
- `node ./node_modules/vitest/vitest.mjs run tests/unit/security-fonts.test.ts` for AC-004
- `node ./node_modules/vitest/vitest.mjs run tests/unit/migration.test.ts` for AC-005
- `node ./node_modules/vitest/vitest.mjs run tests/unit/lockfile-diff.test.ts` for AC-006
