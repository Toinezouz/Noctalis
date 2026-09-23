import { COLOR_ORDER, TILE_COUNT } from '../data/tiles.js';
import {
  NAME_MAX_LENGTH,
  NAME_MIN_LENGTH,
  ROOM_CODE_ALPHABET,
  ROOM_CODE_LENGTH,
} from '../protocol/events.js';
import type { TileColor } from '../types/tiles.js';

export type Validated<T> = { ok: true; value: T } | { ok: false; reason: string };

/**
 * Cleans a display name: whitespace normalised, control characters and
 * dangerous characters (<, >, &, ", ', `) removed. No markup can survive this
 * step, on the server as on the client.
 */
export function sanitizeName(raw: unknown): string {
  if (typeof raw !== 'string') {
    return '';
  }
  return raw
    .normalize('NFC')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, '')
    .replace(/[<>&"'`\\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, NAME_MAX_LENGTH);
}

/** Validates a display name after cleaning. */
export function validateName(raw: unknown): Validated<string> {
  const name = sanitizeName(raw);
  if (name.length < NAME_MIN_LENGTH) {
    return {
      ok: false,
      reason: `A name needs at least ${String(NAME_MIN_LENGTH)} characters.`,
    };
  }
  if (name.length > NAME_MAX_LENGTH) {
    return {
      ok: false,
      reason: `A name must not exceed ${String(NAME_MAX_LENGTH)} characters.`,
    };
  }
  return { ok: true, value: name };
}

/** Normalises and validates a room code (upper case, restricted alphabet). */
export function validateRoomCode(raw: unknown): Validated<string> {
  if (typeof raw !== 'string') {
    return { ok: false, reason: 'Invalid room code.' };
  }
  const code = raw.trim().toUpperCase().replace(/\s/g, '');
  if (code.length !== ROOM_CODE_LENGTH) {
    return { ok: false, reason: `A room code has ${String(ROOM_CODE_LENGTH)} characters.` };
  }
  for (const char of code) {
    if (!ROOM_CODE_ALPHABET.includes(char)) {
      return { ok: false, reason: 'This code contains invalid characters.' };
    }
  }
  return { ok: true, value: code };
}

/** Validates a constellation received from the network. */
export function validateColor(raw: unknown): Validated<TileColor> {
  if (typeof raw === 'string' && (COLOR_ORDER as readonly string[]).includes(raw)) {
    return { ok: true, value: raw as TileColor };
  }
  return { ok: false, reason: 'Invalid constellation.' };
}

/** Validates a star number received from the network. */
export function validateTileNumber(raw: unknown): Validated<number> {
  if (Number.isInteger(raw) && (raw as number) >= 1 && (raw as number) <= TILE_COUNT) {
    return { ok: true, value: raw as number };
  }
  return { ok: false, reason: 'Invalid star number.' };
}

/** Validates a bounded integer (positions, gaps...). */
export function validateIndex(raw: unknown, max: number): Validated<number> {
  if (Number.isInteger(raw) && (raw as number) >= 0 && (raw as number) < max) {
    return { ok: true, value: raw as number };
  }
  return { ok: false, reason: 'Value out of range.' };
}

/** Validates a list of star numbers (raw shape, before the rules). */
export function validateNumberList(raw: unknown, length: number): Validated<number[]> {
  if (!Array.isArray(raw) || raw.length !== length) {
    return { ok: false, reason: `Exactly ${String(length)} numbers are needed.` };
  }
  const out: number[] = [];
  for (const item of raw) {
    if (!Number.isInteger(item) || (item as number) < 1 || (item as number) > TILE_COUNT) {
      return {
        ok: false,
        reason: `Each number must be an integer between 1 and ${String(TILE_COUNT)}.`,
      };
    }
    out.push(item as number);
  }
  return { ok: true, value: out };
}
