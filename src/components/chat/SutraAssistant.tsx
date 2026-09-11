import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2, Maximize2, Minimize2, Sparkles } from 'lucide-react';
import { ChatCompletionMessageParam } from '@mlc-ai/web-llm';
import { SutraAvatar } from './SutraAvatar';
import { useOnClickOutside } from '../../hooks/useOnClickOutside';

export interface SutraAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  engineState: {
    isLoading: boolean;
    provider: string | null;
    progress?: string;
  };
  onGenerateResponse: (messages: ChatCompletionMessageParam[]) => Promise<any>;
}

export type SutraCopilotProps = SutraAssistantProps;

export function SutraAssistant({ isOpen, onClose, engineState, onGenerateResponse }: SutraAssistantProps) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{role: 'user'|'assistant', content: string}[]>([
    { 
      role: 'assistant', 
      content: "Namaste! I'm S.U.T.R.A. (Scripting & Universal Transforming Rendering Assistant). I can generate 6-act regional scripts, Veo/Runway camera prompts, voiceover guides, or stitch timeline cues. How may I assist your campaign today?" 
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Click outside collapse listener
  useOnClickOutside(popoverRef, () => {
    if (isOpen) {
      onClose();
    }
  });

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isTyping) return;

    const userMsg = query.trim();
    setQuery('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);

    try {
      const response = await onGenerateResponse([
        { 
          role: 'system', 
          content: 'You are S.U.T.R.A. (Scripting & Universal Transforming Rendering Assistant) for Arka Fincap Limited. You assist marketing teams in drafting 6-act AV scripts, camera prompts with brand colors (#062A30, #19988B, #C37C5B), voiceover phonetic guides, and video stitching cues. Keep answers structured and brand-aligned.' 
        },
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: userMsg }
      ]);
      
      const assistantText = response?.choices?.[0]?.message?.content || 
        "Drafted your request based on the Arka brand guidelines. Let me know if you would like me to adjust pacing or regional tone.";
      setMessages(prev => [...prev, { role: 'assistant', content: assistantText }]);
    } catch (error: any) {
      setMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: 'S.U.T.R.A. is ready to generate offline. You can also connect an API Key in Model Studio or initialize the local WebLLM weights in the header.' 
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickAction = (action: string) => {
    setQuery(action);
    inputRef.current?.focus();
  };

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.targetTouches[0].clientY);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const touchEnd = e.changedTouches[0].clientY;
    if (touchEnd - touchStart > 80) onClose(); // swipe down collapse
  };

  if (!isOpen) return null;

  const isEngineOnline = !!engineState.provider;

  return (
    <div 
      ref={popoverRef}
      role="dialog"
      aria-label="S.U.T.R.A. AI Assistant"
      className={`fixed z-50 flex flex-col shadow-2xl backdrop-blur-2xl transition-all duration-300 ease-out
        bg-white/95 dark:bg-slate-950/90 text-slate-900 dark:text-slate-100
        border border-slate-300/80 dark:border-white/15 overflow-hidden
        /* Mobile: Bottom Sheet Drawer */
        inset-x-0 bottom-0 h-[80vh] rounded-t-3xl border-b-0
        /* Desktop: Pinned Floating Glass Popover */
        md:inset-x-auto md:bottom-20 md:right-6 md:rounded-3xl md:border-b
        ${isExpanded 
          ? 'md:w-[600px] md:h-[720px] md:max-w-[calc(100vw-3rem)] md:max-h-[calc(100vh-6rem)]' 
          : 'md:w-[420px] md:h-[580px] md:max-w-[calc(100vw-2rem)] md:max-h-[calc(100vh-6rem)]'
        }
      `}
    >
      {/* Mobile Top Drag Handle */}
      <div 
        className="md:hidden w-full flex justify-center pt-2.5 pb-1 cursor-grab active:cursor-grabbing select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="w-12 h-1.5 bg-slate-400/40 rounded-full mx-auto my-1" />
      </div>

      {/* Header Control Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/80 dark:border-white/10 bg-slate-100/70 dark:bg-slate-900/60 backdrop-blur-md">
        {/* Left: Avatar + Title + Online Badge */}
        <div className="flex items-center gap-2.5">
          <div className="p-1 rounded-lg bg-primary/10 border border-primary/20">
            <SutraAvatar className="w-5 h-5" size={20} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">
                S.U.T.R.A. AI Assistant
              </h2>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              <span className={`w-2 h-2 rounded-full ${isEngineOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="font-medium">
                {isEngineOnline ? `${engineState.provider === 'webgpu' ? 'WebLLM GPU' : 'API'} Online` : 'Standby Mode'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Window Controls & Explicit Close Button */}
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-200/70 dark:hover:bg-slate-800/70 rounded-lg transition-colors hidden md:block"
            title={isExpanded ? "Collapse View" : "Expand View"}
            aria-label={isExpanded ? "Collapse View" : "Expand View"}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-200/70 dark:hover:bg-slate-800/70 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="Close Chat"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 no-scrollbar bg-slate-50/50 dark:bg-slate-950/40">
        {/* Quick Suggestion Pills */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {[
            "Tamil Nadu 6-Act Script", 
            "Veo 3 Camera Prompts", 
            "STLAP Product VO Cues",
            "333 Vision Narrative"
          ].map(action => (
            <button 
              key={action}
              onClick={() => handleQuickAction(action)}
              className="text-xs px-2.5 py-1 rounded-full border border-slate-300/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-all text-left"
            >
              {action}
            </button>
          ))}
        </div>

        {/* Conversation Stream */}
        <div aria-live="polite" className="space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-r from-[rgb(var(--color-primary))] to-[rgb(var(--color-secondary))] text-white rounded-br-xs' 
                  : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-bl-xs border border-slate-200 dark:border-white/10'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-slate-900 rounded-2xl rounded-bl-xs px-4 py-3 border border-slate-200 dark:border-white/10 flex items-center gap-2 shadow-sm">
                <SutraAvatar className="w-4 h-4 animate-spin" size={16} />
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">S.U.T.R.A. is formulating response...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Chat Input Dock */}
      <div className="p-3 border-t border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-slate-900/80 backdrop-blur-md">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask S.U.T.R.A. for scripts, prompts, or voiceovers..."
            disabled={isTyping}
            className="flex-1 bg-slate-100/90 dark:bg-slate-950 border border-slate-300/80 dark:border-white/10 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 rounded-xl px-3.5 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
          <button
            type="submit"
            disabled={!query.trim() || isTyping}
            className="p-2.5 bg-gradient-to-tr from-[rgb(var(--color-primary))] to-[rgb(var(--color-secondary))] text-white rounded-xl hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md hover:scale-105 active:scale-95"
            aria-label="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

export const SutraCopilot = SutraAssistant;
