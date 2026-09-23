import type { ClassifyResult, CompareResult, PendingHint } from './game.js';
import type { Tile, TileColor } from './tiles.js';

/** Action de jeu demandee par un client. Toujours revalidee par le serveur. */
export type GameAction =
  | { type: 'reveal'; color: TileColor }
  | { type: 'request-classify'; tileNumber: number }
  | { type: 'submit-classify'; slot: number }
  | { type: 'request-compare'; tileNumber: number; position: number }
  | { type: 'submit-compare'; answer: boolean }
  | { type: 'guess'; numbers: number[] };

export type GameOverReason = 'got-five' | 'all-eliminated' | 'reserve-empty' | 'forfeit';

/** Evenement produit par le moteur, diffuse aux clients (animations, log). */
export type GameEvent =
  /** Ouverture de la partie : annonce le joueur tire au sort (animation). */
  | { type: 'game-started'; startingPlayerId: string }
  | { type: 'tile-revealed'; tile: Tile; byPlayerId: string }
  | { type: 'hint-requested'; hint: PendingHint }
  | { type: 'classify-result'; result: ClassifyResult; wasCorrect: boolean }
  | { type: 'compare-result'; result: CompareResult }
  | { type: 'turn-changed'; activePlayerId: string | null; turn: number }
  | { type: 'guess-result'; playerId: string; numbers: number[]; correct: boolean }
  | { type: 'game-over'; winnerId: string | null; reason: GameOverReason };

export type GameErrorCode =
  | 'PLAYER_NOT_FOUND'
  | 'NOT_YOUR_TURN'
  | 'WRONG_PHASE'
  | 'INVALID_COLOR'
  | 'COLOR_EXHAUSTED'
  | 'TILE_NOT_PUBLIC'
  | 'INVALID_POSITION'
  | 'INVALID_SLOT'
  | 'NOT_RESPONDER'
  | 'GUESS_ALREADY_USED'
  | 'INVALID_GUESS'
  | 'PLAYER_ELIMINATED'
  | 'GAME_OVER'
  | 'NOT_ENOUGH_PLAYERS'
  // Salon : chaque situation a son code, pour un message clair et traduisible.
  | 'ROOM_NOT_FOUND'
  | 'ROOM_FULL'
  | 'ROOM_FINISHED'
  | 'NAME_TAKEN'
  | 'BAD_TOKEN'
  | 'SERVER_BUSY'
  | 'INVALID_NAME'
  | 'INVALID_CODE'
  /** Produit par le client lorsqu'une action reste sans reponse. */
  | 'NETWORK_TIMEOUT';

export interface GameError {
  code: GameErrorCode;
  message: string;
}

export type EngineResult =
  | { ok: true; events: GameEvent[] }
  | { ok: false; error: GameError };

export function engineError(code: GameErrorCode, message: string): EngineResult {
  return { ok: false, error: { code, message } };
}
