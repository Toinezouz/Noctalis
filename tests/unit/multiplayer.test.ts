import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { io as createClient, type Socket } from 'socket.io-client';
import type {
  Ack,
  GameEvent,
  PlayerCredentials,
  StatePayload,
  TileColor,
} from '@umbrastra/shared';
import { createUmbrastraServer, type UmbrastraServer } from '../../server/src/createServer.js';

let server: UmbrastraServer;
let url = '';

beforeAll(async () => {
  server = createUmbrastraServer({ env: 'test', strictLeakCheck: true });
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
 * States received per socket: avoids any race between an action's
 * acknowledgement and the state broadcast right after it.
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

/** Waits for a state matching a predicate (already received or upcoming). */
function waitFor(socket: Socket, predicate: (s: StatePayload) => boolean): Promise<StatePayload> {
  const already = received.get(socket)?.find(predicate);
  if (already) {
    return Promise.resolve(already);
  }
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('timed out waiting for a state'));
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

/** Waits for a game event matching a predicate. */
function nextEvent(socket: Socket, predicate: (e: GameEvent) => boolean): Promise<GameEvent> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('timed out waiting for an event'));
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

/** Clears the history: handy before an action whose effect is observed. */
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
   * The server draws the first player at random: scenarios that depend on
   * the turn order use `first` / `second` rather than Alice and Bob.
   */
  first: Socket;
  second: Socket;
  firstCreds: PlayerCredentials;
  secondCreds: PlayerCredentials;
  firstState: StatePayload;
  secondState: StatePayload;
  /** Opening event received by the first player. */
  startedEvent: GameEvent;
}

/** Creates a room, lets Bob in and starts the game. */
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

describe('real-time multiplayer', () => {
  it('creates a room, welcomes a second player and starts the game', async () => {
    const session = await startSession();
    const { aliceState, bobState } = session;

    expect(session.code).toHaveLength(5);
    expect(aliceState.room.players.map((p) => p.name)).toEqual(['Alice', 'Bob']);
    expect(aliceState.publicState!.phase).toBe('TURN_REVEAL');
    expect(aliceState.publicState!.publicTiles).toHaveLength(5);
    expect(bobState.publicState!.publicTiles).toHaveLength(5);
    // The first player is drawn at random: one of the two, and both clients
    // see the same draw as the one announced at the opening.
    const drawn = aliceState.publicState!.startingPlayerId;
    expect([session.aliceCreds.playerId, session.bobCreds.playerId]).toContain(drawn);
    expect(aliceState.publicState!.activePlayerId).toBe(drawn);
    expect(bobState.publicState!.startingPlayerId).toBe(drawn);
    expect(session.startedEvent).toEqual({ type: 'game-started', startingPlayerId: drawn });
    // And the history tells it, without writing the sentence (each their own language).
    expect(aliceState.publicState!.log.map((l) => l.code)).toContain('starting-player');
    closeAll(session);
  });

  it('never sends a player their own secret numbers', async () => {
    const session = await startSession();
    const alicePrivate = session.aliceState.privateState!;
    const bobPrivate = session.bobState.privateState!;

    // My stars: constellation and position only.
    for (const tile of alicePrivate.myTiles) {
      expect(Object.keys(tile).sort()).toEqual(['color', 'position']);
    }
    // The other player's stars are complete.
    expect(alicePrivate.rivals[0]!.tiles).toHaveLength(5);
    expect(alicePrivate.rivals[0]!.tiles.every((t) => typeof t.number === 'number')).toBe(true);

    // Symmetry: the stars Alice sees are Bob's secrets, and Bob never
    // receives them.
    const bobSecrets = alicePrivate.rivals[0]!.tiles.map((t) => t.number);
    const aliceSecrets = bobPrivate.rivals[0]!.tiles.map((t) => t.number);
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

  it('syncs a full turn: reveal + PLACE + next turn', async () => {
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
    // The server's truth: the gap computed from the real numbers.
    const aliceSecrets = session.secondState.privateState!.rivals[0]!.tiles.map((t) => t.number);
    const expectedSlot = aliceSecrets.filter((n) => n < result.tileNumber).length;
    expect(result.slot).toBe(expectedSlot);

    expect(done.publicState!.activePlayerId).toBe(session.secondCreds.playerId);
    expect(done.publicState!.turn).toBe(2);
    closeAll(session);
  });

  it('a star used for a hint leaves the shared sky on both sides', async () => {
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
    // The memory keeps the star: the star chart needs it.
    expect(settled.publicState!.publicTiles.map((t) => t.tile.number)).toContain(tileNumber);

    // Bob cannot reuse it on his turn.
    await emit<null>(bob, 'game:reveal', { color });
    expect(await emit<null>(bob, 'game:request-classify', { tileNumber })).toMatchObject({
      ok: false,
      error: { code: 'TILE_NOT_PUBLIC' },
    });
    closeAll(session);
  });

  it('applies the server\'s truth for GAUGE', async () => {
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
    // Bob tries to lie: the server ignores the value sent.
    await emit<null>(bob, 'game:submit-compare', { answer: !truth });
    const done = await aliceSeesCompare;
    expect(done.publicState!.comparisons[0]!.match).toBe(truth);
    closeAll(session);
  });

  it('refuses out-of-turn and out-of-phase actions', async () => {
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

  it('handles reconnection after a reload, without leaking a secret', async () => {
    const session = await startSession();
    // Reconnect the player in the lead: the game must stay playable.
    const aliceSecretsSeenByBob = session.secondState.privateState!.rivals[0]!.tiles.map(
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

    // The game is still playable after reconnecting.
    expect((await emit<null>(revived, 'game:reveal', { color: 'green' })).ok).toBe(true);
    revived.close();
    session.second.close();
  });

  it('refuses a reconnection with a wrong token', async () => {
    const session = await startSession();
    const intruder = await connect();
    const res = await emit<PlayerCredentials>(intruder, 'player:reconnect', {
      code: session.code,
      playerId: session.aliceCreds.playerId,
      token: 'invalid-token',
    });
    expect(res.ok).toBe(false);
    intruder.close();
    closeAll(session);
  });

  it('reports the other player\'s disconnection', async () => {
    const session = await startSession();
    const seen = waitFor(session.bob, (s) => s.room.players.some((p) => !p.connected));
    session.alice.close();
    const state = await seen;
    expect(state.room.players.find((p) => p.name === 'Alice')!.connected).toBe(false);
    session.bob.close();
  });

  it('refuses an unknown code, a started game and an invalid name', async () => {
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

  it('plays a game to victory and offers a rematch', async () => {
    const session = await startSession();
    const { alice, bob } = session;
    // Bob sees Alice's real numbers: they make a winning call (exactly the
    // information a human player would have).
    const aliceSecrets = session.bobState.privateState!.rivals[0]!.tiles.map((t) => t.number);

    const over = waitFor(bob, (s) => s.publicState?.phase === 'GAME_OVER');
    expect((await emit<null>(alice, 'game:guess', { numbers: aliceSecrets })).ok).toBe(true);
    const finished = await over;

    expect(finished.publicState!.winnerId).toBe(session.aliceCreds.playerId);
    expect(finished.publicState!.finalReveal).not.toBeNull();
    expect(finished.publicState!.finalReveal![session.aliceCreds.playerId]!.map((t) => t.number)).
      toEqual(aliceSecrets);

    // Rematch: both players have to ask for it.
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

  it('puts a player out after a wrong call and lets the game go on', async () => {
    const session = await startSession();
    const { alice, bob } = session;
    const aliceSecrets = session.bobState.privateState!.rivals[0]!.tiles.map((t) => t.number);
    // A call with a valid shape but wrong numbers.
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

    // Alice can neither play nor call again.
    expect(await emit<null>(alice, 'game:guess', { numbers: aliceSecrets })).toMatchObject({
      ok: false,
      error: { code: 'GUESS_ALREADY_USED' },
    });
    // ...but Bob carries on normally.
    expect((await emit<null>(bob, 'game:reveal', { color: 'green' })).ok).toBe(true);
    closeAll(session);
  });

  it('rate-limits events', async () => {
    const socket = await connect();
    const results: boolean[] = [];
    for (let i = 0; i < 40; i += 1) {
      const res = await emit<unknown>(socket, 'room:create', { name: `Spam${String(i)}` });
      results.push(res.ok);
    }
    expect(results.filter((r) => !r).length).toBeGreaterThan(0);
    socket.close();
  });

  it('leaves a game cleanly (forfeit)', async () => {
    const session = await startSession();
    const over = waitFor(session.bob, (s) => s.publicState?.phase === 'GAME_OVER');
    await emit<null>(session.alice, 'room:leave', {});
    const state = await over;
    expect(state.publicState!.winnerId).toBe(session.bobCreds.playerId);
    closeAll(session);
  });
});

/** Opens a room for `names.length` players (the first one hosts) without starting it. */
async function openTable(
  names: string[],
): Promise<{ sockets: Socket[]; creds: PlayerCredentials[]; code: string }> {
  const sockets: Socket[] = [];
  const creds: PlayerCredentials[] = [];
  for (const [index, name] of names.entries()) {
    const socket = await connect();
    const res =
      index === 0
        ? await emit<PlayerCredentials>(socket, 'room:create', { name })
        : await emit<PlayerCredentials>(socket, 'room:join', { name, code: creds[0]!.roomCode });
    expect(res.ok).toBe(true);
    sockets.push(socket);
    creds.push((res as { ok: true; data: PlayerCredentials }).data);
  }
  return { sockets, creds, code: creds[0]!.roomCode };
}

/** Starts the game and returns everybody's first game state. */
async function startTable(sockets: Socket[]): Promise<StatePayload[]> {
  const states = sockets.map((s) => waitFor(s, (p) => p.publicState !== null));
  expect((await emit<null>(sockets[0]!, 'game:start', {})).ok).toBe(true);
  return Promise.all(states);
}

describe('tables of three and four', () => {
  it('seats four players, refuses a fifth, and deals to everyone', async () => {
    const { sockets, code } = await openTable(['Alice', 'Bob', 'Chloe', 'Dany']);
    const fifth = await connect();
    expect(await emit(fifth, 'room:join', { name: 'Eve', code })).toMatchObject({
      ok: false,
      error: { code: 'ROOM_FULL' },
    });

    const states = await startTable(sockets);
    for (const state of states) {
      expect(state.publicState!.players).toHaveLength(4);
      expect(state.publicState!.order).toHaveLength(4);
      expect(state.privateState!.rivals).toHaveLength(3);
      expect(state.privateState!.rivals.every((r) => r.tiles.length === 5)).toBe(true);
    }
    // Twenty secret stars, all different, and nobody receives their own.
    const secrets = new Map<string, number[]>();
    for (const state of states) {
      for (const rival of state.privateState!.rivals) {
        secrets.set(rival.playerId, rival.tiles.map((t) => t.number));
      }
    }
    expect(new Set([...secrets.values()].flat()).size).toBe(20);
    for (const state of states) {
      const mine = secrets.get(state.privateState!.playerId)!;
      const found = new Set(
        [...JSON.stringify(state).matchAll(/"(?:number|tileNumber)":(\d+)/g)].map((m) =>
          Number(m[1]),
        ),
      );
      expect(mine.some((n) => found.has(n))).toBe(false);
    }
    fifth.close();
    sockets.forEach((s) => s.close());
  });

  it('refuses a newcomer once the game has started', async () => {
    const { sockets, code } = await openTable(['Alice', 'Bob', 'Chloe']);
    await startTable(sockets);
    const late = await connect();
    expect(await emit(late, 'room:join', { name: 'Dany', code })).toMatchObject({
      ok: false,
      error: { code: 'ROOM_STARTED' },
    });
    late.close();
    sockets.forEach((s) => s.close());
  });

  it('asks the next player in the turn order, and moves on when they go offline', async () => {
    const { sockets, creds } = await openTable(['Alice', 'Bob', 'Chloe']);
    const [first] = await startTable(sockets);
    const order = first!.publicState!.order;
    const socketOf = (id: string): Socket => sockets[creds.findIndex((c) => c.playerId === id)]!;
    const lead = socketOf(order[0]!);
    const next = socketOf(order[1]!);
    const after = socketOf(order[2]!);

    const colors = first!.publicState!.reserveByColor;
    const color = (Object.keys(colors) as TileColor[]).find((c) => colors[c] > 0)!;
    expect((await emit<null>(lead, 'game:reveal', { color })).ok).toBe(true);
    const revealed = await waitFor(lead, (s) => s.publicState?.phase === 'TURN_HINT');
    const tileNumber = revealed.publicState!.publicTiles.at(-1)!.tile.number;

    const nextAsked = waitFor(next, (s) => s.privateState?.pendingResponse != null);
    expect((await emit<null>(lead, 'game:request-compare', { tileNumber, position: 0 })).ok).toBe(
      true,
    );
    expect((await nextAsked).publicState!.pendingHint!.responderId).toBe(order[1]);

    // The next player closes their tab: the third one is asked instead.
    resetHistory(after);
    const handedOver = nextEvent(after, (e) => e.type === 'hint-requested');
    const afterAsked = waitFor(after, (s) => s.privateState?.pendingResponse != null);
    next.close();
    await handedOver;
    await afterAsked;
    const answered = waitFor(lead, (s) => (s.publicState?.comparisons.length ?? 0) === 1);
    expect((await emit<null>(after, 'game:submit-compare', { answer: true })).ok).toBe(true);
    await answered;
    sockets.forEach((s) => s.close());
  });

  it('goes on without a player who leaves, and hands the host role over', async () => {
    const { sockets, creds } = await openTable(['Alice', 'Bob', 'Chloe']);
    await startTable(sockets);
    const [alice, bob, chloe] = sockets;

    resetHistory(bob!, chloe!);
    const seen = waitFor(bob!, (s) => s.publicState?.players.some((p) => p.left) ?? false);
    expect((await emit<null>(alice!, 'room:leave', {})).ok).toBe(true);
    const state = await seen;
    expect(state.publicState!.phase).not.toBe('GAME_OVER');
    expect(state.room.players.map((p) => p.name)).toEqual(['Bob', 'Chloe']);
    expect(state.room.players.find((p) => p.id === creds[1]!.playerId)!.isHost).toBe(true);
    expect(state.publicState!.activePlayerId).not.toBe(creds[0]!.playerId);

    // One more departure and the last person at the table wins.
    const over = waitFor(chloe!, (s) => s.publicState?.phase === 'GAME_OVER');
    expect((await emit<null>(bob!, 'room:leave', {})).ok).toBe(true);
    expect((await over).publicState!.winnerId).toBe(creds[2]!.playerId);
    sockets.forEach((s) => s.close());
  });

  it('waits for everybody before a rematch', async () => {
    const { sockets } = await openTable(['Alice', 'Bob', 'Chloe']);
    const states = await startTable(sockets);
    // Nobody sees their own stars: Bob's winning call is read on Alice's screen.
    const bobId = states[1]!.privateState!.playerId;
    const bobStars = states[0]!.privateState!.rivals.find((r) => r.playerId === bobId)!.tiles;
    const over = waitFor(sockets[0]!, (s) => s.publicState?.phase === 'GAME_OVER');
    expect(
      (await emit<null>(sockets[1]!, 'game:guess', { numbers: bobStars.map((t) => t.number) })).ok,
    ).toBe(true);
    await over;

    resetHistory(...sockets);
    await emit<null>(sockets[0]!, 'game:rematch', {});
    await emit<null>(sockets[1]!, 'game:rematch', {});
    const two = await waitFor(sockets[2]!, (s) => s.room.rematchReady.length === 2);
    expect(two.publicState!.phase).toBe('GAME_OVER');
    const fresh = waitFor(sockets[0]!, (s) => s.publicState?.phase === 'TURN_REVEAL');
    await emit<null>(sockets[2]!, 'game:rematch', {});
    expect((await fresh).publicState!.players).toHaveLength(3);
    sockets.forEach((s) => s.close());
  });
});
