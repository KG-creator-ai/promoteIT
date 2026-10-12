import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Square, Volume2, Settings2, Download, Waves, Layers, Mic, AlertTriangle } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { useCampaignContext } from '../../context/CampaignContext';
import { usePageTitle } from '../../hooks/usePageTitle';
import { audioEngine } from '../../services/audioEngine';

const TTS_VOICE_KEY = 'promote_it_tts_voice';

interface VoiceOption {
  uri: string;
  label: string;
  recommended: boolean;
}

export function AudioStudio() {
  const { activeCampaign, scenes } = useCampaignContext();
  usePageTitle('Audio & TTS Studio', 'Client-side voiceover synthesis and audio visualizer.');
  const campaign = activeCampaign;

  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [voiceURI, setVoiceURI] = useState<string>('');
  const [rate, setRate] = useState(1.1);
  const [volume, setVolume] = useState(80);
  const [speaking, setSpeaking] = useState<{ isSpeaking: boolean; sceneIndex: number }>({ isSpeaking: false, sceneIndex: -1 });
  const [masterPlaying, setMasterPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const masterCancelRef = useRef(false);

  const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Live voice list + speaking status from the real engine
  useEffect(() => {
    const loadVoices = () => {
      const list = audioEngine.getAvailableVoices().map(v => ({
        uri: v.voiceURI,
        label: `${v.name} — ${v.lang}${v.isRecommended ? ' (recommended)' : ''}`,
        recommended: v.isRecommended,
      }));
      setVoices(list);
      try {
        const saved = localStorage.getItem(TTS_VOICE_KEY) || '';
        if (saved && list.some(v => v.uri === saved)) {
          setVoiceURI(saved);
          audioEngine.setSelectedVoiceURI(saved);
        }
      } catch {
        // storage unavailable — keep system default
      }
    };
    loadVoices();
    if (ttsSupported && 'onvoiceschanged' in window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    audioEngine.setSpeakingListener((s) => setSpeaking({ isSpeaking: s.isSpeaking, sceneIndex: s.sceneIndex }));
    return () => {
      audioEngine.setSpeakingListener(null);
      audioEngine.stopVoiceover();
    };
  }, [ttsSupported]);

  const pickVoice = (uri: string) => {
    setVoiceURI(uri);
    audioEngine.setSelectedVoiceURI(uri || null);
    try {
      if (uri) localStorage.setItem(TTS_VOICE_KEY, uri);
      else localStorage.removeItem(TTS_VOICE_KEY);
    } catch {
      // ignore
    }
  };

  const sceneText = useCallback((idx: number): string => {
    const s = scenes[idx];
    if (s) return s.voiceoverText || '';
    const cut = campaign?.avScript?.[idx];
    return cut?.audioVoiceover || '';
  }, [scenes, campaign]);

  const speakScene = useCallback((idx: number, onEnd?: () => void) => {
    const text = sceneText(idx);
    if (!text.trim()) {
      onEnd?.();
      return;
    }
    // Engine clamps rate to 0.75–1.15 internally; volume 0–1.
    audioEngine.playVoiceover(text, 0.84, rate, voiceURI || undefined, idx > 0, idx, onEnd, volume / 100);
  }, [sceneText, rate, voiceURI, volume]);

  const stopAll = useCallback(() => {
    masterCancelRef.current = true;
    audioEngine.stopVoiceover();
    setMasterPlaying(false);
  }, []);

  const playMaster = useCallback(() => {
    if (speaking.isSpeaking) {
      stopAll();
      return;
    }
    const total = scenes.length > 0 ? scenes.length : (campaign?.avScript?.length || 0);
    if (total === 0) return;
    masterCancelRef.current = false;
    setMasterPlaying(true);
    const step = (idx: number) => {
      if (masterCancelRef.current || idx >= total) {
        setMasterPlaying(false);
        return;
      }
      speakScene(idx, () => step(idx + 1));
    };
    step(0);
  }, [speaking.isSpeaking, scenes.length, campaign, speakScene, stopAll]);

  // Deterministic segment map (text-length scaled) — real data, never random.
  const maxLen = Math.max(1, ...scenes.map(s => (s.voiceoverText || '').length));

  const downloadEDL = () => {
    const edl = {
      campaign: campaign?.title || 'untitled',
      exportedAt: new Date().toISOString(),
      voiceURI: voiceURI || 'system-default',
      rate,
      volume: volume / 100,
      segments: scenes.map((s, idx) => ({
        sceneIndex: idx,
        actName: s.actName,
        timeStart: s.timeStart,
        timeEnd: s.timeEnd,
        voiceoverText: s.voiceoverText,
        phoneticGuide: s.phoneticGuide || audioEngine.phoneticallyTranscribe(s.voiceoverText || ''),
      })),
    };
    const blob = new Blob([JSON.stringify(edl, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${campaign?.title || 'AV'}_Voiceover_EDL.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMsg('Voiceover package exported (script + phonetics + timing).');
  };

  const recordNarration = async () => {
    if (isRecording) {
      recorderRef.current?.stop();
      return;
    }
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setStatusMsg('Tab audio capture is not available in this browser — use Chrome/Edge and share the tab with audio.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ audio: true, video: true });
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        stream.getTracks().forEach(t => t.stop());
        setStatusMsg('No audio in the shared tab — re-share with "Share tab audio" enabled, then press Play.');
        return;
      }
      chunksRef.current = [];
      const recorder = new MediaRecorder(new MediaStream(audioTracks));
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${campaign?.title || 'AV'}_Narration.webm`;
        a.click();
        URL.revokeObjectURL(url);
        stream.getTracks().forEach(t => t.stop());
        setIsRecording(false);
        setStatusMsg('Narration recording saved.');
      };
      recorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setStatusMsg('Recording live narration — press Play, then stop the recording when done.');
    } catch {
      setStatusMsg('Tab capture was dismissed — no recording started.');
    }
  };

  // Prefer sceneGraph, fall back to avScript
  const legacyCuts = campaign?.avScript || [];
  const hasContent = scenes.length > 0 || legacyCuts.length > 0;

  if (!campaign || !hasContent) {
    return <div className="text-center py-10 text-slate-500">No script available to generate audio.</div>;
  }

  const segmentCount = scenes.length > 0 ? scenes.length : legacyCuts.length;
  const playing = speaking.isSpeaking || masterPlaying;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-slate-900 dark:text-slate-100">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Audio Studio</h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Client-side WebCompute TTS Voiceover Synthesis & Segment Map.</p>
      </div>

      {!ttsSupported && (
        <div role="alert" className="flex gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-500/20 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-400">
            This browser has no Speech Synthesis support — playback controls are disabled.
            Voiceover text and export packages below remain available.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="lg:col-span-2 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Waves className="w-5 h-5 text-primary" />
              Segment Map
              {speaking.isSpeaking && speaking.sceneIndex >= 0 && (
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                  Speaking scene {speaking.sceneIndex + 1}
                </span>
              )}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={playMaster}
                disabled={!ttsSupported}
                className="p-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-40 min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label={playing ? "Stop narration" : "Play all narration"}
              >
                {playing ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              </button>
            </div>
          </div>

          <div className="h-32 bg-slate-100 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-white/10 flex items-end justify-center gap-1 p-2 overflow-hidden" aria-label="Voiceover segment lengths">
            {scenes.map((s, i) => (
              <div
                key={s.id || i}
                title={`${s.actName}: ${s.voiceoverText?.slice(0, 60) || ''}`}
                className={`flex-1 rounded-t-full transition-all duration-300 ${speaking.sceneIndex === i && speaking.isSpeaking ? 'bg-emerald-500' : 'bg-primary opacity-60'}`}
                style={{ height: `${Math.max(8, ((s.voiceoverText || '').length / maxLen) * 100)}%` }}
              />
            ))}
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              Voiceover Segments ({segmentCount} Scenes)
            </h3>
            <div className="space-y-2">
              {scenes.length > 0 ? (
                scenes.map((scene, idx) => (
                  <div key={scene.id || idx} className={`p-3 border rounded-lg flex items-center justify-between group ${speaking.sceneIndex === idx && speaking.isSpeaking ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-500/40' : 'bg-slate-100 dark:bg-slate-900/50 border-slate-200 dark:border-white/5'}`}>
                    <div className="flex items-center gap-3 overflow-hidden">
                      <button
                        onClick={() => (speaking.isSpeaking && speaking.sceneIndex === idx ? stopAll() : speakScene(idx))}
                        disabled={!ttsSupported}
                        className="p-1.5 bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-primary rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent shrink-0 disabled:opacity-40 min-w-[44px] min-h-[44px] flex items-center justify-center"
                        aria-label={speaking.isSpeaking && speaking.sceneIndex === idx ? `Stop scene ${idx + 1}` : `Play scene ${idx + 1}`}
                      >
                        {speaking.isSpeaking && speaking.sceneIndex === idx ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                      </button>
                      <div className="truncate">
                        <span className="text-xs font-bold text-primary uppercase mr-2">{scene.actName}</span>
                        <span className="text-sm text-slate-700 dark:text-slate-300 italic truncate block sm:inline">"{scene.voiceoverText}"</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-slate-500 shrink-0 ml-2">{scene.timeStart}</span>
                  </div>
                ))
              ) : (
                legacyCuts.map((cut, idx) => (
                  <div key={idx} className="p-3 bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-lg flex items-center justify-between group">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <button
                        onClick={() => (speaking.isSpeaking ? stopAll() : speakScene(idx))}
                        disabled={!ttsSupported}
                        className="p-1.5 bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-primary rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent shrink-0 disabled:opacity-40 min-w-[44px] min-h-[44px] flex items-center justify-center"
                        aria-label={speaking.isSpeaking ? `Stop narration` : `Play act ${cut.act}`}
                      >
                        {speaking.isSpeaking ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                      </button>
                      <div className="truncate">
                        <span className="text-xs font-bold text-primary uppercase mr-2">Act {cut.act}</span>
                        <span className="text-sm text-slate-700 dark:text-slate-300 italic truncate block sm:inline">"{cut.audioVoiceover}"</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-slate-500 shrink-0 ml-2">{cut.timestampStart}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-4">
            <Settings2 className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">TTS Settings</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="tts-voice" className="text-sm font-semibold text-slate-700 dark:text-slate-300">System Voice (Web Speech, on-device)</label>
              <select
                id="tts-voice"
                value={voiceURI}
                onChange={e => pickVoice(e.target.value)}
                disabled={!ttsSupported}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-accent min-h-[44px] disabled:opacity-40"
              >
                <option value="">System default voice</option>
                {voices.map(v => (
                  <option key={v.uri} value={v.uri}>{v.label}</option>
                ))}
              </select>
              <p className="text-xs text-slate-500 dark:text-slate-400">{voices.length > 0 ? `${voices.length} voices available on this device.` : 'No voices enumerated yet — they load with the browser speech engine.'}</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="tts-rate" className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex justify-between">
                <span>Speaking Rate</span>
                <span className="text-primary font-mono font-medium">{rate.toFixed(1)}x</span>
              </label>
              <input id="tts-rate" type="range" min="0.5" max="2" step="0.1" value={rate} onChange={e => setRate(Number(e.target.value))} disabled={!ttsSupported} className="w-full accent-primary disabled:opacity-40" />
            </div>

            <div className="space-y-2">
              <label htmlFor="tts-volume" className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex justify-between">
                <span>Master Volume</span>
                <span className="text-primary font-mono font-medium">{volume}%</span>
              </label>
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-slate-500" />
                <input id="tts-volume" type="range" min="0" max="100" value={volume} onChange={e => setVolume(Number(e.target.value))} disabled={!ttsSupported} className="w-full accent-primary disabled:opacity-40" />
              </div>
            </div>
          </div>

          <button
            onClick={downloadEDL}
            className="w-full py-3 bg-primary hover:opacity-90 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary shadow-md min-h-[44px]"
          >
            <Download className="w-4 h-4" />
            Export Voiceover Package (JSON)
          </button>

          <button
            onClick={recordNarration}
            className="w-full py-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold rounded-xl flex items-center justify-center gap-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent min-h-[44px]"
          >
            <Mic className="w-4 h-4" />
            {isRecording ? 'Stop narration recording' : 'Record Live Narration (tab capture)'}
          </button>

          {statusMsg && (
            <p aria-live="polite" className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{statusMsg}</p>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
