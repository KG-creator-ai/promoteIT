# SPEC-004: Real PWA assets (icons per manifest, og-image)
- Status: draft
- Phase: 01
- Owner-persona: po

## Goal
Manifest-declared icons are real PNGs at declared sizes (current files are 1×1 stubs:
68 bytes each); `og-image.png` referenced by index.html exists.

## Non-goals
- Brand redesign; new icon art direction (solid brand-teal regeneration is acceptable).

## Acceptance Criteria
- [ ] AC-001 (SPEC-004.AC-001): `icon-192x192.png` is 192×192 and `icon-512x512.png` is 512×512 — verified by: `python3` PNG-dimension check
- [ ] AC-002 (SPEC-004.AC-002): `public/og-image.png` exists (≥1200×630) and index.html references it — verified by: `test -f` + dimension check
- [ ] AC-003 (SPEC-004.AC-003): `apple-touch-icon.png` is 180×180 — verified by: dimension check

## Graph atoms
| Atom | Kind | Verifies |
| SPEC-004.AC-001 | spec_atom | AC-001 |
| SPEC-004.AC-001.task | task | AC-001 |
| SPEC-004.AC-001.code | code | AC-001 |
| SPEC-004.AC-001.test | test | AC-001 |
| SPEC-004.AC-001.ev | evidence | AC-001 |
| SPEC-004.AC-002(.task/.code/.test/.ev) | * | AC-002 |
| SPEC-004.AC-003(.task/.code/.test/.ev) | * | AC-003 |

## Constraints
- Extend `scripts/gen-favicons.cjs` style (zero-dep PNG writer) — no new dependencies.
- Don't touch auth-gate selectors or audit paths.

## Evidence hooks
- PNG dimension checks for AC-001/002/003
