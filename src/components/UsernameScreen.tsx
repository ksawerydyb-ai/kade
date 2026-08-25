import React, { useState } from 'react';
import { GameApi } from '../hooks/useGame';
import { createRoomUrl } from '../lib/room';

interface UsernameScreenProps {
  game: GameApi;
}

export const UsernameScreen: React.FC<UsernameScreenProps> = ({ game }) => {
  const [username, setUsername] = useState('');
  const [asAdmin, setAsAdmin] = useState(true);
  const [copied, setCopied] = useState(false);

  const hasAdmin = game.roomState.players.some((p) => p.role === 'admin');
  const roomUrl = createRoomUrl(game.roomId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim().length < 2) return;
    game.joinRoom(username.trim(), asAdmin && !hasAdmin);
  };

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(roomUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-8 text-center">
          <div className="mb-2 flex items-center justify-center gap-2">
            <span className="text-5xl">✊</span>
            <span className="text-5xl">✋</span>
            <span className="text-5xl">✌️</span>
          </div>
          <h1 className="bg-gradient-to-r from-amber-300 via-orange-400 to-red-400 bg-clip-text text-3xl font-black uppercase tracking-tight text-transparent">
            Rock Paper Scissors
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Multiplayer Arcade Battle
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">
              Choose your username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={16}
              autoFocus
              placeholder="e.g. ArcadeKing"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-lg font-semibold text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30"
            />
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={asAdmin && !hasAdmin}
                disabled={hasAdmin}
                onChange={(e) => setAsAdmin(e.target.checked)}
                className="h-5 w-5 accent-amber-400"
              />
              <div className="flex-1">
                <div className="text-sm font-bold text-slate-200">
                  Join as Admin
                </div>
                <div className="text-xs text-slate-400">
                  Admin can invite friends and start matches.
                </div>
              </div>
            </label>
            {hasAdmin && (
              <p className="mt-2 text-xs text-amber-400">
                An admin already exists — you will join as a player.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={username.trim().length < 2}
            className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-3 text-lg font-black uppercase tracking-wider text-slate-900 shadow-lg shadow-orange-500/30 transition-all hover:scale-[1.02] hover:shadow-orange-500/50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
          >
            Enter the Arena
          </button>
        </form>

        <div className="mt-6 rounded-xl border border-white/10 bg-slate-950/50 p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Room Link — Invite Friends
            </span>
          </div>
          <p className="text-xs leading-relaxed text-slate-400">
            Share this link with friends so they can join your room. Anyone
            opening it connects in real time, even on a different device.
          </p>
          <div className="mt-2 flex items-center gap-2 rounded-lg bg-black/40 px-3 py-2">
            <code className="flex-1 truncate text-xs text-slate-300">
              {roomUrl}
            </code>
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-md bg-white/10 px-2 py-1 text-xs font-bold text-white hover:bg-white/20"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsernameScreen;
