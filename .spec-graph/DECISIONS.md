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
