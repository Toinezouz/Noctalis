/**
 * Types decrivant le materiel de NOCTALIS : les 60 etoiles, leurs constellations et
 * leurs eclats. La donnee elle-meme vit dans `shared/src/data/tiles.ts`, qui
 * est l'unique source de verite du jeu.
 */

/** Les 5 familles de constellations de la carte du ciel. */
export type TileColor = 'green' | 'pink' | 'blue' | 'red' | 'orange';

/** Une etoile vaut 1, 2 ou 3 eclats. */
export type TilePoints = 1 | 2 | 3;

/** Une etoile complete (information publique une fois revelee). */
export interface Tile {
  /** Identifiant stable, ex. "tile-37". */
  id: string;
  /** Numero de 1 a 60, unique. */
  number: number;
  /** Constellation deduite du numero. */
  color: TileColor;
  /** Points deduits du numero (1, 2 ou 3). */
  points: TilePoints;
}

/**
 * Vue d'une etoile secrete **par son proprietaire**.
 * Volontairement amputee : ni numero, ni eclats (les eclats restreindraient
 * le numero a 12 candidats sur 60, ce qui serait une fuite d'information).
 */
export interface SecretTileView {
  /** Position sur le support, 0 (plus petit) a 4 (plus grand). */
  position: number;
  color: TileColor;
}

/** Une etoile publique, avec sa provenance. */
export interface RevealedTile {
  tile: Tile;
  /** Ordre d'apparition dans la releve commun (0 = mise en place initiale). */
  order: number;
  /** `null` pour les 5 etoiles de la mise en place. */
  revealedBy: string | null;
  /**
   * `true` des qu'un indice a ete demande sur cette etoile : elle quitte alors
   * la releve commun pour rejoindre le support du demandeur, et ne peut plus
   * servir a un autre indice.
   *
   * L'entree reste dans `publicTiles` : c'est la memoire des etoiles sorties du
   * sac, indispensable a la carte du ciel (« deja revelee ») et au
   * garde-fou anti-fuite.
   */
  used: boolean;
}
