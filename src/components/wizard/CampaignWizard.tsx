import React, { useState } from 'react';
import { UploadCloud, FileText, Settings2, PlayCircle, Loader2, Check, Wand2 } from 'lucide-react';

interface CampaignWizardProps {
  onNavigate: (view: string) => void;
  engineState: {
    isLoading: boolean;
    provider: string | null;
  };
}

export function CampaignWizard({ onNavigate, engineState }: CampaignWizardProps) {
  const [step, setStep] = useState(1);
  const [isExtracting, setIsExtracting] = useState(false);
  const [progress, setProgress] = useState(0);

  const steps = [
    { num: 1, title: 'Brand & Context', icon: Settings2 },
    { num: 2, title: 'Document Ingestion', icon: UploadCloud },
    { num: 3, title: 'AI Generation', icon: FileText },
    { num: 4, title: 'Review & Export', icon: PlayCircle },
  ];

  const handleNext = () => setStep(prev => Math.min(prev + 1, 4));
  const handlePrev = () => setStep(prev => Math.max(prev - 1, 1));

  const simulateIngestion = () => {
    setIsExtracting(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setIsExtracting(false);
          handleNext();
          return 100;
        }
        return p + 10;
      });
    }, 200);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 text-slate-900 dark:text-slate-100">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Campaign Wizard</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">Generate a fully structured 6-Act AV Script automatically.</p>
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
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Campaign Title</label>
                <input type="text" className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow" placeholder="e.g. Q3 Regional Expansion" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Target Audience / Region</label>
                <input type="text" className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow" placeholder="e.g. Tamil Nadu MSMEs" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Core Objectives & CTA</label>
                <textarea className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow min-h-[100px]" placeholder="Briefly describe what this video must achieve..."></textarea>
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
            
            {!isExtracting ? (
              <div className="w-full max-w-xl border-2 border-dashed border-slate-300 dark:border-white/20 rounded-3xl p-12 text-center hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer group" onClick={simulateIngestion}>
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 group-hover:bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors">
                  <UploadCloud className="w-8 h-8 text-slate-500 dark:text-slate-400 group-hover:text-primary transition-colors" />
                </div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">Click or drag files here</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Supports PDF, PNG, JPG (Max 50 pages)</p>
              </div>
            ) : (
              <div className="w-full max-w-md space-y-4 text-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">Processing Documents...</h3>
                <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }}></div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Extracting text via WebWorkers</p>
              </div>
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
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${engineState.provider === 'webgpu' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'}`}>
                {engineState.provider === 'webgpu' ? 'WebGPU Acceleration' : 'Remote Fallback API'}
              </span>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="flex-1 flex flex-col items-center justify-center animate-in slide-in-from-right-4 text-center space-y-6">
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950 rounded-full flex items-center justify-center mb-2 text-emerald-600 dark:text-emerald-400">
              <Check className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Generation Complete!</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-sm mx-auto">Your N-Scene script and AI prompts have been saved to your workspace.</p>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-between mt-8 pt-6 border-t border-slate-200 dark:border-white/5">
          <button 
            onClick={handlePrev} 
            disabled={step === 1 || isExtracting || step === 4}
            className="px-6 py-2.5 rounded-xl font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            Back
          </button>
          
          {step < 4 ? (
            <button 
              onClick={step === 2 ? simulateIngestion : handleNext}
              disabled={isExtracting || (step === 3 && !engineState.provider)}
              className="px-6 py-2.5 rounded-xl font-medium bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm"
            >
              {step === 3 ? 'Generate Script' : 'Continue'}
            </button>
          ) : (
            <button 
              onClick={() => onNavigate('script')}
              className="px-6 py-2.5 rounded-xl font-medium bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm"
            >
              Go to Script Studio
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
