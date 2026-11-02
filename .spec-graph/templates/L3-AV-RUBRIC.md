# L3-AV Rubric v2 — audio and video judged like a person (SPEC-022)

Review inputs: the packaged clips in `audit-artifacts/l3-av-package/`
(`clip-NN.webm` + `clip-NN.wav`), `manifest.json`, and the machine facts from
`scripts/av-analyze.mjs`.

Every rubric item gets a verdict in `audit-artifacts/l3-av-verdict.json`:
`pass` | `fail` | `note` (+ a `detail` string). A `fail` blocks the L3-AV sign-off
until it is fixed or explicitly waived.

**Reviewer taxonomy (binding)**

| `reviewerKind` | Meaning | Required |
|---|---|---|
| `human` | A person reviewed the output and attested it | `humanAttestation` with `attestedBy`, `attestedAt`, `statement` |
| `agent-proxy` | An agent persona reviewed it | never present as a human attestation |
| *(missing/unknown)* | invalid | rejected by `scripts/l3-av-assert.mjs` |

The certification states the **achieved review level** explicitly:
`human-verified` · `agent-proxy` · `machine-only`. A persona review is never
presented as a human review.

**Artifact binding** — a verdict carries `sourceHash`, the sha256 prefix (16
chars) of the artifact it reviewed. If the artifact changes, the review is stale
and the assert script rejects it.

## Audio criteria

- **A1 Audible** — the track carries a real signal: decoded peak ≥ 0.01 and
  silence ratio ≤ 0.9, and the reviewer hears sound in every judged clip.
- **A2 No clipping** — clipped sample ratio ≤ 0.01 and no audible distortion in
  the judged clips.
- **A3 Correct voice and language** — the spoken voice is the intended language
  and voice (Tamil, Indian male preferred), or the absence of speech is
  explicitly stated as a known limit.
- **A4 Intelligible and matches the script** — every judged segment is
  intelligible and its spoken words match the EDL script for that scene.
- **A5 No dead air** — no unexplained silence longer than 2s outside the scripted
  pauses; gaps are listed as follow-ups.
- **A6 In sync with picture** — the narration for scene N starts within ±1.5s of
  scene N's picture start, and the A/V drift stays within one frame of the
  container duration.

## Video criteria

- **V1 Rendered** — frames are non-black and non-placeholder; the scene content
  is visible.
- **V2 Legible** — overlays and subtitles are readable at 1280px with no
  clipping or overlap.
- **V3 Scene correspondence** — the content shown in each clip matches the
  scene graph for that time window.
- **V4 Continuity** — neighbouring clips show a coherent progression; no act is
  skipped or repeated.

## Verdict JSON schema (v2)

```json
{
  "reviewerKind": "human | agent-proxy",
  "reviewer": "<name>",
  "reviewedAt": "<ISO>",
  "source": "<webm filename>",
  "sourceHash": "<sha256 of the artifact, 16 chars>",
  "machineFacts": { "verdict": "pass | fail", "reasons": ["..."] },
  "audio": [{ "criterion": "A1", "verdict": "pass | fail | note", "detail": "..." }],
  "video": [{ "criterion": "V1", "verdict": "pass | fail | note", "detail": "..." }],
  "coverage": { "clips": 6, "reviewed": 6 },
  "humanAttestation": { "attestedBy": "...", "attestedAt": "<ISO>", "statement": "..." },
  "overall": "pass | fail",
  "followUps": ["..."]
}
```

`humanAttestation` is required when `reviewerKind` is `human` and forbidden when
it is `agent-proxy` — a persona can never attest as a person.

## Coverage rule

At least 75% of the packaged clips must carry a verdict; the rest must be
listed as follow-ups.
