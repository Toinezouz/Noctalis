import { io, type Socket } from 'socket.io-client';
import type { Ack, ClientToServerEvents, ServerToClientEvents } from '@umbrastra/shared';

export type GameClientSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

/**
 * URL of the Socket.IO server.
 * - Left empty by default: in development Vite proxies `/socket.io` to the
 *   server, and in production Express serves the client itself, so the same
 *   origin is enough.
 * - `VITE_SERVER_URL` can point to a separate backend if ever needed.
 */
const SERVER_URL = (import.meta.env['VITE_SERVER_URL'] as string | undefined) ?? '';

let socket: GameClientSocket | null = null;

export function getSocket(): GameClientSocket {
  if (!socket) {
    socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 400,
      reconnectionDelayMax: 4000,
      timeout: 8000,
    });
  }
  return socket;
}

/** Emits with a promisified acknowledgement (and a safety timeout). */
export function emitWithAck<T>(
  event: keyof ClientToServerEvents,
  payload: unknown,
  timeoutMs = 8000,
): Promise<Ack<T>> {
  const active = getSocket();
  return new Promise((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve({
          ok: false,
          error: { code: 'NETWORK_TIMEOUT', message: 'No answer in time. Please try again.' },
        });
      }
    }, timeoutMs);

    (active.emit as (ev: string, p: unknown, ack: (res: Ack<T>) => void) => void)(
      event,
      payload,
      (res: Ack<T>) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timer);
        resolve(res);
      },
    );
  });
}
