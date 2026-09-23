import {
  COLOR_LABELS,
  COLOR_ORDER,
  SECRET_TILE_COUNT,
  getTileByNumber,
  isValidTileNumber,
} from '../data/tiles.js';
import type { RevealedTile } from '../types/tiles.js';
import type {
  ClassifyResult,
  CompareResult,
  GameState,
  LogCode,
  LogEntry,
  LogKind,
  LogParams,
  PlayerState,
} from '../types/game.js';
import type { EngineResult, GameEvent, GameOverReason } from '../types/actions.js';
import { engineError } from '../types/actions.js';
import type { TileColor } from '../types/tiles.js';
import { createDeck, reserveOfColor, shuffleDeck } from './deck.js';
import { pickRandom, randomInt, type Rng } from './rng.js';
import {
  CLASSIFY_SLOT_COUNT,
  comparePointsByNumber,
  getClassifyPosition,
  validateGuess,
  validateGuessShape,
} from './rules.js';

/** Description minimale d'un joueur au moment de creer la partie. */
export interface PlayerSeed {
  id: string;
  name: string;
  isHost: boolean;
  connected?: boolean;
}

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${String(idCounter)}-${String(Date.now() % 100000)}`;
}

/**
 * Ajoute une entree a l'historique. Aucune phrase n'est redigee ici : seuls un
 * code et ses parametres circulent, pour que chaque client les affiche dans sa
 * propre langue.
 */
function log(
  state: GameState,
  kind: LogKind,
  code: LogCode,
  params: LogParams = {},
  extra: Partial<LogEntry> = {},
): void {
  const entry: LogEntry = {
    id: nextId('log'),
    at: Date.now(),
    kind,
    code,
    params,
    ...extra,
  };
  state.log.push(entry);
  // L'historique reste borne : une partie tres longue ne fait pas gonfler
  // indefiniment la charge utile envoyee aux clients.
  if (state.log.length > 200) {
    state.log.splice(0, state.log.length - 200);
  }
}

export function getPlayer(state: GameState, playerId: string): PlayerState | undefined {
  return state.players.find((p) => p.id === playerId);
}

export function getOpponent(state: GameState, playerId: string): PlayerState | undefined {
  return state.players.find((p) => p.id !== playerId);
}

/**
 * La tuile est-elle disponible dans la zone commune ?
 * Une tuile deja utilisee pour un indice a rejoint un support : elle n'est
 * plus choisissable.
 */
export function isPublicTile(state: GameState, tileNumber: number): boolean {
  return state.publicTiles.some((t) => t.tile.number === tileNumber && !t.used);
}

/** Tuiles encore disponibles au centre. */
export function availablePublicTiles(state: GameState): RevealedTile[] {
  return state.publicTiles.filter((t) => !t.used);
}

/** Marque une tuile comme consommee : elle quitte la zone commune. */
function consumePublicTile(state: GameState, tileNumber: number): void {
  const entry = state.publicTiles.find((t) => t.tile.number === tileNumber);
  if (entry) {
    entry.used = true;
  }
}

/**
 * Cree une partie complete : melange, distribution des 5 tuiles secretes
 * (une par couleur, triees par ordre croissant), mise en place des 5 tuiles
 * publiques initiales (une par couleur) et tirage au sort du joueur qui ouvre
 * la partie.
 */
export function createGame(seeds: readonly PlayerSeed[], rng: Rng): GameState {
  if (seeds.length !== 2) {
    throw new RangeError('Cette version de GOT FIVE! se joue exactement a 2 joueurs.');
  }

  const deck = shuffleDeck(createDeck(), rng);
  /** Pioche par couleur : on retire les tuiles au fur et a mesure. */
  const byColor = new Map<TileColor, number[]>();
  for (const color of COLOR_ORDER) {
    byColor.set(
      color,
      deck.filter((t) => t.color === color).map((t) => t.number),
    );
  }

  const takeColor = (color: TileColor): number => {
    const pool = byColor.get(color)!;
    const n = pool.shift();
    if (n === undefined) {
      throw new RangeError(`Plus aucune tuile ${color} disponible`);
    }
    return n;
  };

  const players: PlayerState[] = seeds.map((seed) => ({
    id: seed.id,
    name: seed.name,
    connected: seed.connected ?? true,
    lastSeenAt: Date.now(),
    isHost: seed.isHost,
    secret: [],
    guessUsed: false,
    eliminated: false,
  }));

  // 1 tuile de chaque couleur par joueur, puis tri croissant.
  for (const player of players) {
    player.secret = COLOR_ORDER.map((color) => takeColor(color)).sort((a, b) => a - b);
  }

  // 5 tuiles publiques initiales : une de chaque couleur.
  const publicNumbers = COLOR_ORDER.map((color) => takeColor(color));

  // Qui commence ? Tirage au sort, exactement comme on tire a la courte paille
  // avant une partie sur table. L'ordre des tours part de ce joueur.
  const startingIndex = randomInt(rng, players.length);
  const starter = players[startingIndex]!;
  const order = [...players.slice(startingIndex), ...players.slice(0, startingIndex)].map(
    (p) => p.id,
  );

  const used = new Set<number>([...players.flatMap((p) => p.secret), ...publicNumbers]);
  const reserve = deck.map((t) => t.number).filter((n) => !used.has(n));

  const state: GameState = {
    phase: 'TURN_REVEAL',
    players,
    order,
    activePlayerId: starter.id,
    startingPlayerId: starter.id,
    reserve,
    publicTiles: publicNumbers.map((n, index) => ({
      tile: getTileByNumber(n),
      order: index,
      revealedBy: null,
      used: false,
    })),
    pendingHint: null,
    classifications: [],
    comparisons: [],
    guesses: [],
    log: [],
    winnerId: null,
    turn: 1,
    revealedThisTurn: false,
    startedAt: Date.now(),
    endedAt: null,
  };

  log(state, 'system', 'game-started', { count: COLOR_ORDER.length });
  log(state, 'system', 'starting-player', { name: starter.name }, { playerId: starter.id });
  log(state, 'turn', 'turn-start', { turn: 1, name: starter.name }, { playerId: starter.id });
  return state;
}

/** Tire au hasard une tuile encore disponible d'une couleur donnee. */
export function drawTileByColor(state: GameState, color: TileColor, rng: Rng): number | null {
  const pool = reserveOfColor(state.reserve, color);
  if (pool.length === 0) {
    return null;
  }
  const n = pickRandom(rng, pool);
  state.reserve = state.reserve.filter((x) => x !== n);
  return n;
}

function guardActive(state: GameState, playerId: string): EngineResult | null {
  if (state.phase === 'GAME_OVER') {
    return engineError('GAME_OVER', 'La partie est terminee.');
  }
  const player = getPlayer(state, playerId);
  if (!player) {
    return engineError('PLAYER_NOT_FOUND', "Tu n'es pas dans cette partie.");
  }
  if (player.eliminated) {
    return engineError('PLAYER_ELIMINATED', 'Tu as deja utilise ta tentative GOT FIVE!.');
  }
  if (state.activePlayerId !== playerId) {
    return engineError('NOT_YOUR_TURN', "Ce n'est pas ton tour.");
  }
  return null;
}

/** PHASE 1 du tour : reveler une tuile de la couleur choisie. */
export function revealTile(
  state: GameState,
  playerId: string,
  color: TileColor,
  rng: Rng,
): EngineResult {
  const guard = guardActive(state, playerId);
  if (guard) {
    return guard;
  }
  if (state.phase !== 'TURN_REVEAL') {
    return engineError('WRONG_PHASE', 'Tu as deja revele une tuile pendant ce tour.');
  }
  if (!COLOR_ORDER.includes(color)) {
    return engineError('INVALID_COLOR', 'Couleur inconnue.');
  }
  const number = drawTileByColor(state, color, rng);
  if (number === null) {
    return engineError(
      'COLOR_EXHAUSTED',
      `Il ne reste plus aucune tuile ${COLOR_LABELS[color]} dans la reserve.`,
    );
  }

  const tile = getTileByNumber(number);
  state.publicTiles.push({
    tile,
    order: state.publicTiles.length,
    revealedBy: playerId,
    used: false,
  });
  state.revealedThisTurn = true;
  state.phase = 'TURN_HINT';

  const player = getPlayer(state, playerId)!;
  log(
    state,
    'reveal',
    'tile-revealed',
    { name: player.name, tile: number },
    { playerId, tileNumber: number },
  );

  return { ok: true, events: [{ type: 'tile-revealed', tile, byPlayerId: playerId }] };
}

/** PHASE 2a : demander a l'adversaire de CLASSER une tuile publique. */
export function requestClassify(
  state: GameState,
  playerId: string,
  tileNumber: number,
): EngineResult {
  const guard = guardActive(state, playerId);
  if (guard) {
    return guard;
  }
  if (state.phase !== 'TURN_HINT') {
    return engineError('WRONG_PHASE', "Revele d'abord une tuile.");
  }
  if (!isValidTileNumber(tileNumber) || !isPublicTile(state, tileNumber)) {
    return engineError('TILE_NOT_PUBLIC', "Cette tuile n'est pas dans la zone publique.");
  }
  const opponent = getOpponent(state, playerId);
  if (!opponent) {
    return engineError('NOT_ENOUGH_PLAYERS', 'Adversaire introuvable.');
  }

  state.pendingHint = {
    type: 'classify',
    tileNumber,
    askerId: playerId,
    responderId: opponent.id,
  };
  // La tuile quitte le centre des qu'elle est choisie : elle rejoint le
  // support du demandeur et ne peut plus servir a un autre indice.
  consumePublicTile(state, tileNumber);
  state.phase = 'WAITING_FOR_CLASSIFY';

  const player = getPlayer(state, playerId)!;
  log(
    state,
    'hint-request',
    'classify-requested',
    { name: player.name, opponent: opponent.name, tile: tileNumber },
    { playerId, tileNumber },
  );

  return { ok: true, events: [{ type: 'hint-requested', hint: state.pendingHint }] };
}

/** PHASE 2a (reponse) : l'adversaire classe la tuile. Le serveur tranche. */
export function submitClassify(state: GameState, playerId: string, slot: number): EngineResult {
  if (state.phase !== 'WAITING_FOR_CLASSIFY' || !state.pendingHint) {
    return engineError('WRONG_PHASE', 'Aucune demande CLASSER en cours.');
  }
  const hint = state.pendingHint;
  if (hint.type !== 'classify') {
    return engineError('WRONG_PHASE', "L'indice en cours n'est pas un CLASSER.");
  }
  if (hint.responderId !== playerId) {
    return engineError('NOT_RESPONDER', "Ce n'est pas a toi de repondre.");
  }
  if (!Number.isInteger(slot) || slot < 0 || slot >= CLASSIFY_SLOT_COUNT) {
    return engineError('INVALID_SLOT', 'Emplacement invalide.');
  }

  const asker = getPlayer(state, hint.askerId);
  if (!asker) {
    return engineError('PLAYER_NOT_FOUND', 'Demandeur introuvable.');
  }

  // Le serveur recalcule la verite : la reponse du client ne peut pas mentir.
  const correctSlot = getClassifyPosition(asker.secret, hint.tileNumber);
  const wasCorrect = correctSlot === slot;

  const result: ClassifyResult = {
    id: nextId('classify'),
    ownerId: asker.id,
    tileNumber: hint.tileNumber,
    slot: correctSlot,
    turn: state.turn,
  };
  state.classifications.push(result);
  state.pendingHint = null;

  const responder = getPlayer(state, playerId)!;
  log(
    state,
    'classify',
    'classify-answered',
    {
      name: responder.name,
      owner: asker.name,
      tile: hint.tileNumber,
      slot: correctSlot,
    },
    { playerId, tileNumber: hint.tileNumber },
  );

  const events: GameEvent[] = [{ type: 'classify-result', result, wasCorrect }];
  events.push(...endTurn(state));
  return { ok: true, events };
}

/** PHASE 2b : demander une COMPARAISON de points avec l'une de mes positions. */
export function requestCompare(
  state: GameState,
  playerId: string,
  tileNumber: number,
  position: number,
): EngineResult {
  const guard = guardActive(state, playerId);
  if (guard) {
    return guard;
  }
  if (state.phase !== 'TURN_HINT') {
    return engineError('WRONG_PHASE', "Revele d'abord une tuile.");
  }
  if (!isValidTileNumber(tileNumber) || !isPublicTile(state, tileNumber)) {
    return engineError('TILE_NOT_PUBLIC', "Cette tuile n'est pas dans la zone publique.");
  }
  if (!Number.isInteger(position) || position < 0 || position >= SECRET_TILE_COUNT) {
    return engineError('INVALID_POSITION', 'Position invalide.');
  }
  const opponent = getOpponent(state, playerId);
  if (!opponent) {
    return engineError('NOT_ENOUGH_PLAYERS', 'Adversaire introuvable.');
  }

  state.pendingHint = {
    type: 'compare',
    tileNumber,
    position,
    askerId: playerId,
    responderId: opponent.id,
  };
  consumePublicTile(state, tileNumber);
  state.phase = 'WAITING_FOR_COMPARE';

  const player = getPlayer(state, playerId)!;
  log(
    state,
    'hint-request',
    'compare-requested',
    {
      name: player.name,
      opponent: opponent.name,
      tile: tileNumber,
      position: position + 1,
    },
    { playerId, tileNumber },
  );

  return { ok: true, events: [{ type: 'hint-requested', hint: state.pendingHint }] };
}

/**
 * Reponse veritable a une demande COMPARER, calculee par le serveur.
 * Renvoie `null` si aucune demande COMPARER n'est en cours.
 */
export function getCompareTruth(state: GameState): boolean | null {
  const hint = state.pendingHint;
  if (!hint || hint.type !== 'compare') {
    return null;
  }
  const asker = getPlayer(state, hint.askerId);
  if (!asker) {
    return null;
  }
  const secretNumber = asker.secret[hint.position];
  if (secretNumber === undefined) {
    return null;
  }
  return comparePointsByNumber(hint.tileNumber, secretNumber);
}

/**
 * PHASE 2b (reponse) : l'adversaire confirme. La valeur envoyee par le client
 * est ignoree : seule la verite calculee par le serveur fait foi.
 */
export function submitCompare(state: GameState, playerId: string): EngineResult {
  if (state.phase !== 'WAITING_FOR_COMPARE' || !state.pendingHint) {
    return engineError('WRONG_PHASE', 'Aucune demande COMPARER en cours.');
  }
  const hint = state.pendingHint;
  if (hint.type !== 'compare') {
    return engineError('WRONG_PHASE', "L'indice en cours n'est pas un COMPARER.");
  }
  if (hint.responderId !== playerId) {
    return engineError('NOT_RESPONDER', "Ce n'est pas a toi de repondre.");
  }
  const truth = getCompareTruth(state);
  if (truth === null) {
    return engineError('WRONG_PHASE', 'Comparaison impossible.');
  }

  const result: CompareResult = {
    id: nextId('compare'),
    ownerId: hint.askerId,
    tileNumber: hint.tileNumber,
    position: hint.position,
    match: truth,
    turn: state.turn,
  };
  state.comparisons.push(result);
  state.pendingHint = null;

  const responder = getPlayer(state, playerId)!;
  log(
    state,
    'compare',
    'compare-answered',
    {
      name: responder.name,
      tile: hint.tileNumber,
      position: hint.position + 1,
      match: truth,
    },
    { playerId, tileNumber: hint.tileNumber },
  );

  const events: GameEvent[] = [{ type: 'compare-result', result }];
  events.push(...endTurn(state));
  return { ok: true, events };
}

/** Termine le tour courant et passe la main (ou termine la partie). */
function endTurn(state: GameState): GameEvent[] {
  const events: GameEvent[] = [];
  state.revealedThisTurn = false;

  if (state.reserve.length === 0) {
    return finishGame(state, null, 'reserve-empty');
  }

  const next = nextActivePlayer(state);
  if (!next) {
    return finishGame(state, null, 'all-eliminated');
  }

  state.activePlayerId = next.id;
  state.turn += 1;
  state.phase = 'TURN_REVEAL';
  log(state, 'turn', 'turn-start', { turn: state.turn, name: next.name }, { playerId: next.id });
  events.push({ type: 'turn-changed', activePlayerId: next.id, turn: state.turn });
  return events;
}

function nextActivePlayer(state: GameState): PlayerState | null {
  const alive = state.players.filter((p) => !p.eliminated);
  if (alive.length === 0) {
    return null;
  }
  if (alive.length === 1) {
    return alive[0]!;
  }
  const currentIndex = state.order.indexOf(state.activePlayerId ?? '');
  const nextIndex = (currentIndex + 1) % state.order.length;
  const nextId2 = state.order[nextIndex]!;
  return getPlayer(state, nextId2) ?? null;
}

function finishGame(
  state: GameState,
  winnerId: string | null,
  reason: GameOverReason,
): GameEvent[] {
  state.phase = 'GAME_OVER';
  state.winnerId = winnerId;
  state.activePlayerId = null;
  state.pendingHint = null;
  state.endedAt = Date.now();

  if (winnerId) {
    const winner = getPlayer(state, winnerId);
    log(
      state,
      'guess',
      'game-over-winner',
      { name: winner?.name ?? '' },
      { playerId: winnerId },
    );
  } else if (reason === 'all-eliminated') {
    log(state, 'system', 'game-over-draw', {});
  } else {
    log(state, 'system', 'game-over-reserve-empty', {});
  }

  return [{ type: 'game-over', winnerId, reason }];
}

/** Abandon volontaire : l'adversaire gagne. */
export function forfeit(state: GameState, playerId: string): EngineResult {
  if (state.phase === 'GAME_OVER') {
    return engineError('GAME_OVER', 'La partie est deja terminee.');
  }
  const player = getPlayer(state, playerId);
  if (!player) {
    return engineError('PLAYER_NOT_FOUND', "Tu n'es pas dans cette partie.");
  }
  const opponent = getOpponent(state, playerId);
  log(state, 'system', 'player-left', { name: player.name }, { playerId });
  return { ok: true, events: finishGame(state, opponent?.id ?? null, 'forfeit') };
}

/** Tentative GOT FIVE! : possible a tout moment, une seule fois par joueur. */
export function submitGuess(
  state: GameState,
  playerId: string,
  numbers: readonly number[],
): EngineResult {
  if (state.phase === 'GAME_OVER') {
    return engineError('GAME_OVER', 'La partie est terminee.');
  }
  const player = getPlayer(state, playerId);
  if (!player) {
    return engineError('PLAYER_NOT_FOUND', "Tu n'es pas dans cette partie.");
  }
  if (player.guessUsed) {
    return engineError('GUESS_ALREADY_USED', 'Tu as deja utilise ta tentative GOT FIVE!.');
  }
  const shape = validateGuessShape(numbers);
  if (!shape.ok) {
    return engineError('INVALID_GUESS', shape.reason);
  }

  const correct = validateGuess(player.secret, shape.numbers);
  player.guessUsed = true;
  state.guesses.push({ playerId, numbers: shape.numbers, correct, turn: state.turn });

  log(
    state,
    'guess',
    correct ? 'guess-correct' : 'guess-wrong',
    { name: player.name, numbers: shape.numbers.join(' - ') },
    { playerId },
  );

  const events: GameEvent[] = [{ type: 'guess-result', playerId, numbers: shape.numbers, correct }];

  if (correct) {
    events.push(...finishGame(state, playerId, 'got-five'));
    return { ok: true, events };
  }

  player.eliminated = true;
  const opponent = getOpponent(state, playerId);
  if (!opponent || opponent.eliminated) {
    events.push(...finishGame(state, null, 'all-eliminated'));
    return { ok: true, events };
  }

  log(
    state,
    'system',
    'player-eliminated',
    { name: player.name, opponent: opponent.name },
    { playerId },
  );

  // Si le joueur elimine avait la main (ou une demande en cours), la partie
  // repart proprement sur l'adversaire.
  if (state.activePlayerId === playerId || state.pendingHint?.askerId === playerId) {
    state.pendingHint = null;
    state.revealedThisTurn = false;
    state.activePlayerId = opponent.id;
    state.turn += 1;
    state.phase = 'TURN_REVEAL';
    log(
      state,
      'turn',
      'turn-start',
      { turn: state.turn, name: opponent.name },
      { playerId: opponent.id },
    );
    events.push({ type: 'turn-changed', activePlayerId: opponent.id, turn: state.turn });
  }

  return { ok: true, events };
}

/** Vainqueur eventuel de la partie. */
export function getWinner(state: GameState): PlayerState | null {
  return state.winnerId ? (getPlayer(state, state.winnerId) ?? null) : null;
}

/** Marque la connexion d'un joueur (pour l'affichage "deconnecte"). */
export function setPlayerConnected(state: GameState, playerId: string, connected: boolean): void {
  const player = getPlayer(state, playerId);
  if (!player) {
    return;
  }
  player.connected = connected;
  player.lastSeenAt = Date.now();
  log(
    state,
    'connection',
    connected ? 'player-connected' : 'player-disconnected',
    { name: player.name },
    { playerId },
  );
}
