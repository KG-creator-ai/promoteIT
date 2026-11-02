# SPEC-023: Decision Gate — the framework verifies its own actions before acting
- Status: done
- Phase: 10
- Owner-persona: architect
- Domains: security, resilience, discovery

## Goal
Adopt the core idea of IBM Research's "Think Before You Act: Decision Gate for
LLM Agents" (arXiv 2610.38620, JevAct): intercept selected actions **before**
execution, compile domain policies into executable state checks, and catch both
invalid actions and premature task termination — with structured feedback and
bounded revision. The harness is model-agnostic and stays zero-backend (V-004).

## Non-goals
- No model weights, no server, no new runtime dependency.
- The probabilistic layer is optional and must degrade honestly — never a
  silent pass when it did not run.
- The gate does not replace the existing gates, the ledger or the quorum; it
  gates the *actions* that feed them.

## Acceptance Criteria
- [x] AC-001 (SPEC-023.AC-001): a policy registry compiles the hard stops in
  `GUARDRAILS.md`, the rules in `DECISIONS.md` and the spec constraints into
  **executable** checks — each policy carries an id, a source citation, a
  severity and a deterministic predicate, and every registered policy is
  machine-runnable — verified by:
  `node ./node_modules/vitest/vitest.mjs run tests/unit/decision-gate.test.ts`
- [x] AC-002 (SPEC-023.AC-002): `graph.mjs verify` runs the gate **before**
  recording evidence — a blocking policy prevents the atom from being marked
  verified and the gate emits structured feedback (policy id, observed fact,
  remediation) — verified by:
  `node ./node_modules/vitest/vitest.mjs run tests/unit/decision-gate.test.ts`
- [x] AC-003 (SPEC-023.AC-003): **premature-termination detection** — the
  `release` / `done` action is blocked while atoms are open, the tiered quorum
  is incomplete, evidence is stale, or the certification over-claims the ledger —
  verified by: `node ./node_modules/vitest/vitest.mjs run tests/unit/decision-gate.test.ts`
- [x] AC-004 (SPEC-023.AC-004): **unknown domains fail closed** (D-013) — an
  unmapped domain in any spec of the phase makes the quorum resolver and
  claim-audit fail with a named error, and a lint rejects unknown domain
  strings in spec files — verified by:
  `node ./node_modules/vitest/vitest.mjs run tests/unit/quorum.test.ts`
- [x] AC-005 (SPEC-023.AC-005): **bounded revision** — consecutive blocks for
  the same target are counted, and at the third block the gate requires an
  escalation card (`ESCALATION-<date>-<topic>.md`) instead of another retry —
  verified by: `node ./node_modules/vitest/vitest.mjs run tests/unit/decision-gate.test.ts`
- [x] AC-006 (SPEC-023.AC-006): the probabilistic judgment layer is **optional
  and honest** — with no provider key the decision record states
  `unverified-probabilistic`, and the gate never reports a probabilistic pass it
  did not obtain — verified by:
  `node ./node_modules/vitest/vitest.mjs run tests/unit/decision-gate.test.ts`

## Graph atoms
| Atom | Kind | Verifies |
| --- | --- | --- |
| SPEC-023.AC-001 | spec_atom | AC-001 |
| SPEC-023.AC-001(.task/.code/.test/.ev) | * | AC-001 |
| SPEC-023.AC-002 | spec_atom | AC-002 |
| SPEC-023.AC-002(.task/.code/.test/.ev) | * | AC-002 |
| SPEC-023.AC-003 | spec_atom | AC-003 |
| SPEC-023.AC-003(.task/.code/.test/.ev) | * | AC-003 |
| SPEC-023.AC-004 | spec_atom | AC-004 |
| SPEC-023.AC-004(.task/.code/.test/.ev) | * | AC-004 |
| SPEC-023.AC-005 | spec_atom | AC-005 |
| SPEC-023.AC-005(.task/.code/.test/.ev) | * | AC-005 |
| SPEC-023.AC-006 | spec_atom | AC-006 |
| SPEC-023.AC-006(.task/.code/.test/.ev) | * | AC-006 |

## Constraints
- Zero-backend: the gate is a Node CLI in `.spec-graph/ops/`, model-agnostic,
  with no dependency on the agent or its tools.
- Policies cite their source; no policy may encode a rule absent from
  GUARDRAILS/DECISIONS/spec constraints.
- The gate must never be bypassable by editing the ledger — policy checks read
  the filesystem and git state, not the ledger's own claims.
- Decision records are append-only and auditable.

## Evidence hooks
- `node ./node_modules/vitest/vitest.mjs run tests/unit/decision-gate.test.ts` for AC-001/AC-002/AC-003/AC-005/AC-006
- `node ./node_modules/vitest/vitest.mjs run tests/unit/quorum.test.ts` for AC-004
