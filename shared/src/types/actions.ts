import type { ClassifyResult, CompareResult, PendingHint } from './game.js';
import type { Tile, TileColor } from './tiles.js';

/** A game action requested by a client. Always re-validated by the server. */
export type GameAction =
  | { type: 'reveal'; color: TileColor }
  | { type: 'request-classify'; tileNumber: number }
  | { type: 'submit-classify'; slot: number }
  | { type: 'request-compare'; tileNumber: number; position: number }
  | { type: 'submit-compare'; answer: boolean }
  | { type: 'guess'; numbers: number[] };

export type GameOverReason = 'constellation' | 'all-eliminated' | 'reserve-empty' | 'forfeit';

/** An event produced by the engine and broadcast to clients (animations, log). */
export type GameEvent =
  /** The game opens: announces the player drawn at random (roulette). */
  | { type: 'game-started'; startingPlayerId: string }
  | { type: 'tile-revealed'; tile: Tile; byPlayerId: string }
  /** Also sent again when the responder changes (the previous one went offline). */
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
  // Rooms: every situation has its own code, for a clear, translatable message.
  | 'ROOM_NOT_FOUND'
  | 'ROOM_FULL'
  | 'ROOM_STARTED'
  | 'ROOM_FINISHED'
  | 'NAME_TAKEN'
  | 'BAD_TOKEN'
  | 'SERVER_BUSY'
  | 'INVALID_NAME'
  | 'INVALID_CODE'
  /** Produced by the client when an action gets no answer. */
  | 'NETWORK_TIMEOUT';

export interface GameError {
  code: GameErrorCode;
  /** Developer-facing explanation. Players see a translation of `code`. */
  message: string;
}

export type EngineResult =
  | { ok: true; events: GameEvent[] }
  | { ok: false; error: GameError };

export function engineError(code: GameErrorCode, message: string): EngineResult {
  return { ok: false, error: { code, message } };
}
