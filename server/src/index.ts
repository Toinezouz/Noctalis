import { createNoctalisServer } from './createServer.js';

const PORT = Number(process.env['PORT'] ?? 3001);
const NODE_ENV = process.env['NODE_ENV'] ?? 'development';
const ROOM_TTL_MS = Number(process.env['ROOM_TTL_MS'] ?? 15 * 60 * 1000);

/**
 * Origines autorisees. En dehors de la production, tout est accepte.
 *
 * Un hebergeur peut ne fournir que le nom d'hote, sans schema (c'est le cas
 * de `fromService` chez Render) : une origine CORS en exige un, on le remet.
 */
function toOrigin(raw: string): string {
  const value = raw.trim();
  if (!value || value.includes('://')) {
    return value;
  }
  return `https://${value}`;
}

const CLIENT_URLS = (process.env['CLIENT_URL'] ?? 'http://localhost:5173')
  .split(',')
  .map(toOrigin)
  .filter(Boolean);

const { httpServer, close } = createNoctalisServer({
  env: NODE_ENV,
  origins: NODE_ENV === 'production' ? CLIENT_URLS : true,
  roomTtlMs: ROOM_TTL_MS,
  serveClient: true,
});

// 0.0.0.0 : indispensable derriere un hebergeur conteneurise (Render), ou
// ecouter seulement sur localhost rendrait le service injoignable.
const HOST = process.env['HOST'] ?? '0.0.0.0';

httpServer.listen(PORT, HOST, () => {
  console.log(`NOCTALIS — serveur pret sur ${HOST}:${String(PORT)} (${NODE_ENV})`);
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
