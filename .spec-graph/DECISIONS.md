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
  evidence commands assert the real artifacts when present and exit 0 with
  an explicit `E2E-ARTIFACTS-ABSENT` note otherwise. Correction (SPEC-016,
  2026-10-29): `audit-artifacts/` is fully gitignored — `manifest.json` is
  local, not committed; the durable L2 record is `CERTIFICATION.md` (which
  quotes the manifest's key results). Binaries stay gitignored.
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
- D15 Compliance posture (Phase 09): licenses, privacy claims (no-analytics),
  and crypto-export (AES-GCM/WebAuthn) stay a *section* of security-auditor,
  not a separate persona. Split condition: first enterprise procurement that
  requires a named compliance signatory → new `compliance-counsel` persona.
- D16 Tiered quorum (Phase 09): 6 core always + 5 conditional auditors
  (security/perf/ux/design→design-reviewer/resilience/docs) + analyst on
  discovery specs only. Merges: UX+UI → design-reviewer (co-vote identical);
  market+VOC → analyst (same artifact). A flat 13-persona committee was
  rejected as quorum bureaucracy — auditors vote IFF their domain is tagged.
- D17 DAST-equivalence for zero-backend: no server ⇒ no classic DAST.
  Honest equivalent = authenticated headless probing (CSP/headers via served
  preview, auth-gate abuse paths, console PII-leak scan) + threat-model doc.
  Never claim pentest coverage; redteam blocks overclaims.
- D18 Supply-chain refresh (Phase 09, 2026-10-29): advisory DB drift surfaced 8
  new highs/crits mid-phase (dompurify ×5 now critical, vite dev-server ×5
  high, all fixed in-lockfile via `npm audit fix`: vite 6.4.5, dompurify
  3.4.17). `vite` removed from `dependencies` (build tool was mislisted as
  prod dep; kept in devDependencies). dep-audit.mjs switched to FULL audit
  (dev tooling included) with the D9 allowlist EMPTIED (all 3 resolved —
  stale permits hide regressions) and a single new permit: GHSA-gcqx-w48m-w2h4
  (deepmerge low, dev/build chain, fix = breaking vite-plugin-pwa downgrade).
- D19 Decision Gate (Phase 10, 2026-11-02): the harness intercepts its own
  consequential actions before execution, adopting IBM Research's JevAct
  (arXiv 2610.38620): domain policies compiled into executable state checks,
  structured feedback, bounded revision (3 blocks → escalation card), and
  premature-termination detection. Model-agnostic and zero-backend — a Node CLI
  in `.spec-graph/ops/decision-gate.mjs`, no agent/tool changes. Interception
  points: `graph.mjs verify` (the only path to "verified") and the release
  path. The probabilistic judgment layer is OPTIONAL: without a provider key the
  decision record says `unverified-probabilistic` — the gate never reports a
  probabilistic pass it did not obtain.
- D20 L5 + reviewer taxonomy (Phase 10, 2026-11-02): the certification gains an
  **L5 — Human-grade AV** rung next to L1–L4. Machine facts (levels, clipping,
  silence, A/V drift, scene correspondence) and human/proxy judgements stay
  separate and are never fused into one score. Every AV verdict declares
  `reviewerKind ∈ {human, agent-proxy}`; a persona verdict is always
  `agent-proxy`, and an L5 claim without a human attestation is a false claim.
  The owner's spot-check is optional and non-blocking — when absent, the
  achieved level is recorded honestly, never inflated.
- D21 Fail-closed domains (Phase 10, 2026-11-02): `ops/quorum.mjs` used to
  IGNORE a `- Domains:` value with no persona mapping, so the auditor for that
  domain was silently never required — the mirror of D-001 and a vacuous-quorum
  hole. Unknown domains now make quorum + claim-audit FAIL with a named error,
  and a spec-domain lint rejects them at source. New domain `av-quality` maps
  to the new `creative-director` persona (Tier 2, 13 personas total).
- D22 Phase-10 discovery intake (2026-11-02): D-011 (silent export — the Web
  Audio bed is never started and Web Speech cannot be muxed), D-012 (dead audio
  surface: unused producers, inert mute/volume), D-013 (unmapped domains
  silently ignored), D-014 (no certification rung asserts content) plus owner
  VOC V-003 ("test the audio and video output as a real human") and V-004
  ("think before you act — gate our own actions") were logged in
  `.spec-graph/DISCOVERY.md` and promoted into SPEC-020…SPEC-023.
