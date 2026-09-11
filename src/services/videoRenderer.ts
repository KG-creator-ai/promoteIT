import { Scene, VideoSettings } from '../types';

export class VideoRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private loadedImages: Map<string, HTMLImageElement> = new Map();
  private loadedVideos: Map<string, HTMLVideoElement> = new Map();
  private isPreloaded = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Canvas 2D context not available');
    this.ctx = context;
  }

  public getVideoElement(src: string): HTMLVideoElement {
    let video = this.loadedVideos.get(src);
    if (!video) {
      video = document.createElement('video');
      video.src = src;
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.playsInline = true;
      video.preload = 'auto';
      video.loop = true;
      video.load();
      this.loadedVideos.set(src, video);
    }
    return video;
  }

  public pauseAllVideos(): void {
    this.loadedVideos.forEach((video) => {
      if (!video.paused) {
        video.pause();
      }
    });
  }

  public syncVideoPlayback(currentTime: number, isPlaying: boolean, scenes: Scene[]): void {
    const curScene = scenes.find((s) => currentTime >= s.startTime && currentTime <= s.endTime);
    if (curScene && curScene.videoSrc) {
      const video = this.getVideoElement(curScene.videoSrc);
      const sceneElapsed = currentTime - curScene.startTime;
      const targetTime = video.duration ? sceneElapsed % video.duration : sceneElapsed;

      if (Math.abs(video.currentTime - targetTime) > 0.35) {
        video.currentTime = targetTime;
      }

      if (isPlaying) {
        if (video.paused) {
          video.play().catch(() => {});
        }
      } else {
        if (!video.paused) {
          video.pause();
        }
      }
    } else {
      this.pauseAllVideos();
    }
  }

  public async preloadImages(scenes: Scene[]): Promise<void> {
    const imagePromises = scenes.map((scene) => {
      if (scene.videoSrc) {
        this.getVideoElement(scene.videoSrc);
      }
      if (this.loadedImages.has(scene.imageSrc)) {
        return Promise.resolve();
      }
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          this.loadedImages.set(scene.imageSrc, img);
          resolve();
        };
        img.onerror = () => {
          console.warn(`Failed to load image: ${scene.imageSrc}`);
          resolve();
        };
        img.src = scene.imageSrc;
      });
    });

    await Promise.all(imagePromises);
    this.isPreloaded = true;
  }

  public renderFrame(
    currentTime: number,
    scenes: Scene[],
    settings: VideoSettings,
    totalDuration: number
  ): void {
    const width = this.canvas.width;
    const height = this.canvas.height;
    const ctx = this.ctx;

    // Clear canvas
    ctx.fillStyle = '#062A30'; // Dark Teal fallback
    ctx.fillRect(0, 0, width, height);

    // Find current scene
    const currentSceneIndex = scenes.findIndex(
      (s) => currentTime >= s.startTime && currentTime <= s.endTime
    );

    if (currentSceneIndex === -1 && currentTime >= totalDuration) {
      // Outro state
      this.drawOutroFrame(width, height, currentTime - totalDuration);
      return;
    }

    const activeIndex = currentSceneIndex !== -1 ? currentSceneIndex : 0;
    const scene = scenes[activeIndex];
    if (!scene) return;

    // Check if cross-fading to next scene
    const transitionDuration = 0.6; // 600ms cross-fade
    const sceneDuration = scene.endTime - scene.startTime;
    const sceneElapsed = currentTime - scene.startTime;
    const timeRemaining = scene.endTime - currentTime;

    const nextScene = scenes[activeIndex + 1];

    if (timeRemaining < transitionDuration && nextScene) {
      // Cross-fade blend
      const fadeRatio = 1.0 - timeRemaining / transitionDuration;
      // Draw base (current scene)
      this.drawSceneImage(scene, sceneElapsed, sceneDuration, width, height, 1.0);
      // Draw incoming next scene on top with alpha
      this.drawSceneImage(nextScene, 0, nextScene.endTime - nextScene.startTime, width, height, fadeRatio);
    } else {
      // Normal single scene draw
      this.drawSceneImage(scene, sceneElapsed, sceneDuration, width, height, 1.0);
    }

    // Color Grading / Cinematic lighting enhancement
    if (settings.colorGrade === 'golden_hour') {
      const grad = ctx.createRadialGradient(width * 0.7, height * 0.3, 50, width * 0.5, height * 0.5, width * 0.8);
      grad.addColorStop(0, 'rgba(255, 185, 100, 0.16)'); // warm golden sunlight
      grad.addColorStop(0.6, 'rgba(195, 124, 91, 0.08)'); // copper warmth
      grad.addColorStop(1, 'rgba(6, 42, 48, 0.22)'); // teal edge depth
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    } else if (settings.colorGrade === 'cinematic_teal') {
      ctx.fillStyle = 'rgba(6, 42, 48, 0.12)';
      ctx.fillRect(0, 0, width, height);
    }

    // Subtle cinematic vignette
    const vignette = ctx.createRadialGradient(width / 2, height / 2, height * 0.4, width / 2, height / 2, width * 0.75);
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.38)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);

    // Overlays
    if (settings.showWatermark) {
      this.drawWatermark(width, height);
    }

    if (settings.showLowerThird && scene.ostTag) {
      this.drawLowerThird(scene.ostTag, scene.ostTitle, width, height, sceneElapsed);
    }

    if (settings.showSubtitles && scene.voiceoverText) {
      this.drawSubtitles(scene.voiceoverText, width, height);
    }
  }

  private drawSceneImage(
    scene: Scene,
    elapsed: number,
    duration: number,
    width: number,
    height: number,
    alpha: number
  ): void {
    const ctx = this.ctx;

    // Check if scene has video source
    if (scene.videoSrc) {
      const video = this.getVideoElement(scene.videoSrc);
      if (video && video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
        ctx.save();
        ctx.globalAlpha = alpha;

        const vAspect = video.videoWidth / video.videoHeight;
        const canvasAspect = width / height;
        let sx = 0;
        let sy = 0;
        let sWidth = video.videoWidth;
        let sHeight = video.videoHeight;

        if (vAspect > canvasAspect) {
          sWidth = video.videoHeight * canvasAspect;
          sx = (video.videoWidth - sWidth) / 2;
        } else {
          sHeight = video.videoWidth / canvasAspect;
          sy = (video.videoHeight - sHeight) / 2;
        }

        ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, width, height);
        ctx.restore();
        return;
      }
    }

    let img = this.loadedImages.get(scene.imageSrc);

    if (!img) {
      // On-demand load for newly assigned or uploaded images
      img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = scene.imageSrc;
      this.loadedImages.set(scene.imageSrc, img);
    }

    if (!img.complete || img.naturalWidth === 0) {
      // Fallback background while image loads
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#062A30';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#C37C5B';
      ctx.font = `600 ${height * 0.04}px 'Plus Jakarta Sans', sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(scene.sceneTitle, width / 2, height / 2);
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.globalAlpha = alpha;

    // Ken Burns Calculation (Smooth cosine easing)
    const progress = Math.min(1, Math.max(0, elapsed / duration));
    const easeProgress = 0.5 * (1 - Math.cos(Math.PI * progress));

    const currentScale = scene.startScale + (scene.endScale - scene.startScale) * easeProgress;

    // Calculate source crop or canvas transformation
    const imgAspect = img.naturalWidth / img.naturalHeight;
    const canvasAspect = width / height;

    let baseW = img.naturalWidth;
    let baseH = img.naturalHeight;

    if (imgAspect > canvasAspect) {
      baseW = img.naturalHeight * canvasAspect;
    } else {
      baseH = img.naturalWidth / canvasAspect;
    }

    const cropW = baseW / currentScale;
    const cropH = baseH / currentScale;

    // Pan calculation
    let cropX = (img.naturalWidth - cropW) / 2;
    let cropY = (img.naturalHeight - cropH) / 2;

    if (scene.panDirection === 'left_to_right') {
      const maxPanX = Math.max(0, img.naturalWidth - cropW);
      cropX = maxPanX * (0.2 + 0.6 * easeProgress);
    } else if (scene.panDirection === 'right_to_left') {
      const maxPanX = Math.max(0, img.naturalWidth - cropW);
      cropX = maxPanX * (0.8 - 0.6 * easeProgress);
    } else if (scene.panDirection === 'bottom_to_top') {
      const maxPanY = Math.max(0, img.naturalHeight - cropH);
      cropY = maxPanY * (0.8 - 0.6 * easeProgress);
    }

    ctx.drawImage(
      img,
      Math.max(0, cropX),
      Math.max(0, cropY),
      Math.min(img.naturalWidth, cropW),
      Math.min(img.naturalHeight, cropH),
      0,
      0,
      width,
      height
    );

    ctx.restore();
  }

  private drawLowerThird(
    tag: string,
    title: string,
    width: number,
    height: number,
    elapsed: number
  ): void {
    const ctx = this.ctx;
    ctx.save();

    // Slide-in entrance animation
    const enterTime = 0.5;
    const slideOffset = elapsed < enterTime ? (1 - elapsed / enterTime) * 80 : 0;
    const opacity = Math.min(1, elapsed / enterTime);

    ctx.globalAlpha = opacity;

    const boxW = width * 0.86;
    const boxH = height * 0.13;
    const x = width * 0.07;
    const y = height * 0.83 + slideOffset;
    const radius = 10;

    // Dark Teal translucent background (#062A30 at 90% opacity)
    ctx.fillStyle = 'rgba(6, 42, 48, 0.92)';
    ctx.beginPath();
    ctx.roundRect(x, y, boxW, boxH, radius);
    ctx.fill();

    // Subtle copper border
    ctx.strokeStyle = 'rgba(195, 124, 91, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Dual Brand Accent Bars: Copper (#C37C5B) top half, Teal (#19988B) bottom half
    ctx.fillStyle = '#C37C5B';
    ctx.beginPath();
    ctx.roundRect(x, y, 7, boxH * 0.5, [radius, 0, 0, 0]);
    ctx.fill();

    ctx.fillStyle = '#19988B';
    ctx.beginPath();
    ctx.roundRect(x, y + boxH * 0.5, 7, boxH * 0.5, [0, 0, 0, radius]);
    ctx.fill();

    // Tag text (Copper #C37C5B) with Teal bullet
    const tagSize = Math.max(14, Math.round(height * 0.026));
    ctx.fillStyle = '#E1966E';
    ctx.font = `700 ${tagSize}px 'Cinzel', serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(tag.toUpperCase(), x + 28, y + boxH * 0.20);

    // Title text (Pure White)
    const titleSize = Math.max(13, Math.round(height * 0.028));
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `600 ${titleSize}px 'Plus Jakarta Sans', sans-serif`;
    ctx.fillText(title, x + 28, y + boxH * 0.56);

    ctx.restore();
  }

  private drawSubtitles(text: string, width: number, height: number): void {
    if (!text || !text.trim()) return;
    const ctx = this.ctx;
    ctx.save();

    const fontSize = Math.max(13, Math.round(height * 0.024));
    ctx.font = `600 ${fontSize}px 'Plus Jakarta Sans', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Word wrap into lines
    const words = text.split(' ');
    const maxLineW = Math.min(width * 0.82, 900);
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = ctx.measureText(testLine).width;
      if (testWidth > maxLineW && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);

    // Limit to max 3 lines per display card
    const displayLines = lines.slice(0, 3);
    const lineHeight = fontSize * 1.45;
    const totalTextH = displayLines.length * lineHeight;
    const paddingX = 24;
    const paddingY = 10;
    const maxLineWidth = Math.max(...displayLines.map((l) => ctx.measureText(l).width));
    const pillW = Math.min(width * 0.88, maxLineWidth + paddingX * 2);
    const pillH = totalTextH + paddingY * 2;
    const pillX = (width - pillW) / 2;
    const pillY = height * 0.72 - pillH / 2;

    // Dark pill background with Teal border (#041D22 at 92% opacity)
    ctx.fillStyle = 'rgba(4, 29, 34, 0.92)';
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, 8);
    ctx.fill();

    ctx.strokeStyle = 'rgba(25, 152, 139, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Top copper accent bar on pill
    ctx.fillStyle = '#C37C5B';
    ctx.beginPath();
    ctx.roundRect(pillX + 16, pillY, Math.min(48, pillW - 32), 2, 1);
    ctx.fill();

    // Subtitle text lines with shadow
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 4;

    displayLines.forEach((line, idx) => {
      const lineY = pillY + paddingY + (idx + 0.5) * lineHeight;
      ctx.fillText(line, width / 2, lineY, pillW - 20);
    });

    ctx.restore();
  }

  private drawWatermark(width: number, height: number): void {
    const ctx = this.ctx;
    ctx.save();

    // Top Right Brand Lockup
    const topMargin = 22;
    const rightMargin = 22;
    const emblemRadius = Math.round(height * 0.022);
    const emblemCenterY = topMargin + emblemRadius;
    const textStartX = width - rightMargin - emblemRadius * 2 - 12;

    // Draw Arka dual chevron emblem on canvas
    const emblemCenterX = width - rightMargin - emblemRadius;
    ctx.save();
    ctx.beginPath();
    ctx.arc(emblemCenterX, emblemCenterY, emblemRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#062A30';
    ctx.fill();
    ctx.strokeStyle = '#C37C5B';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Copper left wing
    ctx.fillStyle = '#C37C5B';
    ctx.beginPath();
    ctx.moveTo(emblemCenterX - emblemRadius * 0.5, emblemCenterY + emblemRadius * 0.4);
    ctx.lineTo(emblemCenterX - emblemRadius * 0.05, emblemCenterY - emblemRadius * 0.5);
    ctx.lineTo(emblemCenterX + emblemRadius * 0.15, emblemCenterY - emblemRadius * 0.2);
    ctx.lineTo(emblemCenterX - emblemRadius * 0.2, emblemCenterY + emblemRadius * 0.4);
    ctx.closePath();
    ctx.fill();

    // Teal right wing
    ctx.fillStyle = '#19988B';
    ctx.beginPath();
    ctx.moveTo(emblemCenterX + emblemRadius * 0.05, emblemCenterY - emblemRadius * 0.1);
    ctx.lineTo(emblemCenterX + emblemRadius * 0.5, emblemCenterY + emblemRadius * 0.45);
    ctx.lineTo(emblemCenterX + emblemRadius * 0.25, emblemCenterY + emblemRadius * 0.45);
    ctx.lineTo(emblemCenterX - emblemRadius * 0.05, emblemCenterY - emblemRadius * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // ARKA FINCAP text
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';

    ctx.font = `800 ${Math.round(height * 0.024)}px 'Plus Jakarta Sans', sans-serif`;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('ARKA ', textStartX - 50, topMargin);
    ctx.fillStyle = '#C37C5B';
    ctx.fillText('FINCAP', textStartX, topMargin);

    // Kirloskar Lineage
    ctx.font = `600 ${Math.round(height * 0.015)}px 'Plus Jakarta Sans', sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillText('A KIRLOSKAR ENTERPRISE', textStartX, topMargin + height * 0.028);

    // AAA Rating Badge Top Left
    ctx.textAlign = 'left';
    const lx = 24;
    const ly = 24;
    const badgeW = width * 0.19;
    const badgeH = height * 0.045;

    ctx.fillStyle = 'rgba(6, 42, 48, 0.85)';
    ctx.beginPath();
    ctx.roundRect(lx, ly, badgeW, badgeH, 6);
    ctx.fill();

    ctx.strokeStyle = 'rgba(25, 152, 139, 0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#E1966E';
    ctx.font = `700 ${Math.round(height * 0.017)}px 'Plus Jakarta Sans', sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.fillText('★ AAA RATED', lx + 10, ly + badgeH / 2);

    ctx.fillStyle = '#19988B';
    ctx.font = `700 ${Math.round(height * 0.015)}px 'Plus Jakarta Sans', sans-serif`;
    ctx.fillText('CRISIL & ICRA', lx + 10 + width * 0.088, ly + badgeH / 2);

    ctx.restore();
  }

  public drawOutroFrame(width: number, height: number, elapsed: number = 0): void {
    const ctx = this.ctx;
    ctx.save();

    // Dark Teal Background (#062A30)
    ctx.fillStyle = '#062A30';
    ctx.fillRect(0, 0, width, height);

    // Vignette
    const vignette = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, width * 0.7);
    vignette.addColorStop(0, 'rgba(10, 55, 63, 0.9)');
    vignette.addColorStop(1, 'rgba(4, 25, 29, 0.98)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);

    // Outer borders in Copper (#C37C5B) and inner border in Teal (#19988B)
    ctx.strokeStyle = '#C37C5B';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(36, 36, width - 72, height - 72);

    ctx.strokeStyle = 'rgba(25, 152, 139, 0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(46, 46, width - 92, height - 92);

    // Centered Content
    ctx.textAlign = 'center';

    // 0. Arka Emblem (Dual Chevrons: Copper & Teal)
    const emblemR = Math.round(height * 0.055);
    const emY = height * 0.14;
    ctx.save();
    ctx.beginPath();
    ctx.arc(width / 2, emY, emblemR, 0, Math.PI * 2);
    ctx.fillStyle = '#031518';
    ctx.fill();
    ctx.strokeStyle = '#C37C5B';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Copper left chevron
    ctx.fillStyle = '#C37C5B';
    ctx.beginPath();
    ctx.moveTo(width / 2 - emblemR * 0.5, emY + emblemR * 0.45);
    ctx.lineTo(width / 2 - emblemR * 0.05, emY - emblemR * 0.55);
    ctx.lineTo(width / 2 + emblemR * 0.15, emY - emblemR * 0.2);
    ctx.lineTo(width / 2 - emblemR * 0.2, emY + emblemR * 0.45);
    ctx.closePath();
    ctx.fill();

    // Teal right chevron
    ctx.fillStyle = '#19988B';
    ctx.beginPath();
    ctx.moveTo(width / 2 + emblemR * 0.05, emY - emblemR * 0.15);
    ctx.lineTo(width / 2 + emblemR * 0.55, emY + emblemR * 0.5);
    ctx.lineTo(width / 2 + emblemR * 0.25, emY + emblemR * 0.5);
    ctx.lineTo(width / 2 - emblemR * 0.05, emY - emblemR * 0.45);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 1. ARKA FINCAP LIMITED
    const titleSize = Math.round(height * 0.06);
    ctx.font = `800 ${titleSize}px 'Plus Jakarta Sans', sans-serif`;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('ARKA FINCAP LIMITED', width / 2, height * 0.26);

    // 2. Arka — Aapka Apna Kirloskar
    const subSize = Math.round(height * 0.035);
    ctx.font = `600 ${subSize}px 'Playfair Display', serif`;
    ctx.fillStyle = '#E1966E';
    ctx.fillText('Arka — Aapka Apna Kirloskar', width / 2, height * 0.34);

    // Brand Colors Accent Strip (Copper #C37C5B + Teal #19988B)
    ctx.strokeStyle = '#C37C5B';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 160, height * 0.39);
    ctx.lineTo(width / 2, height * 0.39);
    ctx.stroke();

    ctx.strokeStyle = '#19988B';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(width / 2, height * 0.39);
    ctx.lineTo(width / 2 + 160, height * 0.39);
    ctx.stroke();

    // 3. PART OF THE 130+ YEAR KIRLOSKAR GROUP
    const lineageSize = Math.round(height * 0.024);
    ctx.font = `700 ${lineageSize}px 'Plus Jakarta Sans', sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillText('PART OF THE 130+ YEAR KIRLOSKAR GROUP', width / 2, height * 0.45);

    // 4. AAA RATED BY CRISIL & ICRA
    const aaaSize = Math.round(height * 0.026);
    ctx.font = `800 ${aaaSize}px 'Plus Jakarta Sans', sans-serif`;
    ctx.fillStyle = '#19988B';
    ctx.fillText('★ AAA RATED BY CRISIL & ICRA — HIGHEST SAFETY ★', width / 2, height * 0.53);

    // 5. Products
    const prodSize = Math.round(height * 0.023);
    ctx.font = `500 ${prodSize}px 'Plus Jakarta Sans', sans-serif`;
    ctx.fillStyle = '#E2E8F0';
    ctx.fillText(
      'MSME Business Loans  |  SME Finance  |  Corporate & Structured Credit',
      width / 2,
      height * 0.62
    );

    // 6. Regional Call
    const sloganSize = Math.round(height * 0.025);
    ctx.font = `600 ${sloganSize}px 'Plus Jakarta Sans', sans-serif`;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('Fueling the Spirit of Enterprise Across Tamil Nadu', width / 2, height * 0.71);

    // 7. Footer / Website
    const footSize = Math.round(height * 0.020);
    ctx.font = `500 ${footSize}px 'Plus Jakarta Sans', sans-serif`;
    ctx.fillStyle = '#94A3B8';
    ctx.fillText('www.arkafincap.com   •   RBI-Registered Systemically Important NBFC', width / 2, height * 0.80);

    ctx.restore();
  }
}
