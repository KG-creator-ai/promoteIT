import React, { useState, useEffect } from 'react';
import { Layout } from './components/layout/Layout';
import { AVArtVark } from './components/dashboard/AVArtVark';
import { ProjectWorkspace } from './components/projects/ProjectWorkspace';
import { CampaignWizard } from './components/wizard/CampaignWizard';
import { MasterScriptTable } from './components/script/MasterScriptTable';
import { PromptHub } from './components/prompts/PromptHub';
import { SettingsView } from './components/settings/SettingsView';
import { AudioStudio } from './components/audio/AudioStudio';
import { StorageQuotaIndicator } from './components/system/StorageQuotaIndicator';
import { ResourceStitcher } from './components/studio/ResourceStitcher';
import { AVVideoPlayer } from './components/studio/AVVideoPlayer';
import { seedDatabase } from './db/seed';
import { seedAuthDatabase } from './db/auth';
import { useDexieCampaign } from './hooks/useDexieCampaign';
import { useBrandTheme } from './hooks/useBrandTheme';
import { useWebLLM } from './hooks/useWebLLM';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [isDbReady, setIsDbReady] = useState(false);
  const { brandTemplates } = useDexieCampaign();
  const engine = useWebLLM();
  
  const template = brandTemplates?.[0];
  useBrandTheme(
    template?.primaryColor || '#062A30',
    template?.secondaryColor || '#19988B',
    template?.accentColor || '#C37C5B'
  );

  useEffect(() => {
    Promise.all([seedDatabase(), seedAuthDatabase()])
      .then(() => setIsDbReady(true))
      .catch(err => {
        console.error('Database seeding failed:', err);
        setIsDbReady(true);
      });
  }, []);

  if (!isDbReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <AVArtVark onNavigate={setActiveView} />;
      case 'projects':
        return <ProjectWorkspace onNavigate={setActiveView} />;
      case 'wizard':
        return <CampaignWizard onNavigate={setActiveView} onGenerateResponse={engine.generateResponse} engineState={{ isLoading: engine.isLoading, provider: engine.provider }} />;
      case 'studio':
        return <ResourceStitcher />;
      case 'script':
        return <MasterScriptTable onNavigate={setActiveView} />;
      case 'prompts':
        return <PromptHub />;
      case 'audio':
        return <AudioStudio />;
      case 'player':
        return <AVVideoPlayer onNavigate={setActiveView} />;
      case 'system':
        return <StorageQuotaIndicator />;
      case 'settings':
        return <SettingsView />;
      default:
        return <AVArtVark onNavigate={setActiveView} />;
    }
  };

  return (
    <Layout 
      activeView={activeView} 
      onNavigate={setActiveView}
      onEngineInit={engine.initEngine}
      onGenerateResponse={engine.generateResponse}
      engineState={{
        isLoading: engine.isLoading,
        provider: engine.provider,
        progress: engine.progress
      }}
    >
      {renderView()}
    </Layout>
  );
}
