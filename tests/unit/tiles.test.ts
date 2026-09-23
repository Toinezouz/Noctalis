import { describe, expect, it } from 'vitest';
import {
  COLOR_ORDER,
  SHEET_COLUMNS,
  SHEET_GRID,
  TILES,
  TILE_COUNT,
  colorForNumber,
  columnForNumber,
  getTileByNumber,
  isValidTileNumber,
  pointsForNumber,
  tilesOfColor,
} from '@gotfive/shared';

/** Mapping officiel de la fiche : couleur attendue pour chaque numero. */
const EXPECTED_COLORS: Record<string, number[]> = {
  green: [1, 6, 11, 16, 21, 26, 31, 36, 41, 46, 51, 56],
  pink: [2, 7, 12, 17, 22, 27, 32, 37, 42, 47, 52, 57],
  blue: [3, 8, 13, 18, 23, 28, 33, 38, 43, 48, 53, 58],
  red: [4, 9, 14, 19, 24, 29, 34, 39, 44, 49, 54, 59],
  orange: [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60],
};

/** Points attendus, par paquets de 5 numeros : 1,2,3,1,2,3... */
const EXPECTED_POINTS: Record<number, number> = (() => {
  const map: Record<number, number> = {};
  const pattern = [1, 2, 3];
  for (let n = 1; n <= 60; n += 1) {
    map[n] = pattern[Math.floor((n - 1) / 5) % 3]!;
  }
  return map;
})();

describe('donnees des 60 tuiles', () => {
  it('contient exactement 60 tuiles', () => {
    expect(TILE_COUNT).toBe(60);
    expect(TILES).toHaveLength(60);
  });

  it('couvre les numeros 1 a 60 sans doublon ni trou', () => {
    const numbers = TILES.map((t) => t.number).sort((a, b) => a - b);
    expect(new Set(numbers).size).toBe(60);
    expect(numbers).toEqual(Array.from({ length: 60 }, (_, i) => i + 1));
  });

  it('a des identifiants uniques et stables', () => {
    const ids = TILES.map((t) => t.id);
    expect(new Set(ids).size).toBe(60);
    expect(getTileByNumber(37).id).toBe('tile-37');
  });

  it.each(Object.entries(EXPECTED_COLORS))('la ligne %s a les bons numeros', (color, numbers) => {
    for (const n of numbers) {
      expect(colorForNumber(n)).toBe(color);
      expect(getTileByNumber(n).color).toBe(color);
    }
    expect(tilesOfColor(color as never).map((t) => t.number)).toEqual(numbers);
  });

  it('attribue les points selon le motif des colonnes (1/2/3)', () => {
    for (let n = 1; n <= 60; n += 1) {
      expect(pointsForNumber(n), `points de ${String(n)}`).toBe(EXPECTED_POINTS[n]);
      expect(getTileByNumber(n).points).toBe(EXPECTED_POINTS[n]);
    }
  });

  it('verifie les 15 premiers exemples de la fiche', () => {
    const expected: [number, string, number][] = [
      [1, 'green', 1],
      [2, 'pink', 1],
      [3, 'blue', 1],
      [4, 'red', 1],
      [5, 'orange', 1],
      [6, 'green', 2],
      [7, 'pink', 2],
      [8, 'blue', 2],
      [9, 'red', 2],
      [10, 'orange', 2],
      [11, 'green', 3],
      [12, 'pink', 3],
      [13, 'blue', 3],
      [14, 'red', 3],
      [15, 'orange', 3],
    ];
    for (const [n, color, points] of expected) {
      const tile = getTileByNumber(n);
      expect([tile.color, tile.points]).toEqual([color, points]);
    }
  });

  it('reprend le motif a partir de 16 et se termine sur 60 orange 3 points', () => {
    expect(getTileByNumber(16)).toMatchObject({ color: 'green', points: 1 });
    expect(getTileByNumber(17)).toMatchObject({ color: 'pink', points: 1 });
    expect(getTileByNumber(37)).toMatchObject({ color: 'pink', points: 2 });
    expect(getTileByNumber(56)).toMatchObject({ color: 'green', points: 3 });
    expect(getTileByNumber(57)).toMatchObject({ color: 'pink', points: 3 });
    expect(getTileByNumber(58)).toMatchObject({ color: 'blue', points: 3 });
    expect(getTileByNumber(59)).toMatchObject({ color: 'red', points: 3 });
    expect(getTileByNumber(60)).toMatchObject({ color: 'orange', points: 3 });
  });

  it('calcule les colonnes 1 a 12', () => {
    expect(columnForNumber(1)).toBe(1);
    expect(columnForNumber(5)).toBe(1);
    expect(columnForNumber(6)).toBe(2);
    expect(columnForNumber(60)).toBe(12);
    expect(SHEET_COLUMNS).toBe(12);
  });

  it('expose une grille 5 lignes x 12 colonnes coherente', () => {
    expect(SHEET_GRID).toHaveLength(5);
    SHEET_GRID.forEach((row, i) => {
      expect(row).toHaveLength(12);
      row.forEach((tile, j) => {
        expect(tile.color).toBe(COLOR_ORDER[i]);
        expect(tile.number).toBe(i + 1 + j * 5);
      });
    });
  });

  it('refuse les numeros invalides', () => {
    expect(isValidTileNumber(0)).toBe(false);
    expect(isValidTileNumber(61)).toBe(false);
    expect(isValidTileNumber(1.5)).toBe(false);
    expect(isValidTileNumber('12')).toBe(false);
    expect(() => getTileByNumber(61)).toThrow();
    expect(() => colorForNumber(0)).toThrow();
  });

  it('interdit toute divergence entre la fiche et les tuiles', () => {
    for (const row of SHEET_GRID) {
      for (const cell of row) {
        const tile = getTileByNumber(cell.number);
        expect(cell).toEqual(tile);
      }
    }
  });
});
