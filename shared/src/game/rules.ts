import { COLOR_ORDER, SECRET_TILE_COUNT, TILE_COUNT, getTileByNumber } from '../data/tiles.js';
import type { Tile } from '../types/tiles.js';

/** Nombre d'encoches de la zone SITUER : avant la 1re ... apres la 5e. */
export const CLASSIFY_SLOT_COUNT = SECRET_TILE_COUNT + 1;

/** Libelles francais des 6 encoches de SITUER. */
export const CLASSIFY_SLOT_LABELS: readonly string[] = Object.freeze([
  'Avant la 1re',
  'Entre la 1re et la 2e',
  'Entre la 2e et la 3e',
  'Entre la 3e et la 4e',
  'Entre la 4e et la 5e',
  'Apres la 5e',
]);

/**
 * Position exacte d'une etoile publique parmi 5 numeros secrets tries.
 * Renvoie un entier de 0 (avant la 1re) a 5 (apres la 5e).
 */
export function getClassifyPosition(secret: readonly number[], tileNumber: number): number {
  let slot = 0;
  for (const n of secret) {
    if (n < tileNumber) {
      slot += 1;
    }
  }
  return slot;
}

/**
 * Verifie la reponse d'un joueur a une demande SITUER.
 * Le serveur reste seul juge : cette fonction sert a savoir si le repondeur
 * s'est trompe (simple retour d'information), pas a fixer le resultat.
 */
export function validateClassify(
  secret: readonly number[],
  tileNumber: number,
  proposedSlot: number,
): { correctSlot: number; wasCorrect: boolean } {
  const correctSlot = getClassifyPosition(secret, tileNumber);
  return { correctSlot, wasCorrect: correctSlot === proposedSlot };
}

/** JAUGER : seul le nombre d'eclats compte, jamais la constellation. */
export function comparePoints(a: Tile, b: Tile): boolean {
  return a.points === b.points;
}

/** JAUGER a partir des numeros. */
export function comparePointsByNumber(aNumber: number, bNumber: number): boolean {
  return comparePoints(getTileByNumber(aNumber), getTileByNumber(bNumber));
}

/** Raison structuree d'un refus, pour que le client la traduise. */
export type GuessIssue = 'count' | 'range' | 'order' | 'colors';

export type GuessValidation =
  | { ok: true; numbers: number[] }
  | { ok: false; issue: GuessIssue; reason: string };

/**
 * Valide la *forme* d'une annonce : 5 entiers distincts entre 1
 * et 60, en ordre strictement croissant (l'ordre du support).
 */
export function validateGuessShape(numbers: readonly unknown[]): GuessValidation {
  if (!Array.isArray(numbers) || numbers.length !== SECRET_TILE_COUNT) {
    return {
      ok: false,
      issue: 'count',
      reason: `Il faut exactement ${String(SECRET_TILE_COUNT)} numeros.`,
    };
  }
  const parsed: number[] = [];
  for (const raw of numbers) {
    if (!Number.isInteger(raw) || (raw as number) < 1 || (raw as number) > TILE_COUNT) {
      return {
        ok: false,
        issue: 'range',
        reason: `Chaque numero doit etre un entier entre 1 et ${String(TILE_COUNT)}.`,
      };
    }
    parsed.push(raw as number);
  }
  for (let i = 1; i < parsed.length; i += 1) {
    if (parsed[i]! <= parsed[i - 1]!) {
      return {
        ok: false,
        issue: 'order',
        reason: 'Les numeros doivent etre en ordre croissant, sans doublon.',
      };
    }
  }
  const colors = new Set(parsed.map((n) => getTileByNumber(n).color));
  if (colors.size !== COLOR_ORDER.length) {
    return {
      ok: false,
      issue: 'colors',
      reason: 'Ta proposition doit contenir une tuile de chaque couleur.',
    };
  }
  return { ok: true, numbers: parsed };
}

/** La tentative correspond-elle exactement aux 5 numeros secrets ? */
export function validateGuess(secret: readonly number[], numbers: readonly number[]): boolean {
  if (secret.length !== numbers.length) {
    return false;
  }
  const a = secret.slice().sort((x, y) => x - y);
  const b = numbers.slice().sort((x, y) => x - y);
  return a.every((n, i) => n === b[i]);
}
