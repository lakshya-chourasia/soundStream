import React from 'react';
import { X, Timer, Check } from 'lucide-react';

interface SleepTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  sleepTimerRemaining: number | null; // seconds remaining
  onSetTimerMinutes: (minutes: number | null) => void;
}

const TIMER_PRESETS = [15, 30, 45, 60, 90];

export const SleepTimerModal: React.FC<SleepTimerModalProps> = ({
  isOpen,
  onClose,
  sleepTimerRemaining,
  onSetTimerMinutes,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Sleep Timer
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg"
            aria-label="Close sleep timer modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-zinc-500">
          Automatically fade out and pause audio playback when you drift off to sleep.
        </p>

        {sleepTimerRemaining !== null && (
          <div
            className="p-3 rounded-xl text-center border"
            style={{
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderColor: 'var(--theme-accent, #f59e0b)',
            }}
          >
            <span className="text-xs font-medium" style={{ color: 'var(--theme-accent, #f59e0b)' }}>
              Active Countdown:{' '}
            </span>
            <span className="text-sm font-mono font-bold" style={{ color: 'var(--theme-accent, #f59e0b)' }}>
              {Math.floor(sleepTimerRemaining / 60)}:
              {(sleepTimerRemaining % 60).toString().padStart(2, '0')}
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 pt-1">
          {TIMER_PRESETS.map((minutes) => (
            <button
              key={minutes}
              onClick={() => {
                onSetTimerMinutes(minutes);
                onClose();
              }}
              className="py-2.5 px-3 text-xs font-medium rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-amber-500 hover:bg-amber-500/10 text-zinc-800 dark:text-zinc-200 transition-colors flex items-center justify-between"
            >
              <span>{minutes} minutes</span>
            </button>
          ))}
        </div>

        {sleepTimerRemaining !== null && (
          <button
            onClick={() => {
              onSetTimerMinutes(null);
              onClose();
            }}
            className="w-full py-2 text-xs font-medium text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors"
          >
            Turn Off Timer
          </button>
        )}
      </div>
    </div>
  );
};
