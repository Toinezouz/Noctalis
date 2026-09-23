/**
 * Types decrivant le materiel de GOT FIVE! : les 60 tuiles, leurs couleurs et
 * leurs points. La donnee elle-meme vit dans `shared/src/data/tiles.ts`, qui
 * est l'unique source de verite du jeu.
 */

/** Les 5 familles de couleurs de la fiche de deduction. */
export type TileColor = 'green' | 'pink' | 'blue' | 'red' | 'orange';

/** Une tuile vaut 1, 2 ou 3 points. */
export type TilePoints = 1 | 2 | 3;

/** Une tuile complete (information publique une fois revelee). */
export interface Tile {
  /** Identifiant stable, ex. "tile-37". */
  id: string;
  /** Numero de 1 a 60, unique. */
  number: number;
  /** Couleur deduite du numero. */
  color: TileColor;
  /** Points deduits du numero (1, 2 ou 3). */
  points: TilePoints;
}

/**
 * Vue d'une tuile secrete **par son proprietaire**.
 * Volontairement amputee : ni numero, ni points (les points restreindraient
 * le numero a 12 candidats sur 60, ce qui serait une fuite d'information).
 */
export interface SecretTileView {
  /** Position sur le support, 0 (plus petit) a 4 (plus grand). */
  position: number;
  color: TileColor;
}

/** Une tuile publique, avec sa provenance. */
export interface RevealedTile {
  tile: Tile;
  /** Ordre d'apparition dans la zone publique (0 = mise en place initiale). */
  order: number;
  /** `null` pour les 5 tuiles de la mise en place. */
  revealedBy: string | null;
  /**
   * `true` des qu'un indice a ete demande sur cette tuile : elle quitte alors
   * la zone commune pour rejoindre le support du demandeur, et ne peut plus
   * servir a un autre indice.
   *
   * L'entree reste dans `publicTiles` : c'est la memoire des tuiles sorties du
   * sac, indispensable a la fiche de deduction (« deja revelee ») et au
   * garde-fou anti-fuite.
   */
  used: boolean;
}
