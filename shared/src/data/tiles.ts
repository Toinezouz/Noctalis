import type { Tile, TileColor, TilePoints } from '../types/tiles.js';

/**
 * ---------------------------------------------------------------------------
 * SOURCE DE VERITE UNIQUE DES 60 TUILES
 * ---------------------------------------------------------------------------
 * Le numero d'une tuile determine entierement sa couleur et ses points.
 * Toute l'application (plateau, tuiles, fiche de deduction, moteur, serveur)
 * lit cette donnee : il est impossible qu'une tuile et sa case de fiche
 * divergent.
 *
 * Couleurs (lignes de la fiche officielle, cycle de 5) :
 *   VERT   : 1  6  11 16 21 26 31 36 41 46 51 56
 *   ROSE   : 2  7  12 17 22 27 32 37 42 47 52 57
 *   BLEU   : 3  8  13 18 23 28 33 38 43 48 53 58
 *   ROUGE  : 4  9  14 19 24 29 34 39 44 49 54 59
 *   ORANGE : 5  10 15 20 25 30 35 40 45 50 55 60
 *
 * Points (colonnes de la fiche, cycle 1/2/3 par paquets de 5) :
 *   1-5 -> 1pt, 6-10 -> 2pts, 11-15 -> 3pts, 16-20 -> 1pt, ... 56-60 -> 3pts
 */

/** Ordre cyclique des couleurs, tel que sur la fiche officielle. */
export const COLOR_ORDER: readonly TileColor[] = Object.freeze([
  'green',
  'pink',
  'blue',
  'red',
  'orange',
] as const);

/** Nombre total de tuiles du jeu. */
export const TILE_COUNT = 60;

/** Nombre de colonnes de la fiche de deduction (60 / 5 couleurs). */
export const SHEET_COLUMNS = TILE_COUNT / COLOR_ORDER.length;

/** Nombre de tuiles secretes par joueur (une par couleur). */
export const SECRET_TILE_COUNT = COLOR_ORDER.length;

/** Libelles francais des couleurs (accessibilite, aria-labels, textes). */
export const COLOR_LABELS: Readonly<Record<TileColor, string>> = Object.freeze({
  green: 'vert',
  pink: 'rose',
  blue: 'bleu',
  red: 'rouge',
  orange: 'orange',
});

/** Couleur d'une tuile a partir de son numero. */
export function colorForNumber(n: number): TileColor {
  assertTileNumber(n);
  return COLOR_ORDER[(n - 1) % COLOR_ORDER.length]!;
}

/** Points d'une tuile a partir de son numero (1, 2 ou 3). */
export function pointsForNumber(n: number): TilePoints {
  assertTileNumber(n);
  return ((Math.floor((n - 1) / COLOR_ORDER.length) % 3) + 1) as TilePoints;
}

/** Colonne (1 a 12) d'un numero sur la fiche de deduction. */
export function columnForNumber(n: number): number {
  assertTileNumber(n);
  return Math.floor((n - 1) / COLOR_ORDER.length) + 1;
}

function assertTileNumber(n: number): void {
  if (!Number.isInteger(n) || n < 1 || n > TILE_COUNT) {
    throw new RangeError(
      `Numero de tuile invalide : ${String(n)} (attendu 1-${String(TILE_COUNT)})`,
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

/** Les 60 tuiles, indexees de 1 a 60 (index 0 inclus mais inutilise). */
export const TILES: readonly Tile[] = Object.freeze(
  Array.from({ length: TILE_COUNT }, (_, i) => buildTile(i + 1)),
);

const BY_NUMBER: ReadonlyMap<number, Tile> = new Map(TILES.map((t) => [t.number, t]));

/** Recupere une tuile par son numero. Leve une erreur si le numero est invalide. */
export function getTileByNumber(n: number): Tile {
  const tile = BY_NUMBER.get(n);
  if (!tile) {
    throw new RangeError(`Tuile inconnue : ${String(n)}`);
  }
  return tile;
}

/** Les 12 numeros d'une couleur donnee, par ordre croissant. */
export function tilesOfColor(color: TileColor): readonly Tile[] {
  return TILES.filter((t) => t.color === color);
}

/**
 * Grille de la fiche de deduction : 5 lignes (couleurs) x 12 colonnes.
 * `SHEET_GRID[i][j]` est la tuile de la couleur `COLOR_ORDER[i]`, colonne `j+1`.
 */
export const SHEET_GRID: readonly (readonly Tile[])[] = Object.freeze(
  COLOR_ORDER.map((color) => Object.freeze(tilesOfColor(color))),
);

/** `true` si `n` est un numero de tuile valide. */
export function isValidTileNumber(n: unknown): n is number {
  return Number.isInteger(n) && (n as number) >= 1 && (n as number) <= TILE_COUNT;
}
