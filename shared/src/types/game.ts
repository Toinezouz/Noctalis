import type { RevealedTile, SecretTileView, Tile, TileColor } from './tiles.js';

/**
 * Game state machine. Every transition is explicit and validated on the
 * server (see `shared/src/game/engine.ts`).
 */
export type GamePhase =
  /** The room exists but nobody has joined yet. */
  | 'WAITING_FOR_PLAYER'
  /** Enough people are here, the game can start. */
  | 'LOBBY_READY'
  /** Dealing the stars (transient, server only). */
  | 'SETUP'
  /** The active player must reveal a star by picking a constellation. */
  | 'TURN_REVEAL'
  /** The active player must ask for a hint (PLACE or GAUGE). */
  | 'TURN_HINT'
  /** The responder must place the chosen star. */
  | 'WAITING_FOR_CLASSIFY'
  /** The responder must confirm the gauge answer. */
  | 'WAITING_FOR_COMPARE'
  /** The game is over. */
  | 'GAME_OVER';

export type HintType = 'classify' | 'compare';

/** A pending PLACE request. */
export interface ClassifyHint {
  type: 'classify';
  /** Public star chosen by the asker. */
  tileNumber: number;
  /** Player whose secret stars are being placed against (the active player). */
  askerId: string;
  /** Player who must answer (they can see the asker's real numbers). */
  responderId: string;
}

/** A pending GAUGE request. */
export interface CompareHint {
  type: 'compare';
  tileNumber: number;
  /** Secret position being gauged, 0 to 4. */
  position: number;
  askerId: string;
  responderId: string;
}

export type PendingHint = ClassifyHint | CompareHint;

/** Result of a PLACE: the star lands in one of the 6 gaps. */
export interface ClassifyResult {
  id: string;
  /** Player whose rack receives the placed star. */
  ownerId: string;
  tileNumber: number;
  /** Gap 0 (before the 1st star) to 5 (after the 5th). */
  slot: number;
  turn: number;
}

/** Result of a GAUGE: YES (same brightness) or NO. */
export interface CompareResult {
  id: string;
  ownerId: string;
  tileNumber: number;
  /** Secret position that was gauged, 0 to 4. */
  position: number;
  /** `true` = YES (same brightness), `false` = NO. */
  match: boolean;
  turn: number;
}

/** A CONSTELLATION! call (one per player). */
export interface GuessRecord {
  playerId: string;
  numbers: number[];
  correct: boolean;
  turn: number;
}

export type LogKind =
  | 'system'
  | 'reveal'
  | 'hint-request'
  | 'classify'
  | 'compare'
  | 'turn'
  | 'guess'
  | 'connection';

/**
 * A history entry. The server never writes sentences: it sends a code and its
 * parameters, and each client renders it in its own language.
 */
export type LogCode =
  | 'game-started'
  | 'starting-player'
  | 'turn-start'
  | 'tile-revealed'
  | 'classify-requested'
  | 'compare-requested'
  | 'classify-answered'
  | 'compare-answered'
  | 'responder-changed'
  | 'guess-correct'
  | 'guess-wrong'
  | 'player-eliminated'
  | 'player-left'
  | 'player-connected'
  | 'player-disconnected'
  | 'game-over-winner'
  | 'game-over-draw'
  | 'game-over-reserve-empty';

/** Values interpolated into the message (names, numbers, positions...). */
export type LogParams = Record<string, string | number | boolean>;

/** Public history entry: never carries forbidden secret information. */
export interface LogEntry {
  id: string;
  at: number;
  kind: LogKind;
  /** Message to display, translated by the client. */
  code: LogCode;
  params: LogParams;
  playerId?: string;
  /** Star involved, if any (always a public star). */
  tileNumber?: number;
}

/** Full server-side state of a player. NEVER leaves the server as is. */
export interface PlayerState {
  id: string;
  name: string;
  connected: boolean;
  lastSeenAt: number;
  isHost: boolean;
  /** The five secret numbers, in ascending order. TOP SECRET. */
  secret: number[];
  guessUsed: boolean;
  /** Made a wrong call, or left: can no longer win. */
  eliminated: boolean;
  /** Left the game for good: no longer plays nor answers hints. */
  left: boolean;
}

/** Full server-side state of a game. NEVER leaves the server as is. */
export interface GameState {
  phase: GamePhase;
  players: PlayerState[];
  /** Turn order (player ids), starting from the player drawn at random. */
  order: string[];
  activePlayerId: string | null;
  /** Player drawn at random to open the game (fixed at deal time). */
  startingPlayerId: string;
  /** Numbers of the stars still hidden in the sky. */
  reserve: number[];
  publicTiles: RevealedTile[];
  pendingHint: PendingHint | null;
  classifications: ClassifyResult[];
  comparisons: CompareResult[];
  guesses: GuessRecord[];
  log: LogEntry[];
  winnerId: string | null;
  /** Current turn number (1 = first turn). */
  turn: number;
  /** Has a star already been revealed during this turn? */
  revealedThisTurn: boolean;
  startedAt: number | null;
  endedAt: number | null;
}

/** A player as everybody sees them: no secret information. */
export interface PublicPlayer {
  id: string;
  name: string;
  connected: boolean;
  isHost: boolean;
  guessUsed: boolean;
  eliminated: boolean;
  left: boolean;
  /** Constellations of the five secret stars, in position order. */
  tileColors: TileColor[];
}

/**
 * Public view of the game: strictly what every player may see. No secret
 * number appears in it (except in `finalReveal`, once the game is over).
 */
export interface PublicGameState {
  phase: GamePhase;
  players: PublicPlayer[];
  /** Turn order, starting from the player drawn at random. */
  order: string[];
  activePlayerId: string | null;
  /** Player drawn at random at the start (public information). */
  startingPlayerId: string;
  publicTiles: RevealedTile[];
  reserveCount: number;
  /** Stars still hidden in the sky, per constellation (public information). */
  reserveByColor: Record<TileColor, number>;
  pendingHint: PendingHint | null;
  classifications: ClassifyResult[];
  comparisons: CompareResult[];
  guesses: GuessRecord[];
  log: LogEntry[];
  winnerId: string | null;
  turn: number;
  revealedThisTurn: boolean;
  startedAt: number | null;
  endedAt: number | null;
  /** Only filled in when `phase === 'GAME_OVER'`. */
  finalReveal: Record<string, Tile[]> | null;
}

/** A hint the recipient has to answer (the responder's private view). */
export interface PendingResponse {
  hint: PendingHint;
  /**
   * For GAUGE only: the true answer, computed by the server. The responder
   * can see the asker's real numbers anyway, so this teaches them nothing;
   * it simply makes a wrong answer impossible.
   */
  truth: boolean | null;
}

/** Another player's rack, face up: I can read their numbers. */
export interface RivalView {
  playerId: string;
  /** Their five stars, in ascending order. */
  tiles: Tile[];
}

/**
 * A player's private view. It is the only channel through which a client
 * receives hidden information, and it NEVER contains its recipient's own
 * secret numbers.
 */
export interface PrivatePlayerState {
  playerId: string;
  /** My stars: constellation and position only, never number nor brightness. */
  myTiles: SecretTileView[];
  /**
   * Everybody else's stars, face up, in seating order: the player right
   * after me in the turn order comes first.
   */
  rivals: RivalView[];
  guessUsed: boolean;
  eliminated: boolean;
  /** Set when a hint is waiting for my answer. */
  pendingResponse: PendingResponse | null;
}
