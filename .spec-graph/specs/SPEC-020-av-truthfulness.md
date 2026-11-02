# SPEC-020: AV truthfulness — real audio in the export, honest labels
- Status: done
- Phase: 10
- Owner-persona: builder
- Domains: resilience, ux, discovery

## Goal
The exported AV file must contain what the UI claims it contains: an audible
audio track, a truthful description of that track, and no dead audio surface
left behind. Today `startContinuousBgm()` is never called, so the muxed bus is
silent; Chrome's speech output can never enter the file; and mute/volume are
inert React state (D-011, D-012).

## Non-goals
- No local TTS/WASM speech model (new runtime dependency — D1 hard stop).
- No change to the visual renderer, the scene graph or the provider path.
- Never claim the browser speech voiceover is inside the exported file.

## Acceptance Criteria
- [x] AC-001 (SPEC-020.AC-001): the export muxes an **audible** track — the
  recorded webm's audio decodes to a peak above the silence floor and a silence
  ratio below the ceiling (measured by the SPEC-021 analyser), and the audio
  bed is started for the export window so the muxed bus carries signal —
  verified by: `node ./node_modules/vitest/vitest.mjs run tests/unit/av-export-audio.test.ts`
- [x] AC-002 (SPEC-020.AC-002): the export **states its contents** — the
  voiceover EDL JSON and the export UI name the included tracks (audio bed /
  recorded narration / subtitles) and state that the browser speech voiceover is
  included only when a narration track was recorded — verified by:
  `node ./node_modules/vitest/vitest.mjs run tests/unit/av-export-audio.test.ts`
- [x] AC-003 (SPEC-020.AC-003): **no dead audio surface** — every public method
  of `audioEngine` and every local callback of `AVVideoPlayer` is either called
  from `src/` or removed, and a method-level dead-surface scan fails on any
  unused public method — verified by: `node scripts/dead-surface.mjs`
- [x] AC-004 (SPEC-020.AC-004): *(redteam)* the failure path — no tab-capture
  permission and no bed — still exports a playable file and labels it
  `video + subtitles only (no audio)` instead of claiming audio —
  verified by: `node ./node_modules/vitest/vitest.mjs run tests/unit/av-export-fallback.test.ts`

## Graph atoms
| Atom | Kind | Verifies |
| --- | --- | --- |
| SPEC-020.AC-001 | spec_atom | AC-001 |
| SPEC-020.AC-001(.task/.code/.test/.ev) | * | AC-001 |
| SPEC-020.AC-002 | spec_atom | AC-002 |
| SPEC-020.AC-002(.task/.code/.test/.ev) | * | AC-002 |
| SPEC-020.AC-003 | spec_atom | AC-003 |
| SPEC-020.AC-003(.task/.code/.test/.ev) | * | AC-003 |
| SPEC-020.AC-004 | spec_atom | AC-004 |
| SPEC-020.AC-004(.task/.code/.test/.ev) | * | AC-004 |

## Constraints
- Zero-backend: no server, no new runtime dependency.
- The narration capture path stays client-side (tab capture → `<audio>` →
  `captureStream()` → mux) and requires an explicit user gesture.
- Export labelling must never overstate what is in the file (D11 spirit).
- Existing E2E auth-gate selectors must stay stable.

## Evidence hooks
- `node ./node_modules/vitest/vitest.mjs run tests/unit/av-export-audio.test.ts` for AC-001/AC-002
- `node scripts/dead-surface.mjs` for AC-003
- `node ./node_modules/vitest/vitest.mjs run tests/unit/av-export-fallback.test.ts` for AC-004
