import type { Server, Socket } from 'socket.io';
import {
  type Ack,
  type ClientToServerEvents,
  type GameError,
  type GameErrorCode,
  type GameEvent,
  type PlayerCredentials,
  type ServerToClientEvents,
  type StatePayload,
  SECRET_TILE_COUNT,
  CLASSIFY_SLOT_COUNT,
  MAX_PLAYERS,
  MIN_PLAYERS,
  defaultRng,
  findSecretLeak,
  forfeit,
  requestClassify,
  requestCompare,
  revealTile,
  submitClassify,
  submitCompare,
  submitGuess,
  toPlayerPrivateState,
  toPublicGameState,
  validateColor,
  validateIndex,
  validateName,
  validateNumberList,
  validateRoomCode,
  validateTileNumber,
} from '@umbrastra/shared';
import { RateLimiter, RATE_LIMITS } from '../security/rateLimit.js';
import type { JoinError, Room, RoomManager } from '../rooms/RoomManager.js';

export interface SocketData {
  roomCode: string | null;
  playerId: string | null;
}

export type GameServer = Server<ClientToServerEvents, ServerToClientEvents, never, SocketData>;
export type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents, never, SocketData>;

/**
 * Every room refusal carries its own code; players see a translation of it.
 * The messages are for developers reading logs and raw acknowledgements.
 */
const JOIN_ERRORS: Record<JoinError, { code: GameErrorCode; message: string }> = {
  ROOM_NOT_FOUND: { code: 'ROOM_NOT_FOUND', message: 'No such room (or it expired).' },
  ROOM_FULL: { code: 'ROOM_FULL', message: 'This room is full.' },
  ROOM_STARTED: { code: 'ROOM_STARTED', message: 'This game has already started.' },
  ROOM_FINISHED: { code: 'ROOM_FINISHED', message: 'This game is over.' },
  NAME_TAKEN: { code: 'NAME_TAKEN', message: 'This name is already taken in the room.' },
  BAD_TOKEN: { code: 'BAD_TOKEN', message: 'Invalid session: join again with the code.' },
  TOO_MANY_ROOMS: { code: 'SERVER_BUSY', message: 'Too many rooms, try again shortly.' },
};

/** Builds the error answer matching a room refusal. */
function joinError(reason: JoinError): Ack<never> {
  const entry = JOIN_ERRORS[reason];
  return err(entry.code, entry.message);
}

function err(code: GameErrorCode, message: string): Ack<never> {
  return { ok: false, error: { code, message } };
}

function ok<T>(data: T): Ack<T> {
  return { ok: true, data };
}

/** Answers an ack, even if the client did not provide one (robustness). */
function reply<T>(ack: unknown, value: Ack<T>): void {
  if (typeof ack === 'function') {
    (ack as (res: Ack<T>) => void)(value);
  }
}

export interface HandlerContext {
  io: GameServer;
  rooms: RoomManager;
  /** Leak check before every emission (development / tests). */
  strictLeakCheck: boolean;
  /** Logs refused actions (useful in development and tests). */
  logRefusals?: boolean;
}

/** Builds the state payload meant for one given player. */
function buildStatePayload(room: Room, playerId: string | null): StatePayload {
  const publicState = room.game ? toPublicGameState(room.game) : null;
  const privateState =
    room.game && playerId ? toPlayerPrivateState(room.game, playerId) : null;
  return { room: room.toRoomState(), publicState, privateState };
}

/** Sends each player their own view: never the full server state. */
export function broadcastState(ctx: HandlerContext, room: Room): void {
  for (const player of room.players) {
    if (!player.socketId) {
      continue;
    }
    const payload = buildStatePayload(room, player.id);
    if (ctx.strictLeakCheck && room.game) {
      const leak = findSecretLeak(room.game, player.id, payload);
      if (leak) {
        // Safety net: better to break the game than to reveal a secret
        // number to its owner.
        console.error(
          `[SECURITY] Leak detected towards ${player.id}: number ${String(leak.number)} at ${leak.path}`,
        );
        ctx.io.to(player.socketId).emit('server:error', {
          code: 'GAME_OVER',
          message: 'Internal security error: game interrupted.',
        });
        continue;
      }
    }
    ctx.io.to(player.socketId).emit(room.game ? 'game:state' : 'room:state', payload);
  }
}

function emitEvents(ctx: HandlerContext, room: Room, events: GameEvent[]): void {
  for (const event of events) {
    ctx.io.to(room.code).emit('game:event', event);
  }
}

function currentRoom(ctx: HandlerContext, socket: GameSocket): Room | null {
  const code = socket.data.roomCode;
  if (!code) {
    return null;
  }
  return ctx.rooms.get(code) ?? null;
}

/** Returns the authenticated room and player behind this socket. */
function requireSession(
  ctx: HandlerContext,
  socket: GameSocket,
): { room: Room; playerId: string } | GameError {
  const room = currentRoom(ctx, socket);
  const playerId = socket.data.playerId;
  if (!room || !playerId || !room.getPlayer(playerId)) {
    return { code: 'PLAYER_NOT_FOUND', message: 'Not in a room any more.' };
  }
  const player = room.getPlayer(playerId)!;
  if (player.socketId !== socket.id) {
    return { code: 'PLAYER_NOT_FOUND', message: 'Invalid session.' };
  }
  return { room, playerId };
}

export function registerHandlers(ctx: HandlerContext, socket: GameSocket): void {
  const limiter = new RateLimiter(RATE_LIMITS['global']!);
  const eventLimiters = new Map<string, RateLimiter>();

  const allow = (event: string): boolean => {
    if (!limiter.take(socket.id)) {
      return false;
    }
    const config = RATE_LIMITS[event] ?? RATE_LIMITS['action']!;
    let eventLimiter = eventLimiters.get(event);
    if (!eventLimiter) {
      eventLimiter = new RateLimiter(config);
      eventLimiters.set(event, eventLimiter);
    }
    return eventLimiter.take(socket.id);
  };

  const guard = <T>(event: string, ack: unknown): boolean => {
    if (allow(event)) {
      return true;
    }
    reply<T>(ack, err('WRONG_PHASE', 'Too many actions in a row, slow down.'));
    return false;
  };

  socket.data.roomCode = null;
  socket.data.playerId = null;

  // --- Room ---------------------------------------------------------------

  socket.on('room:create', (payload, ack) => {
    if (!guard<PlayerCredentials>('room:create', ack)) {
      return;
    }
    const name = validateName(payload?.name);
    if (!name.ok) {
      reply(ack, err('INVALID_NAME', name.reason));
      return;
    }
    const created = ctx.rooms.create(name.value, socket.id);
    if (!created.ok) {
      reply(ack, joinError(created.error));
      return;
    }
    const { room, player } = created.value;
    socket.data.roomCode = room.code;
    socket.data.playerId = player.id;
    void socket.join(room.code);
    reply(ack, ok(room.credentialsFor(player)));
    broadcastState(ctx, room);
  });

  socket.on('room:join', (payload, ack) => {
    if (!guard<PlayerCredentials>('room:join', ack)) {
      return;
    }
    const name = validateName(payload?.name);
    if (!name.ok) {
      reply(ack, err('INVALID_NAME', name.reason));
      return;
    }
    const code = validateRoomCode(payload?.code);
    if (!code.ok) {
      reply(ack, err('INVALID_CODE', code.reason));
      return;
    }
    const joined = ctx.rooms.join(code.value, name.value, socket.id);
    if (!joined.ok) {
      reply(ack, joinError(joined.error));
      return;
    }
    const { room, player } = joined.value;
    socket.data.roomCode = room.code;
    socket.data.playerId = player.id;
    void socket.join(room.code);
    reply(ack, ok(room.credentialsFor(player)));
    socket.to(room.code).emit('player:joined', { playerId: player.id, name: player.name });
    broadcastState(ctx, room);
  });

  socket.on('player:reconnect', (payload, ack) => {
    if (!guard<PlayerCredentials>('player:reconnect', ack)) {
      return;
    }
    const code = validateRoomCode(payload?.code);
    if (!code.ok) {
      reply(ack, err('INVALID_CODE', code.reason));
      return;
    }
    if (typeof payload?.playerId !== 'string' || typeof payload?.token !== 'string') {
      reply(ack, err('BAD_TOKEN', 'Invalid session.'));
      return;
    }
    const res = ctx.rooms.reconnect(code.value, payload.playerId, payload.token, socket.id);
    if (!res.ok) {
      reply(ack, joinError(res.error));
      return;
    }
    const { room, player } = res.value;
    socket.data.roomCode = room.code;
    socket.data.playerId = player.id;
    void socket.join(room.code);
    reply(ack, ok(room.credentialsFor(player)));
    socket.to(room.code).emit('player:reconnected', { playerId: player.id, name: player.name });
    broadcastState(ctx, room);
  });

  socket.on('room:leave', (_payload, ack) => {
    if (!guard<null>('room:leave', ack)) {
      return;
    }
    const session = requireSession(ctx, socket);
    if ('code' in session) {
      reply(ack, ok(null));
      return;
    }
    const { room, playerId } = session;
    const player = room.getPlayer(playerId)!;

    if (room.game && room.game.phase !== 'GAME_OVER') {
      // With three or four players the game goes on without them; with two,
      // the other player wins.
      const result = forfeit(room.game, playerId);
      if (result.ok) {
        if (result.events.some((e) => e.type === 'game-over')) {
          room.status = 'finished';
        }
        emitEvents(ctx, room, result.events);
      }
    }
    void socket.leave(room.code);
    ctx.rooms.removePlayer(room, playerId);
    socket.data.roomCode = null;
    socket.data.playerId = null;
    ctx.io.to(room.code).emit('player:left', { playerId, name: player.name });
    reply(ack, ok(null));
    broadcastState(ctx, room);
  });

  // --- Game ---------------------------------------------------------------

  socket.on('game:start', (_payload, ack) => {
    if (!guard<null>('game:start', ack)) {
      return;
    }
    const session = requireSession(ctx, socket);
    if ('code' in session) {
      reply(ack, { ok: false, error: session });
      return;
    }
    const { room, playerId } = session;
    if (room.players.length < MIN_PLAYERS || room.players.length > MAX_PLAYERS) {
      reply(ack, err('NOT_ENOUGH_PLAYERS', 'A game needs 2 to 4 players.'));
      return;
    }
    if (room.game && room.game.phase !== 'GAME_OVER') {
      reply(ack, err('WRONG_PHASE', 'The game is already running.'));
      return;
    }
    if (!room.getPlayer(playerId)?.isHost) {
      reply(ack, err('NOT_YOUR_TURN', 'Only the host can start the game.'));
      return;
    }
    const events = room.startGame();
    reply(ack, ok(null));
    // The draw is announced before the state: the client then knows a
    // roulette is coming from the very first render of the table, and
    // nothing (tutorial included) shows on top of it.
    emitEvents(ctx, room, events);
    broadcastState(ctx, room);
  });

  socket.on('game:rematch', (_payload, ack) => {
    if (!guard<null>('game:rematch', ack)) {
      return;
    }
    const session = requireSession(ctx, socket);
    if ('code' in session) {
      reply(ack, { ok: false, error: session });
      return;
    }
    const { room, playerId } = session;
    if (!room.game || room.game.phase !== 'GAME_OVER') {
      reply(ack, err('WRONG_PHASE', 'The game is not over.'));
      return;
    }
    if (room.players.length < MIN_PLAYERS) {
      reply(ack, err('NOT_ENOUGH_PLAYERS', 'Not enough players left for a rematch.'));
      return;
    }
    room.rematchReady.add(playerId);
    const events =
      room.rematchReady.size === room.players.length ? room.startGame() : ([] as GameEvent[]);
    reply(ack, ok(null));
    emitEvents(ctx, room, events);
    broadcastState(ctx, room);
  });

  /** Builds a game action handler: a session and a running game are required. */
  const gameAction = (
    event: string,
    run: (room: Room, playerId: string, payload: never) => Ack<null>,
  ) => {
    return (payload: unknown, ack: unknown): void => {
      if (!guard<null>(event, ack)) {
        return;
      }
      const session = requireSession(ctx, socket);
      if ('code' in session) {
        reply(ack, { ok: false, error: session });
        return;
      }
      const { room, playerId } = session;
      if (!room.game) {
        reply(ack, err('WRONG_PHASE', 'The game has not started yet.'));
        return;
      }
      const result = run(room, playerId, payload as never);
      if (!result.ok && ctx.logRefusals) {
        console.error(
          `[action] ${event} refused for ${playerId}: ${result.error.code} - ${result.error.message}`,
        );
      }
      room.touch();
      if (room.game.phase === 'GAME_OVER') {
        room.status = 'finished';
      }
      reply(ack, result);
      broadcastState(ctx, room);
    };
  };

  socket.on(
    'game:reveal',
    gameAction('game:reveal', (room, playerId, payload: { color: unknown }) => {
      const color = validateColor(payload?.color);
      if (!color.ok) {
        return err('INVALID_COLOR', color.reason);
      }
      const result = revealTile(room.game!, playerId, color.value, defaultRng);
      if (!result.ok) {
        return { ok: false, error: result.error };
      }
      emitEvents(ctx, room, result.events);
      return ok(null);
    }),
  );

  socket.on(
    'game:request-classify',
    gameAction('game:request-classify', (room, playerId, payload: { tileNumber: unknown }) => {
      const tile = validateTileNumber(payload?.tileNumber);
      if (!tile.ok) {
        return err('TILE_NOT_PUBLIC', tile.reason);
      }
      const result = requestClassify(room.game!, playerId, tile.value);
      if (!result.ok) {
        return { ok: false, error: result.error };
      }
      emitEvents(ctx, room, result.events);
      return ok(null);
    }),
  );

  socket.on(
    'game:submit-classify',
    gameAction('game:submit-classify', (room, playerId, payload: { slot: unknown }) => {
      const slot = validateIndex(payload?.slot, CLASSIFY_SLOT_COUNT);
      if (!slot.ok) {
        return err('INVALID_SLOT', slot.reason);
      }
      const result = submitClassify(room.game!, playerId, slot.value);
      if (!result.ok) {
        return { ok: false, error: result.error };
      }
      emitEvents(ctx, room, result.events);
      return ok(null);
    }),
  );

  socket.on(
    'game:request-compare',
    gameAction(
      'game:request-compare',
      (room, playerId, payload: { tileNumber: unknown; position: unknown }) => {
        const tile = validateTileNumber(payload?.tileNumber);
        if (!tile.ok) {
          return err('TILE_NOT_PUBLIC', tile.reason);
        }
        const position = validateIndex(payload?.position, SECRET_TILE_COUNT);
        if (!position.ok) {
          return err('INVALID_POSITION', position.reason);
        }
        const result = requestCompare(room.game!, playerId, tile.value, position.value);
        if (!result.ok) {
          return { ok: false, error: result.error };
        }
        emitEvents(ctx, room, result.events);
        return ok(null);
      },
    ),
  );

  socket.on(
    'game:submit-compare',
    gameAction('game:submit-compare', (room, playerId) => {
      // Whatever the client sends is deliberately ignored: only the truth
      // computed by the server counts.
      const result = submitCompare(room.game!, playerId);
      if (!result.ok) {
        return { ok: false, error: result.error };
      }
      emitEvents(ctx, room, result.events);
      return ok(null);
    }),
  );

  socket.on(
    'game:guess',
    gameAction('game:guess', (room, playerId, payload: { numbers: unknown }) => {
      const numbers = validateNumberList(payload?.numbers, SECRET_TILE_COUNT);
      if (!numbers.ok) {
        return err('INVALID_GUESS', numbers.reason);
      }
      const result = submitGuess(room.game!, playerId, numbers.value);
      if (!result.ok) {
        return { ok: false, error: result.error };
      }
      emitEvents(ctx, room, result.events);
      return ok(null);
    }),
  );

  socket.on('disconnect', () => {
    limiter.forget(socket.id);
    for (const l of eventLimiters.values()) {
      l.forget(socket.id);
    }
    const res = ctx.rooms.markDisconnected(socket.id);
    if (res) {
      ctx.io
        .to(res.room.code)
        .emit('player:left', { playerId: res.player.id, name: res.player.name });
      emitEvents(ctx, res.room, res.events);
      broadcastState(ctx, res.room);
    }
  });
}
