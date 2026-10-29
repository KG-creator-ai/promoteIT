# Discovery Log — Phase 09 (2026-10-13 → 2026-10-29)
- Framework: spec-graph 1.0.0
- Owner-persona: analyst
- Rules: every finding carries a source type + date; no invented quotes; no
  unsourced external claims; hypotheses are labelled as such.
- Scope note: this log contains only findings grounded in this repository's own
  committed artifacts (ROADMAP, PROCESS, GUARDRAILS, PERSONAS, AGENTS.md) and
  the project owner's Phase-09 directive as recorded in
  `.spec-graph/ROADMAP.md`. No external market sizing or vendor claims are
  asserted — anything that could not be verified in-repo is labelled a
  hypothesis and stays a candidate.

## Competitive Scan

### D-001 — Persona roster named approvers that did not exist
- Source type: internal-observation
- Date: 2026-10-13
- Observation: `.spec-graph/PROCESS.md` required a Security approver on the
  release gate while `.opencode/agents/` shipped no security persona, so the
  gate could never be satisfied as written. Same shape for perf, UX/a11y and
  resilience review: enterprise assurance was release-shallow.
- Impact: high
- Proposed: Tiered quorum — core6 plus conditional domain auditors, wired to
  spec-level `domains` metadata (SPEC-014).

### D-002 — Release gates asserted trust instead of testing it
- Source type: internal-observation
- Date: 2026-10-13
- Observation: the gate chain ran typecheck/tests/secret-scan only; dependency
  advisories, static findings, perf budgets and accessibility regressions were
  outside the gate, so "green" did not mean "assured".
- Impact: high
- Proposed: Evidence-backed assurance scanners (SAST, dep-audit, budget
  ratchet, axe-core a11y) promoted into the gate chain and CI (SPEC-015).

### D-003 — L3 visual QA was ad-hoc eyeballing
- Source type: internal-observation
- Date: 2026-10-29
- Observation: export videos were reviewed by hand with no recorded rubric,
  reviewer identity, per-frame verdicts or artifact hash binding, so a later
  reviewer could not tell whether the recording had changed since the review.
- Impact: medium
- Proposed: Protocolize L3 — even-frame extraction, binding rubric, populated
  verdict JSON validated against the artifact hash (SPEC-016).

### D-004 — Export kit would silently drop every persona
- Source type: internal-observation
- Date: 2026-10-29
- Observation: the quickstart instructed copying `.spec-graph/` + `opencode.json`
  but not `.opencode/`, so an adopting repo would boot the harness with zero
  persona agents; the kit was also unproven outside its home repo.
- Impact: medium
- Proposed: Complete the quickstart, parameterize repo-specific guardrails,
  stamp a framework version, and add a clean-room self-test (SPEC-017).

## Voice of the Customer

### V-001 — "Let the framework drive, don't ask for every step"
- Source type: user-feedback
- Date: 2026-10-13
- Paraphrase: The project owner authorised ultra-autonomous execution of the
  Phase-09 framework work, delegating implementation judgement to the persona
  loop rather than requesting per-step approval (recorded in the Phase 09
  header of `.spec-graph/ROADMAP.md`).
- Impact: high
- Proposed: Keep the loop autonomous — evidence-gated rather than
  approval-gated, with hard stops from GUARDRAILS unchanged.

### V-002 — "Certification must not overstate what was produced"
- Source type: internal-observation
- Date: 2026-10-29
- Paraphrase: The repo's own working rules require honest statuses — no
  claiming AI output without a working provider path, no presenting local
  artifacts as committed records (`.spec-graph/GUARDRAILS.md`,
  `.spec-graph/DECISIONS.md` D11).
- Impact: high
- Proposed: Refresh `CERTIFICATION.md` from the template, carrying the L1–L4
  verdicts, L3-vision reviewer findings, assurance results and known limits
  (SPEC-019).

## Candidate hygiene
- A finding becomes a roadmap candidate only after it clears the format above.
- Findings stay candidates until a spec author promotes them into a spec;
  `scripts/discovery-to-roadmap.mjs` never rewrites hand-written roadmap rows.
