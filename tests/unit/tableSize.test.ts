import { describe, expect, it } from 'vitest';
import {
  COLOR_ORDER,
  type GameState,
  type PlayerSeed,
  type Rng,
  createGame,
  createSeededRng,
  findSecretLeak,
  forfeit,
  getPlayer,
  getRivals,
  getTileByNumber,
  pickResponder,
  reassignResponder,
  requestClassify,
  requestCompare,
  revealTile,
  seatsAfter,
  setPlayerConnected,
  submitClassify,
  submitCompare,
  submitGuess,
  toPlayerPrivateState,
  toPublicGameState,
} from '@umbrastra/shared';

const NAMES = ['Alice', 'Bob', 'Chloe', 'Dany'];

function seeds(count: number): PlayerSeed[] {
  return NAMES.slice(0, count).map((name, index) => ({
    id: name.toLowerCase(),
    name,
    isHost: index === 0,
  }));
}

/** A reproducible game for `count` players, Alice in the lead. */
function table(count: number, seed = 1): { state: GameState; rng: Rng } {
  for (let candidate = seed; candidate < seed + 200; candidate += 1) {
    const rng = createSeededRng(candidate);
    const state = createGame(seeds(count), rng);
    if (state.activePlayerId === 'alice') {
      return { state, rng };
    }
  }
  throw new Error('no seed lets Alice start');
}

function anyColor(state: GameState): (typeof COLOR_ORDER)[number] {
  return COLOR_ORDER.find((c) => state.reserve.some((n) => getTileByNumber(n).color === c))!;
}

/** Reveal + PLACE for the active player; the responder answers gap 0. */
function playTurn(state: GameState, rng: Rng): string {
  const active = state.activePlayerId!;
  expect(revealTile(state, active, anyColor(state), rng).ok).toBe(true);
  const tile = state.publicTiles[state.publicTiles.length - 1]!.tile.number;
  expect(requestClassify(state, active, tile).ok).toBe(true);
  const responder = state.pendingHint!.responderId;
  expect(submitClassify(state, responder, 0).ok).toBe(true);
  return responder;
}

function wrongCall(secret: readonly number[]): number[] {
  return COLOR_ORDER.map(
    (color) =>
      Array.from({ length: 60 }, (_, i) => i + 1).find(
        (n) => getTileByNumber(n).color === color && !secret.includes(n),
      )!,
  ).sort((a, b) => a - b);
}

describe('tables of 2 to 4 players', () => {
  it.each([2, 3, 4])('deals a full, disjoint set of stars to %i players', (count) => {
    for (let seed = 0; seed < 20; seed += 1) {
      const state = createGame(seeds(count), createSeededRng(seed));
      const all = [
        ...state.players.flatMap((p) => p.secret),
        ...state.publicTiles.map((t) => t.tile.number),
        ...state.reserve,
      ];
      expect(new Set(all).size).toBe(60);
      expect(state.reserve).toHaveLength(60 - 5 * count - 5);
      for (const player of state.players) {
        expect(new Set(player.secret.map((n) => getTileByNumber(n).color)).size).toBe(5);
      }
      expect([...state.order].sort()).toEqual(state.players.map((p) => p.id).sort());
    }
  });

  it('goes round the whole table, in the drawn order', () => {
    const { state, rng } = table(4);
    const seen: string[] = [];
    for (let i = 0; i < 8; i += 1) {
      seen.push(state.activePlayerId!);
      playTurn(state, rng);
    }
    expect(seen).toEqual([...state.order, ...state.order]);
  });

  it('asks the next player in the turn order to answer', () => {
    const { state, rng } = table(3);
    const responder = playTurn(state, rng);
    expect(responder).toBe(state.order[1]);
    // The next turn belongs to that same player, whose own responder is the one after.
    expect(state.activePlayerId).toBe(state.order[1]);
    expect(playTurn(state, rng)).toBe(state.order[2]);
  });

  it('skips an offline player when choosing who answers', () => {
    const { state, rng } = table(3);
    const next = state.order[1]!;
    setPlayerConnected(state, next, false);
    expect(revealTile(state, 'alice', anyColor(state), rng).ok).toBe(true);
    const tile = state.publicTiles[state.publicTiles.length - 1]!.tile.number;
    expect(requestClassify(state, 'alice', tile).ok).toBe(true);
    expect(state.pendingHint!.responderId).toBe(state.order[2]);
  });

  it('hands the question over when the responder goes offline', () => {
    const { state, rng } = table(3);
    expect(revealTile(state, 'alice', anyColor(state), rng).ok).toBe(true);
    const tile = state.publicTiles[state.publicTiles.length - 1]!.tile.number;
    expect(requestCompare(state, 'alice', tile, 1).ok).toBe(true);
    const first = state.pendingHint!.responderId;

    setPlayerConnected(state, first, false);
    const events = reassignResponder(state);
    const second = state.pendingHint!.responderId;
    expect(second).not.toBe(first);
    expect(second).not.toBe('alice');
    expect(events).toEqual([{ type: 'hint-requested', hint: state.pendingHint }]);
    expect(state.log.some((l) => l.code === 'responder-changed')).toBe(true);

    // The old responder can no longer answer, the new one can.
    expect(submitCompare(state, first)).toMatchObject({ ok: false, error: { code: 'NOT_RESPONDER' } });
    expect(submitCompare(state, second).ok).toBe(true);
  });

  it('keeps the responder when nobody else is online (two players)', () => {
    const { state, rng } = table(2);
    expect(revealTile(state, 'alice', anyColor(state), rng).ok).toBe(true);
    const tile = state.publicTiles[state.publicTiles.length - 1]!.tile.number;
    expect(requestClassify(state, 'alice', tile).ok).toBe(true);
    setPlayerConnected(state, 'bob', false);
    expect(reassignResponder(state)).toEqual([]);
    expect(state.pendingHint!.responderId).toBe('bob');
  });
});

describe('what each player can see, at 3 and 4', () => {
  it.each([3, 4])('shows everybody else\'s stars in seating order, never mine (%i players)', (count) => {
    const { state, rng } = table(count, 7);
    playTurn(state, rng);
    for (const player of state.players) {
      const view = toPlayerPrivateState(state, player.id)!;
      expect(view.rivals.map((r) => r.playerId)).toEqual(seatsAfter(state.order, player.id));
      expect(view.rivals).toHaveLength(count - 1);
      for (const rival of view.rivals) {
        expect(rival.tiles.map((t) => t.number)).toEqual(getPlayer(state, rival.playerId)!.secret);
      }
      const payload = { publicState: toPublicGameState(state), privateState: view };
      expect(findSecretLeak(state, player.id, payload)).toBeNull();
      expect(JSON.stringify(view.myTiles)).not.toMatch(/number|points/);
    }
  });

  it('publishes the turn order', () => {
    const { state } = table(4);
    expect(toPublicGameState(state).order).toEqual(state.order);
  });

  it('getRivals starts with the next seat', () => {
    const { state } = table(4);
    expect(getRivals(state, state.order[2]!).map((p) => p.id)).toEqual([
      state.order[3],
      state.order[0],
      state.order[1],
    ]);
  });
});

describe('calls at a bigger table', () => {
  it('lets the game go on after a wrong call, skipping that player', () => {
    const { state, rng } = table(3);
    const bob = state.order[1]!;
    expect(submitGuess(state, bob, wrongCall(getPlayer(state, bob)!.secret)).ok).toBe(true);
    expect(state.phase).not.toBe('GAME_OVER');
    const eliminated = state.log.find((l) => l.code === 'player-eliminated')!;
    expect(eliminated.params['remaining']).toBe(2);

    // Alice plays; Bob is out of the race but still answers her hint...
    expect(playTurn(state, rng)).toBe(bob);
    // ...and the lead skips him.
    expect(state.activePlayerId).toBe(state.order[2]);
  });

  it('moves on when the player in the lead makes a wrong call', () => {
    const { state } = table(4);
    expect(submitGuess(state, 'alice', wrongCall(getPlayer(state, 'alice')!.secret)).ok).toBe(true);
    expect(state.activePlayerId).toBe(state.order[1]);
    expect(state.phase).toBe('TURN_REVEAL');
  });

  it('ends without a winner once everybody has failed', () => {
    const { state } = table(3);
    for (const player of state.players) {
      expect(submitGuess(state, player.id, wrongCall(player.secret)).ok).toBe(true);
    }
    expect(state.phase).toBe('GAME_OVER');
    expect(state.winnerId).toBeNull();
  });

  it('gives the win to whoever calls right, even after others failed', () => {
    const { state } = table(4);
    const [first, second] = state.players;
    submitGuess(state, first!.id, wrongCall(first!.secret));
    expect(submitGuess(state, second!.id, second!.secret).ok).toBe(true);
    expect(state.winnerId).toBe(second!.id);
  });
});

describe('leaving a bigger table', () => {
  it('goes on without the player who left', () => {
    const { state, rng } = table(3);
    const leaver = state.order[2]!;
    expect(forfeit(state, leaver).ok).toBe(true);
    expect(state.phase).toBe('TURN_REVEAL');
    expect(getPlayer(state, leaver)!.left).toBe(true);
    playTurn(state, rng);
    playTurn(state, rng);
    // Only the two remaining players take turns.
    expect(state.activePlayerId).toBe('alice');
  });

  it('passes the lead when the active player leaves', () => {
    const { state, rng } = table(3);
    expect(revealTile(state, 'alice', anyColor(state), rng).ok).toBe(true);
    expect(forfeit(state, 'alice').ok).toBe(true);
    expect(state.activePlayerId).toBe(state.order[1]);
    expect(state.phase).toBe('TURN_REVEAL');
    expect(state.pendingHint).toBeNull();
  });

  it('hands a pending question over when the responder leaves', () => {
    const { state, rng } = table(3);
    expect(revealTile(state, 'alice', anyColor(state), rng).ok).toBe(true);
    const tile = state.publicTiles[state.publicTiles.length - 1]!.tile.number;
    expect(requestClassify(state, 'alice', tile).ok).toBe(true);
    const responder = state.pendingHint!.responderId;
    expect(forfeit(state, responder).ok).toBe(true);
    expect(state.pendingHint!.responderId).toBe(state.order[2]);
  });

  it('declares the last person at the table the winner', () => {
    const { state } = table(3);
    expect(forfeit(state, state.order[1]!).ok).toBe(true);
    expect(forfeit(state, state.order[2]!).ok).toBe(true);
    expect(state.phase).toBe('GAME_OVER');
    expect(state.winnerId).toBe('alice');
  });

  it('never picks someone who left to answer', () => {
    const players = [
      { id: 'a', connected: true, left: false },
      { id: 'b', connected: true, left: true },
      { id: 'c', connected: false, left: false },
      { id: 'd', connected: true, left: false },
    ];
    expect(pickResponder(['a', 'b', 'c', 'd'], players, 'a')?.id).toBe('d');
    expect(pickResponder(['a', 'b', 'c', 'd'], players, 'd')?.id).toBe('a');
    // Nobody online: the next person still at the table.
    const offline = players.map((p) => ({ ...p, connected: false }));
    expect(pickResponder(['a', 'b', 'c', 'd'], offline, 'a')?.id).toBe('c');
  });
});
