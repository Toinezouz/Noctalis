import { describe, expect, it } from 'vitest';
import {
  type GameState,
  createGame,
  createSeededRng,
  findSecretLeak,
  getPlayer,
  requestClassify,
  requestCompare,
  revealTile,
  submitClassify,
  submitCompare,
  submitGuess,
  toPlayerPrivateState,
  toPublicGameState,
} from '@umbrastra/shared';
import { gameStartedByAlice } from './gameFixture.js';

/** Reproducible game in which Alice opens. */
function game(seed: number): { state: GameState; rng: () => number } {
  return gameStartedByAlice(seed);
}

/** Numbers read from the fields that really carry star numbers. */
function tileNumbersIn(payload: unknown): Set<number> {
  const out = new Set<number>();
  const walk = (value: unknown, key: string): void => {
    if (typeof value === 'number') {
      if (key === 'number' || key === 'tileNumber' || key === 'numbers') {
        out.add(value);
      }
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item) => walk(item, key));
      return;
    }
    if (value && typeof value === 'object') {
      for (const [k, v] of Object.entries(value)) {
        walk(v, k);
      }
    }
  };
  walk(payload, 'root');
  return out;
}

describe('protecting secret information', () => {
  it('Alice\'s private view holds none of her own numbers', () => {
    for (let seed = 0; seed < 40; seed += 1) {
      const { state } = game(seed);
      const alice = getPlayer(state, 'alice')!;
      const payload = toPlayerPrivateState(state, 'alice');
      const found = tileNumbersIn(payload);
      for (const secret of alice.secret) {
        expect(found.has(secret), `leak of number ${String(secret)} (seed ${String(seed)})`).toBe(
          false,
        );
      }
      expect(findSecretLeak(state, 'alice', payload)).toBeNull();
    }
  });

  it('Alice\'s private view does hold Bob\'s 5 numbers', () => {
    const { state } = game(5);
    const bob = getPlayer(state, 'bob')!;
    const priv = toPlayerPrivateState(state, 'alice')!;
    expect(priv.rivals[0]!.tiles.map((t) => t.number)).toEqual(bob.secret);
    expect(priv.rivals[0]!.tiles.every((t) => t.points >= 1 && t.points <= 3)).toBe(true);
  });

  it('the same holds for Bob', () => {
    const { state } = game(6);
    const alice = getPlayer(state, 'alice')!;
    const bob = getPlayer(state, 'bob')!;
    const priv = toPlayerPrivateState(state, 'bob')!;
    expect(priv.rivals[0]!.tiles.map((t) => t.number)).toEqual(alice.secret);
    expect(findSecretLeak(state, 'bob', priv)).toBeNull();
    expect(tileNumbersIn(priv).has(bob.secret[0]!)).toBe(false);
  });

  it('my stars only show constellation and position (never brightness)', () => {
    const { state } = game(7);
    const priv = toPlayerPrivateState(state, 'alice')!;
    expect(priv.myTiles).toHaveLength(5);
    priv.myTiles.forEach((tile, index) => {
      expect(Object.keys(tile).sort()).toEqual(['color', 'position']);
      expect(tile.position).toBe(index);
    });
  });

  it('the public state holds no secret number until the game is over', () => {
    const { state, rng } = game(8);
    revealTile(state, 'alice', 'green', rng);
    requestClassify(state, 'alice', state.publicTiles[5]!.tile.number);
    submitClassify(state, 'bob', 2);
    const pub = toPublicGameState(state);
    const found = tileNumbersIn(pub);
    for (const player of state.players) {
      for (const secret of player.secret) {
        expect(found.has(secret), `secret number ${String(secret)} found in the public state`).toBe(
          false,
        );
      }
    }
    expect(pub.finalReveal).toBeNull();
  });

  it('the public state shows the constellations of every rack, in order', () => {
    const { state } = game(9);
    const pub = toPublicGameState(state);
    for (const player of pub.players) {
      expect(player.tileColors).toHaveLength(5);
      expect(new Set(player.tileColors).size).toBe(5);
    }
  });

  it('leaks nothing after a full series of moves (PLACE + GAUGE)', () => {
    const { state, rng } = game(12);
    for (let i = 0; i < 8; i += 1) {
      const active = state.activePlayerId!;
      revealTile(state, active, (['green', 'pink', 'blue', 'red', 'orange'] as const)[i % 5]!, rng);
      const tile = state.publicTiles[state.publicTiles.length - 1]!.tile.number;
      if (i % 2 === 0) {
        requestClassify(state, active, tile);
        submitClassify(state, state.pendingHint!.responderId, 3);
      } else {
        requestCompare(state, active, tile, i % 5);
        submitCompare(state, state.pendingHint!.responderId);
      }
      for (const id of ['alice', 'bob']) {
        const payload = {
          publicState: toPublicGameState(state),
          privateState: toPlayerPrivateState(state, id),
        };
        expect(findSecretLeak(state, id, payload)).toBeNull();
      }
    }
  });

  it('only gives the GAUGE answer to the responder', () => {
    const { state, rng } = game(15);
    revealTile(state, 'alice', 'blue', rng);
    requestCompare(state, 'alice', state.publicTiles[5]!.tile.number, 1);
    expect(toPlayerPrivateState(state, 'alice')!.pendingResponse).toBeNull();
    const bobView = toPlayerPrivateState(state, 'bob')!;
    expect(bobView.pendingResponse).not.toBeNull();
    expect(typeof bobView.pendingResponse!.truth).toBe('boolean');
  });

  it('only reveals secrets once the game is over', () => {
    const { state } = game(16);
    const alice = getPlayer(state, 'alice')!;
    submitGuess(state, 'alice', alice.secret);
    const pub = toPublicGameState(state);
    expect(pub.phase).toBe('GAME_OVER');
    expect(pub.finalReveal).not.toBeNull();
    expect(pub.finalReveal!['alice']!.map((t) => t.number)).toEqual(alice.secret);
    expect(pub.finalReveal!['bob']!.map((t) => t.number)).toEqual(getPlayer(state, 'bob')!.secret);
  });

  it('the public history only mentions public stars', () => {
    const { state, rng } = game(21);
    revealTile(state, 'alice', 'orange', rng);
    requestClassify(state, 'alice', state.publicTiles[5]!.tile.number);
    submitClassify(state, 'bob', 1);
    const publicNumbers = new Set(state.publicTiles.map((t) => t.tile.number));
    for (const entry of state.log) {
      if (entry.tileNumber !== undefined) {
        expect(publicNumbers.has(entry.tileNumber)).toBe(true);
      }
    }
  });

  it('the guard really catches a deliberate leak', () => {
    const { state } = game(23);
    const alice = getPlayer(state, 'alice')!;
    const target = alice.secret.find((n) => n > 6)!;
    const forged = { myTiles: [{ position: 0, number: target }] };
    const leak = findSecretLeak(state, 'alice', forged);
    expect(leak).not.toBeNull();
    expect(leak!.number).toBe(target);
    // ...and inside a forged history text.
    const forgedLog = { log: [{ text: `Your stars are ${String(target)}` }] };
    expect(findSecretLeak(state, 'alice', forgedLog)).not.toBeNull();
    // ...while an identifier containing digits is not a leak.
    expect(findSecretLeak(state, 'alice', { id: `log-${String(target)}-42` })).toBeNull();
  });

  it('returns null for an unknown player', () => {
    const { state } = game(22);
    expect(toPlayerPrivateState(state, 'mallory')).toBeNull();
    expect(findSecretLeak(state, 'mallory', {})).toBeNull();
  });
});

describe('robustness of the leak guard', () => {
  it('ignores the digits of opaque identifiers', () => {
    const { state } = game(31);
    const alice = getPlayer(state, 'alice')!;
    const secret = alice.secret.find((n) => n > 6)!;
    const payload = {
      publicTiles: [{ revealedBy: `p_x${String(secret)}Zq`, order: 1 }],
      log: [{ id: `log-${String(secret)}-991`, text: 'The game goes on.' }],
      room: { code: `A${String(secret)}K9` },
      privateState: { playerId: `p_${String(secret)}abc`, rivalId: `p_${String(secret)}def` },
    };
    expect(findSecretLeak(state, 'alice', payload)).toBeNull();
  });

  it('ignores a name that contains digits', () => {
    const rng = createSeededRng(33);
    const state = createGame(
      [
        { id: 'alice', name: 'Bob37', isHost: true },
        { id: 'bob', name: 'Alice12', isHost: false },
      ],
      rng,
    );
    const alice = getPlayer(state, 'alice')!;
    const payload = {
      log: [{ text: `Bob37 plays against Alice12 on turn ${String(state.turn)}.` }],
      players: [{ name: 'Bob37' }, { name: 'Alice12' }],
    };
    expect(findSecretLeak(state, 'alice', payload)).toBeNull();
    // But a real secret number in the same text is still caught.
    const secret = alice.secret.find((n) => n > 6 && n !== 37 && n !== 12)!;
    expect(
      findSecretLeak(state, 'alice', {
        log: [{ text: `Bob37 holds star ${String(secret)}.` }],
      }),
    ).not.toBeNull();
  });
});

describe('leak guard and the turn order', () => {
  it('reads the published turn order as identifiers, not as numbers', () => {
    const { state } = game(41);
    const alice = getPlayer(state, 'alice')!;
    const secret = alice.secret.find((n) => n > 6)!;
    // Player ids are random and may contain any digits.
    const payload = { publicState: { order: [`p_${String(secret)}x`, `p_q${String(secret)}`] } };
    expect(findSecretLeak(state, 'alice', payload)).toBeNull();
    expect(findSecretLeak(state, 'alice', { room: { rematchReady: [`p_${String(secret)}`] } })).toBeNull();
  });
});
