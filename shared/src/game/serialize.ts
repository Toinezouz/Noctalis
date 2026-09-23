import { getTileByNumber } from '../data/tiles.js';
import type {
  GameState,
  PendingResponse,
  PlayerState,
  PrivatePlayerState,
  PublicGameState,
  PublicPlayer,
} from '../types/game.js';
import type { Tile } from '../types/tiles.js';
import { countReserveByColor } from './deck.js';
import { getCompareTruth, getPlayer, getRivals } from './engine.js';

/**
 * ---------------------------------------------------------------------------
 * SERIALISATION: the security boundary of the game.
 * ---------------------------------------------------------------------------
 * The server-side `GameState` is NEVER sent as is. A client only ever gets
 * the combination of:
 *   - `toPublicGameState(state)`            -> visible to everybody
 *   - `toPlayerPrivateState(state, id)`     -> visible to that player only
 * and the latter never contains its recipient's own secret numbers.
 */

function toPublicPlayer(player: PlayerState): PublicPlayer {
  return {
    id: player.id,
    name: player.name,
    connected: player.connected,
    isHost: player.isHost,
    guessUsed: player.guessUsed,
    eliminated: player.eliminated,
    left: player.left,
    // Only the constellations are public: they show on the back of the stars
    // standing on the rack, exactly as they would on a real table.
    tileColors: player.secret.map((n) => getTileByNumber(n).color),
  };
}

/** Complete public view of the game. */
export function toPublicGameState(state: GameState): PublicGameState {
  const finished = state.phase === 'GAME_OVER';
  const finalReveal = finished
    ? Object.fromEntries(
        state.players.map((p) => [p.id, p.secret.map((n) => getTileByNumber(n))] as const),
      )
    : null;

  return {
    phase: state.phase,
    players: state.players.map(toPublicPlayer),
    order: state.order.slice(),
    activePlayerId: state.activePlayerId,
    startingPlayerId: state.startingPlayerId,
    publicTiles: state.publicTiles.map((t) => ({ ...t })),
    reserveCount: state.reserve.length,
    reserveByColor: countReserveByColor(state.reserve),
    pendingHint: state.pendingHint ? { ...state.pendingHint } : null,
    classifications: state.classifications.map((c) => ({ ...c })),
    comparisons: state.comparisons.map((c) => ({ ...c })),
    guesses: state.guesses.map((g) => ({ ...g, numbers: g.numbers.slice() })),
    log: state.log.map((l) => ({ ...l })),
    winnerId: state.winnerId,
    turn: state.turn,
    revealedThisTurn: state.revealedThisTurn,
    startedAt: state.startedAt,
    endedAt: state.endedAt,
    finalReveal,
  };
}

/**
 * A player's private view.
 * - Their own stars: constellation and position only (no number and no
 *   brightness, since brightness alone narrows the number to 12 out of 60).
 * - Everybody else's stars: face up, with number and brightness.
 */
export function toPlayerPrivateState(
  state: GameState,
  playerId: string,
): PrivatePlayerState | null {
  const player = getPlayer(state, playerId);
  if (!player) {
    return null;
  }
  const rivals = getRivals(state, playerId).map((rival) => ({
    playerId: rival.id,
    tiles: rival.secret.map((n): Tile => getTileByNumber(n)),
  }));

  let pendingResponse: PendingResponse | null = null;
  if (state.pendingHint && state.pendingHint.responderId === playerId) {
    pendingResponse = {
      hint: { ...state.pendingHint },
      truth: state.pendingHint.type === 'compare' ? getCompareTruth(state) : null,
    };
  }

  return {
    playerId,
    myTiles: player.secret.map((n, position) => ({
      position,
      color: getTileByNumber(n).color,
    })),
    rivals,
    guessUsed: player.guessUsed,
    eliminated: player.eliminated,
    pendingResponse,
  };
}

/**
 * ---------------------------------------------------------------------------
 * ANTI-CHEAT GUARD
 * ---------------------------------------------------------------------------
 * Walks a payload meant for `playerId` and looks for one of their secret
 * numbers. The walk is key-aware: fields whose numeric domain has nothing to
 * do with a star number (`position` 0-4, `points` 1-3, `slot` 0-5, counters,
 * timestamps...) are skipped, otherwise a secret such as "3" would raise a
 * false alarm on every position.
 *
 * Strings (history texts) are inspected too: the only numbers tolerated in
 * them are those already public (revealed stars, turn number, ordinals of the
 * 6 gaps, calls made out loud).
 *
 * Used by the tests and, outside production, by the server before every
 * emission.
 */
export interface SecretLeak {
  /** The secret number that was found. */
  number: number;
  /** Path in the payload, e.g. "privateState.myTiles[0].number". */
  path: string;
}

/** Keys whose numeric values are never star numbers. */
const NON_TILE_NUMBER_KEYS = new Set([
  'position',
  'points',
  'slot',
  'order',
  'turn',
  'at',
  'startedAt',
  'endedAt',
  'lastSeenAt',
  'createdAt',
  'reserveCount',
  'count',
  'total',
  'index',
  'remaining',
  'green',
  'pink',
  'blue',
  'red',
  'orange',
]);

/**
 * Keys carrying opaque identifiers (they contain digits). `order` and
 * `rematchReady` are lists of player ids.
 */
const IDENTIFIER_KEYS = new Set(['id', 'code', 'token', 'name', 'order', 'rematchReady']);

/**
 * Does this key hold an identifier or a name? The digits they contain
 * ("p_sszHPTWCDh7i", "Bob37") are never star numbers.
 */
function isIdentifierKey(key: string): boolean {
  return IDENTIFIER_KEYS.has(key) || key.endsWith('Id') || key.endsWith('By');
}

/** Escapes a string for use inside a regular expression. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function findSecretLeak(
  state: GameState,
  playerId: string,
  payload: unknown,
): SecretLeak | null {
  const player = getPlayer(state, playerId);
  if (!player) {
    return null;
  }
  const secrets = new Set(player.secret);

  /**
   * Numbers that legitimately became public:
   * - stars revealed in the middle (never secret stars);
   * - CONSTELLATION! calls, made out loud by their author;
   * - every secret once the game is over (final reveal).
   */
  const publiclyKnown = new Set<number>();
  for (const t of state.publicTiles) {
    publiclyKnown.add(t.tile.number);
  }
  for (const guess of state.guesses) {
    for (const n of guess.numbers) {
      publiclyKnown.add(n);
    }
  }
  if (state.phase === 'GAME_OVER') {
    for (const p of state.players) {
      for (const n of p.secret) {
        publiclyKnown.add(n);
      }
    }
  }

  /** Small numbers scattered through texts (ordinals, turn number...). */
  const textNoise = new Set<number>([1, 2, 3, 4, 5, 6]);
  for (let i = 1; i <= state.turn; i += 1) {
    textNoise.add(i);
  }

  const names = state.players.map((p) => p.name).filter((n) => n.length > 0);
  const namePattern =
    names.length > 0 ? new RegExp(names.map(escapeRegExp).join('|'), 'g') : null;

  const visit = (value: unknown, key: string, path: string): SecretLeak | null => {
    if (typeof value === 'number') {
      if (NON_TILE_NUMBER_KEYS.has(key) || isIdentifierKey(key) || publiclyKnown.has(value)) {
        return null;
      }
      return secrets.has(value) ? { number: value, path } : null;
    }
    if (typeof value === 'string') {
      if (isIdentifierKey(key)) {
        return null;
      }
      // Names are stripped from the text: a player called "Bob37" must not
      // raise a false alarm on star 37.
      const cleaned = namePattern ? value.replace(namePattern, ' ') : value;
      for (const token of cleaned.match(/\d+/g) ?? []) {
        const n = Number(token);
        if (secrets.has(n) && !publiclyKnown.has(n) && !textNoise.has(n)) {
          return { number: n, path };
        }
      }
      return null;
    }
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i += 1) {
        const found = visit(value[i], key, `${path}[${String(i)}]`);
        if (found) {
          return found;
        }
      }
      return null;
    }
    if (value && typeof value === 'object') {
      for (const [childKey, childValue] of Object.entries(value)) {
        const found = visit(childValue, childKey, `${path}.${childKey}`);
        if (found) {
          return found;
        }
      }
    }
    return null;
  };

  return visit(payload, 'root', 'payload');
}
