import {
  type GameEvent,
  type GameState,
  type PlayerCredentials,
  type RoomState,
  type RoomStatus,
  createGame,
  defaultRng,
  setPlayerConnected,
} from '@noctalis/shared';
import { createId, createRoomCode, createToken, safeCompare } from '../security/tokens.js';

export interface RoomPlayer {
  id: string;
  name: string;
  /** Jeton prive de reconnexion. Ne quitte jamais le serveur sauf vers son proprietaire. */
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
    return this.players.length >= 2;
  }

  get hasConnectedPlayer(): boolean {
    return this.players.some((p) => p.connected);
  }

  /** Etat public du lobby (aucun jeton, aucun secret). */
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
      canStart: this.players.length === 2 && this.game === null,
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
   * Demarre (ou relance) une partie avec les 2 joueurs presents.
   * Renvoie l'evenement d'ouverture, qui annonce le joueur tire au sort : les
   * clients s'en servent pour l'animation de roulette.
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
  | 'ROOM_FINISHED'
  | 'NAME_TAKEN'
  | 'BAD_TOKEN'
  | 'TOO_MANY_ROOMS';

export type RoomResult<T> = { ok: true; value: T } | { ok: false; error: JoinError };

export interface RoomManagerOptions {
  /** Duree de survie d'une room sans joueur connecte (ms). */
  ttlMs?: number;
  /** Nombre maximal de rooms simultanees (garde-fou memoire). */
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

  /** Cree une room et son premier joueur (l'hote). */
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

  /** Ajoute un second joueur a une room existante. */
  join(
    code: string,
    name: string,
    socketId: string,
  ): RoomResult<{ room: Room; player: RoomPlayer }> {
    const room = this.rooms.get(code);
    if (!room) {
      return { ok: false, error: 'ROOM_NOT_FOUND' };
    }
    if (room.status === 'finished' && room.players.length >= 2) {
      return { ok: false, error: 'ROOM_FINISHED' };
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

  /** Reconnecte un joueur apres un refresh ou une coupure reseau. */
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

  /** Marque un joueur comme deconnecte (la room survit pendant le TTL). */
  markDisconnected(socketId: string): { room: Room; player: RoomPlayer } | null {
    for (const room of this.rooms.values()) {
      const player = room.getPlayerBySocket(socketId);
      if (player) {
        player.connected = false;
        player.socketId = null;
        player.disconnectedAt = Date.now();
        if (room.game) {
          setPlayerConnected(room.game, player.id, false);
        }
        room.touch();
        return { room, player };
      }
    }
    return null;
  }

  /** Retire definitivement un joueur (quitter volontairement). */
  removePlayer(room: Room, playerId: string): void {
    room.players = room.players.filter((p) => p.id !== playerId);
    room.rematchReady.delete(playerId);
    room.touch();
    if (room.players.length === 0) {
      this.rooms.delete(room.code);
    }
  }

  delete(code: string): void {
    this.rooms.delete(code);
  }

  /** Supprime les rooms inactives : appele periodiquement. */
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
