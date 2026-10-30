# SPEC-018: Discovery loop (competitive scan + VOC intake → roadmap candidates)
- Status: done
- Phase: 09
- Owner-persona: analyst
- Domains: docs, discovery

## Goal
Close the discovery gap: the framework had no repeatable way to capture
market/competitive signals or voice-of-the-customer input, and no mechanical
path from those signals into the roadmap. Add (a) a discovery intake format
(template + a populated Phase-09 log) with anti-hallucination rules — every
finding carries a source type and date, VOC entries are paraphrases and never
invented quotes; and (b) `scripts/discovery-to-roadmap.mjs`, which renders
findings into a "Discovery Candidates" section of `.spec-graph/ROADMAP.md`
deterministically (`--apply` writes, `--check` fails on drift). The analyst
persona is a discovery-tier voter (PERSONAS.md), so these findings are
first-class roadmap input, not prose.

## Non-goals
- Automated web scraping or market sizing (no fabricated external data).
- Auto-creating spec files from findings — candidates stay proposals until a
  spec author promotes them (human-in-the-loop for roadmap scope).
- Consumer interviews: VOC entries in this log are internal observations and
  user-stated requirements already present in the repo's own history.

## Acceptance Criteria
- [x] AC-001 (SPEC-018.AC-001): `.spec-graph/templates/DISCOVERY.md` defines the
  intake format (Competitive Scan + Voice of the Customer sections; each
  finding has id, source type, date, observation/paraphrase, impact,
  proposed action) and states the honesty rules (no invented quotes, no
  unsourced claims, unverified items labelled); `.spec-graph/DISCOVERY.md` is
  populated with ≥3 Phase-09 findings that satisfy the format — verified by:
  `node scripts/discovery-to-roadmap.mjs --check` + format validation
- [x] AC-002 (SPEC-018.AC-002): `scripts/discovery-to-roadmap.mjs` renders every
  parsed finding into a "Discovery Candidates" table in `.spec-graph/ROADMAP.md`
  (id, title, source type, impact, proposed action, state); `--apply` is
  idempotent (re-apply ⇒ byte-identical ROADMAP) and `--check` exits 1 on
  drift; absent discovery log ⇒ `DISCOVERY-ABSENT` exit 0 — verified by:
  apply/apply-idempotency chain + `--check`

## Graph atoms
| Atom | Kind | Verifies |
| --- | --- | --- |
| SPEC-018.AC-001 | spec_atom | AC-001 |
| SPEC-018.AC-001.task | task | AC-001 |
| SPEC-018.AC-001.code | code | AC-001 |
| SPEC-018.AC-001.test | test | AC-001 |
| SPEC-018.AC-001.ev | evidence | AC-001 |
| SPEC-018.AC-002(.task/.code/.test/.ev) | * | AC-002 |

## Constraints
- Honesty (D-series): the populated log may only contain observations sourced
  from this repo's own artifacts and explicitly-labelled hypotheses; no
  external citations are asserted without a verifiable source.
- Script uses node builtins only; no network access; deterministic output
  (stable ordering by finding id).
- ROADMAP edits are scoped to the generated "Discovery Candidates" section —
  hand-written roadmap rows are never rewritten.

## Evidence hooks
- `node scripts/discovery-to-roadmap.mjs --check` for AC-001/AC-002
- apply → apply idempotency → `--check` chain for AC-002
