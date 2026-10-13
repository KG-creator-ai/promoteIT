# ADR-lite — v1.0.0 roadmap decisions (Phase 02)

- D1 Zero-backend stays hard constraint (AGENTS.md). No server code, no new runtime deps.
- D2 Test stack: Vitest 5 + node-env unit tests; jsdom component tests deferred to CI
  (local Node v20 lacks `worker_threads.markAsUncloneable` required by undici 8).
- D3 npm scripts rewritten to `node ./node_modules/...` form (cross-shell, cross-OS).
- D4 WSL Linux natives for rollup/esbuild installed manually via
  `scripts/fix-wsl-natives.sh` (Windows npm refuses `--os=linux` overrides).
- D5 Trunk-based flow (no `gh` CLI): local pre-push gate + authoritative Actions CI.
- D6 PWA assets regenerated with the repo's zero-dep PNG writer (brand-teal placeholders
  at correct dimensions) — no new dependencies for artwork.
- D7 Freshness ledger-exclusion: `graph.json` never hash-tracks itself.
- D8 Release remote is `creator-ai`; `origin` untouched until Phase-07 releaser verdict.
- D9 Harden 2026-10-12: removed unused direct deps (express/dotenv/tsx/@types/express —
  zero imports repo-wide), eliminating the proxy-addr/qs advisory chain. Remaining 3
  advisories accepted with rationale: dompurify×2 via jspdf (client-side, same-origin
  export path; worst case self-XSS) and source-map-js (build-time only, never shipped).
- D10 CI-evidence rule: a workflow run cannot cite its own success (self-reference
  paradox — "latest run" query returns the in-progress run). CI atoms are verified
  OUT-OF-BAND with pinned successful run IDs (here: 38224612161 @78a6dc3); any later
  change to hash-tracked code/test paths auto-reopens them for a fresh pinned run.
- D11 L2-evidence rule (mirror of D10): headless-Chrome artifacts (audit-artifacts/)
  exist only where Windows Chrome + dev server run — never in CI checkouts. E2E
  evidence commands assert the real artifacts when present and exit 0 with an
  explicit `E2E-ARTIFACTS-ABSENT` note otherwise. The committed `manifest.json`
  + `CERTIFICATION.md` carry the L2 record; binaries stay gitignored.
- D13 No self-referential evidence: an evidence command must not invoke the
  auditor (claim-audit) itself — nested audits inherit unrelated open atoms and
  can never stably pass. SPEC-007.AC-003 evidence is `report.mjs` (which runs
  the gate chain) without the nested audit.
- D14 Waiver discipline: `waived` status is allowed ONLY with PO+releaser
  rationale, a named re-verify condition, and a deadline (next green CI).
  Used once: SPEC-001.AC-003 (setup.ts changed after its CI pin; re-verify on
  the next green run, then un-waive).
- D12 Orphan verdicts 2026-10-13: audioEngine → wired into AudioStudio (SPEC-008);
  videoRenderer → wired into AVVideoPlayer (SPEC-009); campaignPresets →
  wired into ProjectWorkspace preset picker (SPEC-012); archival → wired into
  System Health OPFS snapshot card (SPEC-012); SutraCopilot barrel DELETED
  (name still re-exported from SutraAssistant); assetLibrary DELETED
  (inventory superseded by campaignPresets direct media imports — single source).
