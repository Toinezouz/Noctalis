import { beforeEach, describe, expect, it } from 'vitest';
import {
  COLOR_ORDER,
  type GameState,
  type Rng,
  createDeck,
  availablePublicTiles,
  createGame,
  createSeededRng,
  defaultRng,
  comparePoints,
  comparePointsByNumber,
  drawTileByColor,
  forfeit,
  getClassifyPosition,
  getCompareTruth,
  getPlayer,
  getTileByNumber,
  getWinner,
  isPublicTile,
  requestClassify,
  requestCompare,
  revealTile,
  shuffleDeck,
  submitClassify,
  submitCompare,
  submitGuess,
  validateClassify,
  validateGuess,
  validateGuessShape,
} from '@umbrastra/shared';
import { PLAYER_SEEDS, gameStartedByAlice } from './gameFixture.js';

const SEEDS = PLAYER_SEEDS;

/** Reproducible game in which Alice opens. */
function newGame(seed = 42): { state: GameState; rng: Rng } {
  return gameStartedByAlice(seed);
}

/** Plays a full turn (reveal + PLACE) for the active player. */
function playFullTurn(state: GameState, rng: Rng): void {
  const active = state.activePlayerId!;
  const color = COLOR_ORDER.find((c) =>
    state.reserve.some((n) => getTileByNumber(n).color === c),
  )!;
  const r1 = revealTile(state, active, color, rng);
  expect(r1.ok).toBe(true);
  const tile = state.publicTiles[state.publicTiles.length - 1]!.tile.number;
  expect(requestClassify(state, active, tile).ok).toBe(true);
  const responder = state.pendingHint!.responderId;
  expect(submitClassify(state, responder, 0).ok).toBe(true);
}

/**
 * Builds a call with a valid shape (5 ascending numbers, one per
 * constellation) that is deliberately wrong.
 */
function wrongGuess(secret: readonly number[]): number[] {
  const numbers = COLOR_ORDER.map((color) => {
    const candidates = [...Array(60).keys()]
      .map((i) => i + 1)
      .filter((n) => getTileByNumber(n).color === color && !secret.includes(n));
    return candidates[0]!;
  });
  return numbers.sort((a, b) => a - b);
}

describe('drawing the first player', () => {
  it('draws at random, and the draw drives the turn order', () => {
    const { state } = newGame();
    expect([state.players[0]!.id, state.players[1]!.id]).toContain(state.startingPlayerId);
    expect(state.activePlayerId).toBe(state.startingPlayerId);
    expect(state.order[0]).toBe(state.startingPlayerId);
    expect([...state.order].sort()).toEqual(['alice', 'bob']);
  });

  it('records the draw in the history, without writing a sentence', () => {
    const { state } = newGame();
    const entry = state.log.find((l) => l.code === 'starting-player')!;
    expect(entry).toBeDefined();
    expect(entry.playerId).toBe(state.startingPlayerId);
    expect(entry.params['name']).toBe(getPlayer(state, state.startingPlayerId)!.name);
    // The announcement comes before the first turn.
    expect(state.log.findIndex((l) => l.code === 'starting-player')).toBeLessThan(
      state.log.findIndex((l) => l.code === 'turn-start'),
    );
  });

  it('both players get to start, about equally often', () => {
    const counts = { alice: 0, bob: 0 };
    const rounds = 400;
    for (let i = 0; i < rounds; i += 1) {
      const state = createGame(SEEDS, defaultRng);
      counts[state.startingPlayerId as 'alice' | 'bob'] += 1;
    }
    expect(counts.alice).toBeGreaterThan(0);
    expect(counts.bob).toBeGreaterThan(0);
    // Very wide tolerance (± 15 points): this catches a gross bias, not a
    // statistical drift. With 400 draws the standard deviation is 2.5 points.
    expect(counts.alice / rounds).toBeGreaterThan(0.35);
    expect(counts.alice / rounds).toBeLessThan(0.65);
  });

  it('with a given seed, the draw is reproducible', () => {
    const first = createGame(SEEDS, createSeededRng(1234)).startingPlayerId;
    const second = createGame(SEEDS, createSeededRng(1234)).startingPlayerId;
    expect(second).toBe(first);
  });
});

describe('the set of stars', () => {
  it('creates 60 unique stars', () => {
    const deck = createDeck();
    expect(deck).toHaveLength(60);
    expect(new Set(deck.map((t) => t.number)).size).toBe(60);
  });

  it('shuffles without losing or duplicating a star', () => {
    const deck = createDeck();
    const shuffled = shuffleDeck(deck, createSeededRng(7));
    expect(shuffled).toHaveLength(60);
    expect(new Set(shuffled.map((t) => t.number)).size).toBe(60);
    expect(deck.map((t) => t.number)).toEqual(createDeck().map((t) => t.number));
    expect(shuffled.map((t) => t.number)).not.toEqual(deck.map((t) => t.number));
  });

  it('is deterministic for a given seed', () => {
    const a = shuffleDeck(createDeck(), createSeededRng(11)).map((t) => t.number);
    const b = shuffleDeck(createDeck(), createSeededRng(11)).map((t) => t.number);
    expect(a).toEqual(b);
  });
});

describe('setup', () => {
  it('deals 5 secret stars per player, one per constellation, sorted', () => {
    const { state } = newGame();
    for (const player of state.players) {
      expect(player.secret).toHaveLength(5);
      const colors = player.secret.map((n) => getTileByNumber(n).color);
      expect(new Set(colors).size).toBe(5);
      expect([...player.secret].sort((a, b) => a - b)).toEqual(player.secret);
    }
  });

  it('never deals the same star twice', () => {
    for (let seed = 0; seed < 25; seed += 1) {
      const { state } = newGame(seed);
      const used = [
        ...state.players.flatMap((p) => p.secret),
        ...state.publicTiles.map((t) => t.tile.number),
        ...state.reserve,
      ];
      expect(used).toHaveLength(60);
      expect(new Set(used).size).toBe(60);
    }
  });

  it('reveals 5 initial public stars, one per constellation', () => {
    const { state } = newGame();
    expect(state.publicTiles).toHaveLength(5);
    expect(new Set(state.publicTiles.map((t) => t.tile.color)).size).toBe(5);
    expect(state.publicTiles.every((t) => t.revealedBy === null)).toBe(true);
  });

  it('keeps 45 stars in reserve and starts on turn 1 in the reveal phase', () => {
    const { state } = newGame();
    expect(state.reserve).toHaveLength(45);
    expect(state.phase).toBe('TURN_REVEAL');
    expect(state.turn).toBe(1);
    expect(state.activePlayerId).toBe('alice');
  });

  it('refuses a table of fewer than 2 or more than 4 players', () => {
    expect(() => createGame([SEEDS[0]!], createSeededRng(1))).toThrow();
    const five = ['a', 'b', 'c', 'd', 'e'].map((id) => ({ id, name: id, isHost: id === 'a' }));
    expect(() => createGame(five, createSeededRng(1))).toThrow();
  });
});

describe('revealing a star', () => {
  it('takes a star out of the reserve and makes it public', () => {
    const { state, rng } = newGame();
    const before = state.reserve.length;
    const res = revealTile(state, 'alice', 'blue', rng);
    expect(res.ok).toBe(true);
    expect(state.reserve).toHaveLength(before - 1);
    expect(state.publicTiles).toHaveLength(6);
    const last = state.publicTiles[5]!;
    expect(last.tile.color).toBe('blue');
    expect(last.revealedBy).toBe('alice');
    expect(state.phase).toBe('TURN_HINT');
  });

  it('forbids revealing out of turn', () => {
    const { state, rng } = newGame();
    const res = revealTile(state, 'bob', 'blue', rng);
    expect(res).toMatchObject({ ok: false, error: { code: 'NOT_YOUR_TURN' } });
  });

  it('forbids two reveals in the same turn', () => {
    const { state, rng } = newGame();
    expect(revealTile(state, 'alice', 'blue', rng).ok).toBe(true);
    expect(revealTile(state, 'alice', 'red', rng)).toMatchObject({
      ok: false,
      error: { code: 'WRONG_PHASE' },
    });
  });

  it('refuses an unknown constellation', () => {
    const { state, rng } = newGame();
    // @ts-expect-error robustness against invalid input
    expect(revealTile(state, 'alice', 'purple', rng)).toMatchObject({ ok: false });
  });

  it('refuses an exhausted constellation', () => {
    const { state, rng } = newGame();
    state.reserve = state.reserve.filter((n) => getTileByNumber(n).color !== 'green');
    expect(revealTile(state, 'alice', 'green', rng)).toMatchObject({
      ok: false,
      error: { code: 'COLOR_EXHAUSTED' },
    });
  });

  it('drawTileByColor returns null when the constellation is empty', () => {
    const { state, rng } = newGame();
    state.reserve = [];
    expect(drawTileByColor(state, 'red', rng)).toBeNull();
  });
});

describe('PLACE', () => {
  it('computes the exact gap among the 6', () => {
    const secret = [8, 17, 23, 44, 51];
    expect(getClassifyPosition(secret, 3)).toBe(0);
    expect(getClassifyPosition(secret, 12)).toBe(1);
    expect(getClassifyPosition(secret, 20)).toBe(2);
    expect(getClassifyPosition(secret, 30)).toBe(3);
    expect(getClassifyPosition(secret, 50)).toBe(4);
    expect(getClassifyPosition(secret, 60)).toBe(5);
  });

  it('checks the responder\'s answer without giving it the last word', () => {
    const secret = [8, 17, 23, 44, 51];
    expect(validateClassify(secret, 30, 3)).toEqual({ correctSlot: 3, wasCorrect: true });
    expect(validateClassify(secret, 30, 0)).toEqual({ correctSlot: 3, wasCorrect: false });
  });

  it('puts the star in the right gap even when the responder is wrong', () => {
    const { state, rng } = newGame();
    revealTile(state, 'alice', 'blue', rng);
    const tileNumber = state.publicTiles[5]!.tile.number;
    expect(requestClassify(state, 'alice', tileNumber).ok).toBe(true);
    expect(state.phase).toBe('WAITING_FOR_CLASSIFY');

    const alice = getPlayer(state, 'alice')!;
    const truth = getClassifyPosition(alice.secret, tileNumber);
    const lie = (truth + 3) % 6;
    const res = submitClassify(state, 'bob', lie);
    expect(res.ok).toBe(true);
    const result = state.classifications[0]!;
    expect(result.slot).toBe(truth);
    expect(result.ownerId).toBe('alice');
    if (res.ok) {
      expect(res.events.some((e) => e.type === 'classify-result' && !e.wasCorrect)).toBe(true);
    }
  });

  it('forbids the asker from answering their own request', () => {
    const { state, rng } = newGame();
    revealTile(state, 'alice', 'blue', rng);
    requestClassify(state, 'alice', state.publicTiles[5]!.tile.number);
    expect(submitClassify(state, 'alice', 2)).toMatchObject({
      ok: false,
      error: { code: 'NOT_RESPONDER' },
    });
  });

  it('refuses a non-public star and an invalid gap', () => {
    const { state, rng } = newGame();
    revealTile(state, 'alice', 'blue', rng);
    const hidden = state.reserve[0]!;
    expect(requestClassify(state, 'alice', hidden)).toMatchObject({
      ok: false,
      error: { code: 'TILE_NOT_PUBLIC' },
    });
    requestClassify(state, 'alice', state.publicTiles[0]!.tile.number);
    expect(submitClassify(state, 'bob', 6)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_SLOT' },
    });
  });

  it('allows any public star, not only the last one', () => {
    const { state, rng } = newGame();
    revealTile(state, 'alice', 'blue', rng);
    const first = state.publicTiles[0]!.tile.number;
    expect(requestClassify(state, 'alice', first).ok).toBe(true);
  });

  it('stacks several placed stars in the same gap', () => {
    const { state, rng } = newGame();
    const alice = getPlayer(state, 'alice')!;
    // Force two stars below Alice's smallest secret.
    const small = [1, 2, 3, 4, 5].filter((n) => n < alice.secret[0]!);
    if (small.length >= 2) {
      state.publicTiles.push(
        { tile: getTileByNumber(small[0]!), order: 5, revealedBy: null, used: false },
        { tile: getTileByNumber(small[1]!), order: 6, revealedBy: null, used: false },
      );
      revealTile(state, 'alice', 'blue', rng);
      requestClassify(state, 'alice', small[0]!);
      submitClassify(state, 'bob', 0);
      revealTile(state, 'bob', 'red', rng);
      requestClassify(state, 'bob', small[1]!);
      // Now Alice answers for Bob's rack: this only checks that two
      // placements can target the same gap.
      submitClassify(state, 'alice', 0);
      expect(state.classifications).toHaveLength(2);
    }
    expect(state.classifications.length).toBeGreaterThan(0);
  });
});

describe('used stars', () => {
  it('a star used to PLACE leaves the shared sky', () => {
    const { state, rng } = newGame(5);
    revealTile(state, 'alice', 'blue', rng);
    const tileNumber = state.publicTiles[5]!.tile.number;
    const availableBefore = availablePublicTiles(state).length;

    requestClassify(state, 'alice', tileNumber);
    expect(isPublicTile(state, tileNumber)).toBe(false);
    expect(availablePublicTiles(state)).toHaveLength(availableBefore - 1);
    expect(availablePublicTiles(state).map((t) => t.tile.number)).not.toContain(tileNumber);

    submitClassify(state, 'bob', 0);
    expect(isPublicTile(state, tileNumber)).toBe(false);
    // ...but stays in the memory of stars that left the reserve.
    expect(state.publicTiles.map((t) => t.tile.number)).toContain(tileNumber);
    expect(state.publicTiles.find((t) => t.tile.number === tileNumber)!.used).toBe(true);
  });

  it('a star used to GAUGE leaves the shared sky too', () => {
    const { state, rng } = newGame(6);
    revealTile(state, 'alice', 'red', rng);
    const tileNumber = state.publicTiles[5]!.tile.number;

    requestCompare(state, 'alice', tileNumber, 2);
    submitCompare(state, 'bob');
    expect(isPublicTile(state, tileNumber)).toBe(false);
    expect(availablePublicTiles(state).map((t) => t.tile.number)).not.toContain(tileNumber);
  });

  it('forbids asking again about a star already used', () => {
    const { state, rng } = newGame(7);
    revealTile(state, 'alice', 'green', rng);
    const tileNumber = state.publicTiles[5]!.tile.number;
    requestClassify(state, 'alice', tileNumber);
    submitClassify(state, 'bob', 1);

    // Bob's turn: he cannot reuse the star Alice used.
    revealTile(state, 'bob', 'pink', rng);
    expect(requestClassify(state, 'bob', tileNumber)).toMatchObject({
      ok: false,
      error: { code: 'TILE_NOT_PUBLIC' },
    });
    expect(requestCompare(state, 'bob', tileNumber, 0)).toMatchObject({
      ok: false,
      error: { code: 'TILE_NOT_PUBLIC' },
    });
  });

  it('the shared sky stays stable: one reveal, one hint per turn', () => {
    const { state, rng } = newGame(8);
    expect(availablePublicTiles(state)).toHaveLength(5);

    for (let turn = 0; turn < 6; turn += 1) {
      const active = state.activePlayerId!;
      const color = COLOR_ORDER.find((c) =>
        state.reserve.some((n) => getTileByNumber(n).color === c),
      )!;
      revealTile(state, active, color, rng);
      // After a reveal there is always at least one star available, so a
      // hint is always possible.
      const available = availablePublicTiles(state);
      expect(available.length).toBe(6);

      requestClassify(state, active, available[0]!.tile.number);
      submitClassify(state, state.pendingHint!.responderId, 0);
      expect(availablePublicTiles(state)).toHaveLength(5);
    }

    // The memory keeps growing: 5 initial stars + 6 reveals.
    expect(state.publicTiles).toHaveLength(11);
  });
});

describe('GAUGE', () => {
  it('compares brightness only', () => {
    expect(comparePoints(getTileByNumber(1), getTileByNumber(2))).toBe(true);
    expect(comparePoints(getTileByNumber(1), getTileByNumber(6))).toBe(false);
    expect(comparePointsByNumber(11, 15)).toBe(true);
    expect(comparePointsByNumber(11, 16)).toBe(false);
    expect(comparePointsByNumber(37, 39)).toBe(true);
  });

  it('answers YES for equal brightness, NO otherwise', () => {
    const { state, rng } = newGame();
    const alice = getPlayer(state, 'alice')!;
    const target = alice.secret[2]!;
    const samePoints = [...Array(60).keys()]
      .map((i) => i + 1)
      .find(
        (n) =>
          n !== target &&
          getTileByNumber(n).points === getTileByNumber(target).points &&
          !state.players.some((p) => p.secret.includes(n)),
      )!;
    state.publicTiles.push({
      tile: getTileByNumber(samePoints),
      order: 99,
      revealedBy: null,
      used: false,
    });
    state.reserve = state.reserve.filter((n) => n !== samePoints);

    revealTile(state, 'alice', 'blue', rng);
    expect(requestCompare(state, 'alice', samePoints, 2).ok).toBe(true);
    expect(getCompareTruth(state)).toBe(true);
    expect(submitCompare(state, 'bob').ok).toBe(true);
    expect(state.comparisons[0]).toMatchObject({ match: true, position: 2, ownerId: 'alice' });
  });

  it('ignores the client\'s answer and applies the server\'s truth', () => {
    const { state, rng } = newGame();
    revealTile(state, 'alice', 'blue', rng);
    const tileNumber = state.publicTiles[5]!.tile.number;
    requestCompare(state, 'alice', tileNumber, 0);
    const truth = getCompareTruth(state)!;
    expect(submitCompare(state, 'bob').ok).toBe(true);
    expect(state.comparisons[0]!.match).toBe(truth);
  });

  it('refuses a position outside the 5', () => {
    const { state, rng } = newGame();
    revealTile(state, 'alice', 'blue', rng);
    expect(requestCompare(state, 'alice', state.publicTiles[0]!.tile.number, 5)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_POSITION' },
    });
  });

  it('refuses a GAUGE before the reveal', () => {
    const { state } = newGame();
    expect(requestCompare(state, 'alice', state.publicTiles[0]!.tile.number, 0)).toMatchObject({
      ok: false,
      error: { code: 'WRONG_PHASE' },
    });
  });
});

describe('turn flow', () => {
  it('passes the lead after a complete hint', () => {
    const { state, rng } = newGame();
    expect(state.activePlayerId).toBe('alice');
    playFullTurn(state, rng);
    expect(state.activePlayerId).toBe('bob');
    expect(state.turn).toBe(2);
    expect(state.phase).toBe('TURN_REVEAL');
    expect(state.revealedThisTurn).toBe(false);
  });

  it('alternates players over several turns', () => {
    const { state, rng } = newGame();
    const seen: string[] = [];
    for (let i = 0; i < 6; i += 1) {
      seen.push(state.activePlayerId!);
      playFullTurn(state, rng);
    }
    expect(seen).toEqual(['alice', 'bob', 'alice', 'bob', 'alice', 'bob']);
  });

  it('forbids any action from the inactive player', () => {
    const { state, rng } = newGame();
    expect(revealTile(state, 'bob', 'green', rng).ok).toBe(false);
    revealTile(state, 'alice', 'green', rng);
    expect(requestClassify(state, 'bob', state.publicTiles[0]!.tile.number).ok).toBe(false);
  });

  it('forbids a hint request without a reveal first', () => {
    const { state } = newGame();
    expect(requestClassify(state, 'alice', state.publicTiles[0]!.tile.number)).toMatchObject({
      ok: false,
      error: { code: 'WRONG_PHASE' },
    });
  });

  it('forbids two hints in the same turn', () => {
    const { state, rng } = newGame();
    playFullTurn(state, rng);
    // It is now Bob's turn: Alice cannot ask anything.
    expect(requestClassify(state, 'alice', state.publicTiles[0]!.tile.number).ok).toBe(false);
  });
});

describe('CONSTELLATION! call', () => {
  it('accepts an exact call and gives the win', () => {
    const { state } = newGame();
    const alice = getPlayer(state, 'alice')!;
    const res = submitGuess(state, 'alice', alice.secret);
    expect(res.ok).toBe(true);
    expect(state.phase).toBe('GAME_OVER');
    expect(state.winnerId).toBe('alice');
    expect(getWinner(state)?.name).toBe('Alice');
  });

  it('puts a wrong caller out of the race and lets the other play on', () => {
    const { state } = newGame();
    const alice = getPlayer(state, 'alice')!;
    const res = submitGuess(state, 'alice', wrongGuess(alice.secret));
    expect(res.ok).toBe(true);
    expect(getPlayer(state, 'alice')!.eliminated).toBe(true);
    expect(state.phase).not.toBe('GAME_OVER');
    expect(state.activePlayerId).toBe('bob');
  });

  it('refuses a second call', () => {
    const { state } = newGame();
    const alice = getPlayer(state, 'alice')!;
    submitGuess(state, 'alice', alice.secret);
    expect(submitGuess(state, 'alice', alice.secret)).toMatchObject({
      ok: false,
      error: { code: 'GAME_OVER' },
    });

    const second = newGame(9).state;
    const a2 = getPlayer(second, 'alice')!;
    submitGuess(second, 'alice', wrongGuess(a2.secret));
    expect(submitGuess(second, 'alice', a2.secret)).toMatchObject({
      ok: false,
      error: { code: 'GUESS_ALREADY_USED' },
    });
  });

  it('can be made during someone else\'s turn', () => {
    const { state, rng } = newGame();
    playFullTurn(state, rng);
    expect(state.activePlayerId).toBe('bob');
    const alice = getPlayer(state, 'alice')!;
    expect(submitGuess(state, 'alice', alice.secret).ok).toBe(true);
    expect(state.winnerId).toBe('alice');
  });

  it('ends without a winner when both players fail', () => {
    const { state } = newGame();
    for (const id of ['alice', 'bob']) {
      const player = getPlayer(state, id)!;
      expect(submitGuess(state, id, wrongGuess(player.secret)).ok).toBe(true);
    }
    expect(state.phase).toBe('GAME_OVER');
    expect(state.winnerId).toBeNull();
  });

  it('validates the shape of the call', () => {
    expect(validateGuessShape([1, 2, 3, 4, 5]).ok).toBe(true);
    expect(validateGuessShape([1, 2, 3, 4]).ok).toBe(false);
    expect(validateGuessShape([5, 4, 3, 2, 1]).ok).toBe(false);
    expect(validateGuessShape([1, 1, 3, 4, 5]).ok).toBe(false);
    expect(validateGuessShape([0, 2, 3, 4, 5]).ok).toBe(false);
    expect(validateGuessShape([1, 2, 3, 4, 61]).ok).toBe(false);
    expect(validateGuessShape([1, 2, 3, 4, 5.5]).ok).toBe(false);
    // 1,6,11,16,21 are all Lyra: one star per constellation is required.
    expect(validateGuessShape([1, 6, 11, 16, 21]).ok).toBe(false);
  });

  it('compares calls regardless of the order they were sent in', () => {
    expect(validateGuess([3, 12, 25, 40, 58], [58, 40, 25, 12, 3])).toBe(true);
    expect(validateGuess([3, 12, 25, 40, 58], [3, 12, 25, 40, 59])).toBe(false);
    expect(validateGuess([3, 12, 25, 40, 58], [3, 12, 25, 40])).toBe(false);
  });

  it('refuses a malformed call through the engine', () => {
    const { state } = newGame();
    expect(submitGuess(state, 'alice', [1, 2])).toMatchObject({
      ok: false,
      error: { code: 'INVALID_GUESS' },
    });
  });
});

describe('impossible states', () => {
  let state: GameState;
  let rng: Rng;

  beforeEach(() => {
    const game = newGame(3);
    state = game.state;
    rng = game.rng;
  });

  it('blocks every action once the game is over', () => {
    const alice = getPlayer(state, 'alice')!;
    submitGuess(state, 'alice', alice.secret);
    expect(revealTile(state, 'bob', 'green', rng)).toMatchObject({
      ok: false,
      error: { code: 'GAME_OVER' },
    });
    expect(requestClassify(state, 'bob', state.publicTiles[0]!.tile.number).ok).toBe(false);
    expect(submitGuess(state, 'bob', getPlayer(state, 'bob')!.secret).ok).toBe(false);
  });

  it('blocks an unknown player', () => {
    expect(revealTile(state, 'mallory', 'green', rng)).toMatchObject({
      ok: false,
      error: { code: 'PLAYER_NOT_FOUND' },
    });
  });

  it('blocks a player out of the race', () => {
    const alice = getPlayer(state, 'alice')!;
    expect(submitGuess(state, 'alice', wrongGuess(alice.secret)).ok).toBe(true);
    expect(revealTile(state, 'alice', 'green', rng)).toMatchObject({
      ok: false,
      error: { code: 'PLAYER_ELIMINATED' },
    });
  });

  it('does not answer a hint that does not exist', () => {
    expect(submitClassify(state, 'bob', 0)).toMatchObject({
      ok: false,
      error: { code: 'WRONG_PHASE' },
    });
    expect(submitCompare(state, 'bob')).toMatchObject({
      ok: false,
      error: { code: 'WRONG_PHASE' },
    });
  });

  it('handles a player leaving', () => {
    expect(forfeit(state, 'alice').ok).toBe(true);
    expect(state.phase).toBe('GAME_OVER');
    expect(state.winnerId).toBe('bob');
    expect(forfeit(state, 'bob').ok).toBe(false);
  });
});
