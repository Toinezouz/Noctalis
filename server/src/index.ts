import { createNoctalisServer } from './createServer.js';

const PORT = Number(process.env['PORT'] ?? 3001);
const NODE_ENV = process.env['NODE_ENV'] ?? 'development';
const ROOM_TTL_MS = Number(process.env['ROOM_TTL_MS'] ?? 15 * 60 * 1000);

/**
 * Allowed origins. Outside production, anything goes.
 *
 * A host may only provide the host name, without a scheme (Render's
 * `fromService` does): a CORS origin needs one, so it is added back.
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
  // Render sets RENDER_EXTERNAL_URL by itself; PUBLIC_URL overrides it.
  publicUrl: process.env['PUBLIC_URL'] ?? process.env['RENDER_EXTERNAL_URL'],
});

// 0.0.0.0 is required behind a containerised host (Render), where listening
// on localhost only would make the service unreachable.
const HOST = process.env['HOST'] ?? '0.0.0.0';

httpServer.listen(PORT, HOST, () => {
  console.log(`NOCTALIS — server ready on ${HOST}:${String(PORT)} (${NODE_ENV})`);
});

function shutdown(signal: string): void {
  console.log(`\n[${signal}] shutting down...`);
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
