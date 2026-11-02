# SPEC-022: L3-AV human review protocol — judging the output like a person
- Status: draft
- Phase: 10
- Owner-persona: creative-director
- Domains: ux, docs, discovery

## Goal
Let the framework judge the product's audio and video the way a person does —
listening and watching against explicit criteria — while never passing a
persona's review off as a human's. Extends the L3 vision protocol into an
L3-AV protocol with audio criteria, a reviewer taxonomy, and a compact review
package the owner can judge in minutes (D-014, V-003).

## Non-goals
- No automated claim that audio "sounds good" — intelligibility and musicality
  are human/proxy judgements, machine facts are separate and stay separate.
- No fusing machine facts and human judgements into one undifferentiated score.
- No claim that a human reviewed anything when a persona did.

## Acceptance Criteria
- [ ] AC-001 (SPEC-022.AC-001): rubric v2 defines **audio** criteria A1–A6
  (audible · no clipping · correct voice/language · intelligible and matching
  the script · no dead air · in sync with picture) and **video** criteria V1–V4
  (rendered · legible · scene correspondence · continuity), each with an
  explicit pass criterion and an artifact-hash binding —
  verified by: `node ./node_modules/vitest/vitest.mjs run tests/unit/l3-av-rubric.test.ts`
- [ ] AC-002 (SPEC-022.AC-002): the verdict schema records
  `reviewerKind ∈ {human, agent-proxy}` with reviewer, date, artifact hash,
  per-criterion verdicts and coverage; the assert script **rejects** a verdict
  that claims `human` without a human attestation and rejects a missing or
  unknown `reviewerKind` — verified by:
  `node ./node_modules/vitest/vitest.mjs run tests/unit/l3-av-verdict.test.ts`
- [ ] AC-003 (SPEC-022.AC-003): a review-package generator emits the short
  clips, their audio, a rubric form and a verdict template, all gitignored, plus
  a manifest listing each artifact's hash —
  verified by: `node ./node_modules/vitest/vitest.mjs run tests/unit/l3-av-package.test.ts`
- [ ] AC-004 (SPEC-022.AC-004): the certification exposes the **achieved review
  level** explicitly (`human-verified` / `agent-proxy` / `machine-only`) and no
  wording implies a human reviewed what a persona reviewed —
  verified by: `node ./node_modules/vitest/vitest.mjs run tests/unit/l3-av-rubric.test.ts`
- [ ] AC-005 (SPEC-022.AC-005): *(redteam)* a verdict whose `sourceHash` does
  not match the artifact is rejected — a stale review cannot certify a changed
  recording — verified by:
  `node ./node_modules/vitest/vitest.mjs run tests/unit/l3-av-verdict.test.ts`

## Graph atoms
| Atom | Kind | Verifies |
| --- | --- | --- |
| SPEC-022.AC-001 | spec_atom | AC-001 |
| SPEC-022.AC-001(.task/.code/.test/.ev) | * | AC-001 |
| SPEC-022.AC-002 | spec_atom | AC-002 |
| SPEC-022.AC-002(.task/.code/.test/.ev) | * | AC-002 |
| SPEC-022.AC-003 | spec_atom | AC-003 |
| SPEC-022.AC-003(.task/.code/.test/.ev) | * | AC-003 |
| SPEC-022.AC-004 | spec_atom | AC-004 |
| SPEC-022.AC-004(.task/.code/.test/.ev) | * | AC-004 |
| SPEC-022.AC-005 | spec_atom | AC-005 |
| SPEC-022.AC-005(.task/.code/.test/.ev) | * | AC-005 |

## Constraints
- The reviewer taxonomy is binding: `human` requires a human attestation record;
  a persona verdict is always `agent-proxy`.
- Artifacts stay gitignored (D11); the durable record is the certification
  document plus the re-derivation test.
- The owner's spot-check is optional and non-blocking — when it is absent the
  achieved level is recorded honestly, never inflated.

## Evidence hooks
- `node ./node_modules/vitest/vitest.mjs run tests/unit/l3-av-rubric.test.ts` for AC-001/AC-004
- `node ./node_modules/vitest/vitest.mjs run tests/unit/l3-av-verdict.test.ts` for AC-002/AC-005
- `node ./node_modules/vitest/vitest.mjs run tests/unit/l3-av-package.test.ts` for AC-003
