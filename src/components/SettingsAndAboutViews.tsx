import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Compass,
  Eye,
  Gavel,
  Music,
  Network,
  RefreshCw,
  RotateCcw,
  Sliders,
  Smartphone,
  Users,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import {
  AppScreen,
  DetectiveProfileState,
  GameDifficulty,
} from '../types/game';
import { ACHIEVEMENTS, getDetectiveRankInfo } from '../services/persistenceService';
import {
  AudioAssetKey,
  AudioSystemSnapshot,
  EXPECTED_AUDIO_FILES,
  soundService,
} from '../services/soundService';

interface SettingsViewProps {
  profile: DetectiveProfileState;
  onUpdateName: (name: string) => void;
  onToggleSound: () => void;
  onToggleMusic: () => void;
  onChangeMasterVolume: (vol: number) => void;
  onChangeMusicVolume: (vol: number) => void;
  onChangeSfxVolume: (vol: number) => void;
  onChangeDifficulty: (difficulty: GameDifficulty) => void;
  onResetAllData: () => void;
  onNavigate: (screen: AppScreen) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  profile,
  onUpdateName,
  onToggleSound,
  onToggleMusic,
  onChangeMasterVolume,
  onChangeMusicVolume,
  onChangeSfxVolume,
  onChangeDifficulty,
  onResetAllData,
  onNavigate,
}) => {
  const [nameInput, setNameInput] = useState(profile.detectiveName);
  const [confirmReset, setConfirmReset] = useState(false);
  const [audioSnapshot, setAudioSnapshot] = useState<AudioSystemSnapshot>(() =>
    soundService.getSnapshot()
  );
  const [isScanningAudio, setIsScanningAudio] = useState(false);

  useEffect(() => {
    return soundService.subscribe(setAudioSnapshot);
  }, []);

  const handleRescanAudio = async () => {
    setIsScanningAudio(true);
    await soundService.refreshAssetAvailability();
    setIsScanningAudio(false);
  };

  const rankInfo = getDetectiveRankInfo(profile.totalXp);
  const assetKeys = Object.keys(EXPECTED_AUDIO_FILES) as AudioAssetKey[];
  const availableAssetCount = assetKeys.filter(
    (k) => audioSnapshot.assetStatus[k] === 'AVAILABLE'
  ).length;

  const difficulties: {
    id: GameDifficulty;
    label: string;
    detail: string;
  }[] = [
    {
      id: 'EASY',
      label: 'Easy · Guided Eye',
      detail: 'Objects are reasonably visible yet naturally integrated into the room, with 9 Smart Hint charges.',
    },
    {
      id: 'MEDIUM',
      label: 'Medium · Natural Blend',
      detail: 'Objects blend naturally into local shadows, textures, and furniture, requiring careful searching (6 Smart Hints).',
    },
    {
      id: 'HARD',
      label: 'Hard · Master Camouflage',
      detail: 'Objects are partially concealed behind scene geometry and deep shadows—demanding close observation (3 Smart Hints).',
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-7 pb-28 md:pb-14 space-y-7">
      {/* Clear Back & Forward Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-[#8C6D46]/25">
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => onNavigate('HOME')}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#D9B878] hover:text-[#F4EFE6] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </button>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#F4EFE6]">
            Settings & Preferences
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => onNavigate('PROFILE')}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-[#1D1A17] hover:bg-[#26221E] border border-[#C5A059]/30 text-xs sm:text-sm font-medium text-[#F4EFE6] flex items-center gap-2 cursor-pointer"
          >
            <Award className="w-4 h-4 text-[#C5A059]" />
            <span>Service Record ({rankInfo.rank})</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('CASE_FILES')}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-[#C5A059] hover:bg-[#D9B878] text-[#0D0C0B] text-xs sm:text-sm font-semibold flex items-center gap-2 cursor-pointer"
          >
            <span>Case Library</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        {/* Audio & Soundtrack Controls */}
        <section className="bg-[#151311] border border-[#C5A059]/25 rounded-2xl p-6 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-semibold text-[#F4EFE6] flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#C5A059]" />
                <span>Audio & Soundtrack Controls</span>
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-[#C8BFB0]">
                Control master output, screen-based background music, and detective sound effects.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Master Mute / Unmute */}
              <button
                type="button"
                onClick={onToggleSound}
                className={`min-h-[42px] px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                  profile.soundEnabled
                    ? 'bg-[#231D15] border-[#C5A059] text-[#D9B878]'
                    : 'bg-[#1B1815] border-[#8C6D46]/30 text-[#8E8477]'
                }`}
              >
                {profile.soundEnabled ? (
                  <>
                    <Volume2 className="w-4 h-4 text-[#C5A059]" />
                    <span>Audio: Unmuted</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-4 h-4" />
                    <span>Audio: Muted</span>
                  </>
                )}
              </button>

              {/* Background Music On / Off */}
              <button
                type="button"
                onClick={onToggleMusic}
                disabled={!profile.soundEnabled}
                className={`min-h-[42px] px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-45 ${
                  profile.musicEnabled && profile.soundEnabled
                    ? 'bg-[#231D15] border-[#C5A059] text-[#D9B878]'
                    : 'bg-[#1B1815] border-[#8C6D46]/30 text-[#8E8477]'
                }`}
              >
                <Music className="w-4 h-4 text-[#C5A059]" />
                <span>Music: {profile.musicEnabled ? 'On' : 'Off'}</span>
              </button>
            </div>
          </div>

          {/* Three Volume Sliders: Master, Music, SFX */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="master-vol-slider" className="text-[#F4EFE6] font-medium">
                  Master Volume
                </label>
                <span className="font-mono text-[#D9B878] tabular-nums">
                  {Math.round(profile.masterVolume * 100)}%
                </span>
              </div>
              <input
                id="master-vol-slider"
                type="range"
                min={0}
                max={100}
                value={Math.round(profile.masterVolume * 100)}
                disabled={!profile.soundEnabled}
                onChange={(e) => onChangeMasterVolume(Number(e.target.value) / 100)}
                className="w-full accent-[#C5A059] disabled:opacity-40 cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="music-vol-slider" className="text-[#F4EFE6] font-medium">
                  Background Music Volume
                </label>
                <span className="font-mono text-[#D9B878] tabular-nums">
                  {Math.round(profile.musicVolume * 100)}%
                </span>
              </div>
              <input
                id="music-vol-slider"
                type="range"
                min={0}
                max={100}
                value={Math.round(profile.musicVolume * 100)}
                disabled={!profile.soundEnabled || !profile.musicEnabled}
                onChange={(e) => onChangeMusicVolume(Number(e.target.value) / 100)}
                className="w-full accent-[#C5A059] disabled:opacity-40 cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="sfx-vol-slider" className="text-[#F4EFE6] font-medium">
                  Sound Effects Volume
                </label>
                <span className="font-mono text-[#D9B878] tabular-nums">
                  {Math.round(profile.sfxVolume * 100)}%
                </span>
              </div>
              <input
                id="sfx-vol-slider"
                type="range"
                min={0}
                max={100}
                value={Math.round(profile.sfxVolume * 100)}
                disabled={!profile.soundEnabled}
                onChange={(e) => onChangeSfxVolume(Number(e.target.value) / 100)}
                className="w-full accent-[#C5A059] disabled:opacity-40 cursor-pointer"
              />
            </div>
          </div>

          {/* Honest Audio Asset Readiness & Playback State (`public/audio/`) */}
          <div className="pt-4 border-t border-[#8C6D46]/20 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="text-[#C8BFB0] font-mono">
                Playback Status:{' '}
                <span className="text-[#D9B878]">
                  {!profile.soundEnabled
                    ? 'Muted'
                    : !profile.musicEnabled
                    ? 'Music Disabled'
                    : audioSnapshot.isMusicActuallyPlaying && audioSnapshot.activePlayingMusicKey
                    ? `Playing ${EXPECTED_AUDIO_FILES[audioSnapshot.activePlayingMusicKey].filename}`
                    : audioSnapshot.targetMusicKey &&
                      audioSnapshot.assetStatus[audioSnapshot.targetMusicKey] === 'MISSING'
                    ? `Standby (${EXPECTED_AUDIO_FILES[audioSnapshot.targetMusicKey].filename} not yet added to public/audio/)`
                    : 'Ready'}
                </span>
              </div>

              <button
                type="button"
                onClick={handleRescanAudio}
                disabled={isScanningAudio}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#D9B878] hover:text-[#F4EFE6] cursor-pointer"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isScanningAudio ? 'animate-spin' : ''}`}
                />
                <span>Re-scan Audio Folder ({availableAssetCount}/5 detected)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
              {assetKeys.map((key) => {
                const meta = EXPECTED_AUDIO_FILES[key];
                const status = audioSnapshot.assetStatus[key];
                return (
                  <div
                    key={key}
                    className="px-3 py-2 rounded-lg bg-[#1B1815] border border-[#8C6D46]/20 flex flex-col justify-between gap-1 text-[11px]"
                  >
                    <div className="font-mono text-[#F4EFE6] truncate">{meta.filename}</div>
                    <div className="flex items-center justify-between gap-1 text-[10px]">
                      <span className="text-[#8E8477]">{meta.role}</span>
                      {status === 'AVAILABLE' ? (
                        <span className="inline-flex items-center gap-1 text-[#D9B878] font-mono">
                          <CheckCircle2 className="w-3 h-3 text-[#C5A059]" />
                          Loaded
                        </span>
                      ) : status === 'CHECKING' ? (
                        <span className="text-[#C8BFB0] font-mono">Checking...</span>
                      ) : (
                        <span className="text-[#8E8477] font-mono">Awaiting MP3</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Investigation Difficulty Selector */}
        <section className="bg-[#151311] border border-[#8C6D46]/25 rounded-2xl p-6 space-y-4">
          <div>
            <h2 className="font-display text-xl font-semibold text-[#F4EFE6]">
              Hidden-Object Camouflage & Difficulty
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-[#C8BFB0]">
              Adjusts object camouflage, partial furniture obstruction, shadow blending, and Smart Hint charges without altering any case’s story or culprit.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {difficulties.map((d) => {
              const selected = profile.preferredDifficulty === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => onChangeDifficulty(d.id)}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    selected
                      ? 'bg-[#262019] border-[#C5A059] shadow-md'
                      : 'bg-[#1B1815] hover:bg-[#221E1A] border-[#8C6D46]/25'
                  }`}
                >
                  <div className="text-sm font-semibold text-[#F4EFE6]">{d.label}</div>
                  <p className="mt-1.5 text-xs text-[#C8BFB0] leading-relaxed">{d.detail}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Progressive Web App (PWA) & Offline Standalone Installation */}
        <section className="bg-[#151311] border border-[#8C6D46]/25 rounded-2xl p-6 space-y-4">
          <div>
            <h2 className="font-display text-xl font-semibold text-[#F4EFE6] flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-[#C5A059]" />
              Progressive Web App (PWA)
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-[#C8BFB0]">
              Install The Missing Clue directly to your Android device or desktop for full-screen immersive play, quick home screen launch, and offline crime scenes.
            </p>
          </div>
          <PWAInstallButton variant="banner" />
        </section>

        {/* Detective Identity & Saved Data Management */}
        <section className="bg-[#151311] border border-[#8C6D46]/25 rounded-2xl p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <div className="space-y-2">
              <label htmlFor="settings-detective-name" className="block text-sm font-medium text-[#F4EFE6]">
                Investigator Name
              </label>
              <input
                id="settings-detective-name"
                type="text"
                maxLength={32}
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onBlur={() => {
                  const clean = nameInput.trim() || 'Detective Vance';
                  setNameInput(clean);
                  onUpdateName(clean);
                }}
                className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-[#1D1A17] border border-[#8C6D46]/35 focus:border-[#C5A059] text-sm text-[#F4EFE6] outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between md:justify-end gap-3">
              <span className="text-xs text-[#8E8477]">
                {profile.unlockedAchievementIds.length}/{ACHIEVEMENTS.length} Achievements Saved Locally
              </span>
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-[#1D1816] hover:bg-[#2B1918] border border-[#8C6D46]/30 text-xs sm:text-sm font-medium text-[#C8BFB0] hover:text-[#F4EFE6] flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset Saved Progress</span>
              </button>
            </div>
          </div>
        </section>
      </motion.div>

      {confirmReset && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div className="w-full max-w-md bg-[#181512] border border-[#C5A059]/40 rounded-2xl p-6 shadow-2xl">
            <h3 className="font-display text-2xl font-semibold text-[#F4EFE6]">
              Erase All Saved Progress?
            </h3>
            <p className="mt-2 text-sm text-[#C8BFB0] leading-relaxed">
              This permanently clears all completed case records, clues, Detective XP, and unlocked
              achievements stored in this browser.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="min-h-[44px] px-4 py-2 rounded-lg bg-[#24201C] text-sm text-[#C8BFB0] hover:text-[#F4EFE6] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmReset(false);
                  onResetAllData();
                }}
                className="min-h-[44px] px-5 py-2 rounded-lg bg-[#9E2A2B] hover:bg-[#B83234] text-sm font-semibold text-[#F4EFE6] cursor-pointer"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface AboutViewProps {
  hasUnfinishedCase: boolean;
  onContinueUnfinished: () => void;
  onNavigate: (screen: AppScreen) => void;
}

export const AboutView: React.FC<AboutViewProps> = ({
  hasUnfinishedCase,
  onContinueUnfinished,
  onNavigate,
}) => {
  const pillars = [
    {
      icon: <Compass className="w-5 h-5 text-[#C5A059]" />,
      title: '01. Search Five Hand-Painted Crime Scenes',
      body: 'Pinch, pan, double-tap, or toggle the Optical Magnifier across five atmospheric Victorian mysteries to uncover concealed physical exhibits.',
    },
    {
      icon: <Eye className="w-5 h-5 text-[#C5A059]" />,
      title: '02. Progressive 3-Level Smart Hints & Forensics',
      body: 'Need a nudge? Activate progressive Smart Hints—from a subtle area clue to Detective’s Eye highlight—then rotate and inspect every exhibit.',
    },
    {
      icon: <Network className="w-5 h-5 text-[#C5A059]" />,
      title: '03. Link Clues on the Red-String Board',
      body: 'Connect corroborating exhibits and suspect cards on the cork investigation wall to unlock forensic breakthroughs and deeper interrogation lines.',
    },
    {
      icon: <Users className="w-5 h-5 text-[#C5A059]" />,
      title: '04. Cross-Examine, Convict & Replay Anytime',
      body: 'Present physical evidence directly to suspects to shatter false alibis, deliver your Final Accusation, and replay any solved case without losing your original record.',
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-7 pb-28 md:pb-14 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-[#8C6D46]/25">
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => onNavigate('HOME')}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#D9B878] hover:text-[#F4EFE6] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </button>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#F4EFE6]">
            About The Missing Clue
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => onNavigate('DAILY_MYSTERY')}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-[#1D1A17] hover:bg-[#26221E] border border-[#C5A059]/30 text-xs sm:text-sm font-medium text-[#F4EFE6] flex items-center gap-2 cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-[#C5A059]" />
            <span>Daily Mystery</span>
          </button>

          {hasUnfinishedCase ? (
            <button
              type="button"
              onClick={onContinueUnfinished}
              className="min-h-[42px] px-5 py-2 rounded-xl bg-[#C5A059] hover:bg-[#D9B878] text-[#0D0C0B] text-xs sm:text-sm font-semibold flex items-center gap-2 cursor-pointer"
            >
              <span>Continue Investigation</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onNavigate('CASE_FILES')}
              className="min-h-[42px] px-5 py-2 rounded-xl bg-[#C5A059] hover:bg-[#D9B878] text-[#0D0C0B] text-xs sm:text-sm font-semibold flex items-center gap-2 cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>Open Case Library</span>
            </button>
          )}
        </div>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="bg-[#151311] border border-[#C5A059]/30 rounded-2xl p-6 sm:p-10 space-y-4"
      >
        <div className="font-brand text-2xl sm:text-3xl text-[#D9B878] tracking-wider">
          THE MISSING CLUE
        </div>
        <p className="font-display italic text-lg sm:text-xl text-[#F4EFE6]">
          Look closer. Think deeper. Trust no one.
        </p>
        <p className="text-sm sm:text-base text-[#C8BFB0] leading-relaxed max-w-3xl">
          Designed as an atmospheric five-case Victorian detective anthology, every investigation in{' '}
          <strong className="text-[#F4EFE6]">The Missing Clue</strong> pairs tactile hidden-object
          observation with genuine forensic logic. Every suspect harbors a believable secret, every
          red herring has a rational explanation, and every conviction rests on verifiable proof.
        </p>
      </motion.section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {pillars.map((item) => (
          <div
            key={item.title}
            className="bg-[#151311] border border-[#8C6D46]/25 rounded-2xl p-6 space-y-2.5"
          >
            <div className="flex items-center gap-2.5">
              {item.icon}
              <h2 className="font-display text-lg font-semibold text-[#F4EFE6]">{item.title}</h2>
            </div>
            <p className="text-xs sm:text-sm text-[#C8BFB0] leading-relaxed">{item.body}</p>
          </div>
        ))}
      </section>

      <section className="bg-[#151311] border border-[#8C6D46]/25 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="font-display text-lg font-semibold text-[#F4EFE6] flex items-center gap-2">
            <Gavel className="w-4 h-4 text-[#C5A059]" />
            <span>Offline-Ready Browser Persistence</span>
          </div>
          <p className="text-xs sm:text-sm text-[#C8BFB0]">
            All five cases, clues, board deductions, audio preferences, and completed records save
            automatically in your browser with zero accounts or API keys required.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('CASE_FILES')}
          className="min-h-[46px] px-6 py-2.5 rounded-xl bg-[#C5A059] hover:bg-[#D9B878] text-[#0D0C0B] text-sm font-semibold flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <span>Explore All 5 Cases</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </section>
    </div>
  );
};
