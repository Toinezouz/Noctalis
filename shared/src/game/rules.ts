import { COLOR_ORDER, SECRET_TILE_COUNT, TILE_COUNT, getTileByNumber } from '../data/tiles.js';
import type { Tile } from '../types/tiles.js';

/** Number of PLACE gaps: before the 1st star ... after the 5th. */
export const CLASSIFY_SLOT_COUNT = SECRET_TILE_COUNT + 1;

/** English labels of the 6 PLACE gaps (server messages, tests). */
export const CLASSIFY_SLOT_LABELS: readonly string[] = Object.freeze([
  'Before the 1st',
  'Between the 1st and the 2nd',
  'Between the 2nd and the 3rd',
  'Between the 3rd and the 4th',
  'Between the 4th and the 5th',
  'After the 5th',
]);

/**
 * Exact gap of a public star among five sorted secret numbers.
 * Returns an integer from 0 (before the 1st) to 5 (after the 5th).
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
 * Checks a player's answer to a PLACE request.
 * The server stays the only judge: this only tells whether the responder
 * made a mistake (feedback), it never decides the result.
 */
export function validateClassify(
  secret: readonly number[],
  tileNumber: number,
  proposedSlot: number,
): { correctSlot: number; wasCorrect: boolean } {
  const correctSlot = getClassifyPosition(secret, tileNumber);
  return { correctSlot, wasCorrect: correctSlot === proposedSlot };
}

/** GAUGE: only brightness matters, never the constellation. */
export function comparePoints(a: Tile, b: Tile): boolean {
  return a.points === b.points;
}

/** GAUGE, from star numbers. */
export function comparePointsByNumber(aNumber: number, bNumber: number): boolean {
  return comparePoints(getTileByNumber(aNumber), getTileByNumber(bNumber));
}

/** Structured reason for a refusal, so that the client can translate it. */
export type GuessIssue = 'count' | 'range' | 'order' | 'colors';

export type GuessValidation =
  | { ok: true; numbers: number[] }
  | { ok: false; issue: GuessIssue; reason: string };

/**
 * Validates the *shape* of a call: 5 distinct integers between 1 and 60, in
 * strictly ascending order (the order of the rack), one per constellation.
 */
export function validateGuessShape(numbers: readonly unknown[]): GuessValidation {
  if (!Array.isArray(numbers) || numbers.length !== SECRET_TILE_COUNT) {
    return {
      ok: false,
      issue: 'count',
      reason: `Exactly ${String(SECRET_TILE_COUNT)} numbers are needed.`,
    };
  }
  const parsed: number[] = [];
  for (const raw of numbers) {
    if (!Number.isInteger(raw) || (raw as number) < 1 || (raw as number) > TILE_COUNT) {
      return {
        ok: false,
        issue: 'range',
        reason: `Each number must be an integer between 1 and ${String(TILE_COUNT)}.`,
      };
    }
    parsed.push(raw as number);
  }
  for (let i = 1; i < parsed.length; i += 1) {
    if (parsed[i]! <= parsed[i - 1]!) {
      return {
        ok: false,
        issue: 'order',
        reason: 'Numbers must be in ascending order, without duplicates.',
      };
    }
  }
  const colors = new Set(parsed.map((n) => getTileByNumber(n).color));
  if (colors.size !== COLOR_ORDER.length) {
    return {
      ok: false,
      issue: 'colors',
      reason: 'A call needs one star of each constellation.',
    };
  }
  return { ok: true, numbers: parsed };
}

/** Does the call match the five secret numbers exactly? */
export function validateGuess(secret: readonly number[], numbers: readonly number[]): boolean {
  if (secret.length !== numbers.length) {
    return false;
  }
  const a = secret.slice().sort((x, y) => x - y);
  const b = numbers.slice().sort((x, y) => x - y);
  return a.every((n, i) => n === b[i]);
}
