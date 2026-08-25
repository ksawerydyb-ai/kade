import { Choice, RoundState, MATCH_WIN_POINTS } from './types';

export interface RoundResult {
  winnerId: string | null;
  player1Wins: boolean;
  player2Wins: boolean;
  isTie: boolean;
}

export function determineRoundWinner(
  p1Choice: Choice,
  p2Choice: Choice,
  player1Id: string,
  player2Id: string
): RoundResult {
  if (p1Choice === p2Choice) {
    return {
      winnerId: null,
      player1Wins: false,
      player2Wins: false,
      isTie: true,
    };
  }

  const p1Wins =
    (p1Choice === 'rock' && p2Choice === 'scissors') ||
    (p1Choice === 'paper' && p2Choice === 'rock') ||
    (p1Choice === 'scissors' && p2Choice === 'paper');

  return {
    winnerId: p1Wins ? player1Id : player2Id,
    player1Wins: p1Wins,
    player2Wins: !p1Wins,
    isTie: false,
  };
}

export function applyRoundResult(
  round: RoundState,
  result: RoundResult,
  player1Id: string,
  player2Id: string
): { newRound: RoundState; matchWinnerId: string | null } {
  const player1Score = round.player1Score + (result.player1Wins ? 1 : 0);
  const player2Score = round.player2Score + (result.player2Wins ? 1 : 0);

  let matchWinnerId: string | null = null;
  if (player1Score >= MATCH_WIN_POINTS) matchWinnerId = player1Id;
  else if (player2Score >= MATCH_WIN_POINTS) matchWinnerId = player2Id;

  const newRound: RoundState = {
    ...round,
    phase: 'finished',
    player1Score,
    player2Score,
    winnerId: result.winnerId,
  };

  return { newRound, matchWinnerId };
}

export function buildNextRound(
  currentRound: RoundState,
  timerDurationMs: number,
  now: number
): RoundState {
  return {
    phase: 'choosing',
    player1Choice: null,
    player2Choice: null,
    winnerId: null,
    player1Score: currentRound.player1Score,
    player2Score: currentRound.player2Score,
    roundNumber: currentRound.roundNumber + 1,
    timerEndsAt: now + timerDurationMs,
  };
}

export function buildResetRound(
  timerDurationMs: number,
  now: number
): RoundState {
  return {
    phase: 'choosing',
    player1Choice: null,
    player2Choice: null,
    winnerId: null,
    player1Score: 0,
    player2Score: 0,
    roundNumber: 1,
    timerEndsAt: now + timerDurationMs,
  };
}

export function buildInitialMatch(
  player1Id: string,
  player2Id: string,
  timerDurationMs: number,
  now: number
) {
  return {
    player1Id,
    player2Id,
    round: buildResetRound(timerDurationMs, now),
    matchWinnerId: null,
    alertMessage: null,
    alertAction: 'none' as const,
  };
}

export function describeOutcome(
  p1Choice: Choice,
  p2Choice: Choice
): { verb: string; winnerChoice: Choice; loserChoice: Choice } | null {
  if (p1Choice === p2Choice) return null;
  const order: [Choice, Choice, string][] = [
    ['rock', 'scissors', 'crushes'],
    ['paper', 'rock', 'covers'],
    ['scissors', 'paper', 'cuts'],
  ];
  for (const [win, lose, verb] of order) {
    if (p1Choice === win && p2Choice === lose)
      return { verb, winnerChoice: win, loserChoice: lose };
    if (p2Choice === win && p1Choice === lose)
      return { verb, winnerChoice: win, loserChoice: lose };
  }
  return null;
}

export function bothChosen(round: RoundState): boolean {
  return round.player1Choice !== null && round.player2Choice !== null;
}

export function anyChosen(round: RoundState): boolean {
  return round.player1Choice !== null || round.player2Choice !== null;
}

export function choiceBeats(a: Choice, b: Choice): boolean {
  if (a === b) return false;
  return (
    (a === 'rock' && b === 'scissors') ||
    (a === 'paper' && b === 'rock') ||
    (a === 'scissors' && b === 'paper')
  );
}
