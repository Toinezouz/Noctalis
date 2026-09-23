import type { GameEvent, GameError } from '../types/actions.js';
import type { PublicGameState, PrivatePlayerState } from '../types/game.js';
import type { PlayerCredentials, RoomState } from '../types/room.js';
import type { TileColor } from '../types/tiles.js';

/** Limits shared by client and server: names, room codes, table size. */
export const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 16;
export const ROOM_CODE_LENGTH = 5;
/** Alphabet without look-alike characters (no 0/O, 1/I...). */
export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
/** A game needs at least two players... */
export const MIN_PLAYERS = 2;
/** ...and seats four at most. */
export const MAX_PLAYERS = 4;

export interface AckOk<T> {
  ok: true;
  data: T;
}
export interface AckErr {
  ok: false;
  error: GameError;
}
export type Ack<T> = AckOk<T> | AckErr;

/** State envelope, built separately for each socket. */
export interface StatePayload {
  room: RoomState;
  publicState: PublicGameState | null;
  privateState: PrivatePlayerState | null;
}

/** Client -> server events. */
export interface ClientToServerEvents {
  'room:create': (payload: { name: string }, ack: (res: Ack<PlayerCredentials>) => void) => void;
  'room:join': (
    payload: { name: string; code: string },
    ack: (res: Ack<PlayerCredentials>) => void,
  ) => void;
  'player:reconnect': (
    payload: { code: string; playerId: string; token: string },
    ack: (res: Ack<PlayerCredentials>) => void,
  ) => void;
  'room:leave': (payload: Record<string, never>, ack: (res: Ack<null>) => void) => void;
  'game:start': (payload: Record<string, never>, ack: (res: Ack<null>) => void) => void;
  'game:reveal': (payload: { color: TileColor }, ack: (res: Ack<null>) => void) => void;
  'game:request-classify': (
    payload: { tileNumber: number },
    ack: (res: Ack<null>) => void,
  ) => void;
  'game:submit-classify': (payload: { slot: number }, ack: (res: Ack<null>) => void) => void;
  'game:request-compare': (
    payload: { tileNumber: number; position: number },
    ack: (res: Ack<null>) => void,
  ) => void;
  'game:submit-compare': (payload: { answer: boolean }, ack: (res: Ack<null>) => void) => void;
  'game:guess': (payload: { numbers: number[] }, ack: (res: Ack<null>) => void) => void;
  'game:rematch': (payload: Record<string, never>, ack: (res: Ack<null>) => void) => void;
}

/** Server -> client events. */
export interface ServerToClientEvents {
  'room:state': (payload: StatePayload) => void;
  'game:state': (payload: StatePayload) => void;
  'game:event': (event: GameEvent) => void;
  'player:joined': (payload: { playerId: string; name: string }) => void;
  'player:left': (payload: { playerId: string; name: string }) => void;
  'player:reconnected': (payload: { playerId: string; name: string }) => void;
  'server:error': (payload: GameError) => void;
}
