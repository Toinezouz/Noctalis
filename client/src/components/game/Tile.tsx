import type { Tile as TileData } from '@umbrastra/shared';
import { useI18n } from '../../i18n/index.js';
import { ConstellationSigil } from './ConstellationSigil.js';

export type TileSize = 'xs' | 'sm' | 'md' | 'lg';

export interface TileProps {
  tile: TileData;
  size?: TileSize;
  /** Gauged star that got a NO: shown dimmed, with a dashed ring. */
  tilted?: boolean;
  selected?: boolean;
  /** Makes the star clickable (picking a public star, for instance). */
  onClick?: () => void;
  disabled?: boolean;
  /** Appended to the accessible label. */
  labelSuffix?: string;
  /** Small entrance animation. */
  animate?: boolean;
  className?: string;
}

/** Brightness, as one to three small four-pointed sparkles. */
export function TilePoints({ points }: { points: number }): JSX.Element {
  return (
    <span className="tile__points" aria-hidden="true">
      {Array.from({ length: points }, (_, i) => (
        <span key={i} className="tile__dot" />
      ))}
    </span>
  );
}

/**
 * A star, face up: a small celestial medallion with its constellation's
 * sigil, its number and its brightness.
 */
export function Tile({
  tile,
  size = 'md',
  tilted = false,
  selected = false,
  onClick,
  disabled = false,
  labelSuffix,
  animate = false,
  className = '',
}: TileProps): JSX.Element {
  const { t, color: colorName, points: pointsLabel } = useI18n();
  const label = [
    t('tile.label', {
      number: tile.number,
      color: colorName(tile.color),
      points: pointsLabel(tile.points),
    }),
    tilted ? t('tile.tilted') : null,
    labelSuffix ?? null,
  ]
    .filter(Boolean)
    .join(', ');

  const classes = [
    'tile',
    `tile--${size}`,
    tilted ? 'tile--tilted' : '',
    selected ? 'tile--selected' : '',
    animate ? 'tile--enter' : '',
    onClick ? 'tile--clickable' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      {size !== 'xs' ? (
        <ConstellationSigil color={tile.color} className="tile__sigil" size={size === 'lg' ? 22 : 15} />
      ) : null}
      <span className="tile__number">{tile.number}</span>
      <TilePoints points={tile.points} />
      <span className="visually-hidden">{label}</span>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className={classes}
        data-color={tile.color}
        data-tile={tile.number}
        onClick={onClick}
        disabled={disabled}
        aria-pressed={selected}
        aria-label={label}
      >
        {content}
      </button>
    );
  }

  return (
    <span className={classes} data-color={tile.color} data-tile={tile.number} role="img" aria-label={label}>
      {content}
    </span>
  );
}
