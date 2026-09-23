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
} from '@noctalis/shared';
import { RateLimiter, RATE_LIMITS } from '../security/rateLimit.js';
import type { JoinError, Room, RoomManager } from '../rooms/RoomManager.js';

export interface SocketData {
  roomCode: string | null;
  playerId: string | null;
}

export type GameServer = Server<ClientToServerEvents, ServerToClientEvents, never, SocketData>;
export type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents, never, SocketData>;

/** Chaque refus de salon porte son propre code : le client le traduit. */
const JOIN_ERRORS: Record<JoinError, { code: GameErrorCode; message: string }> = {
  ROOM_NOT_FOUND: {
    code: 'ROOM_NOT_FOUND',
    message: "Cette partie n'existe pas (ou a expire).",
  },
  ROOM_FULL: { code: 'ROOM_FULL', message: 'Cette partie est deja complete.' },
  ROOM_FINISHED: { code: 'ROOM_FINISHED', message: 'Cette partie est terminee.' },
  NAME_TAKEN: { code: 'NAME_TAKEN', message: 'Ce pseudo est deja pris dans cette partie.' },
  BAD_TOKEN: { code: 'BAD_TOKEN', message: 'Session invalide : rejoins la partie avec le code.' },
  TOO_MANY_ROOMS: {
    code: 'SERVER_BUSY',
    message: 'Le serveur est sature, reessaie dans un instant.',
  },
};

/** Construit la reponse d'erreur correspondant a un refus de salon. */
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

/** Repond a un ack meme si le client n'en a pas fourni (robustesse). */
function reply<T>(ack: unknown, value: Ack<T>): void {
  if (typeof ack === 'function') {
    (ack as (res: Ack<T>) => void)(value);
  }
}

export interface HandlerContext {
  io: GameServer;
  rooms: RoomManager;
  /** Verification anti-fuite avant chaque emission (developpement / tests). */
  strictLeakCheck: boolean;
  /** Journalise les actions refusees (utile en developpement et en test). */
  logRefusals?: boolean;
}

/** Construit la charge utile d'etat destinee a un joueur precis. */
function buildStatePayload(room: Room, playerId: string | null): StatePayload {
  const publicState = room.game ? toPublicGameState(room.game) : null;
  const privateState =
    room.game && playerId ? toPlayerPrivateState(room.game, playerId) : null;
  return { room: room.toRoomState(), publicState, privateState };
}

/** Envoie a chaque joueur sa propre vue : jamais l'etat serveur complet. */
export function broadcastState(ctx: HandlerContext, room: Room): void {
  for (const player of room.players) {
    if (!player.socketId) {
      continue;
    }
    const payload = buildStatePayload(room, player.id);
    if (ctx.strictLeakCheck && room.game) {
      const leak = findSecretLeak(room.game, player.id, payload);
      if (leak) {
        // Filet de securite : on prefere casser la partie plutot que de
        // divulguer un numero secret a son proprietaire.
        console.error(
          `[SECURITE] Fuite detectee vers ${player.id} : numero ${String(leak.number)} en ${leak.path}`,
        );
        ctx.io.to(player.socketId).emit('server:error', {
          code: 'GAME_OVER',
          message: 'Erreur interne de securite : partie interrompue.',
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

/** Recupere room + joueur authentifies pour ce socket. */
function requireSession(
  ctx: HandlerContext,
  socket: GameSocket,
): { room: Room; playerId: string } | GameError {
  const room = currentRoom(ctx, socket);
  const playerId = socket.data.playerId;
  if (!room || !playerId || !room.getPlayer(playerId)) {
    return { code: 'PLAYER_NOT_FOUND', message: "Tu n'es plus dans une partie." };
  }
  const player = room.getPlayer(playerId)!;
  if (player.socketId !== socket.id) {
    return { code: 'PLAYER_NOT_FOUND', message: 'Session invalide.' };
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
    reply<T>(ack, err('WRONG_PHASE', 'Trop d actions coup sur coup, respire une seconde.'));
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
      reply(ack, err('BAD_TOKEN', 'Session invalide.'));
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
      const result = forfeit(room.game, playerId);
      if (result.ok) {
        room.status = 'finished';
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

  // --- Partie -------------------------------------------------------------

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
    if (room.players.length !== 2) {
      reply(ack, err('NOT_ENOUGH_PLAYERS', "Il faut etre deux pour commencer."));
      return;
    }
    if (room.game && room.game.phase !== 'GAME_OVER') {
      reply(ack, err('WRONG_PHASE', 'La partie est deja en cours.'));
      return;
    }
    if (!room.getPlayer(playerId)?.isHost) {
      reply(ack, err('NOT_YOUR_TURN', "Seul l'hote peut lancer la partie."));
      return;
    }
    const events = room.startGame();
    reply(ack, ok(null));
    // L'annonce du tirage au sort part avant l'etat : le client sait ainsi
    // qu'une annonce est en cours des le premier rendu de la table, et rien
    // (tutoriel compris) ne s'affiche par-dessus.
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
      reply(ack, err('WRONG_PHASE', "La partie n'est pas terminee."));
      return;
    }
    if (room.players.length !== 2) {
      reply(ack, err('NOT_ENOUGH_PLAYERS', 'Ton adversaire a quitte la partie.'));
      return;
    }
    room.rematchReady.add(playerId);
    const events =
      room.rematchReady.size === room.players.length ? room.startGame() : ([] as GameEvent[]);
    reply(ack, ok(null));
    emitEvents(ctx, room, events);
    broadcastState(ctx, room);
  });

  /** Fabrique un handler d'action de jeu : session + partie en cours requises. */
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
        reply(ack, err('WRONG_PHASE', "La partie n'a pas encore commence."));
        return;
      }
      const result = run(room, playerId, payload as never);
      if (!result.ok && ctx.logRefusals) {
        console.error(
          `[action] ${event} refusee pour ${playerId} : ${result.error.code} - ${result.error.message}`,
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
      // La valeur envoyee par le client est volontairement ignoree : seule la
      // verite calculee par le serveur fait foi.
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
      broadcastState(ctx, res.room);
    }
  });
}
