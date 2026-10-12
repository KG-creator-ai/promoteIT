# SPEC-008: AudioStudio becomes real TTS (zero-backend)
- Status: draft
- Phase: 08
- Owner-persona: po

## Goal
AudioStudio drives the real `audioEngine` singleton (Web Speech + Indian phonetic
pipeline): live browser voices, per-segment + master playback, wired rate/volume,
honest progress, working export. Zero mocks, zero backend.

## Non-goals
- Piper/Sherpa-ONNX WASM integration (deferred; the fake model names become the
  honest "System voices (Web Speech)" picker). No cloud TTS.

## Acceptance Criteria
- [x] AC-001 (SPEC-008.AC-001): voice picker lists real `speechSynthesis` voices via `getAvailableVoices()`; selection routes to `setSelectedVoiceURI` and persists — verified by: component test with mocked speechSynthesis + e2e voice count > 0
- [x] AC-002 (SPEC-008.AC-002): segment Play calls `playVoiceover(text, pitch, rate, voiceURI, false, sceneIndex)`; master play speaks scenes sequentially to `onSceneSpeechEnd`; stop cancels via `stopVoiceover` — verified by: e2e asserting `speechSynthesis.speak` fired + utterance text matches scene
- [x] AC-003 (SPEC-008.AC-003): rate/volume sliders drive utterance params; progress bar is boundary/listener-driven (no `Math.random` in render path); TTS-unavailable browsers get an honest notice, not a fake UI — verified by: `grep -c Math.random AudioStudio.tsx` == 0 + e2e

## Graph atoms
| Atom | Kind | Verifies |
| SPEC-008.AC-001 | spec_atom | AC-001 |
| SPEC-008.AC-001.task | task | AC-001 |
| SPEC-008.AC-001.code | code | AC-001 |
| SPEC-008.AC-001.test | test | AC-001 |
| SPEC-008.AC-001.ev | evidence | AC-001 |
| SPEC-008.AC-002(.task/.code/.test/.ev) | * | AC-002 |
| SPEC-008.AC-003(.task/.code/.test/.ev) | * | AC-003 |

## Constraints
- Zero-backend; speechSynthesis only (no MediaStream fabrication of voice).
- Auth-gate selectors + 44px targets unchanged.

## Evidence hooks
- `vitest run tests/component/audio-studio.test.tsx` for AC-001/002 (mocked engine)
- `node scripts/e2e-av.mjs` audio leg for AC-002/003
