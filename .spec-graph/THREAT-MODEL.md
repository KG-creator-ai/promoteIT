# Threat Model — promote-IT AV Studio (VAPT-lite, SPEC-015.AC-001)

Zero-backend PWA: there is no server to pentest (D17). This document is the
honest equivalent — assets, actors, vectors, mitigations, residuals. Reviewed
per release by security-auditor. Last updated: 2026-10-29.

## Assets (value order)
1. **Provider API keys** — `localStorage promote_it_gemini_key`, `VITE_*` build
   env. Theft ⇒ attacker bills the user's OpenRouter/NVIDIA/Gemini quota.
2. **Campaign IP** — plaintext rows in `db.campaigns` (AGENTS.md: vault
   encryption is **unwired** — campaigns are NOT per-user encrypted; do not
   claim otherwise).
3. **Credentials** — PBKDF2 password/PIN hashes + wrapped vault keys in
   `userProfiles`/`encryptedVaults` (IndexedDB, same-origin only).
4. **User media** — uploads/Stitcher assets in IndexedDB/OPFS.

## Actors & vectors
| # | Vector | Mitigation in place | Residual |
|---|---|---|---|
| T1 | XSS via AI-generated scene text rendered as HTML | No `dangerouslySetInnerHTML` without sanitizer (sast.mjs UNSANITIZED-DIH rule, 0 findings); DOMPurify dep present | Audit on every new render path |
| T2 | Malicious `.promoteit` snapshot / preset JSON → `bulkPut` junk rows (DoS of own library, stored-XSS carrier for T1) | `parseArchiveBundle` validates format/version/count (archival.test.ts); restore is user-gated file pick | No schema validation of row *contents* on restore — tracked as discovery candidate D-009 |
| T3 | Key exfil via third-party script / third-party origin | Zero runtime third-party **scripts**; no analytics; no key is ever sent to a font origin | **A third-party origin IS contacted**: `index.html` loads Google Fonts CSS (`fonts.googleapis.com`) + font files (`fonts.gstatic.com`) — visitor IPs reach Google and rendering depends on that origin. **No CSP is configured** (no `Content-Security-Policy` meta) — an open gap, not a mitigation | Supply-chain: advisories tracked by dep-audit.mjs — the D9 allowlist is empty and exactly one dev-only advisory (`GHSA-gcqx-w48m-w2h4`) is pinned by ADR D18; remote fonts tracked as discovery candidate D-008 (self-host or drop) |
| T4 | Device with unlocked profile ⇒ plaintext campaigns readable | Honest status: physical-access = game over; documented, not hidden | Vault wiring (encrypt `campaigns` at rest) is the highest-value future atom |
| T5 | Weak auth (PIN brute force, password guessing) | **Passwords**: PBKDF2-HMAC-SHA256, 100k iterations, per-user salt (security.test.ts: unique salts, wrong-pw reject); tamper tests (bit-flip, wrong-salt). **PIN**: `hashPin` is a single unsalted SHA-256 (`src/lib/security.ts`) — weak against offline brute force, and there is no rate-limiting on PIN entry | PIN path needs PBKDF2 + salt + attempt throttling — tracked as an open candidate (discovery D-006) |
| T6 | `postMessage`/deep-link injection | No message listeners on untrusted origins (sast: no eval/Function sinks) | Re-audit on any new listener |
| T7 | Build-time compromise (malicious dep update) | `package-lock.json` pinned; CI `npm ci`; dep-audit gate on every gate run | No lockfile-diff review step — tracked as discovery candidate D-010 |

## DAST-equivalence probes (headless, per release)
What the repo actually runs today:
- `scripts/e2e-av.mjs` captures browser **console errors and page errors** per
  run (it does **not** scan console output for leaked keys/tokens — that is a
  gap, not a control).
- Auth-gate abuse: the locked-vault gate blocks the views (E2E `auth-unlock`
  leg) and wrong-password / tamper paths are covered by
  `tests/unit/security-tamper.test.ts`.
- Static sweeps: `scripts/sast.mjs` (no eval/Function sinks, no unsanitized
  `dangerouslySetInnerHTML`), `scripts/dep-audit.mjs` (advisories), secret-scan.

Explicitly **not** performed today (open gaps, tracked as discovery candidates
D-005 (no CSP), D-006 (PIN hashing), D-007 (no console secret/PII-leak
scanner) and D-008 (third-party Google Fonts origin) rather than claimed):
- No `Content-Security-Policy` header/meta probe — no CSP is configured.
- No console PII/secret-leak scanner.
- The app still loads Google Fonts from a third-party origin (T3) — not
  claimed as a mitigation; tracked as D-008.

## Out of scope (explicitly NOT claimed)
Network pentest, WAF review, backend API testing — there is no backend.
WebGPU/WebLLM local-model integrity (supply chain of MLC weights) is
accepted risk, recorded here.
