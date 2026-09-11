import React from 'react';
import { Film, Sparkles, ShieldCheck, Download, Video, FolderOpen, Sliders } from 'lucide-react';
import { ArkaLogo } from './ArkaLogo';

interface HeaderProps {
  playbackMode: 'act1' | 'full';
  onModeChange: (mode: 'act1' | 'full') => void;
  onOpenExport: () => void;
  onOpenAssetManager: () => void;
  onOpenCampaignGenerator: () => void;
  currentCampaignTitle: string;
  isRecording: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  playbackMode,
  onModeChange,
  onOpenExport,
  onOpenAssetManager,
  onOpenCampaignGenerator,
  currentCampaignTitle,
  isRecording,
}) => {
  return (
    <header className="bg-[#041D22] border-b border-[#C37C5B]/25 text-white sticky top-0 z-40 backdrop-blur-md bg-opacity-95 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand Lockup with Arka Logo */}
        <div className="flex items-center gap-3">
          <ArkaLogo size="md" variant="horizontal" showLineage={true} />
          <div className="hidden sm:block h-6 w-px bg-[#C37C5B]/25 mx-1" />
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-[11px] text-slate-300">Project:</span>
            <button
              type="button"
              onClick={onOpenCampaignGenerator}
              className="text-xs font-bold text-[#E1966E] hover:text-white bg-[#062A30] px-2.5 py-1 rounded-lg border border-[#C37C5B]/30 hover:border-[#C37C5B] transition-all flex items-center gap-1.5 cursor-pointer"
              title="Click to switch campaign or generate custom video"
            >
              <span>{currentCampaignTitle}</span>
              <Sparkles className="w-3 h-3 text-[#25C5B5]" />
            </button>
          </div>
        </div>

        {/* Center Pill: Mode Switcher & Asset Manager */}
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <div className="flex items-center bg-[#062A30] border border-[#C37C5B]/30 rounded-full p-1 shadow-inner">
            <button
              type="button"
              onClick={() => onModeChange('act1')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                playbackMode === 'act1'
                  ? 'bg-gradient-to-r from-[#C37C5B] to-[#AD6243] text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Video className="w-3.5 h-3.5 text-[#25C5B5]" />
              Act 1 Preview
            </button>
            <button
              type="button"
              onClick={() => onModeChange('full')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                playbackMode === 'full'
                  ? 'bg-gradient-to-r from-[#19988B] to-[#0E5851] text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#E1966E]" />
              Full Cut (Gapless Audio)
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenCampaignGenerator}
            className="px-3.5 py-1.5 rounded-full bg-[#062A30] hover:bg-[#08353D] border border-[#19988B]/40 text-[#25C5B5] hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="Switch Campaign or Generate Video for Any Branch / Product"
          >
            <Sliders className="w-3.5 h-3.5 text-[#C37C5B]" />
            <span>Switch / New Video</span>
          </button>

          <button
            type="button"
            onClick={onOpenAssetManager}
            className="px-3.5 py-1.5 rounded-full bg-[#062A30] hover:bg-[#08353D] border border-[#C37C5B]/40 text-[#E1966E] hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="Upload images or choose from app subfolder sources"
          >
            <FolderOpen className="w-3.5 h-3.5 text-[#25C5B5]" />
            <span>Media Sources & Upload</span>
          </button>
        </div>

        {/* Right CTA & Badges */}
        <div className="flex items-center gap-2.5">
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#062A30]/80 border border-[#19988B]/40 text-[11px] text-slate-200">
            <ShieldCheck className="w-3.5 h-3.5 text-[#19988B]" />
            <span>CRISIL & ICRA <strong className="text-[#E1966E]">AAA</strong></span>
          </div>

          <button
            type="button"
            onClick={onOpenExport}
            disabled={isRecording}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#C37C5B] to-[#AD6243] hover:from-[#d48967] hover:to-[#c37351] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isRecording ? 'Exporting...' : 'Download Video'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
