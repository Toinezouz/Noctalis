import { COLOR_ORDER, TILES, getTileByNumber } from '../data/tiles.js';
import type { Tile, TileColor } from '../types/tiles.js';
import { randomInt, type Rng } from './rng.js';

/** The full set of 60 stars, in ascending order. */
export function createDeck(): Tile[] {
  return TILES.map((t) => t);
}

/** Fisher-Yates shuffle, without mutating the input. */
export function shuffleDeck<T>(deck: readonly T[], rng: Rng): T[] {
  const out = deck.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = randomInt(rng, i + 1);
    const tmp = out[i]!;
    out[i] = out[j]!;
    out[j] = tmp;
  }
  return out;
}

/** Numbers of one constellation found in a reserve. */
export function reserveOfColor(reserve: readonly number[], color: TileColor): number[] {
  return reserve.filter((n) => getTileByNumber(n).color === color);
}

/** Stars left, per constellation. */
export function countReserveByColor(reserve: readonly number[]): Record<TileColor, number> {
  const counts = Object.fromEntries(COLOR_ORDER.map((c) => [c, 0])) as Record<TileColor, number>;
  for (const n of reserve) {
    counts[getTileByNumber(n).color] += 1;
  }
  return counts;
}
