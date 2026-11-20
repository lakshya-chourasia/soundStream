import React, { useState } from 'react';
import { Download, Smartphone, X, Check } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isAndroid, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  // Automatically suppress once running as an installed standalone PWA
  if (isInstalled) {
    return null;
  }

  // Native Chromium / Android / Desktop one-tap install
  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="h-9 px-2.5 sm:px-3.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-zinc-950 font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        title="Install Melophile for uninterrupted Android background playback"
        aria-label="Install Melophile App"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Install App</span>
      </button>
    );
  }

  // Show guided setup button on Android / iOS mobile browsers when native prompt hasn't fired yet
  if (!isAndroid && !isIOS) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowGuide(true)}
        className="h-9 px-2.5 sm:px-3.5 rounded-lg bg-[#141418] hover:bg-[#1c1c23] text-zinc-200 hover:text-white border border-white/[0.08] transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-medium whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70"
        title="Install Melophile for full background playback"
        aria-label="Install Melophile App"
      >
        <Smartphone className="w-3.5 h-3.5 text-amber-400" />
        <span className="hidden sm:inline">Install App</span>
      </button>

      {showGuide && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Install Melophile for Background Play"
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
          onClick={() => setShowGuide(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-[#111114] border border-white/[0.1] p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-zinc-50">
                  {isIOS ? 'Install on iPhone / iPad' : 'Full Background Play on Android'}
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  {isIOS
                    ? 'Add Melophile to your Home Screen for standalone playback.'
                    : 'Install Melophile as an app for dedicated lock-screen controls and screen-off playback.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="w-8 h-8 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] flex items-center justify-center cursor-pointer shrink-0"
                aria-label="Close install guide"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <ol className="space-y-2.5 text-xs text-zinc-300 leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/15 text-amber-400 font-mono text-[11px] font-semibold flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    Tap the <strong className="text-zinc-100">Share</strong> button in the Safari toolbar.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/15 text-amber-400 font-mono text-[11px] font-semibold flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <span>
                    Scroll down and tap <strong className="text-zinc-100">Add to Home Screen</strong>.
                  </span>
                </li>
              </ol>
            ) : (
              <ol className="space-y-2.5 text-xs text-zinc-300 leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/15 text-amber-400 font-mono text-[11px] font-semibold flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    Open the Chrome menu (<strong className="text-zinc-100">⋮</strong>) and tap{' '}
                    <strong className="text-zinc-100">Add to Home screen → Install</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/15 text-amber-400 font-mono text-[11px] font-semibold flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <span>
                    Launch <strong className="text-zinc-100">Melophile</strong> from your Home Screen. Lock-screen artwork, Play/Pause, Next/Previous, and Bluetooth controls work automatically.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/15 text-amber-400 font-mono text-[11px] font-semibold flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <span>
                    For longest screen-off sessions, set Chrome / Melophile battery usage to{' '}
                    <strong className="text-zinc-100">Unrestricted</strong> in Android Settings.
                  </span>
                </li>
              </ol>
            )}

            <div className="pt-1 flex items-center justify-between gap-2 text-[11px] text-zinc-400 border-t border-white/[0.06]">
              <span className="flex items-center gap-1.5 text-amber-400">
                <Check className="w-3.5 h-3.5" />
                Lock-screen MediaSession active
              </span>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-zinc-950 font-semibold text-xs transition-colors cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
