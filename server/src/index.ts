import { createGotFiveServer } from './createServer.js';

const PORT = Number(process.env['PORT'] ?? 3001);
const NODE_ENV = process.env['NODE_ENV'] ?? 'development';
const ROOM_TTL_MS = Number(process.env['ROOM_TTL_MS'] ?? 15 * 60 * 1000);

/** Origines autorisees. En dehors de la production, tout est accepte. */
const CLIENT_URLS = (process.env['CLIENT_URL'] ?? 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const { httpServer, close } = createGotFiveServer({
  env: NODE_ENV,
  origins: NODE_ENV === 'production' ? CLIENT_URLS : true,
  roomTtlMs: ROOM_TTL_MS,
  serveClient: true,
});

httpServer.listen(PORT, () => {
  console.log(`GOT FIVE! serveur pret sur http://localhost:${String(PORT)} (${NODE_ENV})`);
});

function shutdown(signal: string): void {
  console.log(`\n[${signal}] arret du serveur...`);
  void close().then(() => {
    process.exit(0);
  });
  setTimeout(() => {
    process.exit(0);
  }, 3000).unref();
}

process.on('SIGINT', () => {
  shutdown('SIGINT');
});
process.on('SIGTERM', () => {
  shutdown('SIGTERM');
});
