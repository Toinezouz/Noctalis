import { COLOR_ORDER, TILES, getTileByNumber } from '../data/tiles.js';
import type { Tile, TileColor } from '../types/tiles.js';
import { randomInt, type Rng } from './rng.js';

/** Cree le paquet complet des 60 etoiles, dans l'ordre croissant. */
export function createDeck(): Tile[] {
  return TILES.map((t) => t);
}

/** Melange (Fisher-Yates) sans muter le tableau d'origine. */
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

/** Numeros d'une constellation presents dans une reserve donnee. */
export function reserveOfColor(reserve: readonly number[], color: TileColor): number[] {
  return reserve.filter((n) => getTileByNumber(n).color === color);
}

/** Compte des etoiles restantes par constellation. */
export function countReserveByColor(reserve: readonly number[]): Record<TileColor, number> {
  const counts = Object.fromEntries(COLOR_ORDER.map((c) => [c, 0])) as Record<TileColor, number>;
  for (const n of reserve) {
    counts[getTileByNumber(n).color] += 1;
  }
  return counts;
}
