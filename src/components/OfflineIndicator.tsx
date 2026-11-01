import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-16 md:bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-lg bg-[#1D1714] border border-[#8C6D46]/60 px-3.5 py-2 text-xs font-medium text-[#F4EFE6] shadow-2xl backdrop-blur-md animate-fadeIn"
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C5A059] opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D9B878]"></span>
      </span>
      <WifiOff className="w-3.5 h-3.5 text-[#D9B878]" />
      <span>Offline Mode — Cached case files &amp; evidence are accessible.</span>
    </div>
  );
};
