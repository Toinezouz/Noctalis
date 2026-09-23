/**
 * Types describing the UMBRASTRA material: 60 stars, their constellations and
 * their brightness. The data itself lives in `shared/src/data/tiles.ts`, the
 * single source of truth of the game.
 */

/**
 * The five constellations. The identifiers are technical and never shown:
 * players see Lyra, Orion, Cygnus, Scorpius and Cassiopeia, in their own language.
 */
export type TileColor = 'green' | 'pink' | 'blue' | 'red' | 'orange';

/** A star shines with 1, 2 or 3 points of brightness. */
export type TilePoints = 1 | 2 | 3;

/** A complete star (public information once revealed). */
export interface Tile {
  /** Stable identifier, e.g. "tile-37". */
  id: string;
  /** Number from 1 to 60, unique. */
  number: number;
  /** Constellation, derived from the number. */
  color: TileColor;
  /** Brightness, derived from the number (1, 2 or 3). */
  points: TilePoints;
}

/**
 * A secret star **as seen by its owner**.
 * Deliberately stripped down: no number and no brightness (brightness alone
 * would narrow the number down to 12 candidates out of 60, which is a leak).
 */
export interface SecretTileView {
  /** Position on the rack, 0 (smallest) to 4 (largest). */
  position: number;
  color: TileColor;
}

/** A public star, with its history. */
export interface RevealedTile {
  tile: Tile;
  /** Order of appearance in the shared sky (0 = initial setup). */
  order: number;
  /** `null` for the five stars laid out at setup. */
  revealedBy: string | null;
  /**
   * `true` once a hint has been asked about this star: it leaves the shared
   * sky, joins the asker's rack and can no longer be used for another hint.
   *
   * The entry stays in `publicTiles`: it is the memory of every star that
   * left the reserve, needed by the star chart ("already revealed") and by
   * the leak guard.
   */
  used: boolean;
}
