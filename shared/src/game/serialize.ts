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
import { getCompareTruth, getOpponent, getPlayer } from './engine.js';

/**
 * ---------------------------------------------------------------------------
 * SERIALISATION : la frontiere de securite du jeu.
 * ---------------------------------------------------------------------------
 * Le `GameState` serveur n'est JAMAIS envoye tel quel. Un client ne recoit que
 * la combinaison de :
 *   - `toPublicGameState(state)`            -> visible par tout le monde
 *   - `toPlayerPrivateState(state, id)`     -> visible par ce joueur seulement
 * et cette derniere ne contient jamais les numeros secrets de son destinataire.
 */

function toPublicPlayer(player: PlayerState): PublicPlayer {
  return {
    id: player.id,
    name: player.name,
    connected: player.connected,
    isHost: player.isHost,
    guessUsed: player.guessUsed,
    eliminated: player.eliminated,
    // Seules les constellations sont publiques : elles sont visibles sur le dos des
    // etoiles posees sur le support, exactement comme sur la table physique.
    tileColors: player.secret.map((n) => getTileByNumber(n).color),
  };
}

/** Vue publique complete de la partie. */
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
 * Vue privee d'un joueur.
 * - Ses propres etoiles : constellation + position uniquement (ni numero, ni eclats,
 *   car les eclats reduiraient le champ des possibles a 12 numeros sur 60).
 * - Les etoiles de l'adversaire : face visible, avec numero et eclats.
 */
export function toPlayerPrivateState(
  state: GameState,
  playerId: string,
): PrivatePlayerState | null {
  const player = getPlayer(state, playerId);
  if (!player) {
    return null;
  }
  const opponent = getOpponent(state, playerId);

  const opponentTiles: Tile[] = opponent
    ? opponent.secret.map((n) => getTileByNumber(n))
    : [];

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
    opponentTiles,
    opponentId: opponent?.id ?? null,
    guessUsed: player.guessUsed,
    eliminated: player.eliminated,
    pendingResponse,
  };
}

/**
 * ---------------------------------------------------------------------------
 * GARDE-FOU ANTI-TRICHE
 * ---------------------------------------------------------------------------
 * Parcourt une charge utile destinee a `playerId` et cherche un de ses numeros
 * secrets. Le parcours est conscient des cles : les champs dont le domaine
 * numerique n'a rien a voir avec un numero de etoile (`position` 0-4, `eclats`
 * 1-3, `slot` 0-5, compteurs, horodatages...) sont ignores, sans quoi un
 * secret comme "3" declencherait une fausse alerte a chaque position.
 *
 * Les chaines de caracteres (textes de l'historique) sont egalement inspectees :
 * seuls y sont tolerés les nombres deja publics (etoiles revelees, numero de
 * tour, ordinaux des 6 encoches, annonces faites a voix haute).
 *
 * Utilise par les tests et, en developpement, par le serveur avant chaque
 * emission.
 */
export interface SecretLeak {
  /** Numero secret retrouve. */
  number: number;
  /** Chemin dans la charge utile, ex. "privateState.myTiles[0].number". */
  path: string;
}

/** Cles dont les valeurs numeriques ne sont jamais des numeros de etoile. */
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
  'green',
  'pink',
  'blue',
  'red',
  'orange',
]);

/** Cles portant des identifiants opaques (ils contiennent des chiffres). */
const IDENTIFIER_KEYS = new Set(['id', 'code', 'token', 'name']);

/**
 * Une cle designe-t-elle un identifiant ou un pseudo ? Les chiffres qu'ils
 * contiennent ("p_sszHPTWCDh7i", "Bob37") ne sont jamais des numeros de etoile.
 */
function isIdentifierKey(key: string): boolean {
  return IDENTIFIER_KEYS.has(key) || key.endsWith('Id') || key.endsWith('By');
}

/** Echappe une chaine pour l'inserer dans une expression reguliere. */
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
   * Nombres devenus legitimement publics :
   * - les etoiles revelees au centre (jamais des etoiles secretes) ;
   * - les annonces CONSTELLATION, faites a voix haute par leur auteur ;
   * - l'integralite des secrets une fois la partie terminee (revelation finale).
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

  /** Petits nombres qui parsement les textes (ordinaux, numero de tour...). */
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
      // Les pseudos sont retires du texte : un joueur nomme "Bob37" ne doit
      // pas declencher une fausse alerte sur le numero 37.
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
