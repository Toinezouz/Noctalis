import type { TileColor } from '@gotfive/shared';
import { useI18n } from '../../i18n/index.js';
import { Character } from './Character.js';

export interface TileBackProps {
  color: TileColor;
  /** Position sur le support (0 a 4) : affichee comme reperage. */
  position: number;
  size?: 'sm' | 'md' | 'lg';
  highlighted?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  labelSuffix?: string;
}

/**
 * Dos d'une tuile secrete, vu par son proprietaire : la couleur et la position
 * sont visibles, le numero ne l'est jamais (il n'existe pas cote client).
 */
export function TileBack({
  color,
  position,
  size = 'md',
  highlighted = false,
  onClick,
  disabled = false,
  labelSuffix,
}: TileBackProps): JSX.Element {
  const { t, color: colorName } = useI18n();
  const label = [
    t('tile.back', { position: position + 1, color: colorName(color) }),
    labelSuffix ?? null,
  ]
    .filter(Boolean)
    .join(', ');

  const classes = [
    'tile',
    'tile-back',
    `tile--${size}`,
    highlighted ? 'tile--selected' : '',
    onClick ? 'tile--clickable' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      <span className="tile-back__pattern" aria-hidden="true" />
      <span className="tile-back__mark" aria-hidden="true">
        ?
      </span>
      <Character seed={position * 7 + 3} color={color} size={18} />
      <span className="tile-back__position" aria-hidden="true">
        {position + 1}
      </span>
      <span className="visually-hidden">{label}</span>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className={classes}
        data-color={color}
        data-position={position}
        onClick={onClick}
        disabled={disabled}
        aria-pressed={highlighted}
        aria-label={label}
      >
        {content}
      </button>
    );
  }

  return (
    <span className={classes} data-color={color} data-position={position} role="img" aria-label={label}>
      {content}
    </span>
  );
}
