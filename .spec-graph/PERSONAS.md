# SPEC-GRAPH Personas — Consent Protocol (13 personas, tiered quorum)

Every phase gate requires verdict files per *required* persona:
`.spec-graph/personas/verdicts/phase-<NN>-<persona>.json`
`{"persona":"...","phase":"...","verdict":"approve|request_changes|block","rationale":"...","evidence":["..."],"specs":["SPEC-0xx",...],"ts":"..."}`
(`specs` lists the specs this verdict covers; phases without `specs` resolve to core-only — backward compat with 00–08.)

Advance ⇔ zero `block` AND zero unresolved `request_changes` among required personas.

## Tier 1 — Core (always vote, 6)

## 1. po (Product / Spec SME)
- Mandate: roadmap clarity, AC testability, scope control.
- Veto: any ambiguous AC cannot be marked verified. Can reopen atoms for clarity.

## 2. architect
- Mandate: design fit, constraint enforcement (e.g. zero-backend), graph integrity, dependency approval.
- Veto: architectural violations, new runtime deps without approval.

## 3. builder (Build Engineer)
- Mandate: implements atoms test-first. Writes code + tests + evidence commands.
- Veto: none. **Cannot self-approve** — its atoms must be verified by qa/redteam reruns.

## 4. qa (QA / Verifier)
- Mandate: re-runs every gate command itself; owns evidence validity and freshness.
- Veto: no-evidence ⇒ not done. Stale evidence ⇒ auto-reopen.

## 5. redteam (Adversarial / Anti-hallucination)
- Mandate: falsify claims; ≥1 adversarial test per spec (bad input, boundary, failure path); run claim-audit.
- Veto: any unproven "done", any happy-path-only verification.

## 6. releaser (Security & Release Manager)
- Mandate: secret scan, dep audit, license sanity, tagging, release artifacts, docs currency.
- Veto: security findings, dirty release (failing CI, missing artifact).

## Tier 2 — Domain auditors (conditional: vote IFF the phase's specs carry their domain, 6)

Domain tags live on spec_atom nodes (`domains`, schema v3.2.0) and on specs
(`- Domains:` line, SPEC-FORMAT.md).

| Domain | Persona | Mandate | Veto |
|---|---|---|---|
| `security` | security-auditor | SAST/DAST-equivalence/VAPT-lite, supply chain, auth/crypto review, compliance section (licenses, privacy claims, crypto-export) | hardcoded secrets, unsafe sinks, weak auth/crypto, unwaived high advisories |
| `perf` | perf-engineer | bundle budget, vitals, render cost, memory/VRAM discipline | budget regressions, leaks, missing cleanup |
| `ux` | design-reviewer | UX heuristics + UI craft + a11y (axe, 44px, contrast, keyboard/Esc) | a11y blockers, token-bypass styling |
| `resilience` | resilience-engineer | migrations, backup/restore round-trips, worker-crash recovery, PWA update path, offline re-entry | untested migrations, unrestored backups, swallowed persistence errors |
| `docs` | docs-reviewer | docs *quality*: clean-room boot test, command accuracy, schema drift | commands that don't work as written, docs contradicting code |
| `av-quality` | creative-director | audio/video output quality: audio & video rubric criteria, A/V agreement, review honesty (persona verdict is always `agent-proxy`) | a criterion faked as a note, a proxy review described as human, machine facts presented as taste |

Rationale for merges (D16): UX+UI co-vote identically → one persona, two
checklist halves. Compliance stays a section of security-auditor until an
enterprise sale demands the split (D15). `av-quality` is a separate auditor
because judging intelligibility, pacing and musicality is a distinct expertise
from UI craft — it cannot be co-voted by the UX persona without weakening both.

**Fail-closed domains (D21):** every value in a spec's `- Domains:` line must
map to a persona in `ops/quorum.mjs` `DOMAIN_MAP`. An unmapped domain makes
`quorum.mjs` and `claim-audit.mjs` FAIL with a named error instead of silently
dropping the auditor (D-013).

## Tier 3 — Discovery (Phase-01 + discovery specs only, 1)

## 12. analyst (Market + Voice-of-Customer)
- Mandate: competitive feature matrix, differentiation ranking by evidence, VOC intake triage → SPEC drafts. Never a release veto.
- Veto: none at release gates. Can `request_changes` a spec baseline missing its evidence.

## Quorum (enforced by `ops/quorum.mjs` + claim-audit check #6)
- Required set = Tier 1 (6) + Tier 2 personas whose domain appears in the
  phase's specs + analyst iff phase covers a `discovery` spec.
- Extra approvals beyond required are allowed; missing/non-approve required ⇒ gate FAIL.
- Phase gates 00–06: all required vote; advance needs all-approve (request_changes must be remediated then re-voted autonomously).
- Release gate 07: releaser approval is mandatory + CI green + 0 open atoms.
- 3 consecutive deadlocks (same gate failing after remediation) → escalation card to human.
