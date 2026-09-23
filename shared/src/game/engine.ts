import {
  COLOR_LABELS,
  COLOR_ORDER,
  SECRET_TILE_COUNT,
  getTileByNumber,
  isValidTileNumber,
} from '../data/tiles.js';
import { MAX_PLAYERS, MIN_PLAYERS } from '../protocol/events.js';
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

/** Minimal description of a player when a game is created. */
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
 * Appends a history entry. No sentence is written here: only a code and its
 * parameters travel, so that each client can show them in its own language.
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
  // The history stays bounded: a very long game does not keep inflating the
  // payload sent to every client.
  if (state.log.length > 200) {
    state.log.splice(0, state.log.length - 200);
  }
}

export function getPlayer(state: GameState, playerId: string): PlayerState | undefined {
  return state.players.find((p) => p.id === playerId);
}

/**
 * The ids of `order` starting right after `playerId` and going round the
 * table, `playerId` itself excluded. Unknown ids yield the plain order.
 */
export function seatsAfter(order: readonly string[], playerId: string): string[] {
  const index = order.indexOf(playerId);
  const rotated = index < 0 ? order.slice() : [...order.slice(index + 1), ...order.slice(0, index)];
  return rotated.filter((id) => id !== playerId);
}

/** Everybody but `playerId`, in seating order: the next player comes first. */
export function getRivals(state: GameState, playerId: string): PlayerState[] {
  return seatsAfter(state.order, playerId)
    .map((id) => getPlayer(state, id))
    .filter((p): p is PlayerState => p !== undefined);
}

/** The bits of a player that the choice of a responder depends on. */
export interface ResponderCandidate {
  id: string;
  connected: boolean;
  left: boolean;
}

/**
 * Who answers a hint asked by `askerId`?
 *
 * The next person in the turn order who is still at the table, preferably
 * someone online, so that a closed tab never blocks the game. Everybody but
 * the asker can see the asker's stars, so anybody can answer truthfully.
 *
 * Pure function over public data: the client uses it too, to tell the asker
 * who is going to answer before they even ask.
 */
export function pickResponder<T extends ResponderCandidate>(
  order: readonly string[],
  players: readonly T[],
  askerId: string,
): T | null {
  const candidates = seatsAfter(order, askerId)
    .map((id) => players.find((p) => p.id === id))
    .filter((p): p is T => p !== undefined && !p.left);
  return candidates.find((p) => p.connected) ?? candidates[0] ?? null;
}

/**
 * Is this star available in the shared sky?
 * A star already used for a hint has joined a rack: it cannot be picked again.
 */
export function isPublicTile(state: GameState, tileNumber: number): boolean {
  return state.publicTiles.some((t) => t.tile.number === tileNumber && !t.used);
}

/** Stars still available in the middle of the table. */
export function availablePublicTiles(state: GameState): RevealedTile[] {
  return state.publicTiles.filter((t) => !t.used);
}

/** Marks a star as used: it leaves the shared sky. */
function consumePublicTile(state: GameState, tileNumber: number): void {
  const entry = state.publicTiles.find((t) => t.tile.number === tileNumber);
  if (entry) {
    entry.used = true;
  }
}

/**
 * Creates a complete game for 2 to 4 players: shuffles, deals five secret
 * stars to everyone (one per constellation, sorted in ascending order), lays
 * out five public stars (one per constellation) and draws the player who
 * opens the game.
 */
export function createGame(seeds: readonly PlayerSeed[], rng: Rng): GameState {
  if (seeds.length < MIN_PLAYERS || seeds.length > MAX_PLAYERS) {
    throw new RangeError(
      `NOCTALIS is played by ${String(MIN_PLAYERS)} to ${String(MAX_PLAYERS)} players.`,
    );
  }

  const deck = shuffleDeck(createDeck(), rng);
  /** One draw pile per constellation: stars are taken off as they are dealt. */
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
      throw new RangeError(`No ${color} star left to deal`);
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
    left: false,
  }));

  // One star of each constellation per player, then sorted.
  for (const player of players) {
    player.secret = COLOR_ORDER.map((color) => takeColor(color)).sort((a, b) => a - b);
  }

  // Five public stars to start with: one of each constellation.
  const publicNumbers = COLOR_ORDER.map((color) => takeColor(color));

  // Who starts? Drawn at random, like drawing straws before a board game.
  // The turn order goes round the table from that player.
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

/** Draws a random star still hidden in the given constellation. */
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
    return engineError('GAME_OVER', 'The game is over.');
  }
  const player = getPlayer(state, playerId);
  if (!player) {
    return engineError('PLAYER_NOT_FOUND', 'Player not in this game.');
  }
  if (player.eliminated) {
    return engineError('PLAYER_ELIMINATED', 'Player already made their call.');
  }
  if (state.activePlayerId !== playerId) {
    return engineError('NOT_YOUR_TURN', 'Not this player\'s turn.');
  }
  return null;
}

/** Step 1 of a turn: reveal a star of the chosen constellation. */
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
    return engineError('WRONG_PHASE', 'A star was already revealed this turn.');
  }
  if (!COLOR_ORDER.includes(color)) {
    return engineError('INVALID_COLOR', 'Unknown constellation.');
  }
  const number = drawTileByColor(state, color, rng);
  if (number === null) {
    return engineError(
      'COLOR_EXHAUSTED',
      `${COLOR_LABELS[color]} has no hidden star left.`,
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

/** Checks shared by both hint requests; returns the responder on success. */
function prepareHint(
  state: GameState,
  playerId: string,
  tileNumber: number,
): { ok: true; responder: PlayerState } | { ok: false; result: EngineResult } {
  const guard = guardActive(state, playerId);
  if (guard) {
    return { ok: false, result: guard };
  }
  if (state.phase !== 'TURN_HINT') {
    return { ok: false, result: engineError('WRONG_PHASE', 'Reveal a star first.') };
  }
  if (!isValidTileNumber(tileNumber) || !isPublicTile(state, tileNumber)) {
    return {
      ok: false,
      result: engineError('TILE_NOT_PUBLIC', 'This star is not in the shared sky.'),
    };
  }
  const responder = pickResponder(state.order, state.players, playerId);
  if (!responder) {
    return { ok: false, result: engineError('NOT_ENOUGH_PLAYERS', 'Nobody left to answer.') };
  }
  return { ok: true, responder };
}

/** Step 2a: ask the next player to PLACE a public star among my stars. */
export function requestClassify(
  state: GameState,
  playerId: string,
  tileNumber: number,
): EngineResult {
  const prepared = prepareHint(state, playerId, tileNumber);
  if (!prepared.ok) {
    return prepared.result;
  }
  const { responder } = prepared;

  state.pendingHint = {
    type: 'classify',
    tileNumber,
    askerId: playerId,
    responderId: responder.id,
  };
  // The star leaves the middle as soon as it is chosen: it joins the asker's
  // rack and cannot be used for another hint.
  consumePublicTile(state, tileNumber);
  state.phase = 'WAITING_FOR_CLASSIFY';

  const player = getPlayer(state, playerId)!;
  log(
    state,
    'hint-request',
    'classify-requested',
    { name: player.name, responder: responder.name, tile: tileNumber },
    { playerId, tileNumber },
  );

  return { ok: true, events: [{ type: 'hint-requested', hint: { ...state.pendingHint } }] };
}

/** Step 2a (answer): the responder places the star. The server decides. */
export function submitClassify(state: GameState, playerId: string, slot: number): EngineResult {
  if (state.phase !== 'WAITING_FOR_CLASSIFY' || !state.pendingHint) {
    return engineError('WRONG_PHASE', 'No PLACE request pending.');
  }
  const hint = state.pendingHint;
  if (hint.type !== 'classify') {
    return engineError('WRONG_PHASE', 'The pending hint is not a PLACE.');
  }
  if (hint.responderId !== playerId) {
    return engineError('NOT_RESPONDER', 'This player is not the one answering.');
  }
  if (!Number.isInteger(slot) || slot < 0 || slot >= CLASSIFY_SLOT_COUNT) {
    return engineError('INVALID_SLOT', 'Invalid gap.');
  }

  const asker = getPlayer(state, hint.askerId);
  if (!asker) {
    return engineError('PLAYER_NOT_FOUND', 'Asker not found.');
  }

  // The server computes the truth again: the client's answer cannot lie.
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

/** Step 2b: ask the next player to GAUGE a public star against one of my positions. */
export function requestCompare(
  state: GameState,
  playerId: string,
  tileNumber: number,
  position: number,
): EngineResult {
  const prepared = prepareHint(state, playerId, tileNumber);
  if (!prepared.ok) {
    return prepared.result;
  }
  if (!Number.isInteger(position) || position < 0 || position >= SECRET_TILE_COUNT) {
    return engineError('INVALID_POSITION', 'Invalid position.');
  }
  const { responder } = prepared;

  state.pendingHint = {
    type: 'compare',
    tileNumber,
    position,
    askerId: playerId,
    responderId: responder.id,
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
      responder: responder.name,
      tile: tileNumber,
      position: position + 1,
    },
    { playerId, tileNumber },
  );

  return { ok: true, events: [{ type: 'hint-requested', hint: { ...state.pendingHint } }] };
}

/**
 * True answer to a pending GAUGE request, computed by the server.
 * Returns `null` when no GAUGE request is pending.
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
 * Step 2b (answer): the responder confirms. Whatever the client sends is
 * ignored: only the truth computed by the server counts.
 */
export function submitCompare(state: GameState, playerId: string): EngineResult {
  if (state.phase !== 'WAITING_FOR_COMPARE' || !state.pendingHint) {
    return engineError('WRONG_PHASE', 'No GAUGE request pending.');
  }
  const hint = state.pendingHint;
  if (hint.type !== 'compare') {
    return engineError('WRONG_PHASE', 'The pending hint is not a GAUGE.');
  }
  if (hint.responderId !== playerId) {
    return engineError('NOT_RESPONDER', 'This player is not the one answering.');
  }
  const truth = getCompareTruth(state);
  if (truth === null) {
    return engineError('WRONG_PHASE', 'Nothing to gauge.');
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

/**
 * If the player expected to answer the pending hint went offline or left,
 * hands the question over to the next person who can answer. Nothing changes
 * when nobody better is available: the game then waits, as it always did.
 */
export function reassignResponder(state: GameState): GameEvent[] {
  const hint = state.pendingHint;
  if (!hint || state.phase === 'GAME_OVER') {
    return [];
  }
  const current = getPlayer(state, hint.responderId);
  if (current && current.connected && !current.left) {
    return [];
  }
  const next = pickResponder(state.order, state.players, hint.askerId);
  if (!next || next.id === hint.responderId) {
    return [];
  }
  hint.responderId = next.id;
  log(
    state,
    'hint-request',
    'responder-changed',
    { name: next.name, previous: current?.name ?? '' },
    { playerId: next.id, tileNumber: hint.tileNumber },
  );
  return [{ type: 'hint-requested', hint: { ...hint } }];
}

/** Ends the current turn and passes the lead (or ends the game). */
function endTurn(state: GameState): GameEvent[] {
  return passTurn(state, state.activePlayerId ?? '');
}

/**
 * Hands the lead to the next player still in the race after `fromId`.
 * Any pending hint is dropped. Ends the game when the sky is empty or when
 * nobody can win any more.
 */
function passTurn(state: GameState, fromId: string): GameEvent[] {
  state.pendingHint = null;
  state.revealedThisTurn = false;

  if (state.reserve.length === 0) {
    return finishGame(state, null, 'reserve-empty');
  }

  const next = nextActivePlayer(state, fromId);
  if (!next) {
    return finishGame(state, null, 'all-eliminated');
  }

  state.activePlayerId = next.id;
  state.turn += 1;
  state.phase = 'TURN_REVEAL';
  log(state, 'turn', 'turn-start', { turn: state.turn, name: next.name }, { playerId: next.id });
  return [{ type: 'turn-changed', activePlayerId: next.id, turn: state.turn }];
}

/**
 * The next player in the turn order who can still win, going round the
 * table from `fromId`. It may be `fromId` itself when they are the last one
 * in the race.
 */
function nextActivePlayer(state: GameState, fromId: string): PlayerState | null {
  const start = state.order.indexOf(fromId);
  for (let step = 1; step <= state.order.length; step += 1) {
    const id = state.order[(start + step + state.order.length) % state.order.length]!;
    const player = getPlayer(state, id);
    if (player && !player.eliminated) {
      return player;
    }
  }
  return null;
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
  } else if (reason === 'reserve-empty') {
    log(state, 'system', 'game-over-reserve-empty', {});
  } else {
    log(state, 'system', 'game-over-draw', {});
  }

  return [{ type: 'game-over', winnerId, reason }];
}

/**
 * A player leaves during the game. They can no longer win nor answer hints.
 * When a single person is left at the table, that person wins; otherwise the
 * game goes on without the one who left.
 */
export function forfeit(state: GameState, playerId: string): EngineResult {
  if (state.phase === 'GAME_OVER') {
    return engineError('GAME_OVER', 'The game is already over.');
  }
  const player = getPlayer(state, playerId);
  if (!player || player.left) {
    return engineError('PLAYER_NOT_FOUND', 'Player not in this game.');
  }
  player.left = true;
  player.eliminated = true;
  player.connected = false;
  log(state, 'system', 'player-left', { name: player.name }, { playerId });

  const stillHere = state.players.filter((p) => !p.left);
  if (stillHere.length <= 1) {
    return { ok: true, events: finishGame(state, stillHere[0]?.id ?? null, 'forfeit') };
  }
  if (!stillHere.some((p) => !p.eliminated)) {
    return { ok: true, events: finishGame(state, null, 'all-eliminated') };
  }

  const events: GameEvent[] = [];
  if (state.activePlayerId === playerId) {
    // Whatever they were doing is dropped: the next player takes over.
    events.push(...passTurn(state, playerId));
  } else if (state.pendingHint?.responderId === playerId) {
    events.push(...reassignResponder(state));
  }
  return { ok: true, events };
}

/** CONSTELLATION! call: allowed at any time, once per player. */
export function submitGuess(
  state: GameState,
  playerId: string,
  numbers: readonly number[],
): EngineResult {
  if (state.phase === 'GAME_OVER') {
    return engineError('GAME_OVER', 'The game is over.');
  }
  const player = getPlayer(state, playerId);
  if (!player || player.left) {
    return engineError('PLAYER_NOT_FOUND', 'Player not in this game.');
  }
  if (player.guessUsed) {
    return engineError('GUESS_ALREADY_USED', 'Player already made their call.');
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
    events.push(...finishGame(state, playerId, 'constellation'));
    return { ok: true, events };
  }

  player.eliminated = true;
  const stillInRace = state.players.filter((p) => !p.eliminated);
  if (stillInRace.length === 0) {
    events.push(...finishGame(state, null, 'all-eliminated'));
    return { ok: true, events };
  }

  log(
    state,
    'system',
    'player-eliminated',
    { name: player.name, remaining: stillInRace.length },
    { playerId },
  );

  // A player out of the race no longer plays: if they had the lead, or a
  // hint of theirs was waiting for an answer, the game moves on. They still
  // answer other people's hints, since they can see their stars.
  if (state.activePlayerId === playerId) {
    events.push(...passTurn(state, playerId));
  }

  return { ok: true, events };
}

/** The winner, if any. */
export function getWinner(state: GameState): PlayerState | null {
  return state.winnerId ? (getPlayer(state, state.winnerId) ?? null) : null;
}

/** Records a player's connection (for the "offline" badge). */
export function setPlayerConnected(state: GameState, playerId: string, connected: boolean): void {
  const player = getPlayer(state, playerId);
  if (!player || player.left) {
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
