/**
 * Audio Engine for Arka Fincap Tamil Nadu Brand AV
 * Synthesizes:
 * - South Indian Solo Nadaswaram melody with microtonal gamakas
 * - Tanpura background drone (Sa-Pa resonance)
 * - Temple bells & metallic chimes
 * - Deep cinematic percussion & Mridangam rhythmic pulses
 * - Uplifting orchestral crescendo & brass swell
 * - Web Speech API Indian Male Voiceover with automatic audio ducking
 * - MediaStream destination for direct video recording
 */

export const INDIAN_PHONETIC_DICTIONARY: Record<string, string> = {
  'Vanakkam': 'Vah-nuh-kkum',
  'Tamil Nadu': 'Thuh-mil Nah-doo',
  'Kanchipuram': 'Kahn-chee-poo-rum',
  'Thiruvalluvar': 'Thiru-vallu-var',
  'Vivekananda': 'Vee-vay-kah-nun-dah',
  'Kuthuvilakku': 'Koo-thu-vi-la-kku',
  'Nadaswaram': 'Naah-dha-swuh-rum',
  'Mridangam': 'Mri-dhang-gum',
  'Samrat Gupta': 'Sum-raat Ghoop-tah',
  'Arka Fincap': 'Uhr-kah Fin-cap',
  'Arka': 'Uhr-kah',
  'Kirloskar': 'Keer-los-kur',
  'Aapka Apna': 'Aap-kah Up-nah',
  'Nandri': 'Nun-dree',
  'Kongu Nadu': 'Kong-gu Nah-doo',
};

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private streamDest: MediaStreamAudioDestinationNode | null = null;
  private isPlaying = false;
  private activeNodes: { stop: () => void }[] = [];
  private voiceoverUtterance: SpeechSynthesisUtterance | null = null;
  private voiceoverEnabled = true;
  private bgmEnabled = true;
  private cachedVoices: SpeechSynthesisVoice[] = [];
  private selectedVoiceURI: string | null = null;
  private keepAliveInterval: ReturnType<typeof setInterval> | null = null;
  private activeSpeakingSceneIndex: number = -1;
  private currentUtteranceId: number = 0;
  private speakingListener: ((status: { isSpeaking: boolean; currentText: string; sceneIndex: number }) => void) | null = null;
  private onSceneSpeechEndListener: ((sceneIndex: number) => void) | null = null;

  public isSceneCurrentlySpeaking(sceneIndex: number): boolean {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
    return window.speechSynthesis.speaking && this.activeSpeakingSceneIndex === sceneIndex;
  }

  public getActiveSpeakingSceneIndex(): number {
    return this.activeSpeakingSceneIndex;
  }

  constructor() {
    this.refreshVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        this.refreshVoices();
      };
    }
  }

  public setSpeakingListener(cb: ((status: { isSpeaking: boolean; currentText: string; sceneIndex: number }) => void) | null) {
    this.speakingListener = cb;
  }

  public setOnSceneSpeechEndListener(cb: ((sceneIndex: number) => void) | null) {
    this.onSceneSpeechEndListener = cb;
  }

  public isVoiceSpeaking(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking;
  }

  public refreshVoices(): SpeechSynthesisVoice[] {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.cachedVoices = window.speechSynthesis.getVoices();
    }
    return this.cachedVoices;
  }

  public getAvailableVoices() {
    this.refreshVoices();
    return this.cachedVoices.map((v) => {
      const nameLower = v.name.toLowerCase();
      const langLower = v.lang.toLowerCase();
      const isIndian =
        langLower.includes('en-in') ||
        langLower.includes('en_in') ||
        langLower.includes('hi-in') ||
        langLower.includes('ta-in') ||
        nameLower.includes('india') ||
        nameLower.includes('hindi') ||
        nameLower.includes('tamil');

      const femaleMarkers = [
        'female',
        'woman',
        'girl',
        'neerja',
        'veena',
        'swara',
        'zira',
        'samantha',
        'victoria',
        'karen',
        'susan',
        'catherine',
        'hazel',
        'eva',
        'fiona',
      ];
      const isFemale = femaleMarkers.some((m) => nameLower.includes(m));

      const maleMarkers = [
        'male',
        'man',
        'boy',
        'rishi',
        'ravi',
        'prabhat',
        'madhur',
        'karan',
        'hemant',
        'guy',
        'david',
        'daniel',
        'arthur',
        'george',
        'mark',
      ];
      const isExplicitMale = maleMarkers.some((m) => nameLower.includes(m));
      const isMale = isExplicitMale || (!isFemale && isIndian);

      const isRecommended = isIndian && isMale;

      return {
        voiceURI: v.voiceURI,
        name: v.name,
        lang: v.lang,
        isIndian,
        isMale,
        isRecommended,
      };
    });
  }

  public phoneticallyTranscribe(text: string): string {
    let processed = text;
    for (const [word, phonetic] of Object.entries(INDIAN_PHONETIC_DICTIONARY)) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      processed = processed.replace(regex, phonetic);
    }
    return processed;
  }

  public setSelectedVoiceURI(uri: string | null) {
    this.selectedVoiceURI = uri;
  }

  public resolveIndianMaleVoice(preferredURI?: string): SpeechSynthesisVoice | null {
    this.refreshVoices();
    if (this.cachedVoices.length === 0) return null;

    // 1. If explicit URI requested
    const targetURI = preferredURI || this.selectedVoiceURI;
    if (targetURI) {
      const found = this.cachedVoices.find((v) => v.voiceURI === targetURI);
      if (found) return found;
    }

    // 2. Score and pick best Indian Male Voice
    let bestVoice: SpeechSynthesisVoice | null = null;
    let highestScore = -999;

    const femaleMarkers = [
      'female',
      'woman',
      'neerja',
      'veena',
      'swara',
      'zira',
      'samantha',
      'victoria',
      'karen',
      'susan',
      'catherine',
      'hazel',
      'eva',
    ];

    const maleMarkers = [
      'male',
      'rishi',
      'ravi',
      'prabhat',
      'madhur',
      'karan',
      'hemant',
      'man',
    ];

    for (const v of this.cachedVoices) {
      const name = v.name.toLowerCase();
      const lang = v.lang.toLowerCase();
      let score = 0;

      const isIndianLang =
        lang.includes('en-in') ||
        lang.includes('en_in') ||
        lang.includes('hi-in') ||
        lang.includes('ta-in');

      if (isIndianLang) score += 150;
      if (name.includes('india')) score += 80;
      if (name.includes('rishi') || name.includes('prabhat') || name.includes('ravi')) score += 120;

      // Penalize female markers
      if (femaleMarkers.some((m) => name.includes(m))) {
        score -= 200;
      }

      // Boost male markers
      if (maleMarkers.some((m) => name.includes(m))) {
        score += 100;
      }

      // Preference for English
      if (lang.startsWith('en')) {
        score += 20;
      }

      if (score > highestScore) {
        highestScore = score;
        bestVoice = v;
      }
    }

    // Fallback: any male voice with baritone modulation
    if (!bestVoice) {
      bestVoice = this.cachedVoices.find((v) =>
        maleMarkers.some((m) => v.name.toLowerCase().includes(m))
      ) || this.cachedVoices[0] || null;
    }

    return bestVoice;
  }

  public stopVoiceover() {
    this.currentUtteranceId++;
    this.activeSpeakingSceneIndex = -1;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
    this.setBgmVolume(0.75);
    if (this.speakingListener) {
      this.speakingListener({ isSpeaking: false, currentText: '', sceneIndex: -1 });
    }
  }

  public playVoiceover(
    text: string,
    pitch = 0.84,
    rate = 0.90,
    preferredVoiceURI?: string,
    isSequentialTransition = false,
    sceneIndex = -1,
    onEnd?: () => void,
    volume = 0.8
  ) {
    if (!this.voiceoverEnabled || !('speechSynthesis' in window) || !text || !text.trim()) {
      this.activeSpeakingSceneIndex = -1;
      return;
    }

    // Generate unique flight ID to prevent race conditions & duplicate speaks
    this.currentUtteranceId++;
    const thisFlightId = this.currentUtteranceId;

    // Immediately stop any lingering previous utterance
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }

    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }

    const startSpeech = () => {
      // Verify this speech request is still the freshest
      if (thisFlightId !== this.currentUtteranceId) return;

      try {
        const voice = this.resolveIndianMaleVoice(preferredVoiceURI);
        const isIndian =
          voice &&
          (voice.lang.toLowerCase().includes('in') ||
            voice.name.toLowerCase().includes('india') ||
            voice.name.toLowerCase().includes('rishi') ||
            voice.name.toLowerCase().includes('prabhat') ||
            voice.name.toLowerCase().includes('ravi') ||
            voice.name.toLowerCase().includes('hindi') ||
            voice.name.toLowerCase().includes('tamil'));

        const spokenText = isIndian ? text : this.phoneticallyTranscribe(text);
        const utterance = new SpeechSynthesisUtterance(spokenText);
        this.voiceoverUtterance = utterance;
        this.activeSpeakingSceneIndex = sceneIndex;

        // Prevent Chrome garbage collection bug
        if (typeof window !== 'undefined') {
          (window as unknown as { __arkaUtterance: SpeechSynthesisUtterance }).__arkaUtterance = utterance;
        }

        if (voice) {
          utterance.voice = voice;
        }

        // Deep resonant corporate male narration
        utterance.pitch = Math.max(0.7, Math.min(1.2, pitch));
        utterance.rate = Math.max(0.75, Math.min(1.15, rate));
        utterance.volume = Math.max(0, Math.min(1, volume));

        // Audio ducking & state notification
        utterance.onstart = () => {
          if (thisFlightId !== this.currentUtteranceId) return;
          this.activeSpeakingSceneIndex = sceneIndex;
          this.setBgmVolume(0.25);
          if (this.speakingListener) {
            this.speakingListener({ isSpeaking: true, currentText: text, sceneIndex });
          }

          // Chrome keepalive heartbeat
          if (this.keepAliveInterval) clearInterval(this.keepAliveInterval);
          this.keepAliveInterval = setInterval(() => {
            if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
              if (window.speechSynthesis.speaking) {
                if (window.speechSynthesis.paused) {
                  window.speechSynthesis.resume();
                } else {
                  window.speechSynthesis.pause();
                  window.speechSynthesis.resume();
                }
              }
            }
          }, 3500);
        };

        utterance.onend = () => {
          if (thisFlightId !== this.currentUtteranceId) return;
          if (this.activeSpeakingSceneIndex === sceneIndex) {
            this.activeSpeakingSceneIndex = -1;
          }
          if (onEnd) onEnd();
          if (this.onSceneSpeechEndListener && sceneIndex !== -1) {
            this.onSceneSpeechEndListener(sceneIndex);
          }

          if (this.keepAliveInterval) {
            clearInterval(this.keepAliveInterval);
            this.keepAliveInterval = null;
          }
          this.setBgmVolume(0.75);
          if (this.speakingListener) {
            this.speakingListener({ isSpeaking: false, currentText: '', sceneIndex: -1 });
          }
        };

        utterance.onerror = (e) => {
          if (thisFlightId !== this.currentUtteranceId) return;
          if (this.activeSpeakingSceneIndex === sceneIndex) {
            this.activeSpeakingSceneIndex = -1;
          }
          if (onEnd) onEnd();
          if (this.onSceneSpeechEndListener && sceneIndex !== -1) {
            this.onSceneSpeechEndListener(sceneIndex);
          }
          if (e.error !== 'interrupted' && e.error !== 'canceled') {
            console.warn('Speech synthesis non-fatal error:', e.error);
          }

          if (this.keepAliveInterval) {
            clearInterval(this.keepAliveInterval);
            this.keepAliveInterval = null;
          }
          this.setBgmVolume(0.75);
          if (this.speakingListener) {
            this.speakingListener({ isSpeaking: false, currentText: '', sceneIndex: -1 });
          }
        };

        // If paused, unpause first
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('Speech synthesis execution error:', err);
      }
    };

    // Micro-delay ensures previous utterance is fully purged by Chrome
    setTimeout(startSpeech, 30);
  }

  public testVoice(
    sampleText = 'Vanakkam Tamil Nadu! A land where centuries of rich heritage seamlessly weave with unstoppable modern ambition. Arka Fincap welcomes you.',
    pitch = 0.84,
    rate = 0.88,
    preferredVoiceURI?: string
  ) {
    this.playVoiceover(sampleText, pitch, rate, preferredVoiceURI);
  }

  public init() {
    if (this.ctx) return;
    const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioCtxClass();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.85;

    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.value = 0.7;

    this.bgmGain.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    // Create stream destination for video recording
    this.streamDest = this.ctx.createMediaStreamDestination();
    this.masterGain.connect(this.streamDest);
  }

  public getAudioStream(): MediaStreamTrack | null {
    if (!this.streamDest) this.init();
    return this.streamDest?.stream.getAudioTracks()[0] || null;
  }

  public setBgmVolume(volume: number) {
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setTargetAtTime(Math.max(0, Math.min(1, volume)), this.ctx.currentTime, 0.05);
    }
  }

  public setVoiceoverEnabled(enabled: boolean) {
    this.voiceoverEnabled = enabled;
    if (!enabled && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  public setBgmEnabled(enabled: boolean) {
    this.bgmEnabled = enabled;
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setTargetAtTime(enabled ? 0.7 : 0, this.ctx.currentTime, 0.05);
    }
  }

  /**
   * Continuous, Gapless BGM synthesis spanning the entire video (Acts 1 through 6)
   */
  public startAct1Audio(startTimeOffset: number = 0, totalDuration: number = 105) {
    this.startContinuousBgm(startTimeOffset, totalDuration);
  }

  public startContinuousBgm(startTimeOffset: number = 0, totalDuration: number = 105) {
    this.stopBgmOnly();
    this.init();
    if (!this.ctx || !this.bgmGain) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.isPlaying = true;
    const now = this.ctx.currentTime;
    const offset = Math.max(0, startTimeOffset);

    // 1. Continuous Tanpura Drone (Sa-Pa resonance sustained through whole cut)
    this.playTanpuraDrone(now, offset, totalDuration);

    // 2. Act 1: Temple Bell at start
    if (offset < 1) {
      this.playTempleBell(now + (0 - offset));
    }

    // 3. Act 1: Nadaswaram Lead Melody (0:00 - 0:20)
    if (offset < 20) {
      this.playNadaswaramMelody(now, offset);
    }

    // 4. Act 1 / Act 2 Percussion & String Rise (10s to 42s)
    if (offset < 42) {
      this.playAct1And2Percussion(now, offset);
    }

    // 5. Act 3: Kirloskar Heritage Orchestral Swell & Bells (42s to 64s)
    if (offset < 64) {
      this.playAct3KirloskarHeritageScore(now, offset);
    }

    // 6. Act 4: AAA Fortress Strength Metallic Resonances (64s to 84s)
    if (offset < 84) {
      this.playAct4AAASafetyScore(now, offset);
    }

    // 7. Act 5: 333 Vision Driving Synthesizer Arpeggios (84s to 96s)
    if (offset < 96) {
      this.playAct5VisionScore(now, offset);
    }

    // 8. Act 6: Grand Finale & Signature Outro Chord (96s to 105s+)
    this.playAct6FinaleOutroScore(now, offset, totalDuration);
  }

  private playTanpuraDrone(now: number, offset: number, totalDuration: number) {
    if (!this.ctx || !this.bgmGain || !this.bgmEnabled) return;

    // Sa (C3 ~ 130.81Hz), Pa (G3 ~ 196.0Hz), High Sa (C4 ~ 261.63Hz)
    const freqs = [130.81, 196.0, 261.63];
    const duration = Math.max(10, totalDuration - offset + 5);

    freqs.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const filter = this.ctx!.createBiquadFilter();

      osc.type = idx === 1 ? 'triangle' : 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      // Subtle warm chorus detuning
      osc.detune.setValueAtTime(idx * 3 - 3, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320 + idx * 80, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.14 / freqs.length, now + 1.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.bgmGain!);

      osc.start(now);
      osc.stop(now + duration);

      this.activeNodes.push({
        stop: () => {
          try {
            gain.gain.setTargetAtTime(0, this.ctx!.currentTime, 0.08);
            osc.stop(this.ctx!.currentTime + 0.12);
          } catch {
            // ignore
          }
        },
      });
    });
  }

  private playTempleBell(time: number) {
    if (!this.ctx || !this.bgmGain || !this.bgmEnabled || time < this.ctx.currentTime) return;

    const partials = [520, 1140, 1580, 2180, 3100];
    partials.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      const amp = 0.15 / (i + 1);
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(amp, time + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 3.8);

      osc.connect(gain);
      gain.connect(this.bgmGain!);

      osc.start(time);
      osc.stop(time + 4.0);

      this.activeNodes.push({
        stop: () => {
          try {
            osc.stop();
          } catch {
            // ignore
          }
        },
      });
    });
  }

  private playNadaswaramMelody(now: number, offset: number) {
    if (!this.ctx || !this.bgmGain || !this.bgmEnabled) return;

    const melody = [
      { note: 261.63, t: 0.5, dur: 1.6 }, // Sa
      { note: 293.66, t: 2.2, dur: 0.8 }, // Ri
      { note: 329.63, t: 3.1, dur: 1.5 }, // Ga
      { note: 392.00, t: 4.8, dur: 1.8 }, // Pa
      { note: 440.00, t: 6.8, dur: 1.2 }, // Dha
      { note: 493.88, t: 8.1, dur: 1.1 }, // Ni
      { note: 523.25, t: 9.3, dur: 2.2 }, // Tara Sa
      { note: 440.00, t: 11.6, dur: 1.2 },
      { note: 392.00, t: 13.0, dur: 1.5 },
      { note: 349.23, t: 14.6, dur: 1.2 },
      { note: 329.63, t: 16.0, dur: 1.6 },
      { note: 261.63, t: 18.0, dur: 2.4 }, // Grand finale note
    ];

    melody.forEach((phrase) => {
      const startAt = now + (phrase.t - offset);
      if (startAt < now - phrase.dur) return;

      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const nadaswaramFilter = this.ctx!.createBiquadFilter();
      const formantFilter = this.ctx!.createBiquadFilter();

      osc.type = 'sawtooth';
      const actualStart = Math.max(now, startAt);
      const remainingDur = phrase.dur - (actualStart - startAt);
      if (remainingDur <= 0.05) return;

      osc.frequency.setValueAtTime(phrase.note * 0.98, actualStart);
      osc.frequency.exponentialRampToValueAtTime(phrase.note, actualStart + 0.15);

      nadaswaramFilter.type = 'bandpass';
      nadaswaramFilter.frequency.setValueAtTime(1450, actualStart);
      nadaswaramFilter.Q.setValueAtTime(3.8, actualStart);

      formantFilter.type = 'peaking';
      formantFilter.frequency.setValueAtTime(2800, actualStart);
      formantFilter.gain.setValueAtTime(6, actualStart);

      gain.gain.setValueAtTime(0.001, actualStart);
      gain.gain.linearRampToValueAtTime(0.22, actualStart + 0.08);
      gain.gain.setTargetAtTime(0.0001, actualStart + remainingDur - 0.05, 0.08);

      osc.connect(nadaswaramFilter);
      nadaswaramFilter.connect(formantFilter);
      formantFilter.connect(gain);
      gain.connect(this.bgmGain!);

      osc.start(actualStart);
      osc.stop(actualStart + remainingDur);

      this.activeNodes.push({
        stop: () => {
          try {
            osc.stop();
          } catch {
            // ignore
          }
        },
      });
    });
  }

  private playAct1And2Percussion(now: number, offset: number) {
    if (!this.ctx || !this.bgmGain || !this.bgmEnabled) return;

    // Rhythmic pulse across Acts 1 & 2
    for (let t = 10; t <= 42; t += 1.0) {
      const scheduled = now + (t - offset);
      if (scheduled < now) continue;

      const kickOsc = this.ctx!.createOscillator();
      const kickGain = this.ctx!.createGain();

      kickOsc.frequency.setValueAtTime(110, scheduled);
      kickOsc.frequency.exponentialRampToValueAtTime(45, scheduled + 0.14);

      kickGain.gain.setValueAtTime(0.22, scheduled);
      kickGain.gain.exponentialRampToValueAtTime(0.001, scheduled + 0.22);

      kickOsc.connect(kickGain);
      kickGain.connect(this.bgmGain!);

      kickOsc.start(scheduled);
      kickOsc.stop(scheduled + 0.25);

      this.activeNodes.push({
        stop: () => {
          try {
            kickOsc.stop();
          } catch {
            // ignore
          }
        },
      });
    }

    // Acoustic chord swells for Act 2
    const act2Start = now + Math.max(0, 20 - offset);
    if (offset < 42) {
      const chords = [196.0, 246.94, 293.66, 392.0]; // G Major warmth
      chords.forEach((note) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note, act2Start);

        gain.gain.setValueAtTime(0.001, act2Start);
        gain.gain.linearRampToValueAtTime(0.08, act2Start + 2.0);
        gain.gain.setValueAtTime(0.08, act2Start + Math.max(0, 40 - Math.max(20, offset)));
        gain.gain.linearRampToValueAtTime(0.001, act2Start + Math.max(0, 42 - Math.max(20, offset)));

        osc.connect(gain);
        gain.connect(this.bgmGain!);

        osc.start(act2Start);
        osc.stop(act2Start + 23);

        this.activeNodes.push({
          stop: () => {
            try {
              osc.stop();
            } catch {
              // ignore
            }
          },
        });
      });
    }
  }

  private playAct3KirloskarHeritageScore(now: number, offset: number) {
    if (!this.ctx || !this.bgmGain || !this.bgmEnabled) return;

    const startAt = now + Math.max(0, 42 - offset);
    const chords = [130.81, 164.81, 196.0, 261.63, 329.63]; // C Major rich heritage pad

    chords.forEach((note) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const filter = this.ctx!.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(note, startAt);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(380, startAt);
      filter.frequency.exponentialRampToValueAtTime(1400, startAt + 12);

      gain.gain.setValueAtTime(0.001, startAt);
      gain.gain.linearRampToValueAtTime(0.09, startAt + 3.0);
      gain.gain.setValueAtTime(0.09, startAt + 20);
      gain.gain.linearRampToValueAtTime(0.001, startAt + 22);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.bgmGain!);

      osc.start(startAt);
      osc.stop(startAt + 23);

      this.activeNodes.push({
        stop: () => {
          try {
            osc.stop();
          } catch {
            // ignore
          }
        },
      });
    });
  }

  private playAct4AAASafetyScore(now: number, offset: number) {
    if (!this.ctx || !this.bgmGain || !this.bgmEnabled) return;

    const startAt = now + Math.max(0, 64 - offset);

    // Metallic chime for AAA Rating at 64s
    if (offset <= 64) {
      this.playTempleBell(startAt);
    }

    // Confident, solid fortress bass notes
    const bassNotes = [65.41, 82.41, 98.0, 130.81]; // Deep C Power
    bassNotes.forEach((note) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note, startAt);

      gain.gain.setValueAtTime(0.001, startAt);
      gain.gain.linearRampToValueAtTime(0.12, startAt + 2.0);
      gain.gain.setValueAtTime(0.12, startAt + 18);
      gain.gain.linearRampToValueAtTime(0.001, startAt + 20);

      osc.connect(gain);
      gain.connect(this.bgmGain!);

      osc.start(startAt);
      osc.stop(startAt + 21);

      this.activeNodes.push({
        stop: () => {
          try {
            osc.stop();
          } catch {
            // ignore
          }
        },
      });
    });
  }

  private playAct5VisionScore(now: number, offset: number) {
    if (!this.ctx || !this.bgmGain || !this.bgmEnabled) return;

    const startAt = now + Math.max(0, 84 - offset);

    // Fast-driving tempo pulses for 333 Vision
    for (let t = 84; t <= 96; t += 0.5) {
      const scheduled = now + (t - offset);
      if (scheduled < now) continue;

      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(261.63 + ((t % 2) * 130), scheduled);

      gain.gain.setValueAtTime(0.08, scheduled);
      gain.gain.exponentialRampToValueAtTime(0.001, scheduled + 0.15);

      osc.connect(gain);
      gain.connect(this.bgmGain!);

      osc.start(scheduled);
      osc.stop(scheduled + 0.18);

      this.activeNodes.push({
        stop: () => {
          try {
            osc.stop();
          } catch {
            // ignore
          }
        },
      });
    }
  }

  private playAct6FinaleOutroScore(now: number, offset: number, totalDuration: number) {
    if (!this.ctx || !this.bgmGain || !this.bgmEnabled) return;

    const startAt = now + Math.max(0, 96 - offset);
    const chords = [130.81, 164.81, 196.0, 261.63, 329.63, 392.0, 523.25]; // Grand C Major Triumphant Outro

    chords.forEach((note, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = i % 2 === 0 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(note, startAt);

      gain.gain.setValueAtTime(0.001, startAt);
      gain.gain.linearRampToValueAtTime(0.12 / chords.length * 3, startAt + 1.5);
      gain.gain.setValueAtTime(0.12 / chords.length * 3, startAt + 6);
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 10);

      osc.connect(gain);
      gain.connect(this.bgmGain!);

      osc.start(startAt);
      osc.stop(startAt + 10.5);

      this.activeNodes.push({
        stop: () => {
          try {
            osc.stop();
          } catch {
            // ignore
          }
        },
      });
    });
  }

  public stopBgmOnly() {
    this.activeNodes.forEach((node) => {
      try {
        node.stop();
      } catch {
        // ignore
      }
    });
    this.activeNodes = [];
  }

  public stopAll() {
    this.isPlaying = false;
    this.stopBgmOnly();
    this.stopVoiceover();
  }
}

export const audioEngine = new AudioEngine();

