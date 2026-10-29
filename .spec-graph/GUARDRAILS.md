# Guardrails — Autonomy Bounds & Hard Stops

## Autonomous (allowed without asking)
- Read/search any repo file; run builds, tests, linters, audits, harness CLIs.
- Edit code/docs/tests/config/CI under spec atoms.
- Install dev dependencies (vitest, testing-library, jsdom) via lockfile-respecting npm.
- Create branches, commit per-spec, push to origin (no force).
- Update the traceability graph and verdict files.

## Hard stops (never; escalate instead)
- No server/backend code in zero-backend repos; no new runtime deps without architect verdict.
- Never commit `.env*`, secrets, keys, tokens; never log secret values. Secret-scan is a release gate.
- No force-push, no history rewrite, no deleting user data/artifacts (project data dirs — declare them in `AGENTS.md`; the framework never deletes repo content).
- No claiming AI output/behavior without a working provider path; keep honest statuses.
- No UI/auth-gate selector changes that break the headless audit (or update the audit script in the same atom).
- No `v1.0.0-prod`-style release tags and no GitHub Releases without phase-07 verdicts + green CI.
- Attempt-2-class directives (SLM retune, GGUF export, dispatcher deploys) execute ONLY when their prerequisite artifacts exist in-repo; otherwise record BLOCKED with evidence (anti-hallucination: never simulate training results).

## Persona & quorum rules (SPEC-014)
- Builder cannot self-approve; qa/redteam reruns verify builder atoms.
- Quorum is tiered (PERSONAS.md): core6 always + domain auditors iff the
  phase's specs carry their domain + analyst on discovery specs.
  `claim-audit.mjs` check #6 enforces it — a missing/non-approve required
  verdict FAILs the audit. No prose-only verdicts: every verdict cites evidence.

## Escalation protocol
1. Gate fails → autonomous repair (re-read spec → re-diagnose → redesign).
2. 3rd consecutive failure → write `.spec-graph/ESCALATION-<date>-<topic>.md` (what, evidence, options, recommendation) → STOP that track, continue unrelated atoms.
3. Human resolves; loop resumes. Only human touchpoints: spec-baseline sign-off, release notification, escalations.

## Public-repo rule
Repo is public: every push runs secret-scan locally pre-push AND in CI. Any finding blocks push/release.
