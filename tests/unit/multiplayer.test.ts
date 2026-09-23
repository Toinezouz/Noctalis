import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { io as createClient, type Socket } from 'socket.io-client';
import type {
  Ack,
  GameEvent,
  PlayerCredentials,
  StatePayload,
  TileColor,
} from '@noctalis/shared';
import { createNoctalisServer, type NoctalisServer } from '../../server/src/createServer.js';

let server: NoctalisServer;
let url = '';

beforeAll(async () => {
  server = createNoctalisServer({ env: 'test', strictLeakCheck: true });
  await new Promise<void>((resolve) => {
    server.httpServer.listen(0, () => {
      resolve();
    });
  });
  const address = server.httpServer.address() as AddressInfo;
  url = `http://127.0.0.1:${String(address.port)}`;
});

afterAll(async () => {
  await server.close();
});

/**
 * Historique des etats recus par socket : evite toute course entre l'accuse de
 * reception d'une action et l'etat diffuse juste apres.
 */
const received = new Map<Socket, StatePayload[]>();

function connect(): Promise<Socket> {
  return new Promise((resolve, reject) => {
    const socket = createClient(url, { transports: ['websocket'], forceNew: true });
    received.set(socket, []);
    const record = (payload: StatePayload): void => {
      received.get(socket)?.push(payload);
    };
    socket.on('game:state', record);
    socket.on('room:state', record);
    socket.on('connect', () => {
      resolve(socket);
    });
    socket.on('connect_error', reject);
  });
}

function emit<T>(socket: Socket, event: string, payload: unknown): Promise<Ack<T>> {
  return new Promise((resolve) => {
    socket.emit(event, payload, (res: Ack<T>) => {
      resolve(res);
    });
  });
}

/** Attend un etat satisfaisant un predicat (deja recu ou a venir). */
function waitFor(socket: Socket, predicate: (s: StatePayload) => boolean): Promise<StatePayload> {
  const already = received.get(socket)?.find(predicate);
  if (already) {
    return Promise.resolve(already);
  }
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('timeout en attendant un etat'));
    }, 5000);
    const handler = (payload: StatePayload): void => {
      if (predicate(payload)) {
        cleanup();
        resolve(payload);
      }
    };
    const cleanup = (): void => {
      clearTimeout(timer);
      socket.off('game:state', handler);
      socket.off('room:state', handler);
    };
    socket.on('game:state', handler);
    socket.on('room:state', handler);
  });
}

/** Attend un evenement de jeu satisfaisant un predicat. */
function nextEvent(socket: Socket, predicate: (e: GameEvent) => boolean): Promise<GameEvent> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('timeout en attendant un evenement'));
    }, 5000);
    const handler = (event: GameEvent): void => {
      if (predicate(event)) {
        cleanup();
        resolve(event);
      }
    };
    const cleanup = (): void => {
      clearTimeout(timer);
      socket.off('game:event', handler);
    };
    socket.on('game:event', handler);
  });
}

/** Vide l'historique : utile avant une action dont on veut observer l'effet. */
function resetHistory(...sockets: Socket[]): void {
  for (const socket of sockets) {
    received.set(socket, []);
  }
}

interface Session {
  alice: Socket;
  bob: Socket;
  aliceCreds: PlayerCredentials;
  bobCreds: PlayerCredentials;
  code: string;
  aliceState: StatePayload;
  bobState: StatePayload;
  /**
   * Le premier joueur est tire au sort par le serveur : les scenarios qui
   * dependent de l'ordre des tours passent par `first` / `second` plutot que
   * par Alice et Bob.
   */
  first: Socket;
  second: Socket;
  firstCreds: PlayerCredentials;
  secondCreds: PlayerCredentials;
  firstState: StatePayload;
  secondState: StatePayload;
  /** Evenement d'ouverture recu par le premier joueur. */
  startedEvent: GameEvent;
}

/** Cree une room, y fait entrer Bob et lance la partie. */
async function startSession(): Promise<Session> {
  const alice = await connect();
  const bob = await connect();

  const created = await emit<PlayerCredentials>(alice, 'room:create', { name: 'Alice' });
  expect(created.ok).toBe(true);
  const aliceCreds = (created as { ok: true; data: PlayerCredentials }).data;

  const joined = await emit<PlayerCredentials>(bob, 'room:join', {
    name: 'Bob',
    code: aliceCreds.roomCode,
  });
  expect(joined.ok).toBe(true);
  const bobCreds = (joined as { ok: true; data: PlayerCredentials }).data;

  const aliceGame = waitFor(alice, (s) => s.publicState !== null);
  const bobGame = waitFor(bob, (s) => s.publicState !== null);
  const opening = nextEvent(alice, (e) => e.type === 'game-started');
  const started = await emit<null>(alice, 'game:start', {});
  expect(started.ok).toBe(true);

  const [aliceState, bobState, startedEvent] = await Promise.all([aliceGame, bobGame, opening]);
  const aliceStarts = aliceState.publicState!.activePlayerId === aliceCreds.playerId;
  return {
    alice,
    bob,
    aliceCreds,
    bobCreds,
    code: aliceCreds.roomCode,
    aliceState,
    bobState,
    first: aliceStarts ? alice : bob,
    second: aliceStarts ? bob : alice,
    firstCreds: aliceStarts ? aliceCreds : bobCreds,
    secondCreds: aliceStarts ? bobCreds : aliceCreds,
    firstState: aliceStarts ? aliceState : bobState,
    secondState: aliceStarts ? bobState : aliceState,
    startedEvent,
  };
}

function closeAll(session: Session): void {
  session.alice.close();
  session.bob.close();
}

describe('multijoueur temps reel', () => {
  it('cree une room, accueille un second joueur et lance la partie', async () => {
    const session = await startSession();
    const { aliceState, bobState } = session;

    expect(session.code).toHaveLength(5);
    expect(aliceState.room.players.map((p) => p.name)).toEqual(['Alice', 'Bob']);
    expect(aliceState.publicState!.phase).toBe('TURN_REVEAL');
    expect(aliceState.publicState!.publicTiles).toHaveLength(5);
    expect(bobState.publicState!.publicTiles).toHaveLength(5);
    // Le premier joueur est tire au sort : c'est l'un des deux, et les deux
    // clients voient le meme tirage que celui annonce a l'ouverture.
    const drawn = aliceState.publicState!.startingPlayerId;
    expect([session.aliceCreds.playerId, session.bobCreds.playerId]).toContain(drawn);
    expect(aliceState.publicState!.activePlayerId).toBe(drawn);
    expect(bobState.publicState!.startingPlayerId).toBe(drawn);
    expect(session.startedEvent).toEqual({ type: 'game-started', startingPlayerId: drawn });
    // Et l'historique le raconte, sans rediger la phrase (chacun sa langue).
    expect(aliceState.publicState!.log.map((l) => l.code)).toContain('starting-player');
    closeAll(session);
  });

  it('ne transmet jamais a un joueur ses propres numeros secrets', async () => {
    const session = await startSession();
    const alicePrivate = session.aliceState.privateState!;
    const bobPrivate = session.bobState.privateState!;

    // Mes tuiles : uniquement couleur + position.
    for (const tile of alicePrivate.myTiles) {
      expect(Object.keys(tile).sort()).toEqual(['color', 'position']);
    }
    // Les tuiles adverses sont completes.
    expect(alicePrivate.opponentTiles).toHaveLength(5);
    expect(alicePrivate.opponentTiles.every((t) => typeof t.number === 'number')).toBe(true);

    // Symetrie : les tuiles vues par Alice sont bien les secrets de Bob,
    // et Bob ne les recoit jamais.
    const bobSecrets = alicePrivate.opponentTiles.map((t) => t.number);
    const aliceSecrets = bobPrivate.opponentTiles.map((t) => t.number);
    expect(new Set([...bobSecrets, ...aliceSecrets]).size).toBe(10);

    const bobPayload = JSON.stringify(session.bobState);
    const tileNumbersInBobPayload = new Set(
      [...bobPayload.matchAll(/"(?:number|tileNumber)":(\d+)/g)].map((m) => Number(m[1])),
    );
    for (const secret of bobSecrets) {
      expect(tileNumbersInBobPayload.has(secret)).toBe(false);
    }
    closeAll(session);
  });

  it('synchronise un tour complet : reveal + CLASSER + changement de tour', async () => {
    const session = await startSession();
    const { first: alice, second: bob } = session;

    const colors = session.firstState.publicState!.reserveByColor;
    const color = (Object.keys(colors) as TileColor[]).find((c) => colors[c] > 0)!;

    resetHistory(alice, bob);
    const bobSeesReveal = waitFor(bob, (s) => (s.publicState?.publicTiles.length ?? 0) === 6);
    expect((await emit<null>(alice, 'game:reveal', { color })).ok).toBe(true);
    const revealed = await bobSeesReveal;
    const tileNumber = revealed.publicState!.publicTiles[5]!.tile.number;
    expect(revealed.publicState!.phase).toBe('TURN_HINT');

    resetHistory(alice, bob);
    const bobMustAnswer = waitFor(bob, (s) => s.privateState?.pendingResponse != null);
    expect((await emit<null>(alice, 'game:request-classify', { tileNumber })).ok).toBe(true);
    const asked = await bobMustAnswer;
    expect(asked.publicState!.phase).toBe('WAITING_FOR_CLASSIFY');
    expect(asked.privateState!.pendingResponse!.hint.type).toBe('classify');

    resetHistory(alice, bob);
    const aliceSeesResult = waitFor(
      alice,
      (s) => (s.publicState?.classifications.length ?? 0) === 1,
    );
    expect((await emit<null>(bob, 'game:submit-classify', { slot: 2 })).ok).toBe(true);
    const done = await aliceSeesResult;

    const result = done.publicState!.classifications[0]!;
    expect(result.ownerId).toBe(session.firstCreds.playerId);
    // La verite du serveur : la position calculee a partir des vrais numeros.
    const aliceSecrets = session.secondState.privateState!.opponentTiles.map((t) => t.number);
    const expectedSlot = aliceSecrets.filter((n) => n < result.tileNumber).length;
    expect(result.slot).toBe(expectedSlot);

    expect(done.publicState!.activePlayerId).toBe(session.secondCreds.playerId);
    expect(done.publicState!.turn).toBe(2);
    closeAll(session);
  });

  it('la tuile utilisee pour un indice disparait de la zone commune des deux cotes', async () => {
    const session = await startSession();
    const { first: alice, second: bob } = session;

    const colors = session.firstState.publicState!.reserveByColor;
    const color = (Object.keys(colors) as TileColor[]).find((c) => colors[c] > 0)!;

    resetHistory(alice, bob);
    await emit<null>(alice, 'game:reveal', { color });
    const afterReveal = await waitFor(
      alice,
      (s) => (s.publicState?.publicTiles.filter((t) => !t.used).length ?? 0) === 6,
    );
    const tileNumber = afterReveal.publicState!.publicTiles.filter((t) => !t.used)[0]!.tile.number;

    resetHistory(alice, bob);
    await emit<null>(alice, 'game:request-classify', { tileNumber });
    await emit<null>(bob, 'game:submit-classify', { slot: 1 });

    const settled = await waitFor(bob, (s) => (s.publicState?.classifications.length ?? 0) === 1);
    const available = settled.publicState!.publicTiles.filter((t) => !t.used);
    expect(available).toHaveLength(5);
    expect(available.map((t) => t.tile.number)).not.toContain(tileNumber);
    // L'historique conserve la tuile : la fiche de deduction en a besoin.
    expect(settled.publicState!.publicTiles.map((t) => t.tile.number)).toContain(tileNumber);

    // Bob ne peut pas la reutiliser a son tour.
    await emit<null>(bob, 'game:reveal', { color });
    expect(await emit<null>(bob, 'game:request-classify', { tileNumber })).toMatchObject({
      ok: false,
      error: { code: 'TILE_NOT_PUBLIC' },
    });
    closeAll(session);
  });

  it('applique la verite du serveur pour COMPARER', async () => {
    const session = await startSession();
    const { first: alice, second: bob } = session;

    const colors = session.firstState.publicState!.reserveByColor;
    const color = (Object.keys(colors) as TileColor[]).find((c) => colors[c] > 0)!;
    resetHistory(alice, bob);
    await emit<null>(alice, 'game:reveal', { color });
    const afterReveal = await waitFor(alice, (s) => s.publicState?.phase === 'TURN_HINT');
    const tileNumber = afterReveal.publicState!.publicTiles[5]!.tile.number;

    resetHistory(alice, bob);
    const bobAsked = waitFor(bob, (s) => s.privateState?.pendingResponse != null);
    await emit<null>(alice, 'game:request-compare', { tileNumber, position: 1 });
    const asked = await bobAsked;
    const truth = asked.privateState!.pendingResponse!.truth;
    expect(typeof truth).toBe('boolean');

    resetHistory(alice, bob);
    const aliceSeesCompare = waitFor(alice, (s) => (s.publicState?.comparisons.length ?? 0) === 1);
    // Bob tente de mentir : le serveur ignore la valeur envoyee.
    await emit<null>(bob, 'game:submit-compare', { answer: !truth });
    const done = await aliceSeesCompare;
    expect(done.publicState!.comparisons[0]!.match).toBe(truth);
    closeAll(session);
  });

  it('refuse les actions hors tour et hors phase', async () => {
    const session = await startSession();
    const { first: alice, second: bob } = session;

    const outOfTurn = await emit<null>(bob, 'game:reveal', { color: 'green' });
    expect(outOfTurn).toMatchObject({ ok: false, error: { code: 'NOT_YOUR_TURN' } });

    const hintBeforeReveal = await emit<null>(alice, 'game:request-classify', {
      tileNumber: session.firstState.publicState!.publicTiles[0]!.tile.number,
    });
    expect(hintBeforeReveal).toMatchObject({ ok: false, error: { code: 'WRONG_PHASE' } });

    const badColor = await emit<null>(alice, 'game:reveal', { color: 'purple' });
    expect(badColor).toMatchObject({ ok: false, error: { code: 'INVALID_COLOR' } });

    const badGuess = await emit<null>(alice, 'game:guess', { numbers: [1, 2, 3] });
    expect(badGuess).toMatchObject({ ok: false, error: { code: 'INVALID_GUESS' } });
    closeAll(session);
  });

  it('gere la reconnexion apres un refresh, sans fuite de secret', async () => {
    const session = await startSession();
    // On reconnecte le joueur qui a la main : la partie doit rester jouable.
    const aliceSecretsSeenByBob = session.secondState.privateState!.opponentTiles.map(
      (t) => t.number,
    );

    session.first.close();
    const revived = await connect();
    const res = await emit<PlayerCredentials>(revived, 'player:reconnect', {
      code: session.code,
      playerId: session.firstCreds.playerId,
      token: session.firstCreds.token,
    });
    expect(res.ok).toBe(true);
    const state = await waitFor(revived, (s) => s.publicState !== null);
    expect(state.publicState!.phase).toBe('TURN_REVEAL');
    expect(state.privateState!.myTiles).toHaveLength(5);

    const payload = JSON.stringify(state);
    const numbers = new Set(
      [...payload.matchAll(/"(?:number|tileNumber)":(\d+)/g)].map((m) => Number(m[1])),
    );
    for (const secret of aliceSecretsSeenByBob) {
      expect(numbers.has(secret)).toBe(false);
    }

    // Le jeu reste jouable apres reconnexion.
    expect((await emit<null>(revived, 'game:reveal', { color: 'green' })).ok).toBe(true);
    revived.close();
    session.second.close();
  });

  it('refuse une reconnexion avec un mauvais jeton', async () => {
    const session = await startSession();
    const intruder = await connect();
    const res = await emit<PlayerCredentials>(intruder, 'player:reconnect', {
      code: session.code,
      playerId: session.aliceCreds.playerId,
      token: 'jeton-invalide',
    });
    expect(res.ok).toBe(false);
    intruder.close();
    closeAll(session);
  });

  it('signale la deconnexion de l adversaire', async () => {
    const session = await startSession();
    const seen = waitFor(session.bob, (s) => s.room.players.some((p) => !p.connected));
    session.alice.close();
    const state = await seen;
    expect(state.room.players.find((p) => p.name === 'Alice')!.connected).toBe(false);
    session.bob.close();
  });

  it('refuse un code inexistant, une room pleine et un pseudo invalide', async () => {
    const session = await startSession();
    const third = await connect();

    expect(await emit(third, 'room:join', { name: 'Chris', code: 'ZZZZZ' })).toMatchObject({
      ok: false,
    });
    expect(await emit(third, 'room:join', { name: 'Chris', code: session.code })).toMatchObject({
      ok: false,
    });
    expect(await emit(third, 'room:create', { name: 'x' })).toMatchObject({ ok: false });
    expect(await emit(third, 'room:join', { name: 'Chris', code: 'abc' })).toMatchObject({
      ok: false,
    });
    third.close();
    closeAll(session);
  });

  it('joue une observation jusqu a la victoire et propose une revanche', async () => {
    const session = await startSession();
    const { alice, bob } = session;
    // Bob voit les vrais numeros d'Alice : on les utilise pour une tentative
    // gagnante (c'est exactement l'information dont dispose un joueur humain).
    const aliceSecrets = session.bobState.privateState!.opponentTiles.map((t) => t.number);

    const over = waitFor(bob, (s) => s.publicState?.phase === 'GAME_OVER');
    expect((await emit<null>(alice, 'game:guess', { numbers: aliceSecrets })).ok).toBe(true);
    const finished = await over;

    expect(finished.publicState!.winnerId).toBe(session.aliceCreds.playerId);
    expect(finished.publicState!.finalReveal).not.toBeNull();
    expect(finished.publicState!.finalReveal![session.aliceCreds.playerId]!.map((t) => t.number)).
      toEqual(aliceSecrets);

    // Revanche : il faut que les deux joueurs cliquent sur REJOUER.
    resetHistory(alice, bob);
    const askedRematch = waitFor(bob, (s) => s.room.rematchReady.length === 1);
    await emit<null>(alice, 'game:rematch', {});
    await askedRematch;

    resetHistory(alice, bob);
    const newGame = waitFor(alice, (s) => s.publicState?.phase === 'TURN_REVEAL');
    await emit<null>(bob, 'game:rematch', {});
    const fresh = await newGame;
    expect(fresh.publicState!.turn).toBe(1);
    expect(fresh.publicState!.publicTiles).toHaveLength(5);
    expect(fresh.publicState!.winnerId).toBeNull();
    closeAll(session);
  });

  it('elimine un joueur apres une tentative ratee et laisse la partie continuer', async () => {
    const session = await startSession();
    const { alice, bob } = session;
    const aliceSecrets = session.bobState.privateState!.opponentTiles.map((t) => t.number);
    // Proposition valide dans sa forme mais fausse : on decale d'une couleur.
    const wrong = [1, 2, 3, 4, 5]
      .map((base) => {
        for (let n = base; n <= 60; n += 5) {
          if (!aliceSecrets.includes(n)) {
            return n;
          }
        }
        return base;
      })
      .sort((a, b) => a - b);

    const eliminated = waitFor(bob, (s) =>
      (s.publicState?.players ?? []).some((p) => p.eliminated),
    );
    expect((await emit<null>(alice, 'game:guess', { numbers: wrong })).ok).toBe(true);
    const state = await eliminated;
    expect(state.publicState!.phase).not.toBe('GAME_OVER');
    expect(state.publicState!.activePlayerId).toBe(session.bobCreds.playerId);

    // Alice ne peut plus jouer ni retenter.
    expect(await emit<null>(alice, 'game:guess', { numbers: aliceSecrets })).toMatchObject({
      ok: false,
      error: { code: 'GUESS_ALREADY_USED' },
    });
    // ...mais Bob continue sa partie normalement.
    expect((await emit<null>(bob, 'game:reveal', { color: 'green' })).ok).toBe(true);
    closeAll(session);
  });

  it('limite le debit des evenements', async () => {
    const socket = await connect();
    const results: boolean[] = [];
    for (let i = 0; i < 40; i += 1) {
      const res = await emit<unknown>(socket, 'room:create', { name: `Spam${String(i)}` });
      results.push(res.ok);
    }
    expect(results.filter((r) => !r).length).toBeGreaterThan(0);
    socket.close();
  });

  it('quitte proprement une partie (abandon)', async () => {
    const session = await startSession();
    const over = waitFor(session.bob, (s) => s.publicState?.phase === 'GAME_OVER');
    await emit<null>(session.alice, 'room:leave', {});
    const state = await over;
    expect(state.publicState!.winnerId).toBe(session.bobCreds.playerId);
    closeAll(session);
  });
});
