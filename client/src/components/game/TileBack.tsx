import type { TileColor } from '@umbrastra/shared';
import { useI18n } from '../../i18n/index.js';
import { Asterism } from './Asterism.js';

export interface TileBackProps {
  color: TileColor;
  /** Position on the rack (0 to 4), shown as a landmark. */
  position: number;
  size?: 'sm' | 'md' | 'lg';
  highlighted?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  labelSuffix?: string;
}

/**
 * One of my own stars, as I see it: a target not observed yet. Its constellation
 * and position show; its number never does (the client simply does not have
 * it).
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
      <Asterism color={color} className="tile__asterism" size={size === 'lg' ? 22 : 15} />
      <span className="tile-back__mark" aria-hidden="true">
        ?
      </span>
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
