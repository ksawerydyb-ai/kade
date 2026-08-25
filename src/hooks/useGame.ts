import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Player,
  RoomState,
  Screen,
  Choice,
  TURN_DURATION_MS,
  REVEAL_DURATION_MS,
  POINTS_TO_WIN,
} from '../types';
import {
  buildInitialMatch,
  buildNextRound,
  determineRoundWinner,
  applyRoundResult,
  bothChosen,
} from '../gameLogic';
import { supabase } from '../lib/supabase';

const HEARTBEAT_INTERVAL_MS = 3000;
const PRESENCE_TIMEOUT_MS = 10000;
const REVEAL_TICK_MS = 100;
const STATE_EVENT = 'state';

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function getOrCreateSelfId(): string {
  const key = 'rps-game-self-id';
  const existing = sessionStorage.getItem(key);
  if (existing) return existing;
  const id = uid();
  sessionStorage.setItem(key, id);
  return id;
}

function emptyMatch(): RoomState['match'] {
  return {
    player1Id: null,
    player2Id: null,
    round: {
      phase: 'choosing',
      player1Choice: null,
      player2Choice: null,
      winnerId: null,
      player1Score: 0,
      player2Score: 0,
      roundNumber: 1,
      timerEndsAt: null,
    },
    matchWinnerId: null,
    alertMessage: null,
    alertAction: 'none',
  };
}

function emptyRoomState(): RoomState {
  return { players: [], match: emptyMatch(), lastUpdated: Date.now() };
}

export interface GameApi {
  selfId: string;
  self: Player | null;
  roomState: RoomState;
  screen: Screen;
  roomId: string;
  joinRoom: (username: string, asAdmin: boolean) => void;
  leaveRoom: () => void;
  startMatch: (p1Id: string, p2Id: string) => void;
  makeChoice: (choice: Choice) => void;
  backToLobby: () => void;
  resetMatch: () => void;
  isConnected: boolean;
}

export function useGame(roomId: string): GameApi {
  const selfIdRef = useRef<string>(getOrCreateSelfId());
  const [roomState, setRoomState] = useState<RoomState>(emptyRoomState);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const roomStateRef = useRef<RoomState>(roomState);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const presenceCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const self: Player | null =
    roomState.players.find((p) => p.id === selfIdRef.current) ?? null;

  const screen: Screen = (() => {
    if (!self) return 'username';
    const match = roomState.match;
    if (
      match.alertAction === 'match_done' &&
      match.matchWinnerId === selfIdRef.current
    ) {
      return 'match';
    }
    if (
      match.player1Id === selfIdRef.current ||
      match.player2Id === selfIdRef.current
    ) {
      return 'match';
    }
    return 'lobby';
  })();

  const broadcastState = useCallback((state: RoomState) => {
    channelRef.current?.send({
      type: 'broadcast',
      event: STATE_EVENT,
      payload: state,
    });
  }, []);

  const mutateRoom = useCallback(
    (mutator: (prev: RoomState) => RoomState) => {
      setRoomState((prev) => {
        const next = mutator(prev);
        broadcastState(next);
        return next;
      });
    },
    [broadcastState]
  );

  const cleanupTimers = useCallback(() => {
    if (revealTimeoutRef.current) {
      clearTimeout(revealTimeoutRef.current);
      revealTimeoutRef.current = null;
    }
  }, []);

  const processReveal = useCallback(
    (state: RoomState): RoomState => {
      const match = state.match;
      const round = match.round;
      if (round.phase !== 'choosing') return state;
      if (!bothChosen(round)) return state;
      if (!match.player1Id || !match.player2Id) return state;

      const result = determineRoundWinner(
        round.player1Choice!,
        round.player2Choice!,
        match.player1Id,
        match.player2Id
      );
      const { newRound, matchWinnerId } = applyRoundResult(
        round,
        result,
        match.player1Id,
        match.player2Id
      );

      return {
        ...state,
        match: {
          ...match,
          round: newRound,
          matchWinnerId,
          alertMessage: null,
          alertAction: 'none',
        },
        lastUpdated: Date.now(),
      };
    },
    []
  );

  const scheduleAdvance = useCallback(
    (currentState: RoomState) => {
      cleanupTimers();
      revealTimeoutRef.current = setTimeout(() => {
        setRoomState((prev) => {
          const match = prev.match;
          if (match.matchWinnerId) {
            const next: RoomState = {
              ...prev,
              match: {
                ...match,
                alertAction: 'match_done',
                alertMessage: null,
                round: {
                  ...match.round,
                  phase: 'finished',
                  timerEndsAt: null,
                },
              },
              lastUpdated: Date.now(),
            };
            broadcastState(next);
            return next;
          }
          const nextRound = buildNextRound(
            match.round,
            TURN_DURATION_MS,
            Date.now()
          );
          const next: RoomState = {
            ...prev,
            match: {
              ...match,
              round: nextRound,
              alertMessage: null,
              alertAction: 'none',
            },
            lastUpdated: Date.now(),
          };
          broadcastState(next);
          return next;
        });
      }, REVEAL_DURATION_MS);
    },
    [cleanupTimers, broadcastState]
  );

  useEffect(() => {
    const channel = supabase.channel(`room:${roomId}`, {
      config: {
        presence: { key: selfIdRef.current },
        broadcast: { self: false },
      },
    });

    channelRef.current = channel;

    channel
      .on('broadcast', { event: STATE_EVENT }, (msg) => {
        const incoming = msg.payload as RoomState;
        if (!incoming || !incoming.players || !incoming.match) return;
        if (incoming.lastUpdated >= roomStateRef.current.lastUpdated) {
          setRoomState(incoming);
          const round = incoming.match.round;
          if (
            (round.phase === 'reveal' ||
              (round.phase === 'finished' &&
                !incoming.match.matchWinnerId &&
                incoming.match.alertAction === 'none')) &&
            !revealTimeoutRef.current
          ) {
            scheduleAdvance(incoming);
          }
        }
      })
      .on('presence', { event: 'sync' }, () => {
        setIsConnected(true);
      })
      .on('presence', { event: 'join' }, () => {})
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        if (!leftPresences) return;
        const leftIds = (leftPresences as unknown as Array<{
          playerId?: string;
        }>).filter((p) => p && p.playerId);
        const leftPlayerIds = new Set(
          leftIds.map((p) => p.playerId).filter(Boolean) as string[]
        );
        if (leftPlayerIds.size === 0) return;

        setRoomState((prev) => {
          const remaining = prev.players.filter(
            (p) => !leftPlayerIds.has(p.id)
          );
          const match = prev.match;
          const activeMatch =
            match.player1Id !== null && match.round.phase !== 'finished';

          if (
            activeMatch &&
            ((match.player1Id && leftPlayerIds.has(match.player1Id)) ||
              (match.player2Id && leftPlayerIds.has(match.player2Id)))
          ) {
            const missingName =
              (match.player1Id && leftPlayerIds.has(match.player1Id)
                ? prev.players.find((p) => p.id === match.player1Id)?.username
                : null) ??
              (match.player2Id && leftPlayerIds.has(match.player2Id)
                ? prev.players.find((p) => p.id === match.player2Id)?.username
                : null) ??
              'A player';
            const next: RoomState = {
              ...prev,
              players: remaining,
              match: {
                ...match,
                alertMessage: `${missingName} disconnected. Match reset.`,
                alertAction: 'reset_and_lobby',
                round: {
                  ...match.round,
                  phase: 'finished',
                  timerEndsAt: null,
                },
              },
              lastUpdated: Date.now(),
            };
            broadcastState(next);
            cleanupTimers();
            return next;
          }

          if (remaining.length !== prev.players.length) {
            const next: RoomState = {
              ...prev,
              players: remaining,
              lastUpdated: Date.now(),
            };
            broadcastState(next);
            return next;
          }
          return prev;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          await channel.track({
            playerId: selfIdRef.current,
            joinedAt: Date.now(),
          });
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setIsConnected(false);
        }
      });

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
      cleanupTimers();
    };
  }, [roomId, scheduleAdvance, broadcastState, cleanupTimers]);

  useEffect(() => {
    roomStateRef.current = roomState;
  }, [roomState]);

  useEffect(() => {
    const beat = async () => {
      const channel = channelRef.current;
      if (!channel) return;
      await channel.track({
        playerId: selfIdRef.current,
        lastSeen: Date.now(),
      });
    };
    heartbeatRef.current = setInterval(beat, HEARTBEAT_INTERVAL_MS);
    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, []);

  useEffect(() => {
    presenceCheckRef.current = setInterval(() => {
      const channel = channelRef.current;
      if (!channel) return;
      const state = channel.presenceState();
      const now = Date.now();
      const stillConnected = new Set<string>();
      for (const [, presences] of Object.entries(state)) {
        for (const p of presences as Array<{ playerId?: string; lastSeen?: number }>) {
          if (p.playerId) {
            if (!p.lastSeen || now - p.lastSeen < PRESENCE_TIMEOUT_MS) {
              stillConnected.add(p.playerId);
            }
          }
        }
      }

      setRoomState((prev) => {
        const match = prev.match;
        const activeMatch =
          match.player1Id !== null &&
          match.round.phase !== 'finished' &&
          match.alertAction === 'none';

        if (
          activeMatch &&
          ((match.player1Id && !stillConnected.has(match.player1Id)) ||
            (match.player2Id && !stillConnected.has(match.player2Id)))
        ) {
          const missingName =
            (match.player1Id && !stillConnected.has(match.player1Id)
              ? prev.players.find((p) => p.id === match.player1Id)?.username
              : null) ??
            (match.player2Id && !stillConnected.has(match.player2Id)
              ? prev.players.find((p) => p.id === match.player2Id)?.username
              : null) ??
            'A player';
          const next: RoomState = {
            ...prev,
            players: prev.players.filter((p) => stillConnected.has(p.id)),
            match: {
              ...match,
              alertMessage: `${missingName} disconnected. Match reset.`,
              alertAction: 'reset_and_lobby',
              round: {
                ...match.round,
                phase: 'finished',
                timerEndsAt: null,
              },
            },
            lastUpdated: Date.now(),
          };
          broadcastState(next);
          cleanupTimers();
          return next;
        }

        const filtered = prev.players.filter((p) => stillConnected.has(p.id));
        if (filtered.length !== prev.players.length) {
          const next: RoomState = {
            ...prev,
            players: filtered,
            lastUpdated: Date.now(),
          };
          broadcastState(next);
          return next;
        }
        return prev;
      });
    }, 3000);
    return () => {
      if (presenceCheckRef.current) clearInterval(presenceCheckRef.current);
    };
  }, [broadcastState, cleanupTimers]);

  useEffect(() => {
    tickRef.current = setInterval(() => {
      setRoomState((prev) => {
        const match = prev.match;
        const round = match.round;
        if (round.phase !== 'choosing' || !round.timerEndsAt) return prev;
        const now = Date.now();
        if (now >= round.timerEndsAt) {
          if (match.player1Id && match.player2Id) {
            if (!round.player1Choice || !round.player2Choice) {
              const next: RoomState = {
                ...prev,
                match: {
                  ...match,
                  alertMessage: 'Time is up! Match reset to 0:0.',
                  alertAction: 'reset_and_lobby',
                  round: { ...round, phase: 'finished', timerEndsAt: null },
                },
                lastUpdated: now,
              };
              broadcastState(next);
              cleanupTimers();
              return next;
            }
          }
        }
        return prev;
      });
    }, REVEAL_TICK_MS);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [broadcastState, cleanupTimers]);

  useEffect(() => {
    return () => {
      cleanupTimers();
    };
  }, [cleanupTimers]);

  const joinRoom = useCallback(
    (username: string, asAdmin: boolean) => {
      const selfId = selfIdRef.current;
      mutateRoom((prev) => {
        const existing = prev.players.find((p) => p.id === selfId);
        if (existing) {
          return {
            ...prev,
            players: prev.players.map((p) =>
              p.id === selfId
                ? { ...p, username, role: asAdmin ? 'admin' : p.role }
                : p
            ),
            lastUpdated: Date.now(),
          };
        }
        const hasAdmin = prev.players.some((p) => p.role === 'admin');
        const role = asAdmin && !hasAdmin ? 'admin' : 'player';
        const newPlayer: Player = {
          id: selfId,
          username,
          role,
          status: 'lobby',
          isSelf: false,
        };
        return {
          ...prev,
          players: [...prev.players, newPlayer],
          lastUpdated: Date.now(),
        };
      });
    },
    [mutateRoom]
  );

  const leaveRoom = useCallback(() => {
    const selfId = selfIdRef.current;
    mutateRoom((prev) => {
      const remaining = prev.players.filter((p) => p.id !== selfId);
      let match = prev.match;
      if (match.player1Id === selfId || match.player2Id === selfId) {
        match = { ...emptyMatch(), alertMessage: null, alertAction: 'none' };
      }
      return { ...prev, players: remaining, match, lastUpdated: Date.now() };
    });
    cleanupTimers();
  }, [mutateRoom, cleanupTimers]);

  const startMatch = useCallback(
    (p1Id: string, p2Id: string) => {
      mutateRoom((prev) => {
        const match = buildInitialMatch(p1Id, p2Id, TURN_DURATION_MS, Date.now());
        return {
          ...prev,
          match: { ...match, alertMessage: null, alertAction: 'none' },
          players: prev.players.map((p) =>
            p.id === p1Id || p.id === p2Id
              ? { ...p, status: 'in_match' }
              : { ...p, status: 'lobby' }
          ),
          lastUpdated: Date.now(),
        };
      });
    },
    [mutateRoom]
  );

  const makeChoice = useCallback(
    (choice: Choice) => {
      const selfId = selfIdRef.current;
      setRoomState((prev) => {
        const match = prev.match;
        if (match.round.phase !== 'choosing') return prev;
        let updatedRound = match.round;
        if (match.player1Id === selfId) {
          if (match.round.player1Choice) return prev;
          updatedRound = { ...updatedRound, player1Choice: choice };
        } else if (match.player2Id === selfId) {
          if (match.round.player2Choice) return prev;
          updatedRound = { ...updatedRound, player2Choice: choice };
        } else {
          return prev;
        }

        let next: RoomState = {
          ...prev,
          match: { ...match, round: updatedRound },
          lastUpdated: Date.now(),
        };

        if (bothChosen(updatedRound)) {
          next = processReveal(next);
          next = {
            ...next,
            match: {
              ...next.match,
              round: { ...next.match.round, phase: 'reveal', timerEndsAt: null },
            },
          };
          scheduleAdvance(next);
        }
        broadcastState(next);
        return next;
      });
    },
    [processReveal, scheduleAdvance, broadcastState]
  );

  const backToLobby = useCallback(() => {
    cleanupTimers();
    mutateRoom((prev) => ({
      ...prev,
      match: { ...emptyMatch(), alertAction: 'none', alertMessage: null },
      players: prev.players.map((p) => ({ ...p, status: 'lobby' })),
      lastUpdated: Date.now(),
    }));
  }, [mutateRoom, cleanupTimers]);

  const resetMatch = useCallback(() => {
    cleanupTimers();
    mutateRoom((prev) => {
      if (!prev.match.player1Id || !prev.match.player2Id) return prev;
      const match = buildInitialMatch(
        prev.match.player1Id,
        prev.match.player2Id,
        TURN_DURATION_MS,
        Date.now()
      );
      return {
        ...prev,
        match: { ...match, alertMessage: null, alertAction: 'none' },
        lastUpdated: Date.now(),
      };
    });
  }, [mutateRoom, cleanupTimers]);

  const markSelfFlag = (p: Player): Player => ({
    ...p,
    isSelf: p.id === selfIdRef.current,
  });

  const visibleRoomState: RoomState = {
    ...roomState,
    players: roomState.players.map(markSelfFlag),
  };

  return {
    selfId: selfIdRef.current,
    self: self ? markSelfFlag(self) : null,
    roomState: visibleRoomState,
    screen,
    roomId,
    joinRoom,
    leaveRoom,
    startMatch,
    makeChoice,
    backToLobby,
    resetMatch,
    isConnected,
  };
}

export { POINTS_TO_WIN };
