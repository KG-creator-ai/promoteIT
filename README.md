# promote-IT AV Studio

Zero-backend, client-side AV script & AI video-prompt PWA (React 19 + Vite 6).
All compute runs in the browser: Dexie (IndexedDB), Web Workers (PDF/OCR),
WebGPU WebLLM with Gemini REST fallback, Web Speech TTS, Workbox PWA.

## Run locally

Prerequisites: Node.js.

```bash
npm install
npm run dev      # → http://localhost:3000
```

WSL note: Windows npm installs only win32 rollup/esbuild natives, so Vitest needs
Linux natives first: `bash scripts/fix-wsl-natives.sh` (re-run after any
`npm install` that prunes them). CI (Ubuntu) is unaffected.

## Gemini API key (client-side only)

The browser reads **only `VITE_GEMINI_API_KEY`** (Vite exposes just `VITE_*`).
Resolution order: explicit arg → `localStorage promote_it_gemini_key`
(Settings → Model Studio) → `VITE_GEMINI_API_KEY`. A bare `GEMINI_API_KEY`
in `.env` is invisible to the app. Never commit `.env*`; never log keys.

## Verify

```bash
npm run lint   # tsc --noEmit (only check; no ESLint)
npm test       # Vitest (unit in node env; jsdom component tests need Node ≥ 22)
npm run build  # production build + PWA precache (~3 min)
npm run gate   # typecheck + tests + secret-scan (SPEC-GRAPH local gate)
```

Headless UI audit: `node scripts/visual-audit.wsl.mjs` (needs dev server +
Windows Chrome; clears the AuthModal gate automatically).

## How this repo is built (SPEC-GRAPH)

Autonomous spec-driven delivery: `.spec-graph/` (process, personas, living
traceability graph, executable gates) + `opencode.json` (persona agents).
Start with `AGENTS.md`, then `.spec-graph/README.md` and `.spec-graph/ROADMAP.md`.
