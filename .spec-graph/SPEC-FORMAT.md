# Spec Format (binding)

Every spec lives at `.spec-graph/specs/<SPEC-ID>.md` (e.g. `SPEC-001-tests.md`).

## Required sections

```markdown
# SPEC-<NNN>: <Title>
- Status: draft|baselined|in_progress|done
- Phase: 01
- Owner-persona: po

## Goal
<1–3 sentences. What user-visible outcome.>

## Non-goals
<explicit exclusions — prevents scope creep/hallucinated extras>

## Acceptance Criteria (testable, each with atom ID)
- [ ] AC-001 (<ATOM-ID>): <observable behavior> — verified by: <test file + case / command>
- [ ] AC-002 (<ATOM-ID>): ...

## Graph atoms
| Atom | Kind | Verifies |
| ... | spec_atom|task|code|test|evidence | AC-xxx |

## Constraints
<e.g. zero-backend, auth-gate selectors stable, 44px targets>

## Evidence hooks
<commands that prove each AC, e.g. `vitest run tests/unit/x.test.ts`, `tsc --noEmit`>
```

## Rules
- Every AC must have ≥1 evidence hook (executable command). No prose-only ACs.
- Every AC maps to ≥1 test node in the graph. No test ⇒ AC cannot verify.
- Red Team adds ≥1 adversarial AC per spec during Phase 02/04.
- Honesty: specs must state what is NOT claimed (e.g. no AI output without provider).
