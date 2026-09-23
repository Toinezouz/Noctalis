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
 * Nettoie un pseudo : espaces normalises, caracteres de controle et
 * caracteres dangereux (<, >, &, ", ', `) supprimes. Aucune balise ne peut
 * donc survivre a cette etape, cote serveur comme cote client.
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

/** Valide un pseudo apres nettoyage. */
export function validateName(raw: unknown): Validated<string> {
  const name = sanitizeName(raw);
  if (name.length < NAME_MIN_LENGTH) {
    return {
      ok: false,
      reason: `Le pseudo doit contenir au moins ${String(NAME_MIN_LENGTH)} caracteres.`,
    };
  }
  if (name.length > NAME_MAX_LENGTH) {
    return {
      ok: false,
      reason: `Le pseudo ne doit pas depasser ${String(NAME_MAX_LENGTH)} caracteres.`,
    };
  }
  return { ok: true, value: name };
}

/** Normalise et valide un code de room (majuscules, alphabet restreint). */
export function validateRoomCode(raw: unknown): Validated<string> {
  if (typeof raw !== 'string') {
    return { ok: false, reason: 'Code de partie invalide.' };
  }
  const code = raw.trim().toUpperCase().replace(/\s/g, '');
  if (code.length !== ROOM_CODE_LENGTH) {
    return { ok: false, reason: `Le code doit contenir ${String(ROOM_CODE_LENGTH)} caracteres.` };
  }
  for (const char of code) {
    if (!ROOM_CODE_ALPHABET.includes(char)) {
      return { ok: false, reason: 'Ce code contient des caracteres invalides.' };
    }
  }
  return { ok: true, value: code };
}

/** Valide une couleur recue du reseau. */
export function validateColor(raw: unknown): Validated<TileColor> {
  if (typeof raw === 'string' && (COLOR_ORDER as readonly string[]).includes(raw)) {
    return { ok: true, value: raw as TileColor };
  }
  return { ok: false, reason: 'Couleur invalide.' };
}

/** Valide un numero de tuile recu du reseau. */
export function validateTileNumber(raw: unknown): Validated<number> {
  if (Number.isInteger(raw) && (raw as number) >= 1 && (raw as number) <= TILE_COUNT) {
    return { ok: true, value: raw as number };
  }
  return { ok: false, reason: 'Numero de tuile invalide.' };
}

/** Valide un entier borne (positions, encoches...). */
export function validateIndex(raw: unknown, max: number): Validated<number> {
  if (Number.isInteger(raw) && (raw as number) >= 0 && (raw as number) < max) {
    return { ok: true, value: raw as number };
  }
  return { ok: false, reason: 'Valeur hors limites.' };
}

/** Valide une liste de numeros pour GOT FIVE! (forme brute, avant regles). */
export function validateNumberList(raw: unknown, length: number): Validated<number[]> {
  if (!Array.isArray(raw) || raw.length !== length) {
    return { ok: false, reason: `Il faut exactement ${String(length)} numeros.` };
  }
  const out: number[] = [];
  for (const item of raw) {
    if (!Number.isInteger(item) || (item as number) < 1 || (item as number) > TILE_COUNT) {
      return {
        ok: false,
        reason: `Chaque numero doit etre un entier entre 1 et ${String(TILE_COUNT)}.`,
      };
    }
    out.push(item as number);
  }
  return { ok: true, value: out };
}
