# promote-IT AV Studio — Functional Certification (v1.2.0, Phase 09)

How to read this: four levels + assurance, each with an explicit verdict. L1–L2
are machine-proven (evidence in `.spec-graph/graph.json`); L3 is a recorded
image review with findings; L4 is provider-proven. Anything not proven says so
— no claim without a working, evidenced path. This document is the **durable
record**; `audit-artifacts/` (including the local `manifest.json`) is a
gitignored working copy, not a committed artifact (D11).

Product release: **v1.2.0** · SPEC-GRAPH framework: **1.0.0**
(`.spec-graph/VERSION`) · Certification date: **2026-10-30** (L3 vision review
recorded 2026-10-29; L2/L4 artifacts recorded 2026-10-13)

## L1 — Automated gates: PASS

- `tsc --noEmit` clean · Vitest **99 tests green** (21 files: unit + jsdom
  component; the local WSL gate run is a subset because jsdom component tests
  require Node ≥22 — CI pins Node 22 and runs the full set) ·
  `vite build` green · secret-scan PASS ·
  **SAST** 0 findings / 63 files · **dep-audit** all advisories allowlisted ·
  **bundle budget** within ratchet caps · **claim-audit** PASS ·
  **orphan-scan** zero.
- Graph ledger: **51/51 atoms verified** excluding SPEC-019 — whose three
  atoms are the release steps themselves (AC-001 certification refresh, AC-002
  quorum aggregation, AC-003 release publication). Every other atom is
  verified, **0 stale** evidence nodes, and 0 open atoms outside SPEC-019
  (`.spec-graph/graph.json`, 270 nodes).
  A later edit that invalidates any of this re-opens the affected atoms
  automatically — the claim is machine-checked by
  `tests/unit/certification-claims.test.ts`.
- Proof: CI runs on every push (`.github/workflows/ci.yml`, Node 22). The pinned
  successful run ID is added to `RELEASE-REPORT.md` by the certification-pin
  commit — one commit *after* the run it proves, because a workflow run may
  never cite its own success (D10).

## L2 — Headless functional E2E: PASS (8/8 legs, recorded run 2026-10-13)

Harness: `scripts/e2e-av.mjs` (local dev server + Windows Chrome). Recorded
run: **8/8 legs green, 0 page errors, 0 console errors**; manifest dated
`2026-10-13T00:54:00.553Z`. Artifacts live in gitignored `audit-artifacts/`;
their facts are quoted below and in the artifact index — **this document is the
durable L2 record**.

| Leg | Proof |
|---|---|
| auth-unlock | vault signup/login flow completes |
| engine-remote-fallback | header engine init → `Remote API` (no WebGPU in headless) |
| wizard-generate | **6 real scenes** from OpenRouter Qwen into `sceneGraph` |
| script-table | 6 acts rendered with phonetic guides, camera, BGM cues |
| audio-speak | `speechSynthesis.speak` fired with engine-transcribed text |
| player-renders | 593,738-byte canvas, transport clock advances in wall time |
| export-webm | **4,096,366-byte `.webm`**, VP9 video + Opus audio (byte-verified) |
| export-edl | voiceover package JSON downloads |

**Honest scope of this level:** no fresh provider-backed E2E was run for
v1.2.0 — no provider key was present in the release environment, so the run
above is carried forward from the recorded 2026-10-13 session. Phase 09 did
touch runtime product code (see "Phase-09 runtime changes" below), and the
Phase-09 L3 protocol re-verified the recorded export artifact below.

**Correction vs v1.1.0:** v1.1.0 stated the export as "6.2 MB"; the recorded
artifact is **4,096,366 bytes (≈3.9 MiB)** per the manifest and the file on
disk. Corrected here.

## Phase-09 runtime changes (what changed in the product, honestly)

- `src/components/projects/ProjectWorkspace.tsx` — heading order h3 → h2
  (axe-core finding).
- `src/lib/archival.ts` — pure archive bundle seam (build/parse/validate),
  timestamped snapshot filenames so a same-day snapshot no longer overwrites
  the previous one, and OPFS listing failures now log their cause.
- `src/lib/zipImporter.ts` — malformed archive entries are counted instead of
  dropped silently, and the importer only reads the folder it owns (it
  previously also picked up unrelated zip entries as resources).
- `src/components/projects/ImportProjectModal.tsx` — surfaces the skipped
  entry count to the user.
- `src/components/system/StorageQuotaIndicator.tsx` — snapshot/restore
  failures log their cause instead of masking it.

## L3 — Vision QA: PASS (protocol-driven, 2026-10-29)

Protocol: `scripts/l3-extract.mjs` (8 evenly-spaced frames from the export
`.webm`) → review per `.spec-graph/templates/L3-RUBRIC.md` → populated
`audit-artifacts/l3-verdict.json` → `scripts/l3-assert.mjs`
(**L3-ASSERT PASS**, 8/8 frames, 4 screenshots, hash-bound).

- **Reviewer**: `agent-vision` · **Date**: 2026-10-29
- **Source**: `14_export_preview.webm` · sha256 prefix `98a3983c3fe11485`
- **Checks**: F1 rendered / F2 legibility / F3 layout / F4 continuity (per
  frame), S1–S4 (per screenshot), H1–H3 (honest status) — all pass, except
  F3 recorded as *note* (duplication nits below).
- **Findings**: act progression matches the 03:00 EDL timeline exactly
  (frames 00:10 → 02:49, scenes 1/6 → 6/6); text legible at 1280px; no black,
  clipped or overflowing frames.
- **Follow-ups (recorded, not fixed in this release)**: caption box and VO
  strip render the same sentence twice; centre "Act N" watermark duplicates the
  act heading; player scene-timeline ACT-6 card clipped at the panel edge;
  imageless scenes remain text-over-gradient (asset linking is the fix).
- **Human sign-off**: the final aesthetic call on these artifacts remains the
  release-notification touchpoint; the protocol covers F/S/H checks only.

## L4 — Provider-backed generation: PASS (recorded run 2026-10-13, carried forward)

- Provider: OpenRouter, model `qwen/qwen-2.5-7b-instruct` (keys read from
  local env only — never committed, never logged).
- Full wizard path: L2 `wizard-generate` leg produced **6 real scenes** into
  `sceneGraph` (content-hashed in the ledger).
- **Not claimed:** local WebGPU/WebLLM inference is **not** certified here
  (headless has no GPU) — that path is code-reviewed + typechecked only and
  must be exercised on a GPU device via Model Studio. No fresh provider run
  occurred for v1.2.0 (same reason as L2).

## Assurance (Phase 09)

- **SAST** (`scripts/sast.mjs`): 0 findings / 63 files scanned.
- **Dependency audit** (`scripts/dep-audit.mjs`): 1 advisory, explicitly
  allowlisted and pinned by ADR **D18** — `GHSA-gcqx-w48m-w2h4` (dev-only
  transitive, not shipped); all earlier advisories resolved (D9 emptied).
- **Bundle budget** (`scripts/budget.mjs`, ratchet in `.spec-graph/budgets.json`):
  main chunk 7,173,266 / 7,400,000 B · pdf worker 482,297 / 500,000 B ·
  html2canvas 202,379 / 210,000 B · tesseract es 159,715 / 165,000 B ·
  dompurify es 30,469 / 32,000 B · ocr worker 15,963 / 18,000 B · total JS
  8,064,089 B under the 8,300,000 B total cap — all within caps; growth
  requires an explicit cap bump (the quoted sizes are the recorded baseline
  in `.spec-graph/budgets.json`; a rebuild in a different toolchain can differ
  by a few hundred bytes, the caps are the hard limit).
- **A11y** (`tests/component/a11y.test.tsx`, axe-core): 4/4 green, zero
  violations; three real heading-order defects fixed in
  `src/components/projects/ProjectWorkspace.tsx` (h3 → h2).
- **Resilience** (`tests/unit/{migration,archival,security-tamper,import-resilience}.test.ts`
  + `tests/component/import-modal.test.tsx`): 18/18 green — schema v4 migration backfill, archive bundle round-trip with
  count-mismatch validation, and encrypted-vault tamper detection. Silent
  loss paths found in review are closed: malformed ZIP-import entries are
  counted and surfaced in the import result, OPFS snapshots use timestamped
  filenames (a same-day snapshot no longer overwrites the previous one), and
  OPFS/restore failures log their cause instead of masking it; the importer
  only reads the archive folder it owns (it previously also picked up
  unrelated zip entries as resources); the modal keeps itself open when
  entries were skipped so the count is actually shown before the import
  hand-off.
- **Tiered quorum (SPEC-014)**: 12 personas (core6 + security-auditor,
  perf-engineer, design-reviewer, resilience-engineer, docs-reviewer + the
  discovery analyst) approve Phase 09 — verdicts in
  `.spec-graph/personas/verdicts/phase-09-*.json`, resolved by
  `.spec-graph/ops/quorum.mjs`.
- **Framework export kit (SPEC-017)**: clean-room self-test
  (`scripts/export-kit.mjs`) boots the kit in a temp fixture — CLEANROOM-PASS.
- **Discovery loop (SPEC-018)**: 12 findings in `.spec-graph/DISCOVERY.md`
  (competitive scan + voice-of-customer + open gaps D-005…D-010),
  rendered into ROADMAP candidates with their promotion state — DISCOVERY-OK.

## Artifact index (recorded run 2026-10-13 + L3 protocol 2026-10-29)

| Artifact | Bytes | sha256 (prefix) |
|---|---|---|
| `10_wizard_result.png` | 83,765 | `47dd32a43ce6b801` |
| `11_script_table.png` | 168,755 | `eddd965164889dff` |
| `12_audio_studio.png` | 133,411 | `2ee1d2c5d6310127` |
| `13_player_playing.png` | 168,982 | `9c6febf5ea3718be` |
| `14_export_preview.webm` | 4,096,366 | `98a3983c3fe11485` |
| `15_voiceover_EDL.json` | 2,827 | `d648c709ded54566` |
| `l3-frames/frame-00..07.jpg` | 8 frames | extracted from `98a3983c3fe11485` |

## Known limits (not hidden)

- Imageless scenes render text-over-gradient until assets are linked (by design).
- TTS voice quality is the device's speech engine — not a fixed timbre.
- Local WebGPU/WebLLM inference is unproven headless (no GPU in CI); the remote
  provider path is the evidenced one.
- L2/L4 evidence is carried forward from the 2026-10-13 recorded run: a fresh
  provider-backed E2E needs `E2E_OPENROUTER_KEY` + Windows Chrome + a running
  dev server (environment-bound, D11 — never asserted in CI).
- jsdom component tests require Node ≥22; WSL Linux `node` (v20) runs
  unit-only by the version gate in `vitest.config.ts`.
- Tab-capture narration recording needs a user gesture + Chrome/Edge; OPFS
  snapshots need Chromium (other browsers get an honest message, not a fake UI).
- PWA updates are **eventually consistent**: `registerType: 'autoUpdate'` with
  auto-injected registration means a new build activates on the next load
  (skipWaiting + clientsClaim, no in-flight drain, no update prompt). The
  precache guarantees the offline **shell** only; in-flight work is not
  migrated, so the wizard persists before the AI call to bound the exposure.
- Phase-09 L3 follow-ups (caption/VO duplication, watermark duplication, ACT-6
  card clipping) are open product polish, not certification blockers.
- Bundle budgets are ratchets: any growth needs an explicit, visible cap bump.
- Open security gaps, tracked as discovery candidates rather than claimed as
  controls: no Content-Security-Policy (D-005), the PIN path is a single
  unsalted SHA-256 with no attempt throttling (D-006), the headless harness
  has no console secret/PII-leak scanner (D-007), the app still loads Google
  Fonts from a third-party origin — visitor IPs reach that origin and
  typography depends on it (D-008), restored campaign rows are not validated
  row-by-row against the v4 schema (D-009), and no lockfile-diff review step
  runs at release time (D-010).
