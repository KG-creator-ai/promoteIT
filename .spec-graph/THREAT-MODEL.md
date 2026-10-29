# Threat Model — promote-IT AV Studio (VAPT-lite, SPEC-015.AC-001)

Zero-backend PWA: there is no server to pentest (D17). This document is the
honest equivalent — assets, actors, vectors, mitigations, residuals. Reviewed
per release by security-auditor. Last updated: 2026-10-13.

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
| T2 | Malicious `.promoteit` snapshot / preset JSON → `bulkPut` junk rows (DoS of own library, stored-XSS carrier for T1) | `parseArchiveBundle` validates format/version/count (archival.test.ts); restore is user-gated file pick | No schema validation of row *contents* — follow-up atom recorded |
| T3 | Key exfil via third-party script | Zero runtime third-party scripts; no analytics; CSP meta in `index.html` (verify: DAST-equivalence probe) | Supply-chain: jspdf/html2canvas CVEs tracked by dep-audit.mjs (D9 allowlist) |
| T4 | Device with unlocked profile ⇒ plaintext campaigns readable | Honest status: physical-access = game over; documented, not hidden | Vault wiring (encrypt `campaigns` at rest) is the highest-value future atom |
| T5 | Weak auth (PIN brute force, password guessing) | PBKDF2 (security.test.ts: unique salts, wrong-pw reject); tamper tests (bit-flip, wrong-salt) | No rate-limiting on PIN entry — kiosk-mode follow-up |
| T6 | `postMessage`/deep-link injection | No message listeners on untrusted origins (sast: no eval/Function sinks) | Re-audit on any new listener |
| T7 | Build-time compromise (malicious dep update) | `package-lock.json` pinned; CI `npm ci`; dep-audit gate on every gate run | No lockfile-diff review step — releaser checklist follow-up |

## DAST-equivalence probes (headless, per release)
- Served preview headers/CSP meta present; console PII-leak scan during e2e
  (no keys/tokens in logs); auth-gate abuse (locked vault blocks views;
  wrong password rejected — security-tamper tests).

## Out of scope (explicitly NOT claimed)
Network pentest, WAF review, backend API testing — there is no backend.
WebGPU/WebLLM local-model integrity (supply chain of MLC weights) is
accepted risk, recorded here.
