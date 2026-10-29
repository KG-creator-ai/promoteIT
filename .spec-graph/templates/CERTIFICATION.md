# promote-IT AV Studio — Functional Certification (v{{VERSION}})

How to read: four levels + assurance sections. L1–L2 are machine-proven
(evidence in `.spec-graph/graph.json`); L3 is a recorded image review with
findings; L4 is provider-proven. Anything not proven says so — no claim
without a working, evidenced path.

## L1 — Automated gates: {{L1_VERDICT}}
- typecheck · tests (N green) · build · secret-scan · **sast** · **dep-audit**
  · **budget** · claim-audit PASS. Proof: pinned CI run ID (D10).

## L2 — Headless functional E2E: {{L2_VERDICT}}
- Harness `scripts/e2e-av.mjs`; table of legs + key artifact facts
  (bytes, codecs, sha256 prefixes). Artifacts stay in gitignored
  `audit-artifacts/` — **the durable L2 record is this document** (the local
  `manifest.json` is a working copy, not committed).

## L3 — Vision QA: {{L3_VERDICT}}
- Protocol: `scripts/l3-extract.mjs` (even frames from export webm) →
  review per `.spec-graph/templates/L3-RUBRIC.md` → `l3-verdict.json` →
  `scripts/l3-assert.mjs`.
- **Reviewer**: {{L3_REVIEWER}} · **Date**: {{L3_DATE}}
- **Findings**: per-frame/screenshot summary + follow-ups (if any).
- **Human sign-off**: this section's final aesthetic verdict is the human
  touchpoint (#2, release notification); agent vision covers F/S/H checks.

## L4 — Provider-backed generation: {{L4_VERDICT}}
- Which providers, which models, what was generated (with content hashes),
  and what is NOT claimed (e.g. WebGPU path unverified headless).

## Assurance (Phase 09)
- SAST: zero findings (scripts/sast.mjs). Dependency audit: N advisories,
  all explicitly allowlisted by ADR (list them). Bundle budget: sizes vs
  caps table. A11y: axe violations zero (component suite). Resilience:
  migration + archive round-trip tests green.

## Known limits (not hidden)
- {{KNOWN_LIMITS — honest list: imageless scenes, TTS engine dependency,
  WebGPU local path unproven headless, environment-bound evidence, etc.}}
