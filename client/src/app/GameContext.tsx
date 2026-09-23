import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { seatsAfter } from '@noctalis/shared';
import type {
  Ack,
  GameError,
  GameErrorCode,
  GameEvent,
  PlayerCredentials,
  PrivatePlayerState,
  PublicGameState,
  PublicPlayer,
  RoomState,
  StatePayload,
  TileColor,
} from '@noctalis/shared';
import { useI18n, type MessageKey } from '../i18n/index.js';
import { emitWithAck, getSocket } from '../lib/socket.js';
import { clearSession, loadSession, saveSession } from '../lib/storage.js';
import { playSound } from '../lib/audio.js';
import { useToasts } from '../hooks/useToasts.js';

export type ConnectionStatus = 'connecting' | 'online' | 'offline';

export interface GameActions {
  createRoom: (name: string) => Promise<{ ok: boolean; errorCode?: GameErrorCode }>;
  joinRoom: (name: string, code: string) => Promise<{ ok: boolean; errorCode?: GameErrorCode }>;
  startGame: () => Promise<boolean>;
  reveal: (color: TileColor) => Promise<boolean>;
  requestClassify: (tileNumber: number) => Promise<boolean>;
  submitClassify: (slot: number) => Promise<boolean>;
  requestCompare: (tileNumber: number, position: number) => Promise<boolean>;
  submitCompare: (answer: boolean) => Promise<boolean>;
  guess: (numbers: number[]) => Promise<boolean>;
  leaveRoom: () => Promise<void>;
  rematch: () => Promise<boolean>;
}

/** The draw of the first player, announced once per game. */
export interface StartingDraw {
  startingPlayerId: string;
  /** Reception time: identifies the announcement (new game, rematch). */
  at: number;
}

export interface GameContextValue {
  status: ConnectionStatus;
  credentials: PlayerCredentials | null;
  room: RoomState | null;
  publicState: PublicGameState | null;
  privateState: PrivatePlayerState | null;
  /** Last event received (one-off animations). */
  lastEvent: GameEvent | null;
  /**
   * Draw to announce, or `null` once announced. It comes from a real-time
   * event: a player reconnecting mid-game does not see the animation again.
   */
  startingDraw: StartingDraw | null;
  /** Closes the draw announcement. */
  dismissStartingDraw: () => void;
  me: PublicPlayer | null;
  /** Everybody else, in seating order: the player after me comes first. */
  rivals: PublicPlayer[];
  isMyTurn: boolean;
  mustAnswer: boolean;
  actions: GameActions;
}

const GameContext = createContext<GameContextValue | null>(null);

/**
 * Message shown for each server error code. The table is exhaustive
 * (TypeScript checks it): a new code forces its translation.
 */
const ERROR_KEYS: Record<GameErrorCode, MessageKey> = {
  PLAYER_NOT_FOUND: 'error.PLAYER_NOT_FOUND',
  NOT_YOUR_TURN: 'error.NOT_YOUR_TURN',
  WRONG_PHASE: 'error.WRONG_PHASE',
  INVALID_COLOR: 'error.INVALID_COLOR',
  COLOR_EXHAUSTED: 'error.COLOR_EXHAUSTED',
  TILE_NOT_PUBLIC: 'error.TILE_NOT_PUBLIC',
  INVALID_POSITION: 'error.INVALID_POSITION',
  INVALID_SLOT: 'error.INVALID_SLOT',
  NOT_RESPONDER: 'error.NOT_RESPONDER',
  GUESS_ALREADY_USED: 'error.GUESS_ALREADY_USED',
  INVALID_GUESS: 'error.INVALID_GUESS',
  PLAYER_ELIMINATED: 'error.PLAYER_ELIMINATED',
  GAME_OVER: 'error.GAME_OVER',
  NOT_ENOUGH_PLAYERS: 'error.NOT_ENOUGH_PLAYERS',
  ROOM_NOT_FOUND: 'error.ROOM_NOT_FOUND',
  ROOM_FULL: 'error.ROOM_FULL',
  ROOM_STARTED: 'error.ROOM_STARTED',
  ROOM_FINISHED: 'error.ROOM_FINISHED',
  NAME_TAKEN: 'error.NAME_TAKEN',
  BAD_TOKEN: 'error.BAD_TOKEN',
  SERVER_BUSY: 'error.SERVER_BUSY',
  INVALID_NAME: 'error.INVALID_NAME',
  INVALID_CODE: 'error.INVALID_CODE',
  NETWORK_TIMEOUT: 'error.network',
};

/** Translation key of a server error. */
export function errorMessageKey(code: GameErrorCode): MessageKey {
  return ERROR_KEYS[code] ?? 'error.WRONG_PHASE';
}

export function GameProvider({ children }: { children: ReactNode }): JSX.Element {
  const toasts = useToasts();
  const { t } = useI18n();
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [credentials, setCredentials] = useState<PlayerCredentials | null>(null);
  const [room, setRoom] = useState<RoomState | null>(null);
  const [publicState, setPublicState] = useState<PublicGameState | null>(null);
  const [privateState, setPrivateState] = useState<PrivatePlayerState | null>(null);
  const [lastEvent, setLastEvent] = useState<GameEvent | null>(null);
  const [startingDraw, setStartingDraw] = useState<StartingDraw | null>(null);
  const credentialsRef = useRef<PlayerCredentials | null>(null);
  /** Avoids announcing the same turn change twice. */
  const lastTurnAnnounced = useRef<number>(0);

  const applyCredentials = useCallback((next: PlayerCredentials | null) => {
    credentialsRef.current = next;
    setCredentials(next);
    if (next) {
      saveSession(next);
    } else {
      clearSession();
    }
  }, []);

  const applyState = useCallback((payload: StatePayload) => {
    setRoom(payload.room);
    setPublicState(payload.publicState);
    setPrivateState(payload.privateState);
  }, []);

  const dismissStartingDraw = useCallback(() => {
    setStartingDraw(null);
  }, []);

  const describeEvent = useCallback(
    (event: GameEvent): void => {
      const myId = credentialsRef.current?.playerId;
      const nameOf = (id: string | null): string => {
        const player = room?.players.find((p) => p.id === id);
        return player?.name ?? '?';
      };

      switch (event.type) {
        case 'game-started':
          playSound('spin');
          setStartingDraw({ startingPlayerId: event.startingPlayerId, at: Date.now() });
          break;
        case 'tile-revealed':
          playSound('reveal');
          toasts.push(
            t('toast.revealed', { name: nameOf(event.byPlayerId), tile: event.tile.number }),
            'info',
          );
          break;
        case 'hint-requested':
          playSound('click');
          if (event.hint.responderId === myId) {
            toasts.push(
              t('toast.yourAnswer', { name: nameOf(event.hint.askerId) }),
              'warning',
            );
          }
          break;
        case 'classify-result':
          playSound('place');
          if (!event.wasCorrect && event.result.ownerId !== myId) {
            toasts.push(t('toast.wrongClassify'), 'warning', 5000);
          }
          break;
        case 'compare-result':
          playSound(event.result.match ? 'yes' : 'no');
          toasts.push(
            t('toast.compareResult', {
              answer: event.result.match ? t('compare.yes') : t('compare.no'),
              tile: event.result.tileNumber,
              position: event.result.position + 1,
            }),
            event.result.match ? 'success' : 'info',
          );
          break;
        case 'turn-changed':
          if (event.turn !== lastTurnAnnounced.current) {
            lastTurnAnnounced.current = event.turn;
            playSound('turn');
            toasts.push(
              event.activePlayerId === myId
                ? t('toast.yourTurn')
                : t('toast.turnOf', { name: nameOf(event.activePlayerId) }),
              'info',
            );
          }
          break;
        case 'guess-result':
          if (event.correct) {
            playSound('victory');
          } else {
            playSound('defeat');
            toasts.push(
              event.playerId === myId
                ? t('toast.guessFailedMine')
                : t('toast.guessFailedOther', { name: nameOf(event.playerId) }),
              event.playerId === myId ? 'error' : 'success',
              5000,
            );
          }
          break;
        case 'game-over':
          if (event.winnerId === myId) {
            playSound('victory');
          } else if (event.winnerId) {
            playSound('defeat');
          }
          break;
      }
      setLastEvent(event);
    },
    [room, t, toasts],
  );

  // --- Socket lifecycle -----------------------------------------------------
  useEffect(() => {
    const socket = getSocket();

    const onConnect = (): void => {
      setStatus('online');
      const session = credentialsRef.current ?? loadSession();
      if (session) {
        void emitWithAck<PlayerCredentials>('player:reconnect', {
          code: session.roomCode,
          playerId: session.playerId,
          token: session.token,
        }).then((res) => {
          if (res.ok) {
            applyCredentials(res.data);
          } else {
            applyCredentials(null);
            setRoom(null);
            setPublicState(null);
            setPrivateState(null);
            setStartingDraw(null);
          }
        });
      }
    };

    const onDisconnect = (): void => {
      setStatus('offline');
    };

    const onStatePayload = (payload: StatePayload): void => {
      applyState(payload);
    };

    const onServerError = (error: GameError): void => {
      playSound('error');
      toasts.push(t(errorMessageKey(error.code)), 'error');
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('room:state', onStatePayload);
    socket.on('game:state', onStatePayload);
    socket.on('server:error', onServerError);

    if (socket.connected) {
      onConnect();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('room:state', onStatePayload);
      socket.off('game:state', onStatePayload);
      socket.off('server:error', onServerError);
    };
  }, [applyCredentials, applyState, t, toasts]);

  // Game events depend on player names: separate subscription.
  useEffect(() => {
    const socket = getSocket();
    socket.on('game:event', describeEvent);
    return () => {
      socket.off('game:event', describeEvent);
    };
  }, [describeEvent]);

  useEffect(() => {
    const socket = getSocket();
    const onJoined = ({ name }: { name: string }): void => {
      toasts.push(t('toast.joined', { name }), 'success');
      playSound('yes');
    };
    const onReconnected = ({ name }: { name: string }): void => {
      toasts.push(t('toast.reconnected', { name }), 'success');
    };
    const onLeft = ({ playerId, name }: { playerId: string; name: string }): void => {
      // Only about the others: my own departure needs no toast.
      if (playerId !== credentialsRef.current?.playerId) {
        toasts.push(t('toast.playerOffline', { name }), 'warning', 5000);
      }
    };
    socket.on('player:joined', onJoined);
    socket.on('player:reconnected', onReconnected);
    socket.on('player:left', onLeft);
    return () => {
      socket.off('player:joined', onJoined);
      socket.off('player:reconnected', onReconnected);
      socket.off('player:left', onLeft);
    };
  }, [t, toasts]);

  // --- Actions --------------------------------------------------------------

  const handle = useCallback(
    async (
      event: Parameters<typeof emitWithAck>[0],
      payload: unknown,
      options: { silent?: boolean } = {},
    ): Promise<boolean> => {
      const res: Ack<unknown> = await emitWithAck(event, payload);
      if (!res.ok) {
        if (!options.silent) {
          playSound('error');
          toasts.push(t(errorMessageKey(res.error.code)), 'error');
        }
        return false;
      }
      return true;
    },
    [t, toasts],
  );

  const actions = useMemo<GameActions>(
    () => ({
      createRoom: async (name) => {
        const res = await emitWithAck<PlayerCredentials>('room:create', { name });
        if (!res.ok) {
          return { ok: false, errorCode: res.error.code };
        }
        applyCredentials(res.data);
        playSound('yes');
        return { ok: true };
      },
      joinRoom: async (name, code) => {
        const res = await emitWithAck<PlayerCredentials>('room:join', { name, code });
        if (!res.ok) {
          return { ok: false, errorCode: res.error.code };
        }
        applyCredentials(res.data);
        playSound('yes');
        return { ok: true };
      },
      startGame: () => handle('game:start', {}),
      reveal: (color) => handle('game:reveal', { color }),
      requestClassify: (tileNumber) => handle('game:request-classify', { tileNumber }),
      submitClassify: (slot) => handle('game:submit-classify', { slot }),
      requestCompare: (tileNumber, position) =>
        handle('game:request-compare', { tileNumber, position }),
      submitCompare: (answer) => handle('game:submit-compare', { answer }),
      guess: (numbers) => handle('game:guess', { numbers }),
      rematch: () => handle('game:rematch', {}),
      leaveRoom: async () => {
        await emitWithAck('room:leave', {});
        applyCredentials(null);
        setRoom(null);
        setPublicState(null);
        setPrivateState(null);
        setStartingDraw(null);
        lastTurnAnnounced.current = 0;
      },
    }),
    [applyCredentials, handle],
  );

  const me = useMemo(
    () => publicState?.players.find((p) => p.id === credentials?.playerId) ?? null,
    [publicState, credentials],
  );
  const rivals = useMemo(() => {
    if (!publicState || !credentials) {
      return [];
    }
    return seatsAfter(publicState.order, credentials.playerId)
      .map((id) => publicState.players.find((p) => p.id === id))
      .filter((p): p is PublicPlayer => p !== undefined);
  }, [publicState, credentials]);

  const value = useMemo<GameContextValue>(
    () => ({
      status,
      credentials,
      room,
      publicState,
      privateState,
      lastEvent,
      startingDraw,
      dismissStartingDraw,
      me,
      rivals,
      isMyTurn:
        publicState !== null &&
        credentials !== null &&
        publicState.activePlayerId === credentials.playerId,
      mustAnswer: privateState?.pendingResponse != null,
      actions,
    }),
    [
      status,
      credentials,
      room,
      publicState,
      privateState,
      lastEvent,
      startingDraw,
      dismissStartingDraw,
      me,
      rivals,
      actions,
    ],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used inside a GameProvider');
  }
  return context;
}
