# Release Report — v1.2.0 (Phase 09, "10/10 Framework")

- **Tag**: `v1.2.0` — created from the release commit immediately after this
  report is committed and CI is green; `scripts/release-assert.mjs` verifies
  the tag, this report and the published assets together.
- **CERTIFICATION.md sha256 (prefix)**: `9297fb491aede2de`
- **Pinned CI run**: GitHub Actions run **41382738041** on commit `f131507`
  (conclusion: success, 2026-10-30). D10: this report and the certification
  cite a run from a *prior* commit — never the run this pin commit triggers.
- **Release remote**: `creator-ai` → `https://github.com/KG-creator-ai/promoteIT.git`
  (`origin` left untouched, per the release policy recorded in the roadmap).
- **Framework**: SPEC-GRAPH 1.0.0 (`.spec-graph/VERSION`); product release
  v1.2.0 — the two versions are deliberately separate.

## Scope of v1.2.0

Framework assurance, not new product surface. Six specs, all Phase 09:

| Spec | What shipped |
|---|---|
| SPEC-014 | Tiered persona roster (12 personas), `domains` metadata in graph schema v3.1.0, conditional quorum resolver + claim-audit check #6 |
| SPEC-015 | Assurance tooling in the gate chain: SAST, dependency audit, bundle-budget ratchet, axe-core a11y suite, resilience (migration/archive/tamper) tests, threat model |
| SPEC-016 | Vision-L3 protocol: even-frame extraction, binding rubric, hash-bound verdict JSON, certification template — plus the D11 record-honesty correction |
| SPEC-017 | Export kit: complete quickstart (`.opencode/` included), portability-safe guardrails, framework version stamp, clean-room self-test |
| SPEC-018 | Discovery loop: competitive-scan + voice-of-customer intake format, populated log, deterministic roadmap-candidate renderer |
| SPEC-019 | Certification refresh, tiered-quorum consent for the phase, release mechanics |

## Verification at release

- Gate chain: typecheck · 99 tests across 21 files (the local WSL gate run is a
  subset — jsdom component tests need Node ≥22; CI pins Node 22) · SAST ·
  dep-audit · secret-scan — PASS.
- Claim-audit (anti-hallucination, 6 checks incl. tiered quorum) — PASS.
- Ledger: 53/54 atoms verified at this commit — the only open atom is
  SPEC-019.AC-003 (the release publication itself), which
  `scripts/release-assert.mjs` verifies immediately after the tag and assets
  land; the ledger then closes at 54/54. Evidence hashes re-checked (a doc
  edit re-opens the affected atom automatically).
- Tiered quorum: core6 + security-auditor + perf-engineer + design-reviewer +
  resilience-engineer + docs-reviewer + analyst — all approve Phase 09.
- L3 vision review: 8 frames + 4 screenshots, hash-bound to the export
  artifact, 4 follow-ups recorded as open polish.

## Honest limits (same list as the certification)

- L2/L4 evidence is carried forward from the recorded 2026-10-13 headless run
  (no provider key was present at release time) — see `CERTIFICATION.md`.
- No CSP is configured; the PIN path is a single unsalted SHA-256 — both are
  recorded as open discovery candidates (D-005, D-006), not as mitigations.
- Headless E2E and local WebGPU inference remain environment-bound (D11).
