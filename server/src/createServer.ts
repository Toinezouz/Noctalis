import { createServer, type Server as HttpServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express from 'express';
import { Server } from 'socket.io';
import { RoomManager } from './rooms/RoomManager.js';
import { registerHandlers, type GameServer, type GameSocket } from './socket/handlers.js';
import { renderIndexHtml, resolveOrigin, toInviteCode, toPreviewLang } from './http/preview.js';

export interface CreateServerOptions {
  /** Allowed origins (CORS + Socket.IO). `true` = any (outside production). */
  origins?: string[] | true;
  /** How long a room survives with nobody connected. */
  roomTtlMs?: number;
  /** Leak check before every emission (on outside production). */
  strictLeakCheck?: boolean;
  /** Serves the built client from the same service when the folder exists. */
  serveClient?: boolean;
  /** Folder of the built client (defaults to client/dist). */
  clientDist?: string;
  /**
   * Public address of the site, used for absolute links in link previews.
   * When absent, the address of each request is used.
   */
  publicUrl?: string;
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
    const clientDist =
      options.clientDist ??
      path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');
    const indexPath = path.join(clientDist, 'index.html');
    if (existsSync(indexPath)) {
      // Read once: the built page does not change while the server runs.
      const template = readFileSync(indexPath, 'utf8');
      // `index: false`: the page itself always goes through the handler
      // below, which fills in the link preview.
      app.use(express.static(clientDist, { index: false }));
      app.get('*', (req, res) => {
        const html = renderIndexHtml(template, {
          origin: resolveOrigin(options.publicUrl, {
            // Behind a proxy or a tunnel, the visitor's scheme is in this
            // header; resolveOrigin only accepts http or https from it.
            protocol: req.get('x-forwarded-proto')?.split(',')[0]?.trim() ?? req.protocol,
            host: req.get('host'),
          }),
          lang: toPreviewLang(req.query['lang']),
          inviteCode: toInviteCode(req.query['join']),
        });
        res.set('Cache-Control', 'no-cache');
        res.type('html').send(html);
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
