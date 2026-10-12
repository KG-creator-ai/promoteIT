import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useCampaignContext } from '../../context/CampaignContext';
import { GlassCard } from '../ui/GlassCard';
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Download, Camera, Mic, Music, Layers, Clock, Settings2, X
} from 'lucide-react';
import type { AVSceneNode } from '../../db/db';
import { VideoRenderer } from '../../services/videoRenderer';
import type { Scene, VideoSettings } from '../../types';
import { audioEngine } from '../../services/audioEngine';

interface AVVideoPlayerProps {
  onNavigate?: (view: string) => void;
}

interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  currentSceneIndex: number;
  volume: number;
  muted: boolean;
}

const CAMERA_MOTIONS: Record<string, { label: string; icon: string; color: string }> = {
  drone_sweep:    { label: 'Drone Sweep',    icon: '🚁', color: 'text-blue-400' },
  pan_right:      { label: 'Pan Right',      icon: '➡️', color: 'text-emerald-400' },
  macro_zoom:     { label: 'Macro Zoom',     icon: '🔍', color: 'text-amber-400' },
  orbital_sweep:  { label: 'Orbital Sweep',  icon: '🔄', color: 'text-purple-400' },
  slow_push_in:   { label: 'Slow Push In',   icon: '🎯', color: 'text-rose-400' },
  outro_reveal:   { label: 'Outro Reveal',   icon: '✨', color: 'text-cyan-400' },
  Static:         { label: 'Static',         icon: '📷', color: 'text-slate-400' },
};

function parseTimeToSeconds(timeStr: string): number {
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

function formatSeconds(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// ── SPEC-009: AVSceneNode → renderer Scene adapter (single scene renderer) ──
const MOTION_TO_RENDERER: Record<string, Scene['motionType']> = {
  drone_sweep: 'drone_sweep',
  pan_right: 'pan_right',
  macro_zoom: 'macro_zoom',
  orbital_sweep: 'orbital_sweep',
  slow_push_in: 'slow_push_in',
  outro_reveal: 'outro_reveal',
  Static: 'slow_push_in',
  'Static Center': 'slow_push_in',
};

const RENDER_SETTINGS: VideoSettings = {
  aspectRatio: '16:9',
  resolution: '1080p',
  voiceoverEnabled: true,
  voicePitch: 0.84,
  voiceRate: 0.9,
  voiceoverMode: 'seamless_full',
  bgmEnabled: true,
  bgmVolume: 0.7,
  showSubtitles: true,
  showLowerThird: false,
  showWatermark: false,
  colorGrade: 'cinematic_teal',
};

export function sceneToRendererScene(
  scene: AVSceneNode,
  idx: number,
  start: number,
  end: number,
  imageSrc: string,
): Scene {
  const motion = MOTION_TO_RENDERER[scene.cameraMovement] || 'slow_push_in';
  const isStatic = motion === 'slow_push_in' && (scene.cameraMovement === 'Static' || scene.cameraMovement === 'Static Center' || !scene.cameraMovement);
  return {
    id: scene.id || `scene-${idx}`,
    actNumber: idx + 1,
    actTitle: scene.actName || `Act ${idx + 1}`,
    sceneTitle: scene.actName || `Scene ${idx + 1}`,
    startTime: start,
    endTime: end,
    imageSrc,
    mediaType: imageSrc ? 'image' : undefined,
    motionType: motion,
    startScale: 1,
    endScale: isStatic ? 1 : 1.12,
    ostTag: scene.bgmCue || '',
    ostTitle: scene.bgmCue || '',
    aiPrompt: scene.visualDescription || '',
    voiceoverText: scene.voiceoverText || '',
    audioCues: scene.bgmCue || '',
  };
}

export function AVVideoPlayer({ onNavigate }: AVVideoPlayerProps) {
  const { activeCampaign, scenes, resources, updateCampaign } = useCampaignContext();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<VideoRenderer | null>(null);
  const animFrameRef = useRef<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const startTimeRef = useRef<number>(0);
  const [showShotEditor, setShowShotEditor] = useState(false);
  const [editingScene, setEditingScene] = useState<AVSceneNode | null>(null);

  const [state, setState] = useState<PlaybackState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    currentSceneIndex: 0,
    volume: 0.8,
    muted: false,
  });

  const totalDuration = scenes.reduce((acc, s) => {
    const start = parseTimeToSeconds(s.timeStart);
    const end = parseTimeToSeconds(s.timeEnd);
    return acc + (end - start);
  }, 0);

  // Calculate scene absolute start/end times
  const sceneTimeline = scenes.reduce<{ scene: AVSceneNode; start: number; end: number }[]>((acc, scene, i) => {
    const start = i === 0 ? 0 : acc[i - 1].end;
    const dur = parseTimeToSeconds(scene.timeEnd) - parseTimeToSeconds(scene.timeStart);
    acc.push({ scene, start, end: start + dur });
    return acc;
  }, []);

  const getCurrentSceneIndex = useCallback((time: number) => {
    for (let i = 0; i < sceneTimeline.length; i++) {
      if (time >= sceneTimeline[i].start && time < sceneTimeline[i].end) return i;
    }
    return sceneTimeline.length - 1;
  }, [sceneTimeline]);

  // SPEC-009: renderer Scene list (image resolution from linked image resources)
  const rendererScenes: Scene[] = useMemo(() => {
    return sceneTimeline.map((entry, i) => {
      let imageSrc = '';
      for (const rid of entry.scene.linkedResourceIds || []) {
        const res = resources.find(r => r.id === rid);
        if (res && (res.mimeType || '').startsWith('image/') && res.blobOrTextRef) {
          imageSrc = res.blobOrTextRef;
          break;
        }
      }
      return sceneToRendererScene(entry.scene, i, entry.start, entry.end, imageSrc);
    });
  }, [sceneTimeline, resources]);

  const seekTo = useCallback((time: number) => {
    setState(prev => ({
      ...prev,
      currentTime: Math.max(0, Math.min(time, totalDuration)),
      currentSceneIndex: getCurrentSceneIndex(Math.max(0, Math.min(time, totalDuration))),
    }));
  }, [totalDuration, getCurrentSceneIndex]);

  // Canvas rendering loop — scene drawing is owned by VideoRenderer (SPEC-009);
  // the player keeps transport overlays (badge, titles, voiceover, progress).
  const drawFrame = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Lazy renderer init (try/catch: jsdom/test envs have no 2D context).
    if (!rendererRef.current) {
      try {
        rendererRef.current = new VideoRenderer(canvas);
      } catch {
        rendererRef.current = null;
      }
    }

    if (rendererRef.current) {
      try {
        rendererRef.current.renderFrame(time, rendererScenes, RENDER_SETTINGS, totalDuration);
      } catch {
        // Fall through to overlays on a plain background.
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, w, h);
      }
    } else {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);
    }

    // Transport overlays (player-owned; scene pixels come from VideoRenderer).
    const idx = getCurrentSceneIndex(time);
    const entry = sceneTimeline[idx];
    if (!entry) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '24px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No scene data', w / 2, h / 2);
      return;
    }
    const scene = entry.scene;
    const motion = scene.cameraMovement || 'Static';
    const motionData = CAMERA_MOTIONS[motion] || CAMERA_MOTIONS.Static;

    // Scene index badge
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.roundRect(20, 20, 80, 32, 8);
    ctx.fill();
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 14px "Plus Jakarta Sans", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Scene ${idx + 1}/${scenes.length}`, 32, 42);

    // Act name
    ctx.fillStyle = '#f1f5f9';
    ctx.font = 'bold 28px "Cinzel", serif';
    ctx.textAlign = 'center';
    ctx.fillText(scene.actName || `Act ${idx + 1}`, w / 2, 70);

    // Visual description
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '16px "Plus Jakarta Sans", sans-serif';
    const desc = scene.visualDescription || '';
    const maxChars = Math.floor(w / 10);
    const truncated = desc.length > maxChars ? desc.slice(0, maxChars) + '…' : desc;
    ctx.fillText(truncated, w / 2, 100);

    // Camera movement indicator
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.beginPath();
    ctx.roundRect(w / 2 - 100, 115, 200, 28, 14);
    ctx.fill();
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`${motionData.icon}  ${motionData.label}`, w / 2, 133);

    // Voiceover text
    if (scene.voiceoverText) {
      const voY = h - 120;
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.roundRect(w * 0.1, voY - 10, w * 0.8, 60, 12);
      ctx.fill();
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'italic 14px "Plus Jakarta Sans", sans-serif';
      const voText = scene.voiceoverText;
      const voTruncated = voText.length > 80 ? voText.slice(0, 80) + '…' : voText;
      ctx.fillText(`"${voTruncated}"`, w / 2, voY + 15);
    }

    // Progress bar at bottom
    const barY = h - 30;
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(20, barY, w - 40, 4);
    ctx.fillStyle = '#19988b';
    ctx.fillRect(20, barY, (w - 40) * (time / Math.max(totalDuration, 1)), 4);

    // Time display
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${formatSeconds(time)} / ${formatSeconds(totalDuration)}`, w - 20, barY - 6);
  }, [scenes, sceneTimeline, rendererScenes, totalDuration, getCurrentSceneIndex]);

  // Playback loop
  useEffect(() => {
    if (!state.isPlaying) {
      cancelAnimationFrame(animFrameRef.current);
      return;
    }

    startTimeRef.current = performance.now() - state.currentTime * 1000;

    const tick = (now: number) => {
      const elapsed = (now - startTimeRef.current) / 1000;
      if (elapsed >= totalDuration) {
        setState(prev => ({ ...prev, isPlaying: false, currentTime: totalDuration }));
        return;
      }
      setState(prev => ({
        ...prev,
        currentTime: elapsed,
        currentSceneIndex: getCurrentSceneIndex(elapsed),
      }));
      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [state.isPlaying, totalDuration, getCurrentSceneIndex]);

  // Canvas draw on state change
  useEffect(() => {
    drawFrame(state.currentTime);
  }, [state.currentTime, drawFrame]);

  // Audio: generate simple tones for BGM cues
  const playTone = useCallback((freq: number, duration: number) => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(state.volume * 0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  }, [state.volume]);

  const togglePlay = () => {
    if (state.currentTime >= totalDuration) {
      seekTo(0);
    }
    setState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const skipForward = () => {
    const nextIdx = Math.min(state.currentSceneIndex + 1, sceneTimeline.length - 1);
    seekTo(sceneTimeline[nextIdx]?.start || 0);
  };

  const skipBack = () => {
    const prevIdx = Math.max(state.currentSceneIndex - 1, 0);
    seekTo(sceneTimeline[prevIdx]?.start || 0);
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    seekTo(pct * totalDuration);
  };

  const handleSceneDurationUpdate = async (sceneId: string, newTimeEnd: string) => {
    if (!activeCampaign?.id) return;
    const updated = scenes.map(s => s.id === sceneId ? { ...s, timeEnd: newTimeEnd } : s);
    await updateCampaign(activeCampaign.id, { sceneGraph: updated });
  };

  const handleCameraUpdate = async (sceneId: string, newCamera: string) => {
    if (!activeCampaign?.id) return;
    const updated = scenes.map(s => s.id === sceneId ? { ...s, cameraMovement: newCamera } : s);
    await updateCampaign(activeCampaign.id, { sceneGraph: updated });
  };

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const stream = canvas.captureStream(30);
    // SPEC-009: mix the BGM bus so the export carries real audio.
    try {
      const audioTrack = audioEngine.getAudioStream();
      if (audioTrack) stream.addTrack(audioTrack);
    } catch {
      // Audio bus unavailable — video-only export still proceeds.
    }
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
    const chunks: Blob[] = [];
    recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeCampaign?.title || 'AV'}_Preview.webm`;
      a.click();
      URL.revokeObjectURL(url);
    };

    // Record full playback
    seekTo(0);
    setState(prev => ({ ...prev, isPlaying: true }));
    recorder.start();

    const checkEnd = setInterval(() => {
      if (state.currentTime >= totalDuration || !state.isPlaying) {
        clearInterval(checkEnd);
        recorder.stop();
        setState(prev => ({ ...prev, isPlaying: false }));
      }
    }, 100);
  };

  if (!activeCampaign || scenes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-slate-400">
        <Layers className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">No campaign scenes to preview</p>
        <p className="text-sm mt-1">Create a campaign with scenes in the Wizard or Script Studio.</p>
        {onNavigate && (
          <button onClick={() => onNavigate('projects')} className="mt-4 px-4 py-2 min-h-[44px] bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors">
            Go to Projects
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-slate-900 dark:text-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">AV Video Player</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 flex items-center gap-2">
            {activeCampaign.title}
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center gap-1">
              <Layers className="w-3 h-3" /> {scenes.length} Scenes
            </span>
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowShotEditor(!showShotEditor)}
            className={`px-4 py-2 min-h-[44px] rounded-lg font-medium flex items-center justify-center gap-2 shadow-sm transition-colors border ${
              showShotEditor
                ? 'bg-primary/10 text-primary border-primary/30'
                : 'bg-slate-200/50 dark:bg-slate-800/50 border-slate-300/50 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            <Settings2 className="w-4 h-4" />
            <span className="hidden sm:inline">Shot Editor</span>
          </button>
          <button
            onClick={handleExport}
            className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 px-4 py-2 min-h-[44px] rounded-lg font-medium flex items-center justify-center gap-2 shadow-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export .webm</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Canvas Player */}
        <div className="lg:col-span-3 space-y-4">
          <GlassCard className="overflow-hidden">
            <canvas
              ref={canvasRef}
              width={1280}
              height={720}
              className="w-full aspect-video bg-slate-900 rounded-t-3xl"
              onClick={togglePlay}
            />
            
            {/* Transport Controls */}
            <div className="p-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-white/10">
              {/* Timeline Scrubber */}
              <div 
                className="w-full h-8 bg-slate-200 dark:bg-slate-800 rounded-full cursor-pointer relative mb-3 group"
                onClick={handleTimelineClick}
              >
                {/* Scene markers */}
                {sceneTimeline.map((entry, i) => {
                  const leftPct = (entry.start / Math.max(totalDuration, 1)) * 100;
                  const widthPct = ((entry.end - entry.start) / Math.max(totalDuration, 1)) * 100;
                  return (
                    <div
                      key={i}
                      className="absolute top-0 h-full rounded-full opacity-20 group-hover:opacity-40 transition-opacity"
                      style={{
                        left: `${leftPct}%`,
                        width: `${widthPct}%`,
                        backgroundColor: i % 2 === 0 ? '#19988b' : '#c37c5b',
                      }}
                    />
                  );
                })}
                {/* Playhead */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-primary z-10 transition-all"
                  style={{ left: `${(state.currentTime / Math.max(totalDuration, 1)) * 100}%` }}
                />
              </div>

              {/* Transport buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button onClick={skipBack} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-primary rounded-lg transition-colors" aria-label="Skip back">
                    <SkipBack className="w-5 h-5" />
                  </button>
                  <button onClick={togglePlay} className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center bg-primary text-white rounded-full hover:bg-primary/90 transition-colors shadow-md" aria-label={state.isPlaying ? 'Pause' : 'Play'}>
                    {state.isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </button>
                  <button onClick={skipForward} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-primary rounded-lg transition-colors" aria-label="Skip forward">
                    <SkipForward className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                    {formatSeconds(state.currentTime)} / {formatSeconds(totalDuration)}
                  </span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setState(prev => ({ ...prev, muted: !prev.muted }))} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-500 hover:text-primary rounded-lg transition-colors" aria-label={state.muted ? 'Unmute' : 'Mute'}>
                      {state.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={state.muted ? 0 : state.volume}
                      onChange={e => setState(prev => ({ ...prev, volume: Number(e.target.value), muted: false }))}
                      className="w-20 accent-primary"
                      aria-label="Volume"
                    />
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Sidebar: Scene List + Shot Editor */}
        <div className="space-y-4">
          <GlassCard className="p-4">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Scene Timeline
            </h3>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {sceneTimeline.map((entry, i) => {
                const isActive = state.currentSceneIndex === i;
                const cam = CAMERA_MOTIONS[entry.scene.cameraMovement] || CAMERA_MOTIONS.Static;
                return (
                  <button
                    key={entry.scene.id || i}
                    onClick={() => seekTo(entry.start)}
                    className={`w-full text-left p-3 rounded-xl transition-all border ${
                      isActive
                        ? 'bg-primary/10 border-primary/30 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[11px] font-bold uppercase tracking-wide ${isActive ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`}>
                        {entry.scene.actName || `Scene ${i + 1}`}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {formatSeconds(entry.start)} – {formatSeconds(entry.end)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">{entry.scene.visualDescription}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className={`text-[10px] ${cam.color}`}>{cam.icon}</span>
                      <span className="text-[10px] text-slate-400">{cam.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </GlassCard>

          {/* Shot Editor Panel */}
          {showShotEditor && editingScene && (
            <GlassCard className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-primary" /> Shot Editor
                </h3>
                <button onClick={() => { setShowShotEditor(false); setEditingScene(null); }} className="p-1 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg" aria-label="Close editor">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Camera Movement</label>
                  <select
                    value={editingScene.cameraMovement}
                    onChange={e => {
                      const val = e.target.value;
                      setEditingScene({ ...editingScene, cameraMovement: val });
                      handleCameraUpdate(editingScene.id, val);
                    }}
                    className="w-full mt-1 bg-slate-100 dark:bg-slate-800/50 border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 min-h-[44px] text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {Object.entries(CAMERA_MOTIONS).map(([key, val]) => (
                      <option key={key} value={key}>{val.icon} {val.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">End Time</label>
                  <input
                    type="text"
                    value={editingScene.timeEnd}
                    onChange={e => {
                      const val = e.target.value;
                      setEditingScene({ ...editingScene, timeEnd: val });
                    }}
                    onBlur={() => editingScene && handleSceneDurationUpdate(editingScene.id, editingScene.timeEnd)}
                    className="w-full mt-1 bg-slate-100 dark:bg-slate-800/50 border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 min-h-[44px] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="MM:SS"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Voiceover</label>
                  <textarea
                    value={editingScene.voiceoverText}
                    onChange={e => setEditingScene({ ...editingScene, voiceoverText: e.target.value })}
                    onBlur={() => {
                      if (activeCampaign?.id && editingScene) {
                        const updated = scenes.map(s => s.id === editingScene.id ? editingScene : s);
                        updateCampaign(activeCampaign.id, { sceneGraph: updated });
                      }
                    }}
                    className="w-full mt-1 bg-slate-100 dark:bg-slate-800/50 border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    rows={3}
                  />
                </div>
              </div>
            </GlassCard>
          )}

          {!showShotEditor && (
            <GlassCard className="p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                Click <strong>Shot Editor</strong> to adjust scene durations, camera movements, and voiceover text.
              </p>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}
