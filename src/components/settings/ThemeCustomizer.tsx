import React, { useState, useEffect } from 'react';
import { useDexieCampaign } from '../../hooks/useDexieCampaign';
import { db } from '../../db/db';
import { Palette, Upload, Download, Save } from 'lucide-react';
import { saveAs } from 'file-saver';
import { GlassCard } from '../ui/GlassCard';

export function ThemeCustomizer() {
  const { brandTemplates } = useDexieCampaign();
  const template = brandTemplates?.[0];

  const [primary, setPrimary] = useState('#062A30');
  const [secondary, setSecondary] = useState('#19988B');
  const [accent, setAccent] = useState('#C37C5B');
  const [logo, setLogo] = useState<string | null>(null);

  useEffect(() => {
    if (template) {
      setPrimary(template.primaryColor);
      setSecondary(template.secondaryColor);
      setAccent(template.accentColor);
      setLogo(template.logoBase64 || null);
    }
  }, [template]);

  const handleSave = async () => {
    if (template?.id) {
      await db.brandTemplates.update(template.id, {
        primaryColor: primary,
        secondaryColor: secondary,
        accentColor: accent,
        logoBase64: logo || undefined,
        updatedAt: Date.now()
      });
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExportConfig = () => {
    const config = { primary, secondary, accent, logo };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    saveAs(blob, 'brand-config.json');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 text-slate-900 dark:text-slate-100">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">White-Label Customizer</h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Configure your agency or client's dynamic brand parameters.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <GlassCard className="lg:col-span-2 space-y-6 p-8">
          <div className="flex items-center gap-3 border-b border-slate-200 dark:border-white/10 pb-4">
            <Palette className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Theme Colors</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Primary Color</label>
              <div className="flex items-center gap-3">
                <input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} className="w-12 h-12 rounded-xl cursor-pointer border-0 p-0 bg-transparent" />
                <input type="text" value={primary} onChange={(e) => setPrimary(e.target.value)} className="flex-1 bg-slate-100 dark:bg-slate-950/50 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm font-mono uppercase" />
              </div>
            </div>
            
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Secondary Color</label>
              <div className="flex items-center gap-3">
                <input type="color" value={secondary} onChange={(e) => setSecondary(e.target.value)} className="w-12 h-12 rounded-xl cursor-pointer border-0 p-0 bg-transparent" />
                <input type="text" value={secondary} onChange={(e) => setSecondary(e.target.value)} className="flex-1 bg-slate-100 dark:bg-slate-950/50 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm font-mono uppercase" />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Accent Color</label>
              <div className="flex items-center gap-3">
                <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-12 h-12 rounded-xl cursor-pointer border-0 p-0 bg-transparent" />
                <input type="text" value={accent} onChange={(e) => setAccent(e.target.value)} className="flex-1 bg-slate-100 dark:bg-slate-950/50 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm font-mono uppercase" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 border-b border-slate-200 dark:border-white/10 pb-4 pt-6">
            <Upload className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Brand Logo</h2>
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-slate-300 dark:border-white/20 flex items-center justify-center bg-slate-100 dark:bg-slate-950/50 overflow-hidden relative group hover:border-primary/50 transition-colors">
              {logo ? (
                <img src={logo} alt="Brand Logo" className="w-full h-full object-contain p-2" />
              ) : (
                <span className="text-xs text-slate-500 font-medium group-hover:text-primary transition-colors">No Logo</span>
              )}
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            </div>
            <div className="space-y-2 flex-1">
              <p className="text-sm text-slate-700 dark:text-slate-300">Upload a high-resolution PNG or SVG logo.</p>
              <p className="text-xs text-slate-500">The image will be converted to Base64 and stored securely in IndexedDB.</p>
            </div>
          </div>
        </GlassCard>

        {/* Preview Panel */}
        <div className="space-y-6">
          <GlassCard className="p-6">
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Live Preview</h3>
            
            <div className="space-y-4">
              <div className="w-full h-12 rounded-xl flex items-center justify-center font-semibold text-white shadow-[0_0_15px_rgba(var(--color-primary),0.3)] transition-all" style={{ backgroundColor: primary }}>
                Primary Button
              </div>
              <div className="w-full h-12 rounded-xl flex items-center justify-center font-semibold border border-slate-200 dark:border-white/10 backdrop-blur-md transition-all" style={{ backgroundColor: `${primary}20`, color: primary }}>
                Secondary Surface
              </div>
              <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100/60 dark:bg-slate-900/40 backdrop-blur-md">
                <div className="w-8 h-8 rounded-full mb-2 shadow-[0_0_10px_rgba(var(--color-accent),0.4)] transition-all" style={{ backgroundColor: accent }}></div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">Accent Highlight</div>
              </div>
            </div>
          </GlassCard>

          <div className="flex flex-col gap-3">
            <button onClick={handleSave} className="w-full py-3 bg-primary text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(var(--color-primary),0.4)] hover:bg-primary/90 transition-all">
              <Save className="w-4 h-4" />
              Save Brand Profile
            </button>
            <button onClick={handleExportConfig} className="w-full py-3 bg-slate-100 dark:bg-slate-800/50 border border-slate-300 dark:border-white/10 text-slate-800 dark:text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all">
              <Download className="w-4 h-4" />
              Export Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
