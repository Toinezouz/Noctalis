import type { TileColor } from '@gotfive/shared';

export interface CharacterProps {
  /** Numero de la tuile : determine la variante du personnage (original). */
  seed: number;
  color: TileColor;
  size?: number;
}

/**
 * Petits personnages originaux dessines en SVG : 5 variantes, choisies de
 * facon deterministe a partir du numero de la tuile. Aucun asset externe.
 */
export function Character({ seed, size = 22 }: CharacterProps): JSX.Element {
  const variant = seed % 5;
  const ink = 'rgba(21, 8, 34, 0.78)';
  const light = 'rgba(255, 255, 255, 0.92)';

  return (
    <svg
      className="character"
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="16" cy="17" r="11" fill={light} />
      {variant === 0 ? (
        <>
          <circle cx="12" cy="15" r="2" fill={ink} />
          <circle cx="20" cy="15" r="2" fill={ink} />
          <path d="M11 21c2.4 2.4 7.6 2.4 10 0" stroke={ink} strokeWidth="2" fill="none" strokeLinecap="round" />
        </>
      ) : null}
      {variant === 1 ? (
        <>
          <path d="M9 14l5 2-5 2z" fill={ink} />
          <circle cx="21" cy="15" r="2.4" fill={ink} />
          <path d="M12 21h8" stroke={ink} strokeWidth="2" strokeLinecap="round" />
          <path d="M16 6v3" stroke={ink} strokeWidth="2" strokeLinecap="round" />
          <circle cx="16" cy="5" r="2" fill={ink} />
        </>
      ) : null}
      {variant === 2 ? (
        <>
          <rect x="9" y="13" width="5" height="4" rx="1.6" fill={ink} />
          <rect x="18" y="13" width="5" height="4" rx="1.6" fill={ink} />
          <path d="M12 22c1.6-1.6 6.4-1.6 8 0" stroke={ink} strokeWidth="2" fill="none" strokeLinecap="round" />
        </>
      ) : null}
      {variant === 3 ? (
        <>
          <circle cx="12" cy="15" r="2.2" fill={ink} />
          <circle cx="20" cy="15" r="2.2" fill={ink} />
          <circle cx="16" cy="21" r="2.4" fill={ink} />
          <path d="M6 12l3-3M26 12l-3-3" stroke={ink} strokeWidth="2" strokeLinecap="round" />
        </>
      ) : null}
      {variant === 4 ? (
        <>
          <path d="M10 14c1.6-1.6 3.2-1.6 4 0" stroke={ink} strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M18 14c1.6-1.6 3.2-1.6 4 0" stroke={ink} strokeWidth="2" fill="none" strokeLinecap="round" />
          <ellipse cx="16" cy="21" rx="3" ry="2.4" fill={ink} />
        </>
      ) : null}
    </svg>
  );
}
