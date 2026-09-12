import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, Settings2, PlayCircle, Loader2, Check, Wand2, X, TriangleAlert } from 'lucide-react';
import type { ChatCompletionMessageParam } from '@mlc-ai/web-llm';
import { useCampaignContext } from '../../context/CampaignContext';
import { usePageTitle } from '../../hooks/usePageTitle';
import { buildAVGeneratorPrompt, parseAVGeneratorResponse } from '../../lib/avGenerator';
import type { AVResourceRef, AVSceneNode } from '../../db/db';

interface CampaignWizardProps {
  onNavigate: (view: string) => void;
  engineState: {
    isLoading: boolean;
    provider: string | null;
  };
  onGenerateResponse?: (messages: ChatCompletionMessageParam[]) => Promise<any>;
}

interface StagedFile {
  id: string;
  name: string;
  kind: 'pdf_brief' | 'ocr_extract';
  status: 'extracting' | 'ready' | 'error';
  text?: string;
  detail?: string;
}

function runWorker<T>(worker: Worker, message: Record<string, unknown>, timeoutMs = 120000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      try { worker.terminate(); } catch { /* already gone */ }
      reject(new Error('Extraction timed out. Try a smaller file.'));
    }, timeoutMs);
    worker.onmessage = (e: MessageEvent) => {
      window.clearTimeout(timer);
      try { worker.terminate(); } catch { /* already gone */ }
      const data = e.data;
      if (data?.status === 'SUCCESS') resolve(data as T);
      else reject(new Error(data?.message || 'Extraction failed.'));
    };
    worker.onerror = () => {
      window.clearTimeout(timer);
      try { worker.terminate(); } catch { /* already gone */ }
      reject(new Error('Worker crashed (likely out of memory). Try a smaller file.'));
    };
    worker.postMessage(message);
  });
}

async function extractPdfText(file: File): Promise<{ text: string; pageCount: number; truncated: boolean }> {
  const worker = new Worker(new URL('../../workers/pdfWorker.ts', import.meta.url), { type: 'module' });
  const arrayBuffer = await file.arrayBuffer();
  return runWorker(worker, { type: 'EXTRACT_TEXT', arrayBuffer }, 180000);
}

async function extractOcrText(file: File): Promise<{ text: string; confidence: number }> {
  const worker = new Worker(new URL('../../workers/ocrWorker.ts', import.meta.url), { type: 'module' });
  return runWorker(worker, { type: 'EXTRACT_OCR', imageBlob: file }, 180000);
}

export function CampaignWizard({ onNavigate, engineState, onGenerateResponse }: CampaignWizardProps) {
  const { createNewCampaign, updateCampaign, setActiveCampaignId } = useCampaignContext();
  usePageTitle('4-Step Campaign Wizard', 'Ingest briefs and generate AV scripts.');
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [audience, setAudience] = useState('');
  const [objectives, setObjectives] = useState('');
  const [staged, setStaged] = useState<StagedFile[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const steps = [
    { num: 1, title: 'Brand & Context', icon: Settings2 },
    { num: 2, title: 'Document Ingestion', icon: UploadCloud },
    { num: 3, title: 'AI Generation', icon: FileText },
    { num: 4, title: 'Review & Export', icon: PlayCircle },
  ];

  const handleNext = () => setStep(prev => Math.min(prev + 1, 4));
  const handlePrev = () => setStep(prev => Math.max(prev - 1, 1));

  const isPdf = (f: File) => f.type === 'application/pdf' || /\.pdf$/i.test(f.name);
  const isImage = (f: File) => f.type.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(f.name);

  const handleFiles = async (files: FileList | File[]) => {
    const list = Array.from(files).filter(f => isPdf(f) || isImage(f));
    if (list.length === 0) return;
    setIsExtracting(true);
    setProgress(0);
    let done = 0;

    for (const file of list) {
      const id = `staged-${crypto.randomUUID().slice(0, 8)}`;
      const kind = isPdf(file) ? 'pdf_brief' : 'ocr_extract';
      setStaged(prev => [...prev, { id, name: file.name, kind, status: 'extracting' }]);
      try {
        const result = isPdf(file) ? await extractPdfText(file) : await extractOcrText(file);
        const text = result.text?.trim() || '';
        if (!text) throw new Error('No readable text found in this file.');
        const detail = isPdf(file)
          ? `${(result as { pageCount: number; truncated: boolean }).pageCount} pages${(result as { truncated: boolean }).truncated ? ' (capped at 50)' : ''} · ${text.length} chars`
          : `${text.length} chars`;
        setStaged(prev => prev.map(s => (s.id === id ? { ...s, status: 'ready', text, detail } : s)));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Extraction failed.';
        setStaged(prev => prev.map(s => (s.id === id ? { ...s, status: 'error', detail: message } : s)));
      }
      done += 1;
      setProgress(Math.round((done / list.length) * 100));
    }
    setIsExtracting(false);
  };

  const removeStaged = (id: string) => setStaged(prev => prev.filter(s => s.id !== id));

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenError(null);
    try {
      const readyTexts = staged.filter(s => s.status === 'ready' && s.text);
      const briefText = [
        title.trim() && `Campaign: ${title.trim()}`,
        audience.trim() && `Audience/Region: ${audience.trim()}`,
        objectives.trim() && `Objectives: ${objectives.trim()}`,
        ...readyTexts.map(s => `--- ${s.name} ---\n${s.text}`),
      ].filter(Boolean).join('\n\n');

      const resourceLibrary: AVResourceRef[] = readyTexts.map(s => ({
        id: `res-${crypto.randomUUID().slice(0, 8)}`,
        type: s.kind,
        title: s.name,
        mimeType: s.kind === 'pdf_brief' ? 'application/pdf' : 'image/*',
        blobOrTextRef: (s.text || '').slice(0, 20000),
        metadata: { source: 'wizard_upload', chars: s.text?.length || 0 },
        createdAt: Date.now(),
      }));

      // Create clean campaign via context
      const campaignId = await createNewCampaign(
        title.trim() || 'Untitled Campaign',
        audience.trim() || undefined
      );

      // Store resources and brief on the campaign
      await updateCampaign(campaignId, {
        rawBriefText: briefText || undefined,
        resourceLibrary,
        status: 'briefing',
      });

      // Attempt AI structuring only when an inference provider is online.
      if (onGenerateResponse && engineState.provider && briefText) {
        try {
          const reply = await onGenerateResponse(
            buildAVGeneratorPrompt({ modelType: 'veo3', briefText: briefText.slice(0, 12000), brandName: 'Arka Fincap' })
          );
          const text: string = reply?.choices?.[0]?.message?.content || '';
          const parsed = parseAVGeneratorResponse(text);
          const sceneGraph: AVSceneNode[] = (parsed.avScript || []).map((cut, idx) => ({
            id: `scene-${crypto.randomUUID().slice(0, 8)}`,
            sceneIndex: idx,
            actName: `Act ${cut.act}`,
            timeStart: cut.timestampStart,
            timeEnd: cut.timestampEnd,
            visualDescription: cut.visualDescription,
            cameraMovement: cut.cameraMovement || 'Static Center',
            voiceoverText: cut.audioVoiceover,
            bgmCue: cut.bgmCue,
            linkedResourceIds: [],
          }));
          await updateCampaign(campaignId, {
            sceneGraph,
            videoPrompts: (parsed.videoPrompts || []).map((p, idx) => ({
              id: `prompt-${crypto.randomUUID().slice(0, 8)}`,
              actIndex: p.actIndex ?? idx + 1,
              targetModel: 'veo3' as const,
              promptText: p.promptText,
              jsonParameters: p.jsonParameters,
            })),
            status: 'scripting',
          });
        } catch {
          setGenError('AI structuring is unavailable right now — your brief and resources were saved. Use S.U.T.R.A. or Script Studio to generate scenes.');
        }
      } else if (!engineState.provider) {
        setGenError('Engine is on standby — brief and resources saved. Load the AI engine (header) or add a Gemini key in Settings for AI structuring.');
      }
      setStep(4);
    } catch {
      setGenError('Could not create the campaign. Storage may be full — check System Health and retry.');
    } finally {
      setIsGenerating(false);
    }
  };

  const readyCount = staged.filter(s => s.status === 'ready').length;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 text-slate-900 dark:text-slate-100">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Campaign Wizard</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">Generate a fully structured N-Scene AV Script automatically.</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between relative mb-12">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 dark:bg-slate-800 -z-10 rounded-full"></div>
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary -z-10 rounded-full transition-all duration-500" style={{ width: `${((step - 1) / 3) * 100}%` }}></div>

        {steps.map(s => {
          const Icon = s.icon;
          const isActive = s.num === step;
          const isPassed = s.num < step;
          return (
            <div key={s.num} className="flex flex-col items-center gap-2 bg-slate-50 dark:bg-slate-950 px-2">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 border-slate-100 dark:border-slate-900 transition-colors duration-300 ${isActive ? 'bg-primary text-white shadow-md' : isPassed ? 'bg-primary text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-xs font-semibold ${isActive || isPassed ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>{s.title}</span>
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 shadow-2xl rounded-3xl p-8 min-h-[400px] flex flex-col">
        {step === 1 && (
          <div className="flex-1 space-y-6 animate-in slide-in-from-right-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Campaign Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="wizard-title" className="text-sm font-semibold text-slate-700 dark:text-slate-200">Campaign Title</label>
                <input id="wizard-title" type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow" placeholder="e.g. Q3 Regional Expansion" />
              </div>
              <div className="space-y-2">
                <label htmlFor="wizard-audience" className="text-sm font-semibold text-slate-700 dark:text-slate-200">Target Audience / Region</label>
                <input id="wizard-audience" type="text" value={audience} onChange={e => setAudience(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow" placeholder="e.g. Tamil Nadu MSMEs" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="wizard-objectives" className="text-sm font-semibold text-slate-700 dark:text-slate-200">Core Objectives & CTA</label>
                <textarea id="wizard-objectives" value={objectives} onChange={e => setObjectives(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow min-h-[100px]" placeholder="Briefly describe what this video must achieve..."></textarea>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex-1 space-y-6 flex flex-col items-center justify-center animate-in slide-in-from-right-4">
            <div className="text-center space-y-2 mb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Upload Knowledge Base</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">Provide PDF decks or images to inform the AI generator.</p>
            </div>

            <label
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={e => { e.preventDefault(); setIsDragging(false); void handleFiles(e.dataTransfer.files); }}
              className={`w-full max-w-xl border-2 border-dashed rounded-3xl p-12 text-center transition-colors cursor-pointer group ${isDragging ? 'border-primary bg-primary/5' : 'border-slate-300 dark:border-white/20 hover:border-primary hover:bg-primary/5'}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                className="sr-only"
                onChange={e => { if (e.target.files) void handleFiles(e.target.files); e.target.value = ''; }}
              />
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 group-hover:bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors">
                <UploadCloud className="w-8 h-8 text-slate-500 dark:text-slate-400 group-hover:text-primary transition-colors" />
              </div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-200">Click or drag files here</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Supports PDF, PNG, JPG (Max 50 pages per PDF)</p>
            </label>

            {isExtracting && (
              <div className="w-full max-w-md space-y-4 text-center" aria-live="polite">
                <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">Processing Documents...</h3>
                <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }}></div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Extracting text via WebWorkers (isolated from UI thread)</p>
              </div>
            )}

            {staged.length > 0 && (
              <ul className="w-full max-w-xl space-y-2" aria-live="polite">
                {staged.map(s => (
                  <li key={s.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/50 text-sm">
                    <FileText className="w-4 h-4 text-primary shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-slate-800 dark:text-slate-200 truncate">{s.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {s.status === 'extracting' && 'Extracting...'}
                        {s.status === 'ready' && `Ready · ${s.detail}`}
                        {s.status === 'error' && `Failed · ${s.detail}`}
                      </div>
                    </div>
                    {s.status === 'ready' && <Check className="w-4 h-4 text-emerald-500 shrink-0" />}
                    {s.status === 'error' && <TriangleAlert className="w-4 h-4 text-amber-500 shrink-0" />}
                    <button
                      onClick={() => removeStaged(s.id)}
                      className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
                      aria-label={`Remove ${s.name}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {readyCount > 0 && !isExtracting && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{readyCount} file{readyCount > 1 ? 's' : ''} extracted and ready.</p>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="flex-1 flex flex-col items-center justify-center animate-in slide-in-from-right-4 text-center space-y-6">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-2">
              <Wand2 className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Ready to Generate</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-sm mx-auto">The engine will now structure your brief into an N-Scene AV Script and generate AI video prompts.</p>
            </div>
            <div className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-white/10 text-sm text-slate-700 dark:text-slate-300 flex items-center gap-3">
              <span className="font-semibold">Engine Status:</span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${engineState.provider === 'webgpu' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : engineState.provider === 'remote-api' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'}`}>
                {engineState.provider === 'webgpu' ? 'WebGPU Acceleration' : engineState.provider === 'remote-api' ? 'Remote Fallback API' : 'Standby — brief will still be saved'}
              </span>
            </div>
            {isGenerating && (
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400" aria-live="polite">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                Creating campaign{engineState.provider ? ' and structuring scenes' : ''}...
              </div>
            )}
            {genError && (
              <p role="alert" className="max-w-md text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/20 rounded-xl px-4 py-3">
                {genError}
              </p>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="flex-1 flex flex-col items-center justify-center animate-in slide-in-from-right-4 text-center space-y-6">
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950 rounded-full flex items-center justify-center mb-2 text-emerald-600 dark:text-emerald-400">
              <Check className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Generation Complete!</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-sm mx-auto">Your campaign{readyCount > 0 ? `, ${readyCount} ingested resource${readyCount > 1 ? 's' : ''},` : ''} and N-Scene script have been saved to your workspace.</p>
            </div>
            {genError && (
              <p role="alert" className="max-w-md text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/20 rounded-xl px-4 py-3">
                {genError}
              </p>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-between mt-8 pt-6 border-t border-slate-200 dark:border-white/5">
          <button
            onClick={handlePrev}
            disabled={step === 1 || isExtracting || isGenerating || step === 4}
            className="px-6 py-2.5 min-h-[44px] rounded-xl font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            Back
          </button>

          {step < 4 ? (
            <button
              onClick={step === 2 ? handleNext : step === 3 ? handleGenerate : handleNext}
              disabled={isExtracting || isGenerating}
              className="px-6 py-2.5 min-h-[44px] rounded-xl font-medium bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm flex items-center gap-2"
            >
              {(isGenerating || (step === 2 && isExtracting)) && <Loader2 className="w-4 h-4 animate-spin" />}
              {step === 3 ? (isGenerating ? 'Generating...' : 'Generate Script') : 'Continue'}
            </button>
          ) : (
            <button
              onClick={() => onNavigate('script')}
              className="px-6 py-2.5 min-h-[44px] rounded-xl font-medium bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm"
            >
              Go to Script Studio
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
