import React from 'react';
import { Choice } from '../types';
import { ChoiceIcon } from './icons/ChoiceIcon';

interface ChoiceButtonProps {
  choice: Choice;
  selected: boolean;
  disabled: boolean;
  revealed: boolean;
  onClick: () => void;
}

const labels: Record<Choice, string> = {
  rock: 'Rock',
  paper: 'Paper',
  scissors: 'Scissors',
};

export const ChoiceButton: React.FC<ChoiceButtonProps> = ({
  choice,
  selected,
  disabled,
  revealed,
  onClick,
}) => {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`
        group relative flex flex-col items-center gap-2 rounded-2xl border-2 px-6 py-5
        transition-all duration-200 select-none
        ${
          selected
            ? 'border-amber-400 bg-amber-400/10 scale-105 shadow-lg shadow-amber-400/30'
            : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
        }
        ${
          disabled && !selected
            ? 'opacity-50 cursor-not-allowed'
            : 'cursor-pointer hover:scale-105 active:scale-95'
        }
      `}
    >
      <div className="transition-transform duration-200 group-hover:scale-110">
        <ChoiceIcon choice={choice} size={64} />
      </div>
      <span
        className={`text-sm font-bold uppercase tracking-wider ${
          selected ? 'text-amber-300' : 'text-slate-300'
        }`}
      >
        {labels[choice]}
      </span>
      {selected && !revealed && (
        <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-xs font-black text-slate-900">
          ✓
        </span>
      )}
    </button>
  );
};

export default ChoiceButton;
