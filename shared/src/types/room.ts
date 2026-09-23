import type { PrivatePlayerState, PublicGameState } from './game.js';

export type RoomStatus = 'waiting' | 'playing' | 'finished';

/** A player as shown in the lobby. */
export interface RoomPlayerInfo {
  id: string;
  name: string;
  connected: boolean;
  isHost: boolean;
}

/** Public state of a room (lobby). */
export interface RoomState {
  code: string;
  status: RoomStatus;
  players: RoomPlayerInfo[];
  /** `true` as soon as enough players are present and no game is running. */
  canStart: boolean;
  /** Ids of the players who asked for a rematch (end screen). */
  rematchReady: string[];
  createdAt: number;
}

/** Credentials handed to a client after creating or joining a room. */
export interface PlayerCredentials {
  roomCode: string;
  playerId: string;
  /** Private token used to reconnect. Holds no game secret. */
  token: string;
  name: string;
}

/** Full state envelope sent to one given client. */
export interface GameStateSnapshot {
  room: RoomState;
  publicState: PublicGameState | null;
  privateState: PrivatePlayerState | null;
}
