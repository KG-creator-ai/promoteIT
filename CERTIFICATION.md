# promote-IT AV Studio — Functional Certification (v1.1.0, Phase 08)

How to read this: four levels, each with an explicit verdict. L1–L2 are
machine-proven (evidence in `.spec-graph/graph.json`); L3 is human judgment on
recorded artifacts; L4 is provider-proven. Anything not proven says so.

## L1 — Automated gates: PASS

- `tsc --noEmit` clean · Vitest **50 tests green** (unit + jsdom component) ·
  `vite build` green · secret-scan PASS · `claim-audit.mjs` PASS · orphan-scan zero.
- Proof: CI runs on every push (`.github/workflows/ci.yml`, Node 22).

## L2 — Headless functional E2E: PASS (8/8 legs)

Harness: `scripts/e2e-av.mjs` (local dev server + Windows Chrome). Latest run:
**8/8 legs green, 0 page errors, 0 console errors.** Artifacts in
`audit-artifacts/` (gitignored; `manifest.json` committed as the L2 record).

| Leg | Proof |
|---|---|
| auth-unlock | vault signup/login flow completes |
| engine-remote-fallback | header engine init → `Remote API` (no WebGPU in headless) |
| wizard-generate | **6 real scenes** from OpenRouter Qwen into `sceneGraph` |
| script-table | 6 acts rendered with phonetic guides, camera, BGM cues |
| audio-speak | `speechSynthesis.speak` fired with engine-transcribed text |
| player-renders | 606 KB canvas, transport clock advances in wall time |
| export-webm | **6.2 MB `.webm`, VP9 video + Opus audio** (byte-verified) |
| export-edl | voiceover package JSON downloads |

Bugs this level caught and fixed (all committed): playback clock reset every
render (unmemoized timeline), export recorder never stopping (stale closure),
env-specific evidence (exec bit, remote name), CDP download paths, textarea
setter misuse in the harness itself.

## L3 — Human + vision QA: CONDITIONAL PASS (agent vision), FINAL CALL YOURS

I inspected all four screenshots: wizard completion, 6-act script table
(phonetics, camera, cues all coherent), Audio Studio (6 segments, 3 enumerated
voices, working controls), player (overlays, timeline, 00:00/03:25 transport).
Artifacts for your judgment: `audit-artifacts/` — `10_wizard_result.png`,
`11_script_table.png`, `12_audio_studio.png`, `13_player_playing.png`,
`14_export_preview.webm` (plays in any browser), `15_voiceover_EDL.json`.

Known honest limits: imageless scenes render text-over-gradient (by design until
assets are linked); TTS voice quality = the device's speech engine; "great" is
your call on the artifacts.

## L4 — Provider-backed generation: PASS (OpenRouter Qwen)

- Connectivity: OpenRouter `/models` 200, NVIDIA NIM `/models` 200 (keys from
  local env only — never committed, never logged; **rotate both after this run**).
- Minimal chat path: `qwen/qwen-2.5-7b-instruct` returned exact expected output.
- Full wizard path: L2 `wizard-generate` leg (6 scenes, content-hashed in graph).
- WebLLM default is now Qwen2.5-7B (airgap-capable); Qwen2.5-1.5B listed for
  edge devices. Local WebGPU inference itself is NOT certified here (headless
  has no GPU) — honest status: WebLLM path code-reviewed + typechecked, live
  load must happen on a GPU device via Model Studio.

## Known limits (not hidden)

- Component tests needing jsdom run in CI (Node 22) and Windows-node; WSL
  Linux-node runs unit-only by version gate (documented in `vitest.config.ts`).
- E2E evidence is environment-bound (D11); CI runs unit/component/typecheck/build.
- Tab-capture narration recording needs a user gesture + Chrome/Edge (by design).
- OPFS snapshots need Chromium; other browsers get an honest message, not a fake UI.
