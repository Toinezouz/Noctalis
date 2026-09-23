import type { PrivatePlayerState, PublicGameState } from './game.js';

export type RoomStatus = 'waiting' | 'playing' | 'finished';

/** Joueur tel qu'affiche dans le lobby. */
export interface RoomPlayerInfo {
  id: string;
  name: string;
  connected: boolean;
  isHost: boolean;
}

/** Etat public d'une room (lobby). */
export interface RoomState {
  code: string;
  status: RoomStatus;
  players: RoomPlayerInfo[];
  /** `true` des que 2 joueurs sont presents. */
  canStart: boolean;
  /** Ids des joueurs ayant demande une revanche (ecran de fin). */
  rematchReady: string[];
  createdAt: number;
}

/** Identifiants rendus au client apres creation / connexion a une room. */
export interface PlayerCredentials {
  roomCode: string;
  playerId: string;
  /** Jeton prive permettant la reconnexion. Ne contient aucun secret de jeu. */
  token: string;
  name: string;
}

/** Enveloppe complete d'etat envoyee a un client donne. */
export interface GameStateSnapshot {
  room: RoomState;
  publicState: PublicGameState | null;
  privateState: PrivatePlayerState | null;
}
