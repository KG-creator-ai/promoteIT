# SPEC-009: Video pipeline consolidation (VideoRenderer gets a consumer)
- Status: draft
- Phase: 08
- Owner-persona: po

## Goal
One scene renderer: AVVideoPlayer delegates frame drawing to `VideoRenderer`
via an `AVSceneNode → Scene` adapter (preloading, cross-fades, outro). Export
mixes the canvas stream with the BGM audio track (`audioEngine.getAudioStream`)
so the `.webm` has real sound. Orphan resolved by wiring.

## Non-goals
- Changing scene timing model or player state machine; 4K/60fps targets.

## Acceptance Criteria
- [x] AC-001 (SPEC-009.AC-001): player frame path calls `renderer.renderFrame` through the adapter; no duplicate scene-draw code for scenes/outro in the component — verified by: `tsc` + e2e frames render (screenshot pixels differ across time)
- [x] AC-002 (SPEC-009.AC-002): export stream carries 1 video + 1 audio track; downloaded `.webm` is non-trivially sized — verified by: e2e asserting `getAudioTracks().length === 1` at record time + artifact size check
- [x] AC-003 (SPEC-009.AC-003): no playback regression (play/pause/seek/scene-advance behave as before) — verified by: e2e player-leg assertions + screenshots

## Graph atoms
| Atom | Kind | Verifies |
| SPEC-009.AC-001 | spec_atom | AC-001 |
| SPEC-009.AC-001.task | task | AC-001 |
| SPEC-009.AC-001.code | code | AC-001 |
| SPEC-009.AC-001.test | test | AC-001 |
| SPEC-009.AC-001.ev | evidence | AC-001 |
| SPEC-009.AC-002(.task/.code/.test/.ev) | * | AC-002 |
| SPEC-009.AC-003(.task/.code/.test/.ev) | * | AC-003 |

## Constraints
- Keep export filename/behavior contract (`<title>_Preview.webm` download).
- BGM audio requires user gesture (AudioContext policy) — export starts from a click.

## Evidence hooks
- `node scripts/e2e-av.mjs` player/export legs for AC-001/002/003
