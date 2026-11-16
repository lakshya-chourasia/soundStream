import React from 'react';
import { X, Timer } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in select-none">
      <div className="relative w-full max-w-sm bg-[#121214] border border-white/15 rounded-3xl shadow-2xl p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-white" />
            <h3 className="text-base font-bold text-white">
              Sleep Timer
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded-full transition-colors"
            aria-label="Close sleep timer modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
          Pause playback automatically:
        </p>

        {sleepTimerRemaining !== null && (
          <div className="p-3 bg-[#18181b] border border-white/10 rounded-2xl text-center">
            <span className="text-xs text-zinc-400 uppercase tracking-wider">
              Remaining:{' '}
            </span>
            <span className="text-sm font-mono font-bold text-white tabular-nums">
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
              className="py-3 px-3 text-xs font-semibold rounded-2xl bg-[#18181b] border border-white/10 text-zinc-200 hover:bg-white hover:text-black transition-all flex items-center justify-center font-mono"
            >
              <span>{minutes} Minutes</span>
            </button>
          ))}
        </div>

        {sleepTimerRemaining !== null && (
          <button
            onClick={() => {
              onSetTimerMinutes(null);
              onClose();
            }}
            className="w-full py-2.5 text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors border border-white/10"
          >
            Cancel Timer
          </button>
        )}
      </div>
    </div>
  );
};
