import React, { useMemo } from 'react';
import { Choice } from '../types';
import { ChoiceIcon } from './icons/ChoiceIcon';
import { describeOutcome, choiceBeats } from '../gameLogic';

interface BattleStageProps {
  p1Choice: Choice | null;
  p2Choice: Choice | null;
  p1Name: string;
  p2Name: string;
  p1IsWinner: boolean;
  p2IsWinner: boolean;
  isTie: boolean;
  phase: 'reveal' | 'finished';
}

const clashClass = (p1: Choice, p2: Choice): string => {
  if (p1 === p2) return 'tie';
  if (choiceBeats(p1, p2)) return 'p1-wins';
  return 'p2-wins';
};

export const BattleStage: React.FC<BattleStageProps> = ({
  p1Choice,
  p2Choice,
  p1Name,
  p2Name,
  p1IsWinner,
  p2IsWinner,
  isTie,
  phase,
}) => {
  const outcome = useMemo(() => {
    if (!p1Choice || !p2Choice) return null;
    return describeOutcome(p1Choice, p2Choice);
  }, [p1Choice, p2Choice]);

  const clash = p1Choice && p2Choice ? clashClass(p1Choice, p2Choice) : '';

  return (
    <div className="relative flex flex-col items-center gap-6 py-6">
      <div className="flex w-full items-center justify-center gap-4 sm:gap-12">
        <CombatantSide
          choice={p1Choice}
          name={p1Name}
          isWinner={p1IsWinner}
          isLoser={p2IsWinner}
          side="left"
          clash={clash}
        />

        <div className="relative z-20 flex flex-col items-center">
          <div
            className={`text-4xl font-black italic text-red-500 sm:text-6xl ${
              phase === 'reveal' ? 'animate-clash-vs' : ''
            }`}
          >
            VS
          </div>
        </div>

        <CombatantSide
          choice={p2Choice}
          name={p2Name}
          isWinner={p2IsWinner}
          isLoser={p1IsWinner}
          side="right"
          clash={clash}
        />
      </div>

      <div className="h-8">
        {outcome && phase === 'reveal' && (
          <div className="animate-fade-in-up text-center">
            <span className="text-lg font-bold text-amber-300 sm:text-2xl">
              {outcome.winnerChoice} {outcome.verb} {outcome.loserChoice}
            </span>
          </div>
        )}
        {isTie && phase === 'reveal' && (
          <div className="animate-fade-in-up text-center text-lg font-bold text-slate-300 sm:text-2xl">
            TIE — Both picked {p1Choice}
          </div>
        )}
      </div>
    </div>
  );
};

interface CombatantSideProps {
  choice: Choice | null;
  name: string;
  isWinner: boolean;
  isLoser: boolean;
  side: 'left' | 'right';
  clash: string;
}

const CombatantSide: React.FC<CombatantSideProps> = ({
  choice,
  name,
  isWinner,
  isLoser,
  side,
  clash,
}) => {
  return (
    <div className="flex flex-1 flex-col items-center gap-3">
      <div
        className={`relative flex h-40 w-40 items-center justify-center rounded-2xl border-2 sm:h-48 sm:w-48 ${
          isWinner
            ? 'border-emerald-400 bg-emerald-400/10'
            : isLoser
            ? 'border-red-400/50 bg-red-400/5'
            : 'border-white/10 bg-white/5'
        }`}
      >
        {choice ? (
          <div
            className={`animate-enter-${side} ${
              clash === 'p1-wins' && side === 'left'
                ? 'animate-victor-shake'
                : clash === 'p2-wins' && side === 'right'
                ? 'animate-victor-shake'
                : clash === 'p1-wins' && side === 'right'
                ? 'animate-defeated-fall'
                : clash === 'p2-wins' && side === 'left'
                ? 'animate-defeated-fall'
                : 'animate-tie-bounce'
            }`}
          >
            <ChoiceIcon choice={choice} size={120} animated />
          </div>
        ) : (
          <div className="text-6xl text-white/20">?</div>
        )}

        {isWinner && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-400 px-4 py-1 text-xs font-black uppercase tracking-wider text-slate-900 shadow-lg animate-fade-in-up">
            Winner
          </div>
        )}
      </div>
      <span className="max-w-[140px] truncate text-center text-sm font-bold uppercase tracking-wider text-slate-200">
        {name}
      </span>
    </div>
  );
};

export default BattleStage;
