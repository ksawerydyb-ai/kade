import React from 'react';
import { Choice } from '../../types';

interface ChoiceIconProps {
  choice: Choice;
  size?: number;
  className?: string;
  animated?: boolean;
}

export const ChoiceIcon: React.FC<ChoiceIconProps> = ({
  choice,
  size = 80,
  className = '',
  animated = false,
}) => {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 100 100',
    className: `${className} ${animated ? 'choice-icon-animated' : ''}`,
    xmlns: 'http://www.w3.org/2000/svg',
  } as const;

  if (choice === 'rock') {
    return (
      <svg {...common}>
        <defs>
          <radialGradient id="rockGrad" cx="40%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#a8a29e" />
            <stop offset="55%" stopColor="#78716c" />
            <stop offset="100%" stopColor="#44403c" />
          </radialGradient>
        </defs>
        <ellipse cx="50" cy="58" rx="40" ry="36" fill="url(#rockGrad)" />
        <ellipse cx="38" cy="44" rx="10" ry="8" fill="#9ca3af" opacity="0.6" />
        <path
          d="M22 55 Q28 72 50 72 Q72 72 78 55"
          stroke="#292524"
          strokeWidth="2"
          fill="none"
          opacity="0.5"
        />
        <circle cx="35" cy="40" r="3" fill="#292524" opacity="0.3" />
        <circle cx="62" cy="48" r="2.5" fill="#292524" opacity="0.3" />
      </svg>
    );
  }

  if (choice === 'paper') {
    return (
      <svg {...common}>
        <defs>
          <linearGradient id="paperGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#e7e5e4" />
          </linearGradient>
        </defs>
        <rect
          x="24"
          y="18"
          width="52"
          height="64"
          rx="4"
          fill="url(#paperGrad)"
          stroke="#d6d3d1"
          strokeWidth="1.5"
        />
        <line x1="34" y1="32" x2="66" y2="32" stroke="#cbd5e1" strokeWidth="2" />
        <line x1="34" y1="42" x2="66" y2="42" stroke="#cbd5e1" strokeWidth="2" />
        <line x1="34" y1="52" x2="66" y2="52" stroke="#cbd5e1" strokeWidth="2" />
        <line x1="34" y1="62" x2="56" y2="62" stroke="#cbd5e1" strokeWidth="2" />
        <path d="M76 18 L76 30 L64 18 Z" fill="#f5f5f4" stroke="#d6d3d1" strokeWidth="1.5" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <defs>
        <linearGradient id="scissorsGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <g stroke="url(#scissorsGrad)" strokeWidth="7" strokeLinecap="round" fill="none">
        <line x1="50" y1="52" x2="22" y2="26" />
        <line x1="50" y1="52" x2="78" y2="26" />
      </g>
      <circle cx="22" cy="26" r="11" fill="none" stroke="url(#scissorsGrad)" strokeWidth="6" />
      <circle cx="78" cy="26" r="11" fill="none" stroke="url(#scissorsGrad)" strokeWidth="6" />
      <g stroke="#78350f" strokeWidth="6" strokeLinecap="round" fill="none">
        <line x1="50" y1="52" x2="60" y2="82" />
        <line x1="50" y1="52" x2="40" y2="82" />
      </g>
      <circle cx="50" cy="52" r="4" fill="#78350f" />
    </svg>
  );
};

export default ChoiceIcon;
