# Deep Diagnostic Inspection & Technical Architecture Report

> **SUPERSEDED snapshot (pre-v3 schema).** Trust the code + `AGENTS.md` over this
> document. Kept for history only.

## 1. Current Backend & Storage Details

### 1.1 IndexedDB Schema (`src/db/db.ts`)
The application relies entirely on client-side storage using **Dexie.js** wrapped around standard `IndexedDB`.
* **Tables & Indices**:
  * `brandTemplates`: Indexed by `id, name, updatedAt`.
  * `campaigns`: Indexed by `id, title, brandTemplateId, status, createdAt, updatedAt`.
  * `exports`: Indexed by `id, campaignId, timestamp`.
* **Migration Handlers**: The database implements a robust versioning strategy. The migration from Version 1 to Version 2 handles backward compatibility by backfilling the `status` string (defaulting to `'draft'`) and deep-mutating the `avScript` nested arrays to ensure legacy records receive the new `cameraMovement` defaults without dropping data.

### 1.2 WebWorker Document Ingestion (`pdfjs-dist` & `tesseract.js`)
* To prevent blocking the main UI thread (and crashing the DOM), document ingestion is offloaded to background WebWorkers (`src/workers/pdfWorker.ts` and `src/workers/ocrWorker.ts`).
* `pdfjs-dist` operates strictly inside a WebWorker context to parse embedded text layers.
* `tesseract.js` provisions an isolated WASM instance to OCR pixel data from uploaded images. Both workers yield their intermediate parsing states to the main thread utilizing `aria-live="polite"` DOM nodes, ensuring screen readers receive progress updates without focus hijacking. If memory consumption spikes (OOM), the WebWorker scope isolates the crash, allowing the main React thread to gracefully handle the termination and present a recovery UI.

### 1.3 WebLLM Copilot & Coprocessor
* **WebGPU Detection**: `@mlc-ai/web-llm` attempts to invoke `navigator.gpu.requestAdapter()`. If hardware acceleration is absent, it immediately triggers the `remote-api` fallback route.
* **Idle VRAM Unloads**: The `useWebLLM.ts` hook implements an aggressive `300,000ms` (5 minutes) debounce timer. Upon expiration, it triggers `engine.unload()` to aggressively evict the LLM (e.g., Llama 3 8B) from the user's GPU VRAM, preventing thermal throttling or OS-level memory reclaims when the tab is idle.
* **API Key Failover**: If generation catches an `OperationError` (signaling WebGPU OOM exhaustion mid-generation), the engine catches the exception, clears the adapter context, and transparently routes the payload to the synchronous fallback REST endpoint, guaranteeing query completion.

---

## 2. Client-Side WebCompute Voice Generation & AV Workflow

### 2.1 Mechanics of In-Browser Text-to-Speech (TTS)
The **Audio Studio** synthesizes production-grade voiceovers entirely within the client boundary.
* **WASM/WebGPU Execution**: By utilizing WASM-compiled engines like **Piper TTS** or **Sherpa-ONNX**, the browser executes local acoustic inference. The models (quantized ONNX graphs, typically 20-50MB) are cached persistently via the ServiceWorker `CacheStorage` API.
* **Audio Synthesis**: The text is tokenized into phonemes directly in JS, fed through the WASM acoustic model, and returned as a Float32 buffer representing PCM audio data. This buffer is then piped into the Web Audio API (`AudioContext`) for live waveform visualization and instantaneous playback, allowing for pitch/speed manipulation without network latency.

### 2.2 End-to-End On-Device Generation Loop
The app achieves a 100% cloud-independent campaign generation workflow through these synchronous steps:
1. **Ingestion**: User drops a PDF. The `pdfjs-dist` WebWorker extracts raw text locally.
2. **Structuring**: The extracted text is passed to the WebGPU `@mlc-ai/web-llm` model residing in VRAM, which structures the unstructured text into a rigid 6-Act Markdown JSON payload.
3. **Voice Synthesis**: The extracted VO script from the 6-Act payload is mapped into the WASM TTS engine, generating synchronized audio clips.
4. **Visual Prompts**: Simultaneously, the LLM translates the visual cues into hyper-specific text-to-video prompt strings (e.g., tailored for Veo 3 or Runway Gen-3) infused with dynamic JSON camera paths.
5. **Assembly**: The user exports the final PDF script and the `.WAV` master track, completely bypassing external cloud services, API rate limits, or network ingestion tracking.
