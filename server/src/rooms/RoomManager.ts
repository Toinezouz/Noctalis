import {
  type GameEvent,
  type GameState,
  type PlayerCredentials,
  type RoomState,
  type RoomStatus,
  MAX_PLAYERS,
  MIN_PLAYERS,
  createGame,
  defaultRng,
  getPlayer,
  reassignResponder,
  setPlayerConnected,
} from '@noctalis/shared';
import { createId, createRoomCode, createToken, safeCompare } from '../security/tokens.js';

export interface RoomPlayer {
  id: string;
  name: string;
  /** Private reconnection token. Only ever sent to its owner. */
  token: string;
  socketId: string | null;
  connected: boolean;
  isHost: boolean;
  joinedAt: number;
  disconnectedAt: number | null;
}

export class Room {
  readonly code: string;
  readonly createdAt = Date.now();
  players: RoomPlayer[] = [];
  game: GameState | null = null;
  status: RoomStatus = 'waiting';
  rematchReady = new Set<string>();
  lastActivityAt = Date.now();

  constructor(code: string) {
    this.code = code;
  }

  touch(): void {
    this.lastActivityAt = Date.now();
  }

  getPlayer(playerId: string): RoomPlayer | undefined {
    return this.players.find((p) => p.id === playerId);
  }

  getPlayerBySocket(socketId: string): RoomPlayer | undefined {
    return this.players.find((p) => p.socketId === socketId);
  }

  get isFull(): boolean {
    return this.players.length >= MAX_PLAYERS;
  }

  get hasConnectedPlayer(): boolean {
    return this.players.some((p) => p.connected);
  }

  /** Public lobby state (no token, no secret). */
  toRoomState(): RoomState {
    return {
      code: this.code,
      status: this.status,
      players: this.players.map((p) => ({
        id: p.id,
        name: p.name,
        connected: p.connected,
        isHost: p.isHost,
      })),
      canStart: this.players.length >= MIN_PLAYERS && this.game === null,
      rematchReady: [...this.rematchReady],
      createdAt: this.createdAt,
    };
  }

  credentialsFor(player: RoomPlayer): PlayerCredentials {
    return {
      roomCode: this.code,
      playerId: player.id,
      token: player.token,
      name: player.name,
    };
  }

  /**
   * Starts (or restarts) a game with everybody in the room.
   * Returns the opening event announcing the player drawn at random: clients
   * use it for the roulette animation.
   */
  startGame(): GameEvent[] {
    const game = createGame(
      this.players.map((p) => ({
        id: p.id,
        name: p.name,
        isHost: p.isHost,
        connected: p.connected,
      })),
      defaultRng,
    );
    this.game = game;
    this.status = 'playing';
    this.rematchReady.clear();
    this.touch();
    return [{ type: 'game-started', startingPlayerId: game.startingPlayerId }];
  }
}

export type JoinError =
  | 'ROOM_NOT_FOUND'
  | 'ROOM_FULL'
  | 'ROOM_STARTED'
  | 'ROOM_FINISHED'
  | 'NAME_TAKEN'
  | 'BAD_TOKEN'
  | 'TOO_MANY_ROOMS';

export type RoomResult<T> = { ok: true; value: T } | { ok: false; error: JoinError };

export interface RoomManagerOptions {
  /** How long a room survives with nobody connected (ms). */
  ttlMs?: number;
  /** Maximum number of rooms at once (memory guard). */
  maxRooms?: number;
}

export class RoomManager {
  private readonly rooms = new Map<string, Room>();
  private readonly ttlMs: number;
  private readonly maxRooms: number;

  constructor(options: RoomManagerOptions = {}) {
    this.ttlMs = options.ttlMs ?? 15 * 60 * 1000;
    this.maxRooms = options.maxRooms ?? 2000;
  }

  get size(): number {
    return this.rooms.size;
  }

  get(code: string): Room | undefined {
    return this.rooms.get(code);
  }

  /** Creates a room and its first player (the host). */
  create(name: string, socketId: string): RoomResult<{ room: Room; player: RoomPlayer }> {
    if (this.rooms.size >= this.maxRooms) {
      return { ok: false, error: 'TOO_MANY_ROOMS' };
    }
    let code = createRoomCode();
    let guard = 0;
    while (this.rooms.has(code)) {
      code = createRoomCode();
      guard += 1;
      if (guard > 50) {
        return { ok: false, error: 'TOO_MANY_ROOMS' };
      }
    }

    const room = new Room(code);
    const player: RoomPlayer = {
      id: createId('p'),
      name,
      token: createToken(),
      socketId,
      connected: true,
      isHost: true,
      joinedAt: Date.now(),
      disconnectedAt: null,
    };
    room.players.push(player);
    this.rooms.set(code, room);
    return { ok: true, value: { room, player } };
  }

  /** Adds a player to a room that has not started yet. */
  join(
    code: string,
    name: string,
    socketId: string,
  ): RoomResult<{ room: Room; player: RoomPlayer }> {
    const room = this.rooms.get(code);
    if (!room) {
      return { ok: false, error: 'ROOM_NOT_FOUND' };
    }
    // Seats are only open in the lobby: nobody joins a game in progress, whose
    // stars have already been dealt.
    if (room.game) {
      return { ok: false, error: room.status === 'playing' ? 'ROOM_STARTED' : 'ROOM_FINISHED' };
    }
    if (room.isFull) {
      return { ok: false, error: 'ROOM_FULL' };
    }
    if (room.players.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      return { ok: false, error: 'NAME_TAKEN' };
    }

    const player: RoomPlayer = {
      id: createId('p'),
      name,
      token: createToken(),
      socketId,
      connected: true,
      isHost: false,
      joinedAt: Date.now(),
      disconnectedAt: null,
    };
    room.players.push(player);
    room.touch();
    return { ok: true, value: { room, player } };
  }

  /** Reconnects a player after a reload or a network drop. */
  reconnect(
    code: string,
    playerId: string,
    token: string,
    socketId: string,
  ): RoomResult<{ room: Room; player: RoomPlayer }> {
    const room = this.rooms.get(code);
    if (!room) {
      return { ok: false, error: 'ROOM_NOT_FOUND' };
    }
    const player = room.getPlayer(playerId);
    if (!player || !safeCompare(player.token, token)) {
      return { ok: false, error: 'BAD_TOKEN' };
    }
    player.socketId = socketId;
    player.connected = true;
    player.disconnectedAt = null;
    if (room.game) {
      setPlayerConnected(room.game, player.id, true);
    }
    room.touch();
    return { ok: true, value: { room, player } };
  }

  /**
   * Marks a player as disconnected (the room survives for the TTL). If they
   * were expected to answer a hint, the question moves on to someone online:
   * the returned events announce it.
   */
  markDisconnected(
    socketId: string,
  ): { room: Room; player: RoomPlayer; events: GameEvent[] } | null {
    for (const room of this.rooms.values()) {
      const player = room.getPlayerBySocket(socketId);
      if (player) {
        player.connected = false;
        player.socketId = null;
        player.disconnectedAt = Date.now();
        const events: GameEvent[] = [];
        if (room.game) {
          setPlayerConnected(room.game, player.id, false);
          events.push(...reassignResponder(room.game));
        }
        room.touch();
        return { room, player, events };
      }
    }
    return null;
  }

  /**
   * Removes a player for good (they chose to leave). When the host leaves,
   * the longest-seated player takes over, so that someone can still start
   * the next game.
   */
  removePlayer(room: Room, playerId: string): void {
    const leaving = room.getPlayer(playerId);
    room.players = room.players.filter((p) => p.id !== playerId);
    room.rematchReady.delete(playerId);
    room.touch();
    if (room.players.length === 0) {
      this.rooms.delete(room.code);
      return;
    }
    if (leaving?.isHost) {
      const heir = room.players[0]!;
      heir.isHost = true;
      if (room.game) {
        const seat = getPlayer(room.game, heir.id);
        if (seat) {
          seat.isHost = true;
        }
      }
    }
  }

  delete(code: string): void {
    this.rooms.delete(code);
  }

  /** Deletes idle rooms: called periodically. */
  sweep(now = Date.now()): number {
    let removed = 0;
    for (const [code, room] of this.rooms) {
      const stale = now - room.lastActivityAt > this.ttlMs;
      if (!room.hasConnectedPlayer && stale) {
        this.rooms.delete(code);
        removed += 1;
      }
    }
    return removed;
  }
}
