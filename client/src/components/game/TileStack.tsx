import type { Tile as TileData } from '@gotfive/shared';
import { Tile } from './Tile.js';

export interface TileStackProps {
  tiles: TileData[];
  /** Tuiles inclinees (reponse NON), reperees par numero. */
  tiltedNumbers?: number[];
  size?: 'xs' | 'sm' | 'md';
  label?: string;
}

/**
 * Au-dela de ce nombre de tuiles, la pile se resserre pour qu'une encoche tres
 * chargee ne fasse pas grandir le support indefiniment.
 */
const LOOSE_STACK_LIMIT = 5;

/**
 * Empilement de tuiles : plusieurs tuiles peuvent etre classees dans la meme
 * encoche, ou comparees a la meme position secrete. Les tuiles se superposent
 * verticalement, chaque numero restant lisible.
 */
export function TileStack({
  tiles,
  tiltedNumbers = [],
  size = 'sm',
  label,
}: TileStackProps): JSX.Element | null {
  if (tiles.length === 0) {
    return null;
  }
  return (
    <span
      className="tile-stack"
      aria-label={label}
      style={
        {
          '--stack-overlap': tiles.length > LOOSE_STACK_LIMIT ? '-20px' : '-8px',
        } as React.CSSProperties
      }
    >
      {tiles.map((tile, index) => (
        <span
          className="tile-stack__item"
          key={tile.id}
          style={{ '--stack-index': index } as React.CSSProperties}
        >
          <Tile tile={tile} size={size} tilted={tiltedNumbers.includes(tile.number)} />
        </span>
      ))}
    </span>
  );
}
