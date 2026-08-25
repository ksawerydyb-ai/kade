import React, { useMemo } from 'react';
import { GameApi } from '../hooks/useGame';
import { Choice, POINTS_TO_WIN } from '../types';
import { ChoiceButton } from './ChoiceButton';
import { TimerBar } from './TimerBar';
import { BattleStage } from './BattleStage';
import { determineRoundWinner } from '../gameLogic';

interface ArenaScreenProps {
  game: GameApi;
}

export const ArenaScreen: React.FC<ArenaScreenProps> = ({ game }) => {
  const self = game.self;
  const match = game.roomState.match;
  const round = match.round;
  const players = game.roomState.players;

  const p1 = players.find((p) => p.id === match.player1Id);
  const p2 = players.find((p) => p.id === match.player2Id);

  const isPlayer1 = self?.id === match.player1Id;
  const isPlayer2 = self?.id === match.player2Id;
  const isParticipant = isPlayer1 || isPlayer2;
  const isSpectator = self && !isParticipant;

  const myChoice = isPlayer1 ? round.player1Choice : round.player2Choice;
  const hasAlert = match.alertAction === 'reset_and_lobby';
  const matchDone = match.alertAction === 'match_done' && match.matchWinnerId;

  const result = useMemo(() => {
    if (!bothChosen(round) || !match.player1Id || !match.player2Id) return null;
    return determineRoundWinner(
      round.player1Choice!,
      round.player2Choice!,
      match.player1Id,
      match.player2Id
    );
  }, [round, match.player1Id, match.player2Id]);

  const p1IsWinner = round.phase !== 'choosing' && result?.player1Wins === true;
  const p2IsWinner = round.phase !== 'choosing' && result?.player2Wins === true;
  const isTie = round.phase !== 'choosing' && result?.isTie === true;

  const matchWinner = players.find((p) => p.id === match.matchWinnerId);

  const revealChoices = round.phase === 'reveal' || round.phase === 'finished';
  const showP1Choice = revealChoices ? round.player1Choice : null;
  const showP2Choice = revealChoices ? round.player2Choice : null;

  if (!p1 || !p2) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-8 text-center">
          <p className="text-slate-300">Match setup incomplete.</p>
          <button
            onClick={game.backToLobby}
            className="mt-4 rounded-xl bg-white/10 px-5 py-2 font-bold text-white hover:bg-white/20"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  if (hasAlert) {
    return (
      <AlertOverlay
        message={match.alertMessage ?? 'Match reset.'}
        onContinue={game.backToLobby}
        isParticipant={!!isParticipant}
      />
    );
  }

  if (matchDone && matchWinner) {
    return (
      <MatchWinnerOverlay
        winnerName={matchWinner.username}
        isWinner={matchWinner.id === self?.id}
        isParticipant={!!isParticipant}
        onContinue={game.backToLobby}
        onRematch={game.resetMatch}
        canRematch={!!isParticipant}
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col p-4">
      <div className="mx-auto w-full max-w-4xl flex-1">
        <ScoreHeader
          p1Name={p1.username}
          p2Name={p2.username}
          p1Score={round.player1Score}
          p2Score={round.player2Score}
          roundNumber={round.roundNumber}
          p1IsSelf={isPlayer1}
          p2IsSelf={isPlayer2}
        />

        <div className="mt-4 rounded-2xl border border-white/10 bg-slate-900/60 p-5">
          {round.phase === 'choosing' && (
            <TimerBar timerEndsAt={round.timerEndsAt} />
          )}
          {round.phase !== 'choosing' && (
            <div className="h-[52px]" />
          )}

          <div className="mt-4">
            <BattleStage
              p1Choice={showP1Choice as Choice | null}
              p2Choice={showP2Choice as Choice | null}
              p1Name={p1.username}
              p2Name={p2.username}
              p1IsWinner={p1IsWinner}
              p2IsWinner={p2IsWinner}
              isTie={isTie}
              phase={round.phase === 'choosing' ? 'reveal' : 'finished'}
            />
          </div>

          {round.phase === 'choosing' && (
            <div className="mt-4">
              {isParticipant ? (
                <div>
                  <p className="mb-3 text-center text-sm font-bold uppercase tracking-widest text-slate-400">
                    {myChoice
                      ? 'Waiting for opponent…'
                      : 'Make your move!'}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5">
                    {(['rock', 'paper', 'scissors'] as Choice[]).map((c) => (
                      <ChoiceButton
                        key={c}
                        choice={c}
                        selected={myChoice === c}
                        disabled={!!myChoice}
                        revealed={false}
                        onClick={() => game.makeChoice(c)}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-center text-sm font-bold uppercase tracking-widest text-slate-400">
                  Spectating — players are choosing…
                </p>
              )}
            </div>
          )}

          {round.phase !== 'choosing' && (
            <div className="mt-2 text-center">
              <p className="text-sm font-bold uppercase tracking-widest text-slate-400">
                {isTie
                  ? 'Tie round!'
                  : p1IsWinner
                  ? `${p1.username} wins the round!`
                  : p2IsWinner
                  ? `${p2.username} wins the round!`
                  : 'Revealing…'}
              </p>
            </div>
          )}
        </div>

        {isSpectator && (
          <div className="mt-4 text-center">
            <span className="rounded-full bg-white/5 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-slate-400">
              You are spectating
            </span>
          </div>
        )}

        {isParticipant && (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => {
                if (
                  confirm(
                    'Leave the match? This will reset the score and return both players to the lobby.'
                  )
                ) {
                  game.backToLobby();
                }
              }}
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-2 text-sm font-bold text-slate-300 hover:bg-white/10"
            >
              Forfeit Match
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

function bothChosen(round: { player1Choice: Choice | null; player2Choice: Choice | null }) {
  return round.player1Choice !== null && round.player2Choice !== null;
}

interface ScoreHeaderProps {
  p1Name: string;
  p2Name: string;
  p1Score: number;
  p2Score: number;
  roundNumber: number;
  p1IsSelf: boolean;
  p2IsSelf: boolean;
}

const ScoreHeader: React.FC<ScoreHeaderProps> = ({
  p1Name,
  p2Name,
  p1Score,
  p2Score,
  roundNumber,
  p1IsSelf,
  p2IsSelf,
}) => (
  <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
    <div className="mb-3 flex items-center justify-center">
      <span className="rounded-full bg-amber-400/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-amber-300">
        Round {roundNumber} — First to {POINTS_TO_WIN}
      </span>
    </div>
    <div className="grid grid-cols-3 items-center gap-2">
      <ScoreSide name={p1Name} score={p1Score} isSelf={p1IsSelf} align="left" />
      <div className="text-center">
        <div className="text-2xl font-black text-slate-500">VS</div>
      </div>
      <ScoreSide name={p2Name} score={p2Score} isSelf={p2IsSelf} align="right" />
    </div>
  </div>
);

interface ScoreSideProps {
  name: string;
  score: number;
  isSelf: boolean;
  align: 'left' | 'right';
}

const ScoreSide: React.FC<ScoreSideProps> = ({ name, score, isSelf, align }) => (
  <div className={`flex flex-col ${align === 'right' ? 'items-end' : 'items-start'}`}>
    <div className="flex items-center gap-2">
      <span className="max-w-[120px] truncate font-bold text-white">{name}</span>
      {isSelf && (
        <span className="rounded bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-300">
          You
        </span>
      )}
    </div>
    <div className="flex gap-1.5 mt-1">
      {Array.from({ length: POINTS_TO_WIN }).map((_, i) => (
        <span
          key={i}
          className={`h-3 w-3 rounded-full transition-colors ${
            i < score
              ? 'bg-gradient-to-br from-amber-300 to-orange-500 shadow-sm shadow-orange-500/50'
              : 'bg-white/10'
          }`}
        />
      ))}
    </div>
    <div className="mt-1 text-3xl font-black tabular-nums text-white">{score}</div>
  </div>
);

interface AlertOverlayProps {
  message: string;
  onContinue: () => void;
  isParticipant: boolean;
}

const AlertOverlay: React.FC<AlertOverlayProps> = ({ message, onContinue, isParticipant }) => (
  <div className="flex min-h-screen items-center justify-center p-4">
    <div className="w-full max-w-md animate-fade-in-up rounded-3xl border border-red-400/30 bg-slate-900/80 p-8 text-center shadow-2xl backdrop-blur-xl">
      <div className="mb-4 text-5xl">⚠️</div>
      <h2 className="mb-2 text-2xl font-black uppercase text-red-400">Match Reset</h2>
      <p className="mb-6 text-slate-300">{message}</p>
      <p className="mb-6 text-sm text-slate-500">
        Score reset to 0:0. Returning to the lobby.
      </p>
      {isParticipant ? (
        <button
          onClick={onContinue}
          className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-3 text-lg font-black uppercase tracking-wider text-slate-900 transition-all hover:scale-[1.02] active:scale-95"
        >
          Back to Lobby
        </button>
      ) : (
        <p className="text-xs text-slate-500">Waiting for players to return…</p>
      )}
    </div>
  </div>
);

interface MatchWinnerOverlayProps {
  winnerName: string;
  isWinner: boolean;
  isParticipant: boolean;
  onContinue: () => void;
  onRematch: () => void;
  canRematch: boolean;
}

const MatchWinnerOverlay: React.FC<MatchWinnerOverlayProps> = ({
  winnerName,
  isWinner,
  isParticipant,
  onContinue,
  onRematch,
  canRematch,
}) => (
  <div className="flex min-h-screen items-center justify-center p-4">
    <div className="w-full max-w-md animate-fade-in-up rounded-3xl border border-amber-400/40 bg-slate-900/80 p-8 text-center shadow-2xl shadow-amber-500/20 backdrop-blur-xl">
      <div className="mb-4 text-6xl animate-victory-glow">🏆</div>
      <h2 className="mb-2 text-3xl font-black uppercase text-amber-300">
        {isWinner ? 'You Win!' : `${winnerName} Wins!`}
      </h2>
      <p className="mb-6 text-slate-400">
        {isWinner
          ? 'Congratulations, champion!'
          : 'Better luck next time, challenger.'}
      </p>
      <div className="space-y-3">
        {canRematch && (
          <button
            onClick={onRematch}
            className="w-full rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 px-6 py-3 text-lg font-black uppercase tracking-wider text-slate-900 transition-all hover:scale-[1.02] active:scale-95"
          >
            Rematch
          </button>
        )}
        {isParticipant && (
          <button
            onClick={onContinue}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-bold text-white hover:bg-white/10"
          >
            Back to Lobby
          </button>
        )}
      </div>
    </div>
  </div>
);

export default ArenaScreen;
