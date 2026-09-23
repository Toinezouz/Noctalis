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
} from '@noctalis/shared';
import { gameStartedByAlice } from './gameFixture.js';

/** Partie reproductible dans laquelle Alice ouvre le jeu. */
function game(seed: number): { state: GameState; rng: () => number } {
  return gameStartedByAlice(seed);
}

/** Numeros lus dans les champs qui portent reellement des numeros de tuile. */
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

describe('protection des informations secretes', () => {
  it("la vue privee d'Alice ne contient aucun de ses propres numeros", () => {
    for (let seed = 0; seed < 40; seed += 1) {
      const { state } = game(seed);
      const alice = getPlayer(state, 'alice')!;
      const payload = toPlayerPrivateState(state, 'alice');
      const found = tileNumbersIn(payload);
      for (const secret of alice.secret) {
        expect(found.has(secret), `fuite du numero ${String(secret)} (graine ${String(seed)})`).toBe(
          false,
        );
      }
      expect(findSecretLeak(state, 'alice', payload)).toBeNull();
    }
  });

  it("la vue privee d'Alice contient bien les 5 numeros de Bob", () => {
    const { state } = game(5);
    const bob = getPlayer(state, 'bob')!;
    const priv = toPlayerPrivateState(state, 'alice')!;
    expect(priv.opponentTiles.map((t) => t.number)).toEqual(bob.secret);
    expect(priv.opponentTiles.every((t) => t.points >= 1 && t.points <= 3)).toBe(true);
  });

  it('la symetrie est vraie pour Bob', () => {
    const { state } = game(6);
    const alice = getPlayer(state, 'alice')!;
    const bob = getPlayer(state, 'bob')!;
    const priv = toPlayerPrivateState(state, 'bob')!;
    expect(priv.opponentTiles.map((t) => t.number)).toEqual(alice.secret);
    expect(findSecretLeak(state, 'bob', priv)).toBeNull();
    expect(tileNumbersIn(priv).has(bob.secret[0]!)).toBe(false);
  });

  it('mes tuiles ne revelent que couleur et position (jamais les points)', () => {
    const { state } = game(7);
    const priv = toPlayerPrivateState(state, 'alice')!;
    expect(priv.myTiles).toHaveLength(5);
    priv.myTiles.forEach((tile, index) => {
      expect(Object.keys(tile).sort()).toEqual(['color', 'position']);
      expect(tile.position).toBe(index);
    });
  });

  it("l'etat public ne contient aucun numero secret tant que la partie n'est pas finie", () => {
    const { state, rng } = game(8);
    revealTile(state, 'alice', 'green', rng);
    requestClassify(state, 'alice', state.publicTiles[5]!.tile.number);
    submitClassify(state, 'bob', 2);
    const pub = toPublicGameState(state);
    const found = tileNumbersIn(pub);
    for (const player of state.players) {
      for (const secret of player.secret) {
        expect(found.has(secret), `numero secret ${String(secret)} present dans l'etat public`).toBe(
          false,
        );
      }
    }
    expect(pub.finalReveal).toBeNull();
  });

  it("l'etat public expose les couleurs des supports, dans l'ordre", () => {
    const { state } = game(9);
    const pub = toPublicGameState(state);
    for (const player of pub.players) {
      expect(player.tileColors).toHaveLength(5);
      expect(new Set(player.tileColors).size).toBe(5);
    }
  });

  it('ne fuit rien apres une serie complete de coups (classer + comparer)', () => {
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

  it('ne donne la reponse COMPARER qu au repondeur', () => {
    const { state, rng } = game(15);
    revealTile(state, 'alice', 'blue', rng);
    requestCompare(state, 'alice', state.publicTiles[5]!.tile.number, 1);
    expect(toPlayerPrivateState(state, 'alice')!.pendingResponse).toBeNull();
    const bobView = toPlayerPrivateState(state, 'bob')!;
    expect(bobView.pendingResponse).not.toBeNull();
    expect(typeof bobView.pendingResponse!.truth).toBe('boolean');
  });

  it("ne revele les secrets qu'a la fin de la partie", () => {
    const { state } = game(16);
    const alice = getPlayer(state, 'alice')!;
    submitGuess(state, 'alice', alice.secret);
    const pub = toPublicGameState(state);
    expect(pub.phase).toBe('GAME_OVER');
    expect(pub.finalReveal).not.toBeNull();
    expect(pub.finalReveal!['alice']!.map((t) => t.number)).toEqual(alice.secret);
    expect(pub.finalReveal!['bob']!.map((t) => t.number)).toEqual(getPlayer(state, 'bob')!.secret);
  });

  it("l'historique public ne cite que des tuiles publiques", () => {
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

  it('le garde-fou detecte reellement une fuite volontaire', () => {
    const { state } = game(23);
    const alice = getPlayer(state, 'alice')!;
    const target = alice.secret.find((n) => n > 6)!;
    const forged = { myTiles: [{ position: 0, number: target }] };
    const leak = findSecretLeak(state, 'alice', forged);
    expect(leak).not.toBeNull();
    expect(leak!.number).toBe(target);
    // ...et dans un texte d'historique falsifie.
    const forgedLog = { log: [{ text: `Tes tuiles sont ${String(target)}` }] };
    expect(findSecretLeak(state, 'alice', forgedLog)).not.toBeNull();
    // ...alors qu'un identifiant contenant des chiffres n'est pas une fuite.
    expect(findSecretLeak(state, 'alice', { id: `log-${String(target)}-42` })).toBeNull();
  });

  it('renvoie null pour un joueur inconnu', () => {
    const { state } = game(22);
    expect(toPlayerPrivateState(state, 'mallory')).toBeNull();
    expect(findSecretLeak(state, 'mallory', {})).toBeNull();
  });
});

describe('robustesse du garde-fou anti-fuite', () => {
  it('ne se declenche pas sur les chiffres des identifiants opaques', () => {
    const { state } = game(31);
    const alice = getPlayer(state, 'alice')!;
    const secret = alice.secret.find((n) => n > 6)!;
    const payload = {
      publicTiles: [{ revealedBy: `p_x${String(secret)}Zq`, order: 1 }],
      log: [{ id: `log-${String(secret)}-991`, text: 'La partie continue.' }],
      room: { code: `A${String(secret)}K9` },
      privateState: { playerId: `p_${String(secret)}abc`, opponentId: `p_${String(secret)}def` },
    };
    expect(findSecretLeak(state, 'alice', payload)).toBeNull();
  });

  it('ne se declenche pas sur un pseudo contenant des chiffres', () => {
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
      log: [{ text: `Bob37 joue contre Alice12 au tour ${String(state.turn)}.` }],
      players: [{ name: 'Bob37' }, { name: 'Alice12' }],
    };
    expect(findSecretLeak(state, 'alice', payload)).toBeNull();
    // Mais un vrai numero secret dans le meme texte reste detecte.
    const secret = alice.secret.find((n) => n > 6 && n !== 37 && n !== 12)!;
    expect(
      findSecretLeak(state, 'alice', {
        log: [{ text: `Bob37 possede la tuile ${String(secret)}.` }],
      }),
    ).not.toBeNull();
  });
});
