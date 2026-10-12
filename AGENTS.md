# AGENTS.md — promote-IT AV Studio

Zero-backend React 19 + Vite 6 PWA. All compute is client-side: Dexie (IndexedDB),
Web Workers (PDF/OCR), WebGPU WebLLM, Web Speech TTS, Workbox PWA.

## Commands — npm scripts use node-direct form (works in WSL + CI)

- `npm` on PATH is Windows (Scoop) npm.exe and `node_modules/.bin` has POSIX shims only
  (zero `.cmd` files). Scripts were rewritten to `node ./node_modules/<pkg>/bin/...` form,
  so `npm run lint|test|build|dev` now works from WSL **and** in CI. From the repo root:
  - Typecheck (the only check — there is no ESLint): `npm run lint` (currently clean;
    `scripts/` is excluded from tsconfig).
  - Tests: `npm test` (Vitest; unit tests run in `node` env — jsdom component tests need
    Node ≥22, see vitest.config.ts; CI pins Node 22).
  - Build: `npm run build` (~3 min, ~7 MB JS chunk + PWA precache; chunk-size warning expected).
  - Dev server: `npm run dev` → `http://localhost:3000`.
  - Full local gate: `npm run gate` (typecheck + tests + secret-scan).
- WSL native-binary trap: Windows npm installs only **win32** rollup/esbuild natives, so
  Vitest fails under WSL's Linux node until Linux natives are added. Fix (re-run after
  any `npm install` that prunes them): `bash scripts/fix-wsl-natives.sh`. CI unaffected.
- `package-lock.json` is the live lockfile; `bun.lock` is vestigial (bun not installed).
- `npm run clean` uses `rm -rf` — WSL-only anyway.
- Quote trap: PowerShell interpolates `$?` inside double quotes — use single quotes for
  `wsl -d debian -- bash -c '...; echo EXIT=$?'`.

## Verification

- Headless UI audit: `node scripts/visual-audit.wsl.mjs` (puppeteer-core; needs a running
  dev server + Windows Chrome at `/mnt/c/Program Files/Google/Chrome/Application/chrome.exe`;
  override via `AUDIT_DIR` / `CHROME_PATH` / `BASE_URL`). The older `scripts/visual-audit.mjs`
  has hardcoded Windows paths — don't use it from WSL.
- Any headless/browser check must clear the auth gate first: the UI is blocked by
  `AuthModal` until the vault is unlocked (demo/guest login paths exist; the audit script
  automates signup via placeholder selectors — keep those selectors stable).

## Env keys (client-side only)

- Browser reads only **`VITE_GEMINI_API_KEY`** (Vite exposes just `VITE_*`). The bare
  `GEMINI_API_KEY` currently sitting in `.env`, and the README's `.env.local` instructions,
  are invisible to the app.
- Runtime resolution in `useWebLLM`: explicit arg → `localStorage promote_it_gemini_key`
  (saved via Settings → Model Studio) → `VITE_GEMINI_API_KEY`.
- Never commit `.env*` (gitignored); never log keys. Remote fallback is a direct
  browser→Gemini REST fetch (`gemini-2.0-flash`) — no backend, no proxy, key stays local.

## Architecture facts agents miss

- Two Dexie databases exist. The real one is `PromoteITDatabase` (`src/db/db.ts`,
  schema **v4**): `brandTemplates`, `campaigns`, `exports` plus v4 `userProfiles`,
  `encryptedVaults`, `notifications`. v2 backfills `status`/`cameraMovement`; v3 converts
  legacy `avScript[]` → `sceneGraph[]` + `resourceLibrary[]`. Seeds: `src/db/seed.ts`.
  The other DB, `AVArtVarkAuthDatabase` (`src/db/auth.ts`), is still seeded at boot with an
  "Agency Admin" user but is legacy — real auth is `AuthContext` → `db.userProfiles` +
  `lib/security.ts` (PBKDF2/AES-GCM) + `lib/webauthn.ts`.
- Auth gate: `App.tsx` renders `<AuthModal isOpen>` whenever the vault is locked. The
  `encryptedVaults` table and `encryptVault` helpers exist but are unwired — campaigns are
  still plain rows in `db.campaigns`; don't claim data is per-user encrypted.
- Campaign state has two access layers: `CampaignContext` (active-campaign id, rich
  mutations) and `useDexieCampaign` (direct reads). Both hit `db.campaigns`; prefer the
  context for new write paths.
- Workers (`src/workers/`) self-terminate (`self.close()`); always `worker.terminate()`
  from the main thread too. PDF ingestion is capped at 50 pages per batch. OOM crashes
  only kill the worker.
- `useWebLLM` unloads VRAM after 5 min idle (`engine.unload()`); OOM mid-generation
  (`OperationError`) auto-fails over to Gemini REST. Remote path needs a key or it throws.
- Wizard ingestion is real (workers → `resourceLibrary`); generation needs an online
  provider, otherwise the campaign is saved as `status: 'briefing'` — keep that honest,
  don't claim AI output was produced.
- Brand colors flow: `brandTemplates` → `useBrandTheme` → CSS vars (`--brand-*`,
  `--color-*` as `r g b` triplets). `bg-primary/10`-style opacity + `rgb(var(--color-*))`
  gradients depend on the hook having run.
- Entry: `src/main.tsx` → `App.tsx` (`AuthProvider` → `CampaignProvider`; 10 views via an
  `activeView` switch, **no router**) → `Layout` (Sidebar/Header/SutraAssistant/
  CommandPalette). Trap: `src/components/Header.tsx` is stale — the real header is
  `src/components/layout/Header.tsx`.
- Zero-backend is a hard constraint: no server code. `express`/`tsx`/`dotenv` in
  package.json are unused; `metadata.json`'s `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API`
  is an AI Studio template leftover — there is no server.
- Mobile bottom nav overlaps content — `Layout` compensates with `mb-16`; keep it.
- Touch targets: interactive controls must be ≥44px (`min-h-[44px]` precedent in
  AuthModal/AVArtVark/MasterScriptTable). `role="dialog"` popovers need `aria-label` + Esc close.
- `dist/` is gitignored/untracked; `scripts/cloud-sync.sh` runs `tsc` + `vite build` then
  commits with a fixed message and pushes to `origin main` (the `origin` remote exists:
  KG-Strategist/promoteIT). `README.md`, `ARCHITECTURE_AUDIT.md`, and `DIAGNOSTIC_REPORT.md`
  are stale snapshots (pre-v3 schema) — trust the code over them.
