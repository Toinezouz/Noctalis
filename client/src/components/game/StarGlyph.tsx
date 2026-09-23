import type { TileColor } from '@noctalis/shared';

export interface StarGlyphProps {
  /** Numero de l'etoile : determine la figure, de facon deterministe. */
  seed: number;
  color: TileColor;
  size?: number;
}

/**
 * Figures stellaires originales, dessinees en SVG : cinq variantes choisies a
 * partir du numero de l'etoile. Elles donnent a chaque etoile un visage
 * reconnaissable sans jamais reveler son numero. Aucun asset externe.
 */
export function StarGlyph({ seed, size = 22 }: StarGlyphProps): JSX.Element {
  const variant = seed % 5;
  const light = 'rgba(255, 255, 255, 0.94)';
  const halo = 'rgba(255, 255, 255, 0.34)';

  return (
    <svg
      className="star-glyph"
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
    >
      {variant === 0 ? (
        /* Etoile a quatre branches */
        <path
          d="M16 4 L18.6 13.4 L28 16 L18.6 18.6 L16 28 L13.4 18.6 L4 16 L13.4 13.4 Z"
          fill={light}
        />
      ) : null}
      {variant === 1 ? (
        /* Etoile a six branches */
        <g fill={light}>
          <path d="M16 4 L19 14 L16 28 L13 14 Z" />
          <path d="M4 16 L14 13 L28 16 L14 19 Z" />
          <path d="M7.5 7.5 L16 14 L24.5 24.5 L16 18 Z" opacity="0.75" />
          <path d="M24.5 7.5 L18 16 L7.5 24.5 L14 16 Z" opacity="0.75" />
        </g>
      ) : null}
      {variant === 2 ? (
        /* Etoile double */
        <g fill={light}>
          <circle cx="12" cy="13" r="5" />
          <circle cx="22" cy="21" r="3.4" />
          <path d="M12 13 L22 21" stroke={halo} strokeWidth="1.4" />
        </g>
      ) : null}
      {variant === 3 ? (
        /* Amas */
        <g fill={light}>
          <circle cx="16" cy="10" r="3" />
          <circle cx="10" cy="19" r="2.4" />
          <circle cx="22" cy="19" r="2.4" />
          <circle cx="16" cy="24" r="1.8" opacity="0.8" />
        </g>
      ) : null}
      {variant === 4 ? (
        /* Nebuleuse */
        <g>
          <ellipse cx="16" cy="16" rx="11" ry="7" fill={halo} />
          <ellipse cx="16" cy="16" rx="6.5" ry="3.6" fill={light} />
          <circle cx="16" cy="16" r="1.8" fill="#fff" />
        </g>
      ) : null}
    </svg>
  );
}
