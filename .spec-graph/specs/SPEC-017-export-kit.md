# SPEC-017: Export kit (quickstart fix, portability stamp, clean-room self-test)
- Status: done
- Phase: 09
- Owner-persona: docs-reviewer
- Domains: docs

## Goal
Make the framework genuinely copy-pasteable into any repo: the README
quickstarts must instruct copying `.opencode/` (persona agents) alongside
`.spec-graph/` + `opencode.json` (they currently omit it, so a fresh adopter
loses all 12 personas); GUARDRAILS must contain zero repo-specific tokens
(one hardcoded project-path list remains); a single-source framework version
stamp (`.spec-graph/VERSION`, distinct from the product release tag) must be
referenced by the quickstart; and `scripts/export-kit.mjs` must prove the kit
boots clean-room — copied to a temp dir with a fixture `package.json` (no
deps) and fixture spec, `init.mjs` + `graph.mjs init/status` must run headless.

## Non-goals
- Publishing to npm/a registry; templating org-specific policy beyond the one
  observed repo-specific token; automated adoption docs beyond the quickstart.

## Acceptance Criteria
- [x] AC-001 (SPEC-017.AC-001): `.spec-graph/README.md` quickstart step 1 AND
  root `README.md` quickstart both instruct copying `.opencode/` (persona
  agents) together with `.spec-graph/` + `opencode.json` — verified by: grep
  chain over both READMEs for `.opencode`
- [x] AC-002 (SPEC-017.AC-002): single-source framework version stamp:
  `.spec-graph/VERSION` holds a semver, `.spec-graph/README.md` references it;
  `GUARDRAILS.md` contains no repo-specific tokens (media/, .antigravity/,
  samples/, cloud-sync, Promote-IT) — verified by: grep/python chain
- [x] AC-003 (SPEC-017.AC-003): `scripts/export-kit.mjs` default self-test
  copies `.spec-graph/` + `.opencode/` + `opencode.json` to a temp dir, writes
  fixture package.json (no deps) + fixture spec, runs `ops/init.mjs` then
  `ops/graph.mjs init` + `status` headless; all pass ⇒ `CLEANROOM-PASS`
  exit 0, any missing artifact ⇒ exit 1 — verified by: `node scripts/export-kit.mjs`

## Graph atoms
| Atom | Kind | Verifies |
| --- | --- | --- |
| SPEC-017.AC-001 | spec_atom | AC-001 |
| SPEC-017.AC-001.task | task | AC-001 |
| SPEC-017.AC-001.code | code | AC-001 |
| SPEC-017.AC-001.test | test | AC-001 |
| SPEC-017.AC-001.ev | evidence | AC-001 |
| SPEC-017.AC-002(.task/.code/.test/.ev) | * | AC-002 |
| SPEC-017.AC-003(.task/.code/.test/.ev) | * | AC-003 |

## Constraints
- Zero-backend, no new runtime deps; self-test must use only node builtins
  (fs/os/child_process) and run in CI (Linux tmp, no git required).
- Temp fixture cleaned up on success; left in place on failure for debugging
  (path printed).
- Framework version (`.spec-graph/VERSION`) stays distinct from the product
  release tag (v1.x.y) — never conflate the two.

## Evidence hooks
- grep chain over `.spec-graph/README.md` + `README.md` for AC-001
- `cat .spec-graph/VERSION` + grep consistency + GUARDRAILS token scan for AC-002
- `node scripts/export-kit.mjs` for AC-003
