# SPEC-014: Tiered persona roster + conditional quorum
- Status: done
- Phase: 09
- Owner-persona: architect
- Domains:

## Goal
Expand the roster from 6 to 12 personas (6 core + 5 conditional domain
auditors + 1 discovery analyst) with tiered quorum enforced by tooling:
a gate FAILs when a phase touching a domain lacks that domain persona's
approval. Fixes the PROCESS.md inconsistency (phases 02/06 already demand a
"Security" approver that does not exist).

## Non-goals
- Assurance scanners themselves (SPEC-015); vision protocol (SPEC-016);
  export kit (SPEC-017); discovery research content (SPEC-018).
- Splitting compliance-counsel out of security-auditor (deferred per D15).

## Acceptance Criteria
- [x] AC-001 (SPEC-014.AC-001): schema v3.1.0 carries optional `domains` on
  spec_atom nodes; `graph.mjs init` parses `- Domains:` from spec files;
  existing 36 atoms backfilled (005→docs, 008→ux, 009→ux+perf, 010→security,
  011→ux, 012→resilience) — verified by: `node .spec-graph/ops/graph.mjs status` + domains unit test
- [x] AC-002 (SPEC-014.AC-002): `quorum.mjs` resolves required verdict set
  (core6 + domain-mapped personas) and FAILs on missing/non-approve/block;
  wired into claim-audit check #6; old phases without `specs` in verdicts
  still pass on core6 — verified by: `tests/unit/quorum.test.ts` (positive + negative cases)
- [x] AC-003 (SPEC-014.AC-003): 6 new `.opencode/agents/*.md` defs
  (security-auditor, perf-engineer, design-reviewer, resilience-engineer,
  docs-reviewer, analyst); PERSONAS.md (tiers + quorum table + domain map),
  PROCESS.md (Security approver named), GUARDRAILS.md (quorum rule),
  GRAPH-SCHEMA.md (v3.1.0), ADRs D15–D17 — verified by: file-presence + cross-link test

## Graph atoms
| Atom | Kind | Verifies |
| SPEC-014.AC-001 | spec_atom | AC-001 |
| SPEC-014.AC-001.task | task | AC-001 |
| SPEC-014.AC-001.code | code | AC-001 |
| SPEC-014.AC-001.test | test | AC-001 |
| SPEC-014.AC-001.ev | evidence | AC-001 |
| SPEC-014.AC-002(.task/.code/.test/.ev) | * | AC-002 |
| SPEC-014.AC-003(.task/.code/.test/.ev) | * | AC-003 |

## Constraints
- Backward compatible: phases 00–08 verdicts (no `specs` field) resolve to core6 only.
- No always-on committee: auditors vote IFF their domain is present (D16).
- Builder cannot self-approve (unchanged).

## Evidence hooks
- `node ./node_modules/vitest/vitest.mjs run tests/unit/quorum.test.ts` for AC-001/002
- `node .spec-graph/ops/claim-audit.mjs` for AC-002 (quorum check live)
- presence/link check for AC-003
