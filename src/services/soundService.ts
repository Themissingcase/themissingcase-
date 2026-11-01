export type SceneAtmosphereMode = 'MENU' | 'CRIME_SCENE' | 'INVESTIGATION' | 'REVELATION';

export type AudioAssetKey =
  | 'main_theme'
  | 'crime_scene'
  | 'object_found'
  | 'evidence_found'
  | 'case_solved';

export type AudioAssetStatus = 'CHECKING' | 'AVAILABLE' | 'MISSING';

export const EXPECTED_AUDIO_FILES: Record<AudioAssetKey, { filename: string; url: string; role: 'MUSIC' | 'SFX'; label: string }> = {
  main_theme: {
    filename: 'main_theme.mp3',
    url: '/audio/main_theme.mp3',
    role: 'MUSIC',
    label: 'Main Menu & Library Theme',
  },
  crime_scene: {
    filename: 'crime_scene.mp3',
    url: '/audio/crime_scene.mp3',
    role: 'MUSIC',
    label: 'Crime Scene & Investigation Music',
  },
  object_found: {
    filename: 'object_found.mp3',
    url: '/audio/object_found.mp3',
    role: 'SFX',
    label: 'Hidden Object Discovered SFX',
  },
  evidence_found: {
    filename: 'evidence_found.mp3',
    url: '/audio/evidence_found.mp3',
    role: 'SFX',
    label: 'Evidence & Deduction SFX',
  },
  case_solved: {
    filename: 'case_solved.mp3',
    url: '/audio/case_solved.mp3',
    role: 'SFX',
    label: 'Case Solved Theme / Fanfare',
  },
};

export interface AudioSystemSnapshot {
  soundEnabled: boolean;
  musicEnabled: boolean;
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  atmosphereMode: SceneAtmosphereMode;
  targetMusicKey: 'main_theme' | 'crime_scene' | null;
  activePlayingMusicKey: 'main_theme' | 'crime_scene' | null;
  isMusicActuallyPlaying: boolean;
  assetStatus: Record<AudioAssetKey, AudioAssetStatus>;
}

type SnapshotListener = (snapshot: AudioSystemSnapshot) => void;

/**
 * Lightweight, resilient HTML5 Audio manager for THE MISSING CLUE.
 *
 * Uses the five expected MP3 files in `public/audio/`:
 * - `/audio/main_theme.mp3`
 * - `/audio/crime_scene.mp3`
 * - `/audio/object_found.mp3`
 * - `/audio/evidence_found.mp3`
 * - `/audio/case_solved.mp3`
 *
 * Safely verifies each file before playback (guarding against SPA `text/html` fallback responses
 * when MP3 files have not been added yet), never throws console/media errors on missing files,
 * never pretends music is playing when assets are absent, and handles screen-based track switching,
 * smooth fade transitions, visibility pause/resume, and volume controls.
 */
class SoundService {
  private soundEnabled = true;
  private musicEnabled = true;
  private masterVolume = 0.85;
  private musicVolume = 0.5;
  private sfxVolume = 0.8;
  private atmosphereMode: SceneAtmosphereMode = 'MENU';
  private unlockedByGesture = false;
  private documentHidden = false;

  private assetStatus: Record<AudioAssetKey, AudioAssetStatus> = {
    main_theme: 'CHECKING',
    crime_scene: 'CHECKING',
    object_found: 'CHECKING',
    evidence_found: 'CHECKING',
    case_solved: 'CHECKING',
  };

  private musicElements: Partial<Record<'main_theme' | 'crime_scene', HTMLAudioElement>> = {};
  private currentMusicKey: 'main_theme' | 'crime_scene' | null = null;
  private isMusicPlaying = false;
  private fadeTimer: number | null = null;
  private probePromise: Promise<void> | null = null;
  private listeners = new Set<SnapshotListener>();

  constructor() {
    if (typeof window !== 'undefined') {
      if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', () => {
          this.documentHidden = document.hidden;
          if (this.documentHidden) {
            this.pauseActiveMusic();
          } else {
            this.syncMusicPlayback();
          }
        });
      }

      const unlockOnce = () => {
        this.unlockFromUserGesture();
      };
      window.addEventListener('pointerdown', unlockOnce, { passive: true });
      window.addEventListener('keydown', unlockOnce, { passive: true });

      // Probe expected audio assets quietly on startup
      void this.refreshAssetAvailability();
    }
  }

  public subscribe(listener: SnapshotListener): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit() {
    if (this.listeners.size === 0) return;
    const snap = this.getSnapshot();
    this.listeners.forEach((fn) => fn(snap));
  }

  private getTargetMusicKey(): 'main_theme' | 'crime_scene' | null {
    if (this.atmosphereMode === 'MENU') return 'main_theme';
    if (this.atmosphereMode === 'CRIME_SCENE' || this.atmosphereMode === 'INVESTIGATION') {
      return 'crime_scene';
    }
    // On REVELATION (Case Solved screen), `case_solved.mp3` plays as the celebratory cue
    return null;
  }

  public getSnapshot(): AudioSystemSnapshot {
    const targetMusicKey = this.getTargetMusicKey();
    return {
      soundEnabled: this.soundEnabled,
      musicEnabled: this.musicEnabled,
      masterVolume: this.masterVolume,
      musicVolume: this.musicVolume,
      sfxVolume: this.sfxVolume,
      atmosphereMode: this.atmosphereMode,
      targetMusicKey,
      activePlayingMusicKey: this.isMusicPlaying ? this.currentMusicKey : null,
      isMusicActuallyPlaying: this.isMusicPlaying,
      assetStatus: { ...this.assetStatus },
    };
  }

  /**
   * Probes `public/audio/<filename>` via HEAD request and checks Content-Type so Vite's
   * SPA HTML fallback is cleanly recognized as MISSING rather than triggering MediaError.
   */
  public async refreshAssetAvailability(): Promise<void> {
    if (typeof window === 'undefined' || typeof fetch === 'undefined') return;
    if (this.probePromise) return this.probePromise;

    this.probePromise = (async () => {
      const keys = Object.keys(EXPECTED_AUDIO_FILES) as AudioAssetKey[];
      await Promise.all(
        keys.map(async (key) => {
          const { url } = EXPECTED_AUDIO_FILES[key];
          try {
            const res = await fetch(url, { method: 'HEAD', cache: 'no-store' });
            const contentType = (res.headers.get('content-type') || '').toLowerCase();
            const contentLength = res.headers.get('content-length');
            const isValidAudioResponse =
              res.ok &&
              !contentType.includes('text/html') &&
              (contentType.includes('audio/') ||
                contentType.includes('application/octet-stream') ||
                contentType.includes('mpeg')) &&
              contentLength !== '0';

            this.assetStatus[key] = isValidAudioResponse ? 'AVAILABLE' : 'MISSING';
          } catch {
            this.assetStatus[key] = 'MISSING';
          }
        })
      );
      this.probePromise = null;
      this.emit();
      this.syncMusicPlayback();
    })();

    return this.probePromise;
  }

  public configure(opts: {
    enabled: boolean;
    musicEnabled?: boolean;
    masterVolume?: number;
    musicVolume: number;
    sfxVolume: number;
  }) {
    this.soundEnabled = opts.enabled;
    if (typeof opts.musicEnabled === 'boolean') {
      this.musicEnabled = opts.musicEnabled;
    }
    if (typeof opts.masterVolume === 'number') {
      this.masterVolume = Math.max(0, Math.min(1, opts.masterVolume));
    }
    this.musicVolume = Math.max(0, Math.min(1, opts.musicVolume));
    this.sfxVolume = Math.max(0, Math.min(1, opts.sfxVolume));
    this.applyVolumeToActiveMusic();
    this.syncMusicPlayback();
    this.emit();
  }

  public setEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    this.applyVolumeToActiveMusic();
    this.syncMusicPlayback();
    this.emit();
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  public setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    this.applyVolumeToActiveMusic();
    this.syncMusicPlayback();
    this.emit();
  }

  public isMusicEnabled(): boolean {
    return this.musicEnabled;
  }

  public setMasterVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    this.applyVolumeToActiveMusic();
    this.syncMusicPlayback();
    this.emit();
  }

  public getMasterVolume(): number {
    return this.masterVolume;
  }

  public setMusicVolume(vol: number) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    this.applyVolumeToActiveMusic();
    this.syncMusicPlayback();
    this.emit();
  }

  public getMusicVolume(): number {
    return this.musicVolume;
  }

  public setSfxVolume(vol: number) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    this.emit();
  }

  public getSfxVolume(): number {
    return this.sfxVolume;
  }

  public setAtmosphereMode(mode: SceneAtmosphereMode) {
    if (this.atmosphereMode === mode) return;
    this.atmosphereMode = mode;
    this.syncMusicPlayback();
    this.emit();
  }

  public unlockFromUserGesture() {
    if (!this.unlockedByGesture) {
      this.unlockedByGesture = true;
      this.syncMusicPlayback();
    }
  }

  private getEffectiveMusicVolume(): number {
    if (!this.soundEnabled || !this.musicEnabled) return 0;
    return Math.max(0, Math.min(1, this.masterVolume * this.musicVolume));
  }

  private getEffectiveSfxVolume(): number {
    if (!this.soundEnabled) return 0;
    return Math.max(0, Math.min(1, this.masterVolume * this.sfxVolume));
  }

  private getOrCreateMusicElement(key: 'main_theme' | 'crime_scene'): HTMLAudioElement | null {
    if (typeof window === 'undefined' || typeof Audio === 'undefined') return null;
    if (this.assetStatus[key] !== 'AVAILABLE') return null;

    let audio = this.musicElements[key];
    if (!audio) {
      audio = new Audio(EXPECTED_AUDIO_FILES[key].url);
      audio.loop = true;
      audio.preload = 'auto';
      audio.volume = this.getEffectiveMusicVolume();

      audio.addEventListener('play', () => {
        if (this.currentMusicKey === key) {
          this.isMusicPlaying = true;
          this.emit();
        }
      });

      audio.addEventListener('pause', () => {
        if (this.currentMusicKey === key) {
          this.isMusicPlaying = false;
          this.emit();
        }
      });

      audio.addEventListener('error', () => {
        this.assetStatus[key] = 'MISSING';
        if (this.currentMusicKey === key) {
          this.isMusicPlaying = false;
          this.currentMusicKey = null;
        }
        delete this.musicElements[key];
        this.emit();
      });

      this.musicElements[key] = audio;
    }
    return audio;
  }

  private clearFadeTimer() {
    if (this.fadeTimer !== null && typeof window !== 'undefined') {
      window.clearInterval(this.fadeTimer);
      this.fadeTimer = null;
    }
  }

  private applyVolumeToActiveMusic() {
    if (!this.currentMusicKey) return;
    const active = this.musicElements[this.currentMusicKey];
    if (active) {
      active.volume = this.getEffectiveMusicVolume();
    }
  }

  private pauseActiveMusic() {
    this.clearFadeTimer();
    (['main_theme', 'crime_scene'] as const).forEach((k) => {
      const el = this.musicElements[k];
      if (el && !el.paused) {
        try {
          el.pause();
        } catch {
          // Ignore safely
        }
      }
    });
    this.isMusicPlaying = false;
    this.emit();
  }

  private syncMusicPlayback() {
    if (typeof window === 'undefined') return;

    const targetKey = this.getTargetMusicKey();
    const effectiveVol = this.getEffectiveMusicVolume();
    const canPlay =
      !this.documentHidden &&
      this.unlockedByGesture &&
      targetKey !== null &&
      effectiveVol > 0.005 &&
      this.assetStatus[targetKey] === 'AVAILABLE';

    if (!canPlay) {
      this.pauseActiveMusic();
      if (targetKey === null || this.assetStatus[targetKey] !== 'AVAILABLE') {
        this.currentMusicKey = targetKey;
      }
      this.emit();
      return;
    }

    // Stop any non-target track immediately so two tracks never overlap
    const otherKey = targetKey === 'main_theme' ? 'crime_scene' : 'main_theme';
    const otherEl = this.musicElements[otherKey];
    if (otherEl && !otherEl.paused) {
      try {
        otherEl.pause();
        otherEl.currentTime = 0;
      } catch {
        // Ignore safely
      }
    }

    const nextEl = this.getOrCreateMusicElement(targetKey);
    if (!nextEl) {
      this.isMusicPlaying = false;
      this.emit();
      return;
    }

    const switchingTrack = this.currentMusicKey !== targetKey || nextEl.paused;
    this.currentMusicKey = targetKey;

    if (!switchingTrack) {
      nextEl.volume = effectiveVol;
      this.isMusicPlaying = !nextEl.paused;
      this.emit();
      return;
    }

    this.clearFadeTimer();
    nextEl.volume = Math.min(effectiveVol, 0.05);

    nextEl
      .play()
      .then(() => {
        this.isMusicPlaying = true;
        this.emit();
        // Smooth 360ms fade-in to target volume
        let step = 0;
        const steps = 9;
        this.fadeTimer = window.setInterval(() => {
          step += 1;
          const target = this.getEffectiveMusicVolume();
          if (step >= steps || nextEl.paused) {
            nextEl.volume = target;
            this.clearFadeTimer();
            return;
          }
          nextEl.volume = Math.max(0, Math.min(1, (target * step) / steps));
        }, 40);
      })
      .catch(() => {
        this.isMusicPlaying = false;
        this.emit();
      });
  }

  private playSfxAsset(key: 'object_found' | 'evidence_found' | 'case_solved') {
    this.unlockFromUserGesture();
    const vol = this.getEffectiveSfxVolume();
    if (vol <= 0.005) return;
    if (this.assetStatus[key] !== 'AVAILABLE') return;
    if (typeof window === 'undefined' || typeof Audio === 'undefined') return;

    try {
      const sfx = new Audio(EXPECTED_AUDIO_FILES[key].url);
      sfx.volume = vol;
      sfx.addEventListener('error', () => {
        this.assetStatus[key] = 'MISSING';
        this.emit();
      });
      sfx.play().catch(() => {});
    } catch {
      // Fail silently if unavailable
    }
  }

  /** Triggered when discovering a hidden object in the crime scene (`object_found.mp3`) */
  public playObjectFound() {
    this.playSfxAsset('object_found');
  }

  /** Alias kept for existing CrimeScene discovery calls */
  public playClueFound() {
    this.playObjectFound();
  }

  /** Triggered when inspecting/collecting evidence or unlocking a deduction (`evidence_found.mp3`) */
  public playEvidenceFound() {
    this.playSfxAsset('evidence_found');
  }

  /** Triggered when unlocking a red-string deduction or exposing a contradiction (`evidence_found.mp3`) */
  public playBreakthrough() {
    this.playEvidenceFound();
  }

  /** Triggered when solving a case (`case_solved.mp3`) */
  public playCaseSolvedFanfare() {
    this.playSfxAsset('case_solved');
  }

  /** User gesture unlock hooks for lightweight UI interactions (silent unless mapped) */
  public playTap() {
    this.unlockFromUserGesture();
  }

  public playSceneTransition() {
    this.unlockFromUserGesture();
  }

  public playMissTap() {
    this.unlockFromUserGesture();
  }

  public playDetectivesEye() {
    this.unlockFromUserGesture();
  }

  public playNotebookOpen() {
    this.unlockFromUserGesture();
  }

  public playHint() {
    this.unlockFromUserGesture();
  }
}

export const soundService = new SoundService();
