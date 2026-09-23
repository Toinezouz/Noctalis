import { createServer, type Server as HttpServer } from 'node:http';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express from 'express';
import { Server } from 'socket.io';
import { RoomManager } from './rooms/RoomManager.js';
import { registerHandlers, type GameServer, type GameSocket } from './socket/handlers.js';

export interface CreateServerOptions {
  /** Allowed origins (CORS + Socket.IO). `true` = any (outside production). */
  origins?: string[] | true;
  /** How long a room survives with nobody connected. */
  roomTtlMs?: number;
  /** Leak check before every emission (on outside production). */
  strictLeakCheck?: boolean;
  /** Serves the built client from the same service when the folder exists. */
  serveClient?: boolean;
  env?: string;
}

export interface NoctalisServer {
  httpServer: HttpServer;
  io: GameServer;
  rooms: RoomManager;
  /** Stops the server cleanly and clears its timers. */
  close: () => Promise<void>;
}

export function createNoctalisServer(options: CreateServerOptions = {}): NoctalisServer {
  const env = options.env ?? process.env['NODE_ENV'] ?? 'development';
  const origins = options.origins ?? true;
  const strictLeakCheck = options.strictLeakCheck ?? env !== 'production';

  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin: origins, credentials: false }));
  app.use(express.json({ limit: '16kb' }));

  const rooms = new RoomManager({ ttlMs: options.roomTtlMs ?? 15 * 60 * 1000 });

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', rooms: rooms.size, uptime: process.uptime(), env });
  });

  if (options.serveClient) {
    const clientDist = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      '../../client/dist',
    );
    if (existsSync(clientDist)) {
      app.use(express.static(clientDist));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(clientDist, 'index.html'), (error) => {
          if (error) {
            res.status(500).end();
          }
        });
      });
    }
  }

  const httpServer = createServer(app);
  const io: GameServer = new Server(httpServer, {
    cors: { origin: origins, methods: ['GET', 'POST'] },
    // Deliberately small payload limit: no legitimate message is big.
    maxHttpBufferSize: 16 * 1024,
    pingTimeout: 20000,
    pingInterval: 10000,
  });

  io.on('connection', (socket: GameSocket) => {
    registerHandlers({ io, rooms, strictLeakCheck, logRefusals: env !== 'production' }, socket);
  });

  const sweeper = setInterval(() => {
    const removed = rooms.sweep();
    if (removed > 0) {
      console.log(`[rooms] ${String(removed)} idle room(s) removed`);
    }
  }, 60_000);
  sweeper.unref();

  const close = async (): Promise<void> => {
    clearInterval(sweeper);
    await new Promise<void>((resolve) => {
      void io.close(() => {
        resolve();
      });
    });
    await new Promise<void>((resolve) => {
      httpServer.close(() => {
        resolve();
      });
    });
  };

  return { httpServer, io, rooms, close };
}
