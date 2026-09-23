import { randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH } from '@noctalis/shared';

/** Identifiant opaque (joueur, room interne...). */
export function createId(prefix: string): string {
  return `${prefix}_${randomBytes(9).toString('base64url')}`;
}

/** Jeton de session prive, utilise uniquement pour la reconnexion. */
export function createToken(): string {
  return randomBytes(32).toString('base64url');
}

/** Code de room court, lisible, sans caracteres ambigus. */
export function createRoomCode(): string {
  let code = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i += 1) {
    code += ROOM_CODE_ALPHABET[randomInt(ROOM_CODE_ALPHABET.length)];
  }
  return code;
}

/** Comparaison a temps constant, pour eviter toute fuite par chronometrage. */
export function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}
