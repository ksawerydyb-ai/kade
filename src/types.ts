export type Choice = 'rock' | 'paper' | 'scissors';

export type PlayerRole = 'admin' | 'player';

export type PlayerStatus = 'lobby' | 'in_match';

export type Screen = 'username' | 'lobby' | 'match';

export interface Player {
  id: string;
  username: string;
  role: PlayerRole;
  status: PlayerStatus;
  isSelf: boolean;
}

export type RoundPhase = 'choosing' | 'reveal' | 'finished';

export interface RoundState {
  phase: RoundPhase;
  player1Choice: Choice | null;
  player2Choice: Choice | null;
  winnerId: string | null; // null = tie or none
  player1Score: number;
  player2Score: number;
  roundNumber: number;
  timerEndsAt: number | null;
}

export interface MatchState {
  player1Id: string | null;
  player2Id: string | null;
  round: RoundState;
  matchWinnerId: string | null;
  alertMessage: string | null;
  alertAction: 'reset_and_lobby' | 'none' | 'match_done' | null;
}

export interface RoomState {
  players: Player[];
  match: MatchState;
  lastUpdated: number;
}

export const CHOICES: Choice[] = ['rock', 'paper', 'scissors'];

export const POINTS_TO_WIN = 3;
export const TURN_DURATION_MS = 15000;
export const REVEAL_DURATION_MS = 3000;
export const MATCH_WIN_POINTS = 3;
