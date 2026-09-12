# AGENTS.md — promote-IT AV Studio

Zero-backend React 19 + Vite 6 PWA. All compute is client-side: Dexie.js (IndexedDB),
Web Workers (PDF/OCR), WebGPU WebLLM, Web Speech TTS, Workbox PWA.

## Test here, not Windows PowerShell

- All verification runs in **`wsl -d debian`** at `/mnt/d/Promote-IT_AV-Studio`
  (Windows `node_modules/.bin` has no `.cmd` shims — `npx tsc` fails on PowerShell).
- Typecheck: `./node_modules/.bin/tsc --noEmit` (this is also what `npm run lint` does — there is no ESLint).
- Build: `npm run build` (~3 min: 6.9 MB JS chunk + PWA precache; chunk-size warning is expected).
- Dev server: `npm run dev` → `http://localhost:3000` (fixed `--port=3000 --host=0.0.0.0`).
- Headless audit: `scripts/visual-audit.mjs` (puppeteer-core) expects Chrome + running dev server;
  from WSL point it at `/mnt/c/Program Files/Google/Chrome/Application/chrome.exe`.
- Quote trap: PowerShell interpolates `$?` inside double quotes — use single quotes for
  `wsl -d debian -- bash -c '...; echo EXIT=$?'`.
- `npm run clean` uses `rm -rf` — WSL-only.

## Env keys (client-side only)

- Browser reads **`VITE_GEMINI_API_KEY`** (Vite exposes only `VITE_*`; bare `GEMINI_API_KEY` in `.env` is invisible to the app).
- Runtime resolution order in `useWebLLM`: explicit arg → `localStorage promote_it_gemini_key`
  (saved via Settings → Model Studio) → `VITE_GEMINI_API_KEY`.
- Never commit `.env*` (gitignored); never log keys. Remote fallback is a direct
  browser→Google fetch — no backend, no proxy, key stays local.

## Architecture facts agents miss

- DB is Dexie v3 (`src/db/db.ts`): `brandTemplates`, `campaigns`, `exports`.
  v1→v2→v3 migrations backfill `status`/`cameraMovement` and auto-convert legacy
  `avScript[]` → `sceneGraph[]` + `resourceLibrary[]`. Seed data: `src/db/seed.ts`.
- Workers (`src/workers/`) self-terminate (`self.close()`); always `worker.terminate()`
  from the main thread too. PDF capped at 50 pages. OOM crashes only kill the worker.
- `useWebLLM` unloads VRAM after 5 min idle (`engine.unload()`); OOM mid-generation
  (`OperationError`) auto-fails over to Gemini REST. Remote path needs a key or it throws.
- Wizard ingestion is real (workers → `resourceLibrary`); generation needs an online
  provider, otherwise the campaign is saved as `status: 'briefing'` — keep that honest,
  don't claim AI output was produced.
- Brand colors flow: `brandTemplates` → `useBrandTheme` → CSS vars (`--brand-*`,
  `--color-*` as `r g b` triplets). `bg-primary/10`-style opacity + `rgb(var(--color-*))`
  gradients depend on the hook having run.
- Entry: `src/main.tsx` → `App.tsx` (8 views via `activeView` state, no router) →
  `Layout` (Sidebar/Header/SutraAssistant/SutraFAB/CommandPalette).
- Mobile bottom nav overlaps content — `Layout` compensates with `mb-16`; keep it.
- Touch targets: interactive controls must be ≥44px (`min-h-[44px]` precedent in
  MasterScriptTable/AVArtVark). `role="dialog"` popovers need `aria-label` + Esc close.
- `express`/`tsx` in package.json are unused (no server file) — do not add backend code;
  zero-backend is a hard constraint (see `metadata.json` capabilities).
- `dist/` is committed build output; `scripts/cloud-sync.sh` runs `tsc` + `build` then
  commits (pushes only if an `origin` remote exists — normally there is none).
