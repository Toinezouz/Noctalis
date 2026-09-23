import type { Tile as TileData } from '@noctalis/shared';
import { Tile } from './Tile.js';

export interface TileStackProps {
  tiles: TileData[];
  /** Stars that got a NO, by number. */
  tiltedNumbers?: number[];
  size?: 'xs' | 'sm' | 'md';
  label?: string;
}

/**
 * Beyond this many stars the stack tightens, so that a crowded gap does not
 * make the rack grow forever.
 */
const LOOSE_STACK_LIMIT = 5;

/**
 * A stack of stars: several stars can land in the same gap, or be gauged
 * against the same position. They overlap vertically and every number stays
 * readable.
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
