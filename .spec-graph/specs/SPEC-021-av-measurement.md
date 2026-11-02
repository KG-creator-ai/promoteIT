# SPEC-021: AV measurement harness — machine facts about picture and sound
- Status: done
- Phase: 10
- Owner-persona: builder
- Domains: perf, resilience

## Goal
Make the audio and video of an export **measurable**: per-stream facts, audio
level/clipping/silence, picture-and-sound drift, and scene correspondence —
computed both from the file on disk and in-browser from the recorded blob, with
no server (D-014).

## Non-goals
- No perceptual "beauty" scoring — that is the human/proxy review (SPEC-022).
- No ASR, no loudness-normalisation target (a human judges intelligibility).
- No change to the product's rendering behaviour.

## Acceptance Criteria
- [x] AC-001 (SPEC-021.AC-001): `scripts/av-analyze.mjs` emits a machine-readable
  AV facts JSON — per-stream codec, duration, bitrate, channels, sample rate;
  audio peak, RMS, clipping ratio, silence ratio; A/V duration drift; black-frame
  and freeze-frame counts — each bound to the source artifact's sha256 prefix —
  verified by: `node ./node_modules/vitest/vitest.mjs run tests/unit/av-analyze.test.ts`
- [x] AC-002 (SPEC-021.AC-002): the same audio facts are computable **in-browser**
  from the exported blob via `decodeAudioData` (no server), and the in-browser
  and on-disk paths agree on duration within one frame tolerance —
  verified by: `node ./node_modules/vitest/vitest.mjs run tests/unit/av-metrics.test.ts`
- [x] AC-003 (SPEC-021.AC-003): the analyser is CI-safe — with no artifact it
  prints `AV-ARTIFACTS-ABSENT` and exits 0 (D11); with an artifact but no
  ffmpeg it fails loudly with a non-zero exit (no silent skip) —
  verified by: `node ./node_modules/vitest/vitest.mjs run tests/unit/av-analyze.test.ts`
- [x] AC-004 (SPEC-021.AC-004): *(redteam)* a synthetic artifact with a silent
  audio track and a truncated video track is **rejected** by the facts check —
  no false "audible, in sync" verdict — verified by:
  `node ./node_modules/vitest/vitest.mjs run tests/unit/av-analyze.test.ts`

## Graph atoms
| Atom | Kind | Verifies |
| --- | --- | --- |
| SPEC-021.AC-001 | spec_atom | AC-001 |
| SPEC-021.AC-001(.task/.code/.test/.ev) | * | AC-001 |
| SPEC-021.AC-002 | spec_atom | AC-002 |
| SPEC-021.AC-002(.task/.code/.test/.ev) | * | AC-002 |
| SPEC-021.AC-003 | spec_atom | AC-003 |
| SPEC-021.AC-003(.task/.code/.test/.ev) | * | AC-003 |
| SPEC-021.AC-004 | spec_atom | AC-004 |
| SPEC-021.AC-004(.task/.code/.test/.ev) | * | AC-004 |

## Constraints
- Zero-backend; ffmpeg/ffprobe are **local-only** tools — CI-safe degradation
  must follow D11 (`ARTIFACTS-ABSENT`, exit 0) while the durable facts live in
  the certification document.
- Analysis must never upload media anywhere.
- The analyser must not modify the artifact it inspects.

## Evidence hooks
- `node ./node_modules/vitest/vitest.mjs run tests/unit/av-analyze.test.ts` for AC-001/AC-003/AC-004
- `node ./node_modules/vitest/vitest.mjs run tests/unit/av-metrics.test.ts` for AC-002
