import React, { useState } from 'react';
import { GameApi } from '../hooks/useGame';
import { Player } from '../types';
import { createRoomUrl } from '../lib/room';

interface LobbyScreenProps {
  game: GameApi;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({ game }) => {
  const self = game.self;
  const isAdmin = self?.role === 'admin';
  const players = game.roomState.players;
  const [p1Id, setP1Id] = useState<string>('');
  const [p2Id, setP2Id] = useState<string>('');

  const availablePlayers = players.filter((p) => p.status === 'lobby');
  const canStart =
    isAdmin &&
    p1Id &&
    p2Id &&
    p1Id !== p2Id &&
    availablePlayers.length >= 2;

  const roomUrl = createRoomUrl(game.roomId);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(roomUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex min-h-screen items-start justify-center p-4 pt-12">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
          <h1 className="bg-gradient-to-r from-amber-300 via-orange-400 to-red-400 bg-clip-text text-3xl font-black uppercase tracking-tight text-transparent">
            Game Lobby
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Waiting for players — first to 3 wins the match
          </p>
        </div>

        {isAdmin && (
          <div className="rounded-2xl border border-amber-400/30 bg-amber-400/5 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-300">
                Admin — Invite Friends
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="rounded-lg bg-amber-400/20 px-3 py-1 text-xs font-bold text-amber-200 hover:bg-amber-400/30"
              >
                {copied ? 'Copied!' : 'Copy link'}
              </button>
            </div>
            <code className="block truncate rounded-lg bg-black/40 px-3 py-2 text-xs text-slate-300">
              {roomUrl}
            </code>
          </div>
        )}

        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">
              Connected Players
            </h2>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-300">
              {players.length} online
            </span>
          </div>

          {players.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">
              No players yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {players.map((p) => (
                <PlayerRow key={p.id} player={p} />
              ))}
            </ul>
          )}
        </div>

        {isAdmin && (
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
            <h2 className="mb-4 text-lg font-bold text-white">Start a Match</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <PlayerSelect
                label="Player 1"
                players={availablePlayers}
                value={p1Id}
                onChange={setP1Id}
                excludeId={p2Id}
              />
              <PlayerSelect
                label="Player 2"
                players={availablePlayers}
                value={p2Id}
                onChange={setP2Id}
                excludeId={p1Id}
              />
            </div>
            <button
              type="button"
              disabled={!canStart}
              onClick={() => game.startMatch(p1Id, p2Id)}
              className="mt-4 w-full rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 px-6 py-3 text-lg font-black uppercase tracking-wider text-slate-900 shadow-lg shadow-emerald-500/30 transition-all hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
            >
              Start Match
            </button>
            {availablePlayers.length < 2 && (
              <p className="mt-2 text-center text-xs text-slate-500">
                Need at least 2 players in the lobby to start.
              </p>
            )}
          </div>
        )}

        {!isAdmin && (
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 text-center">
            <p className="text-sm text-slate-400">
              Waiting for the admin to start a match. Hang tight!
            </p>
          </div>
        )}

        <div className="flex justify-center">
          <button
            type="button"
            onClick={game.leaveRoom}
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-2 text-sm font-bold text-slate-300 hover:bg-white/10"
          >
            Leave Room
          </button>
        </div>
      </div>
    </div>
  );
};

const PlayerRow: React.FC<{ player: Player }> = ({ player }) => (
  <li className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-sm font-black text-slate-900">
      {player.username.slice(0, 1).toUpperCase()}
    </div>
    <div className="flex-1">
      <div className="flex items-center gap-2">
        <span className="font-bold text-white">{player.username}</span>
        {player.isSelf && (
          <span className="rounded bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-300">
            You
          </span>
        )}
      </div>
      <span className="text-xs text-slate-500">
        {player.role === 'admin' ? 'Admin' : 'Player'}
      </span>
    </div>
    <span
      className={`flex items-center gap-1.5 text-xs font-bold ${
        player.status === 'in_match' ? 'text-red-400' : 'text-emerald-400'
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          player.status === 'in_match' ? 'bg-red-400' : 'bg-emerald-400'
        }`}
      />
      {player.status === 'in_match' ? 'In Match' : 'Ready'}
    </span>
  </li>
);

interface PlayerSelectProps {
  label: string;
  players: Player[];
  value: string;
  onChange: (id: string) => void;
  excludeId: string;
}

const PlayerSelect: React.FC<PlayerSelectProps> = ({
  label,
  players,
  value,
  onChange,
  excludeId,
}) => {
  const options = players.filter((p) => p.id !== excludeId);
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-400">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-white focus:border-amber-400 focus:outline-none"
      >
        <option value="" className="bg-slate-800">
          Select player…
        </option>
        {options.map((p) => (
          <option key={p.id} value={p.id} className="bg-slate-800">
            {p.username}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LobbyScreen;
