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
} from '@noctalis/shared';
import { PLAYER_SEEDS, gameStartedByAlice } from './gameFixture.js';

const SEEDS = PLAYER_SEEDS;

/** Partie reproductible dans laquelle Alice ouvre le jeu. */
function newGame(seed = 42): { state: GameState; rng: Rng } {
  return gameStartedByAlice(seed);
}

/** Joue un tour complet (reveal + classer) pour le joueur actif. */
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
 * Construit une annonce valide dans sa forme (5 numeros
 * croissants, une couleur chacun) mais volontairement fausse.
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

describe('tirage du premier joueur', () => {
  it('tire au sort, et le tirage pilote l ordre des tours', () => {
    const { state } = newGame();
    expect([state.players[0]!.id, state.players[1]!.id]).toContain(state.startingPlayerId);
    expect(state.activePlayerId).toBe(state.startingPlayerId);
    expect(state.order[0]).toBe(state.startingPlayerId);
    expect([...state.order].sort()).toEqual(['alice', 'bob']);
  });

  it('inscrit le tirage dans l historique, sans rediger de phrase', () => {
    const { state } = newGame();
    const entry = state.log.find((l) => l.code === 'starting-player')!;
    expect(entry).toBeDefined();
    expect(entry.playerId).toBe(state.startingPlayerId);
    expect(entry.params['name']).toBe(getPlayer(state, state.startingPlayerId)!.name);
    // L'annonce precede le premier tour.
    expect(state.log.findIndex((l) => l.code === 'starting-player')).toBeLessThan(
      state.log.findIndex((l) => l.code === 'turn-start'),
    );
  });

  it('les deux joueurs commencent, et a peu pres aussi souvent', () => {
    const counts = { alice: 0, bob: 0 };
    const rounds = 400;
    for (let i = 0; i < rounds; i += 1) {
      const state = createGame(SEEDS, defaultRng);
      counts[state.startingPlayerId as 'alice' | 'bob'] += 1;
    }
    expect(counts.alice).toBeGreaterThan(0);
    expect(counts.bob).toBeGreaterThan(0);
    // Tolerance tres large (± 15 points) : on detecte un biais grossier, pas
    // une derive statistique. Avec 400 tirages, l'ecart-type vaut 2,5 points.
    expect(counts.alice / rounds).toBeGreaterThan(0.35);
    expect(counts.alice / rounds).toBeLessThan(0.65);
  });

  it('avec une graine donnee, le tirage est reproductible', () => {
    const first = createGame(SEEDS, createSeededRng(1234)).startingPlayerId;
    const second = createGame(SEEDS, createSeededRng(1234)).startingPlayerId;
    expect(second).toBe(first);
  });
});

describe('paquet de tuiles', () => {
  it('cree 60 tuiles uniques', () => {
    const deck = createDeck();
    expect(deck).toHaveLength(60);
    expect(new Set(deck.map((t) => t.number)).size).toBe(60);
  });

  it('melange sans perdre ni dupliquer de tuile', () => {
    const deck = createDeck();
    const shuffled = shuffleDeck(deck, createSeededRng(7));
    expect(shuffled).toHaveLength(60);
    expect(new Set(shuffled.map((t) => t.number)).size).toBe(60);
    expect(deck.map((t) => t.number)).toEqual(createDeck().map((t) => t.number));
    expect(shuffled.map((t) => t.number)).not.toEqual(deck.map((t) => t.number));
  });

  it('est deterministe pour une graine donnee', () => {
    const a = shuffleDeck(createDeck(), createSeededRng(11)).map((t) => t.number);
    const b = shuffleDeck(createDeck(), createSeededRng(11)).map((t) => t.number);
    expect(a).toEqual(b);
  });
});

describe('mise en place', () => {
  it('donne 5 tuiles secretes par joueur, une de chaque couleur, triees', () => {
    const { state } = newGame();
    for (const player of state.players) {
      expect(player.secret).toHaveLength(5);
      const colors = player.secret.map((n) => getTileByNumber(n).color);
      expect(new Set(colors).size).toBe(5);
      expect([...player.secret].sort((a, b) => a - b)).toEqual(player.secret);
    }
  });

  it('ne distribue jamais deux fois la meme tuile', () => {
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

  it('revele 5 tuiles publiques initiales, une de chaque couleur', () => {
    const { state } = newGame();
    expect(state.publicTiles).toHaveLength(5);
    expect(new Set(state.publicTiles.map((t) => t.tile.color)).size).toBe(5);
    expect(state.publicTiles.every((t) => t.revealedBy === null)).toBe(true);
  });

  it('laisse 45 tuiles en reserve et demarre au tour 1 en phase reveal', () => {
    const { state } = newGame();
    expect(state.reserve).toHaveLength(45);
    expect(state.phase).toBe('TURN_REVEAL');
    expect(state.turn).toBe(1);
    expect(state.activePlayerId).toBe('alice');
  });

  it('refuse une partie qui ne compte pas exactement 2 joueurs', () => {
    expect(() => createGame([SEEDS[0]!], createSeededRng(1))).toThrow();
  });
});

describe('reveler une tuile', () => {
  it('sort une tuile de la reserve et la rend publique', () => {
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

  it("interdit de reveler hors de son tour", () => {
    const { state, rng } = newGame();
    const res = revealTile(state, 'bob', 'blue', rng);
    expect(res).toMatchObject({ ok: false, error: { code: 'NOT_YOUR_TURN' } });
  });

  it('interdit deux reveals dans le meme tour', () => {
    const { state, rng } = newGame();
    expect(revealTile(state, 'alice', 'blue', rng).ok).toBe(true);
    expect(revealTile(state, 'alice', 'red', rng)).toMatchObject({
      ok: false,
      error: { code: 'WRONG_PHASE' },
    });
  });

  it('refuse une couleur inconnue', () => {
    const { state, rng } = newGame();
    // @ts-expect-error verification de la robustesse face a une entree invalide
    expect(revealTile(state, 'alice', 'purple', rng)).toMatchObject({ ok: false });
  });

  it('refuse une couleur epuisee', () => {
    const { state, rng } = newGame();
    state.reserve = state.reserve.filter((n) => getTileByNumber(n).color !== 'green');
    expect(revealTile(state, 'alice', 'green', rng)).toMatchObject({
      ok: false,
      error: { code: 'COLOR_EXHAUSTED' },
    });
  });

  it('drawTileByColor renvoie null quand la couleur est absente', () => {
    const { state, rng } = newGame();
    state.reserve = [];
    expect(drawTileByColor(state, 'red', rng)).toBeNull();
  });
});

describe('CLASSER', () => {
  it('calcule la position exacte parmi les 6 encoches', () => {
    const secret = [8, 17, 23, 44, 51];
    expect(getClassifyPosition(secret, 3)).toBe(0);
    expect(getClassifyPosition(secret, 12)).toBe(1);
    expect(getClassifyPosition(secret, 20)).toBe(2);
    expect(getClassifyPosition(secret, 30)).toBe(3);
    expect(getClassifyPosition(secret, 50)).toBe(4);
    expect(getClassifyPosition(secret, 60)).toBe(5);
  });

  it('valide la reponse du repondeur sans lui laisser le dernier mot', () => {
    const secret = [8, 17, 23, 44, 51];
    expect(validateClassify(secret, 30, 3)).toEqual({ correctSlot: 3, wasCorrect: true });
    expect(validateClassify(secret, 30, 0)).toEqual({ correctSlot: 3, wasCorrect: false });
  });

  it('place la tuile dans la bonne encoche meme si le repondeur se trompe', () => {
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

  it("interdit au demandeur de repondre a sa propre demande", () => {
    const { state, rng } = newGame();
    revealTile(state, 'alice', 'blue', rng);
    requestClassify(state, 'alice', state.publicTiles[5]!.tile.number);
    expect(submitClassify(state, 'alice', 2)).toMatchObject({
      ok: false,
      error: { code: 'NOT_RESPONDER' },
    });
  });

  it('refuse une tuile non publique et une encoche invalide', () => {
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

  it('autorise le choix de n importe quelle tuile publique, pas seulement la derniere', () => {
    const { state, rng } = newGame();
    revealTile(state, 'alice', 'blue', rng);
    const first = state.publicTiles[0]!.tile.number;
    expect(requestClassify(state, 'alice', first).ok).toBe(true);
  });

  it('empile plusieurs tuiles classees dans la meme encoche', () => {
    const { state, rng } = newGame();
    const alice = getPlayer(state, 'alice')!;
    // On force deux tuiles inferieures au plus petit secret d'Alice.
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
      // C'est maintenant Alice qui repond pour le support de Bob : on verifie
      // seulement que deux classements peuvent viser la meme encoche.
      submitClassify(state, 'alice', 0);
      expect(state.classifications).toHaveLength(2);
    }
    expect(state.classifications.length).toBeGreaterThan(0);
  });
});

describe('tuiles consommees', () => {
  it('une tuile utilisee pour CLASSER quitte la zone commune', () => {
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
    // ...mais elle reste dans l'historique des tuiles sorties du sac.
    expect(state.publicTiles.map((t) => t.tile.number)).toContain(tileNumber);
    expect(state.publicTiles.find((t) => t.tile.number === tileNumber)!.used).toBe(true);
  });

  it('une tuile utilisee pour COMPARER quitte aussi la zone commune', () => {
    const { state, rng } = newGame(6);
    revealTile(state, 'alice', 'red', rng);
    const tileNumber = state.publicTiles[5]!.tile.number;

    requestCompare(state, 'alice', tileNumber, 2);
    submitCompare(state, 'bob');
    expect(isPublicTile(state, tileNumber)).toBe(false);
    expect(availablePublicTiles(state).map((t) => t.tile.number)).not.toContain(tileNumber);
  });

  it('interdit de redemander un indice sur une tuile deja utilisee', () => {
    const { state, rng } = newGame(7);
    revealTile(state, 'alice', 'green', rng);
    const tileNumber = state.publicTiles[5]!.tile.number;
    requestClassify(state, 'alice', tileNumber);
    submitClassify(state, 'bob', 1);

    // Tour de Bob : il ne peut pas reutiliser la tuile consommee par Alice.
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

  it('la zone commune reste stable : une revelation, un indice, par tour', () => {
    const { state, rng } = newGame(8);
    expect(availablePublicTiles(state)).toHaveLength(5);

    for (let turn = 0; turn < 6; turn += 1) {
      const active = state.activePlayerId!;
      const color = COLOR_ORDER.find((c) =>
        state.reserve.some((n) => getTileByNumber(n).color === c),
      )!;
      revealTile(state, active, color, rng);
      // Apres une revelation il y a toujours au moins une tuile disponible :
      // un indice est donc toujours possible.
      const available = availablePublicTiles(state);
      expect(available.length).toBe(6);

      requestClassify(state, active, available[0]!.tile.number);
      submitClassify(state, state.pendingHint!.responderId, 0);
      expect(availablePublicTiles(state)).toHaveLength(5);
    }

    // L'historique, lui, ne cesse de grandir : 5 initiales + 6 revelations.
    expect(state.publicTiles).toHaveLength(11);
  });
});

describe('COMPARER', () => {
  it('compare uniquement les points', () => {
    expect(comparePoints(getTileByNumber(1), getTileByNumber(2))).toBe(true);
    expect(comparePoints(getTileByNumber(1), getTileByNumber(6))).toBe(false);
    expect(comparePointsByNumber(11, 15)).toBe(true);
    expect(comparePointsByNumber(11, 16)).toBe(false);
    expect(comparePointsByNumber(37, 39)).toBe(true);
  });

  it('renvoie OUI quand les points sont egaux, NON sinon', () => {
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

  it('ignore la reponse du client et applique la verite du serveur', () => {
    const { state, rng } = newGame();
    revealTile(state, 'alice', 'blue', rng);
    const tileNumber = state.publicTiles[5]!.tile.number;
    requestCompare(state, 'alice', tileNumber, 0);
    const truth = getCompareTruth(state)!;
    expect(submitCompare(state, 'bob').ok).toBe(true);
    expect(state.comparisons[0]!.match).toBe(truth);
  });

  it('refuse une position hors des 5 emplacements', () => {
    const { state, rng } = newGame();
    revealTile(state, 'alice', 'blue', rng);
    expect(requestCompare(state, 'alice', state.publicTiles[0]!.tile.number, 5)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_POSITION' },
    });
  });

  it('refuse un COMPARER avant le reveal', () => {
    const { state } = newGame();
    expect(requestCompare(state, 'alice', state.publicTiles[0]!.tile.number, 0)).toMatchObject({
      ok: false,
      error: { code: 'WRONG_PHASE' },
    });
  });
});

describe('deroulement des tours', () => {
  it('passe la main apres un indice complet', () => {
    const { state, rng } = newGame();
    expect(state.activePlayerId).toBe('alice');
    playFullTurn(state, rng);
    expect(state.activePlayerId).toBe('bob');
    expect(state.turn).toBe(2);
    expect(state.phase).toBe('TURN_REVEAL');
    expect(state.revealedThisTurn).toBe(false);
  });

  it('alterne les joueurs sur plusieurs tours', () => {
    const { state, rng } = newGame();
    const seen: string[] = [];
    for (let i = 0; i < 6; i += 1) {
      seen.push(state.activePlayerId!);
      playFullTurn(state, rng);
    }
    expect(seen).toEqual(['alice', 'bob', 'alice', 'bob', 'alice', 'bob']);
  });

  it("interdit toute action au joueur inactif", () => {
    const { state, rng } = newGame();
    expect(revealTile(state, 'bob', 'green', rng).ok).toBe(false);
    revealTile(state, 'alice', 'green', rng);
    expect(requestClassify(state, 'bob', state.publicTiles[0]!.tile.number).ok).toBe(false);
  });

  it('interdit une demande d indice sans reveal prealable', () => {
    const { state } = newGame();
    expect(requestClassify(state, 'alice', state.publicTiles[0]!.tile.number)).toMatchObject({
      ok: false,
      error: { code: 'WRONG_PHASE' },
    });
  });

  it('interdit deux indices dans le meme tour', () => {
    const { state, rng } = newGame();
    playFullTurn(state, rng);
    // C'est desormais le tour de Bob : Alice ne peut plus rien demander.
    expect(requestClassify(state, 'alice', state.publicTiles[0]!.tile.number).ok).toBe(false);
  });
});

describe('annonce CONSTELLATION', () => {
  it('accepte une proposition exacte et donne la victoire', () => {
    const { state } = newGame();
    const alice = getPlayer(state, 'alice')!;
    const res = submitGuess(state, 'alice', alice.secret);
    expect(res.ok).toBe(true);
    expect(state.phase).toBe('GAME_OVER');
    expect(state.winnerId).toBe('alice');
    expect(getWinner(state)?.name).toBe('Alice');
  });

  it('elimine le joueur en cas d erreur et laisse l adversaire en lice', () => {
    const { state } = newGame();
    const alice = getPlayer(state, 'alice')!;
    const res = submitGuess(state, 'alice', wrongGuess(alice.secret));
    expect(res.ok).toBe(true);
    expect(getPlayer(state, 'alice')!.eliminated).toBe(true);
    expect(state.phase).not.toBe('GAME_OVER');
    expect(state.activePlayerId).toBe('bob');
  });

  it('refuse une seconde tentative', () => {
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

  it('peut etre tente pendant le tour adverse', () => {
    const { state, rng } = newGame();
    playFullTurn(state, rng);
    expect(state.activePlayerId).toBe('bob');
    const alice = getPlayer(state, 'alice')!;
    expect(submitGuess(state, 'alice', alice.secret).ok).toBe(true);
    expect(state.winnerId).toBe('alice');
  });

  it('termine la partie sans vainqueur si les deux joueurs echouent', () => {
    const { state } = newGame();
    for (const id of ['alice', 'bob']) {
      const player = getPlayer(state, id)!;
      expect(submitGuess(state, id, wrongGuess(player.secret)).ok).toBe(true);
    }
    expect(state.phase).toBe('GAME_OVER');
    expect(state.winnerId).toBeNull();
  });

  it('valide la forme de la proposition', () => {
    expect(validateGuessShape([1, 2, 3, 4, 5]).ok).toBe(true);
    expect(validateGuessShape([1, 2, 3, 4]).ok).toBe(false);
    expect(validateGuessShape([5, 4, 3, 2, 1]).ok).toBe(false);
    expect(validateGuessShape([1, 1, 3, 4, 5]).ok).toBe(false);
    expect(validateGuessShape([0, 2, 3, 4, 5]).ok).toBe(false);
    expect(validateGuessShape([1, 2, 3, 4, 61]).ok).toBe(false);
    expect(validateGuessShape([1, 2, 3, 4, 5.5]).ok).toBe(false);
    // 1,6,11,16,21 sont toutes vertes : une couleur par tuile est obligatoire.
    expect(validateGuessShape([1, 6, 11, 16, 21]).ok).toBe(false);
  });

  it('compare les propositions sans tenir compte de l ordre d envoi', () => {
    expect(validateGuess([3, 12, 25, 40, 58], [58, 40, 25, 12, 3])).toBe(true);
    expect(validateGuess([3, 12, 25, 40, 58], [3, 12, 25, 40, 59])).toBe(false);
    expect(validateGuess([3, 12, 25, 40, 58], [3, 12, 25, 40])).toBe(false);
  });

  it('refuse une proposition mal formee via le moteur', () => {
    const { state } = newGame();
    expect(submitGuess(state, 'alice', [1, 2])).toMatchObject({
      ok: false,
      error: { code: 'INVALID_GUESS' },
    });
  });
});

describe('etats impossibles', () => {
  let state: GameState;
  let rng: Rng;

  beforeEach(() => {
    const game = newGame(3);
    state = game.state;
    rng = game.rng;
  });

  it('bloque toute action apres la fin de partie', () => {
    const alice = getPlayer(state, 'alice')!;
    submitGuess(state, 'alice', alice.secret);
    expect(revealTile(state, 'bob', 'green', rng)).toMatchObject({
      ok: false,
      error: { code: 'GAME_OVER' },
    });
    expect(requestClassify(state, 'bob', state.publicTiles[0]!.tile.number).ok).toBe(false);
    expect(submitGuess(state, 'bob', getPlayer(state, 'bob')!.secret).ok).toBe(false);
  });

  it('bloque un joueur inconnu', () => {
    expect(revealTile(state, 'mallory', 'green', rng)).toMatchObject({
      ok: false,
      error: { code: 'PLAYER_NOT_FOUND' },
    });
  });

  it('bloque un joueur elimine', () => {
    const alice = getPlayer(state, 'alice')!;
    expect(submitGuess(state, 'alice', wrongGuess(alice.secret)).ok).toBe(true);
    expect(revealTile(state, 'alice', 'green', rng)).toMatchObject({
      ok: false,
      error: { code: 'PLAYER_ELIMINATED' },
    });
  });

  it('ne repond pas a un indice inexistant', () => {
    expect(submitClassify(state, 'bob', 0)).toMatchObject({
      ok: false,
      error: { code: 'WRONG_PHASE' },
    });
    expect(submitCompare(state, 'bob')).toMatchObject({
      ok: false,
      error: { code: 'WRONG_PHASE' },
    });
  });

  it('gere l abandon', () => {
    expect(forfeit(state, 'alice').ok).toBe(true);
    expect(state.phase).toBe('GAME_OVER');
    expect(state.winnerId).toBe('bob');
    expect(forfeit(state, 'bob').ok).toBe(false);
  });
});
