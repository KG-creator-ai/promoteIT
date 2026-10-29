# SPEC-016: Vision-L3 protocol (frame extraction + rubric + verdict)
- Status: done
- Phase: 09
- Owner-persona: design-reviewer
- Domains: ux, docs

## Goal
Protocolize L3 human+vision QA instead of ad-hoc eyeballing: `l3-extract.mjs`
picks evenly-spaced frames from export `.webm` artifacts; a binding rubric
template defines what agent vision must check; a populated `l3-verdict.json`
(recorded by an actual image review) is machine-validated by `l3-assert.mjs`;
`CERTIFICATION.md` template embeds the verdict section. Also corrects the L2
record honesty bug: D11/CERTIFICATION claimed `manifest.json` is committed —
it never was (`audit-artifacts/` fully gitignored).

## Non-goals
- Committing binary frames/videos (stay gitignored, D11); automated
  visual-regression baselines (needs golden images — future atom if wanted).

## Acceptance Criteria
- [x] AC-001 (SPEC-016.AC-001): `scripts/l3-extract.mjs` finds ffmpeg (PATH →
  `$HOME/.local/ffmpeg` → `FFMPEG` env), extracts ≥6 evenly-spaced frames from
  `audit-artifacts/*.webm` + `meta.json`; no-artifacts ⇒ exit 0 with
  `L3-ARTIFACTS-ABSENT` (CI-safe, D11 pattern); ffmpeg-missing WITH artifacts ⇒
  exit 1 (no silent skip) — verified by: `node scripts/l3-extract.mjs`
- [x] AC-002 (SPEC-016.AC-002): `.spec-graph/templates/L3-RUBRIC.md` (binding
  checklist) + populated `audit-artifacts/l3-verdict.json` from a real image
  review (reviewer, per-frame notes, rubric answers, sourceHash) validated by
  `scripts/l3-assert.mjs` (schema + frame coverage + hash match; absent ⇒
  `L3-VERDICT-ABSENT` exit 0) — verified by: `node scripts/l3-assert.mjs`
- [x] AC-003 (SPEC-016.AC-003): `.spec-graph/templates/CERTIFICATION.md`
  mandates L1–L4 verdicts, artifact index with hashes, L3-vision section with
  reviewer+findings, assurance-scanner section, known-limits section; D11
  wording corrected (manifest is local; CERTIFICATION carries the durable
  record) — verified by: grep chain over template + DECISIONS.md

## Graph atoms
| Atom | Kind | Verifies |
| SPEC-016.AC-001 | spec_atom | AC-001 |
| SPEC-016.AC-001.task | task | AC-001 |
| SPEC-016.AC-001.code | code | AC-001 |
| SPEC-016.AC-001.test | test | AC-001 |
| SPEC-016.AC-001.ev | evidence | AC-001 |
| SPEC-016.AC-002(.task/.code/.test/.ev) | * | AC-002 |
| SPEC-016.AC-003(.task/.code/.test/.ev) | * | AC-003 |

## Constraints
- Frames + verdict JSON stay in gitignored `audit-artifacts/`; durable record
  lives in committed CERTIFICATION.md (SPEC-019).
- Evidence commands must exit 0 in CI where artifacts don't exist (D11).
- Honest statuses: extraction/verdict presence is asserted, never simulated.

## Evidence hooks
- `node scripts/l3-extract.mjs` for AC-001
- `node scripts/l3-assert.mjs` for AC-002
- grep chain (template sections + D11 corrected wording) for AC-003
