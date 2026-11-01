import React, { useState } from 'react';
import { Download, Smartphone, X, Check } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'full' | 'banner';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'compact',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // If already running in standalone mode, show subtle confirmation if in banner mode, otherwise hide
  if (isInstalled) {
    if (variant === 'banner') {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1B261D] border border-emerald-600/30 text-emerald-300 text-xs font-medium">
          <Check className="w-3.5 h-3.5" />
          <span>App installed on device</span>
        </div>
      );
    }
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      setIsInstalling(true);
      await install();
      setIsInstalling(false);
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  // If not installable and not iOS (e.g. unsupported desktop or already running inside iframe preview),
  // in banner/settings mode we still explain how to install on mobile Chrome
  if (!isInstallable && !isIOS && variant !== 'banner') {
    return null;
  }

  return (
    <>
      {variant === 'compact' && (
        <button
          type="button"
          onClick={handleInstallClick}
          title="Install The Missing Clue to Home Screen"
          className={`h-[38px] px-3 rounded-lg bg-[#1D1A17] hover:bg-[#28231E] border border-[#C5A059]/40 text-[#D9B878] hover:text-[#FFF5D6] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${className}`}
        >
          <Download className="w-3.5 h-3.5 text-[#C5A059]" />
          <span className="hidden sm:inline">Install App</span>
        </button>
      )}

      {variant === 'full' && (
        <button
          type="button"
          onClick={handleInstallClick}
          disabled={isInstalling}
          className={`w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#C5A059] to-[#D9B878] hover:from-[#D9B878] hover:to-[#F4E0A5] text-[#0D0C0B] font-bold text-sm tracking-wide shadow-lg hover:shadow-[#C5A059]/20 flex items-center justify-center gap-2 transition-all cursor-pointer ${className}`}
        >
          <Smartphone className="w-4 h-4 text-[#0D0C0B]" />
          <span>{isInstalling ? 'Installing...' : 'Install "The Missing Clue" (PWA)'}</span>
        </button>
      )}

      {variant === 'banner' && (
        <div className={`p-4 rounded-xl border border-[#C5A059]/30 bg-[#161311] relative overflow-hidden ${className}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#241F1A] border border-[#C5A059]/40 flex items-center justify-center shrink-0">
                <img src="/pwa-192x192.png" alt="App Icon" className="w-8 h-8 rounded" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#F4EFE6] flex items-center gap-1.5">
                  The Missing Clue
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#C5A059]/20 text-[#D9B878] border border-[#C5A059]/30">
                    PWA
                  </span>
                </h4>
                <p className="text-xs text-[#8E8477]">
                  Install on Android or iOS for full-screen crime scene investigation and offline play.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleInstallClick}
              className="px-4 py-2 rounded-lg bg-[#C5A059] hover:bg-[#D9B878] text-[#0D0C0B] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              {isIOS ? 'Install on iOS' : isInstallable ? 'Install App' : 'How to Install'}
            </button>
          </div>
        </div>
      )}

      {/* iOS or Android Instruction Modal */}
      {showIOSGuide && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fadeIn"
        >
          <div className="w-full max-w-sm rounded-2xl bg-[#171412] border border-[#C5A059]/40 p-6 shadow-2xl text-[#F4EFE6]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#D9B878]" />
                <h3 className="text-base font-bold text-[#D9B878]">Install on Mobile Device</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="text-[#8E8477] hover:text-[#F4EFE6] p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#C8BFB0] leading-relaxed">
              <div className="p-3 rounded-lg bg-[#1F1B17] border border-[#8C6D46]/30">
                <p className="font-semibold text-[#D9B878] mb-1">On Android (Chrome):</p>
                <p>1. Tap the three dots menu (⋮) in the top-right corner of Chrome.</p>
                <p>2. Select <strong className="text-white">"Install app"</strong> or <strong className="text-white">"Add to Home screen"</strong>.</p>
              </div>

              <div className="p-3 rounded-lg bg-[#1F1B17] border border-[#8C6D46]/30">
                <p className="font-semibold text-[#D9B878] mb-1">On iOS (Safari):</p>
                <p>1. Tap the <strong className="text-white">Share</strong> button (box with upward arrow) at the bottom.</p>
                <p>2. Scroll down and tap <strong className="text-white">"Add to Home Screen"</strong>.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-[#C5A059] hover:bg-[#D9B878] text-[#0D0C0B] font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};
