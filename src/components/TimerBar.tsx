import React, { useEffect, useState } from 'react';
import { TURN_DURATION_MS } from '../types';

interface TimerBarProps {
  timerEndsAt: number | null;
  onExpire?: () => void;
}

export const TimerBar: React.FC<TimerBarProps> = ({ timerEndsAt }) => {
  const [remainingMs, setRemainingMs] = useState(0);

  useEffect(() => {
    if (!timerEndsAt) {
      setRemainingMs(0);
      return;
    }
    const tick = () => {
      const rem = Math.max(0, timerEndsAt - Date.now());
      setRemainingMs(rem);
    };
    tick();
    const interval = setInterval(tick, 50);
    return () => clearInterval(interval);
  }, [timerEndsAt]);

  const percent = timerEndsAt
    ? Math.min(100, (remainingMs / TURN_DURATION_MS) * 100)
    : 0;
  const seconds = Math.ceil(remainingMs / 1000);
  const danger = percent <= 25;
  const warning = percent <= 50 && percent > 25;

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
          Time Left
        </span>
        <span
          className={`text-2xl font-black tabular-nums transition-colors ${
            danger
              ? 'text-red-400 animate-pulse'
              : warning
              ? 'text-amber-400'
              : 'text-emerald-400'
          }`}
        >
          {seconds}s
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all duration-100 ease-linear ${
            danger
              ? 'bg-gradient-to-r from-red-500 to-rose-500'
              : warning
              ? 'bg-gradient-to-r from-amber-400 to-orange-500'
              : 'bg-gradient-to-r from-emerald-400 to-teal-500'
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

export default TimerBar;
