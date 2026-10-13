# SPEC-010: Multi-provider AI (Gemini / OpenRouter / NVIDIA NIM) + Qwen default
- Status: draft
- Phase: 08
- Owner-persona: po

## Goal
Honest provider choice, all client-side: WebLLM first (default **Qwen2.5-7B-Instruct**,
airgap-capable), then user-selected remote (Gemini REST, OpenAI-compatible
OpenRouter, NVIDIA NIM). ModelStudio gains provider selector + NVIDIA key + model
fields + a real Test-Connection. Keys live in localStorage/`.env.local` only.

## Non-goals
- Server proxy of any kind; storing keys anywhere but the user's browser/env file.

## Acceptance Criteria
- [x] AC-001 (SPEC-010.AC-001): provider selector + NVIDIA key + model inputs + Test-Connection button that performs a real minimal request and reports ok/fail honestly — verified by: component test with mocked fetch (ok + 401 paths)
- [x] AC-002 (SPEC-010.AC-002): `useWebLLM` resolves provider config from localStorage; OpenAI-compatible chat path returns `ChatCompletion`-shaped replies for OpenRouter + NIM; WebLLM default model is Qwen2.5-7B; ModelStudio preset list is Qwen-first — verified by: unit tests with mocked fetch (no keys) + `tsc`
- [x] AC-003 (SPEC-010.AC-003): live L4 proof — one real generation through the wizard path populates `sceneGraph` with provider-produced content (key from env, never logged/committed) — verified by: e2e run log (scene count + content hash, no secrets)

## Graph atoms
| Atom | Kind | Verifies |
| SPEC-010.AC-001 | spec_atom | AC-001 |
| SPEC-010.AC-001.task | task | AC-001 |
| SPEC-010.AC-001.code | code | AC-001 |
| SPEC-010.AC-001.test | test | AC-001 |
| SPEC-010.AC-001.ev | evidence | AC-001 |
| SPEC-010.AC-002(.task/.code/.test/.ev) | * | AC-002 |
| SPEC-010.AC-003(.task/.code/.test/.ev) | * | AC-003 |

## Constraints
- Never log/commit keys (secret-scan gate). No provider ⇒ `status: 'briefing'` preserved.
- OpenAI-compatible path uses `/v1/chat/completions` with `model` from settings.

## Evidence hooks
- `vitest run tests/unit/providers.test.ts tests/component/model-studio.test.tsx` for AC-001/002
- `node scripts/e2e-av.mjs --provider=openrouter` (or `nvidia`) for AC-003
