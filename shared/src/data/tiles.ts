import type { Tile, TileColor, TilePoints } from '../types/tiles.js';

/**
 * ---------------------------------------------------------------------------
 * SINGLE SOURCE OF TRUTH FOR THE 60 STARS
 * ---------------------------------------------------------------------------
 * A star's number fully determines its constellation and its brightness.
 * The whole application (table, stars, star chart, engine, server) reads
 * this data, so a star and its chart cell can never disagree.
 *
 * Constellations (rows of the star chart, cycle of 5):
 *   green  / Lyra    : 1  6  11 16 21 26 31 36 41 46 51 56
 *   pink   / Aurora  : 2  7  12 17 22 27 32 37 42 47 52 57
 *   blue   / Cygnus  : 3  8  13 18 23 28 33 38 43 48 53 58
 *   red    / Ember   : 4  9  14 19 24 29 34 39 44 49 54 59
 *   orange / Phoenix : 5  10 15 20 25 30 35 40 45 50 55 60
 *
 * Brightness (columns of the chart, cycle 1/2/3 in blocks of five):
 *   1-5 -> 1, 6-10 -> 2, 11-15 -> 3, 16-20 -> 1, ... 56-60 -> 3
 */

/** Cyclic order of the constellations, as on the star chart. */
export const COLOR_ORDER: readonly TileColor[] = Object.freeze([
  'green',
  'pink',
  'blue',
  'red',
  'orange',
] as const);

/** Total number of stars. */
export const TILE_COUNT = 60;

/** Number of columns of the star chart (60 / 5 constellations). */
export const SHEET_COLUMNS = TILE_COUNT / COLOR_ORDER.length;

/** Secret stars per player (one per constellation). */
export const SECRET_TILE_COUNT = COLOR_ORDER.length;

/**
 * English names of the constellations, used in server messages. Players see
 * the names from the client's catalogue, in their own language.
 */
export const COLOR_LABELS: Readonly<Record<TileColor, string>> = Object.freeze({
  green: 'Lyra',
  pink: 'Aurora',
  blue: 'Cygnus',
  red: 'Ember',
  orange: 'Phoenix',
});

/** Constellation of a star, from its number. */
export function colorForNumber(n: number): TileColor {
  assertTileNumber(n);
  return COLOR_ORDER[(n - 1) % COLOR_ORDER.length]!;
}

/** Brightness of a star, from its number (1, 2 or 3). */
export function pointsForNumber(n: number): TilePoints {
  assertTileNumber(n);
  return ((Math.floor((n - 1) / COLOR_ORDER.length) % 3) + 1) as TilePoints;
}

/** Column (1 to 12) of a number on the star chart. */
export function columnForNumber(n: number): number {
  assertTileNumber(n);
  return Math.floor((n - 1) / COLOR_ORDER.length) + 1;
}

function assertTileNumber(n: number): void {
  if (!Number.isInteger(n) || n < 1 || n > TILE_COUNT) {
    throw new RangeError(
      `Invalid star number: ${String(n)} (expected 1-${String(TILE_COUNT)})`,
    );
  }
}

function buildTile(n: number): Tile {
  return Object.freeze({
    id: `tile-${String(n)}`,
    number: n,
    color: colorForNumber(n),
    points: pointsForNumber(n),
  });
}

/** The 60 stars, in ascending order. */
export const TILES: readonly Tile[] = Object.freeze(
  Array.from({ length: TILE_COUNT }, (_, i) => buildTile(i + 1)),
);

const BY_NUMBER: ReadonlyMap<number, Tile> = new Map(TILES.map((t) => [t.number, t]));

/** Looks a star up by number. Throws on an invalid number. */
export function getTileByNumber(n: number): Tile {
  const tile = BY_NUMBER.get(n);
  if (!tile) {
    throw new RangeError(`Unknown star: ${String(n)}`);
  }
  return tile;
}

/** The 12 stars of a constellation, in ascending order. */
export function tilesOfColor(color: TileColor): readonly Tile[] {
  return TILES.filter((t) => t.color === color);
}

/**
 * Star chart grid: 5 rows (constellations) x 12 columns.
 * `SHEET_GRID[i][j]` is the star of constellation `COLOR_ORDER[i]`, column `j+1`.
 */
export const SHEET_GRID: readonly (readonly Tile[])[] = Object.freeze(
  COLOR_ORDER.map((color) => Object.freeze(tilesOfColor(color))),
);

/** `true` when `n` is a valid star number. */
export function isValidTileNumber(n: unknown): n is number {
  return Number.isInteger(n) && (n as number) >= 1 && (n as number) <= TILE_COUNT;
}
