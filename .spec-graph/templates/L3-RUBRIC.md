# L3 Vision Rubric — binding review checklist (SPEC-016.AC-002)

Review inputs: `audit-artifacts/l3-frames/frame-NN.jpg` (+ `meta.json`), the
4 QA screenshots, and `14_export_preview.webm` when a player is available.
Every rubric item gets a verdict in `audit-artifacts/l3-verdict.json`:
`pass` | `fail` | `note` (+ `detail` string). A `fail` blocks CERTIFICATION
L3 sign-off until fixed or explicitly waived (D14).

## Per-frame (export artifact)
- F1 Rendered: non-black, non-placeholder frame; scene content visible.
- F2 Text legibility: overlays/subtitles readable at 1280px; no clipping/overlap.
- F3 Layout integrity: safe margins; no stray debug UI, no duplicated captions.
- F4 Continuity: neighboring frames tell a coherent progression (acts advance).

## Screenshots (app flows)
- S1 Wizard result: generated scenes visible, statuses coherent.
- S2 Script table: acts/phonetics/camera/BGM columns populated and aligned.
- S3 Audio Studio: voice list, rate/volume, segment map, export controls.
- S4 Player: transport state, clock advancing, timeline matches scene count.

## Honest-status checks
- H1 Engine chip shows the truth (e.g. "Remote API" fallback, not a fake GPU).
- H2 No "AI generated" claim without provider evidence (L4 linkage).
- H3 Known limits stated (imageless scenes, TTS engine dependency).

## Verdict JSON schema
```json
{
  "reviewer": "agent-vision | human",
  "reviewedAt": "<ISO>",
  "source": "<webm filename>",
  "sourceHash": "<sha256 of webm, 16 chars>",
  "frames": [{ "name": "frame-00.jpg", "notes": "...", "checks": { "F1": "pass" } }],
  "screenshots": [{ "name": "10_wizard_result.png", "checks": { "S1": "pass" } }],
  "honestStatus": { "H1": "pass", "H2": "pass", "H3": "pass" },
  "overall": "pass | fail",
  "followUps": ["..."]
}
```
Frame coverage rule: `frames` must cover every file in `l3-frames/`
(meta frames minus 1 allowed for edge frames — assert script enforces ≥75%).
