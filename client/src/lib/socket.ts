import { io, type Socket } from 'socket.io-client';
import type { Ack, ClientToServerEvents, ServerToClientEvents } from '@gotfive/shared';

export type GameClientSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

/**
 * URL du serveur Socket.IO.
 * - En developpement et en previsualisation, on laisse vide : Vite proxifie
 *   `/socket.io` vers le serveur, donc la meme origine suffit.
 * - En production, `VITE_SERVER_URL` pointe vers le service backend.
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

/** Emission avec accuse de reception promisifie (et delai de garde). */
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
          error: { code: 'NETWORK_TIMEOUT', message: 'Le serveur ne repond pas. Reessaie.' },
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
