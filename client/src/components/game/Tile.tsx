import type { Tile as TileData } from '@gotfive/shared';
import { useI18n } from '../../i18n/index.js';
import { Character } from './Character.js';

export type TileSize = 'xs' | 'sm' | 'md' | 'lg';

export interface TileProps {
  tile: TileData;
  size?: TileSize;
  /** Tuile inclinee : reponse NON a une comparaison. */
  tilted?: boolean;
  selected?: boolean;
  /** Rend la tuile cliquable (choix d'une tuile publique, par exemple). */
  onClick?: () => void;
  disabled?: boolean;
  /** Suffixe ajoute au libelle accessible. */
  labelSuffix?: string;
  /** Petite animation d'apparition. */
  animate?: boolean;
  className?: string;
}

/** Les points, affiches sous le numero, comme sur le materiel physique. */
export function TilePoints({ points }: { points: number }): JSX.Element {
  return (
    <span className="tile__points" aria-hidden="true">
      {Array.from({ length: points }, (_, i) => (
        <span key={i} className="tile__dot" />
      ))}
    </span>
  );
}

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
      <span className="tile__number">{tile.number}</span>
      <TilePoints points={tile.points} />
      {size !== 'xs' ? <Character seed={tile.number} color={tile.color} size={size === 'lg' ? 28 : 20} /> : null}
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
