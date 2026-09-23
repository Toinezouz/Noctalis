import type { TileColor } from '@umbrastra/shared';

export interface AsterismProps {
  color: TileColor;
  /** Rendered size in pixels (the drawing is square). */
  size?: number;
  className?: string;
}

export interface Figure {
  /** Lines joining the stars, as SVG path data. */
  lines: string;
  /** Stars: [x, y, radius]; the radius follows the star's real brightness. */
  stars: readonly (readonly [number, number, number])[];
}

/**
 * The five constellations of the game are real ones, drawn from their actual
 * stick figures (simplified) on a 24×24 grid, north up. They let players tell
 * constellations apart by shape as well as by colour, which matters for
 * colour-blind players.
 */
export const ASTERISMS: Record<TileColor, Figure> = {
  // Lyra: Vega, then the small parallelogram of ζ, δ, γ and β.
  green: {
    lines: 'M8.5 3.6 L12.9 4.2 L11 9 Z M11 9 L16.2 10.4 L15.6 19.6 L9.6 18.2 Z',
    stars: [
      [8.5, 3.6, 2.5],
      [12.9, 4.2, 1],
      [11, 9, 1.2],
      [16.2, 10.4, 1.2],
      [15.6, 19.6, 1.6],
      [9.6, 18.2, 1.4],
    ],
  },
  // Orion: Betelgeuse and Bellatrix, the three stars of the belt, Saiph and Rigel.
  pink: {
    lines:
      'M6 4.6 L11 2.6 L16.6 5.6 M6 4.6 L9.6 12.8 L12 12.1 L14.4 11.4 L16.6 5.6 M9.6 12.8 L8 20.8 M14.4 11.4 L17.6 19.8',
    stars: [
      [6, 4.6, 2.2],
      [11, 2.6, 0.9],
      [16.6, 5.6, 1.5],
      [9.6, 12.8, 1.3],
      [12, 12.1, 1.3],
      [14.4, 11.4, 1.3],
      [8, 20.8, 1.3],
      [17.6, 19.8, 2.1],
    ],
  },
  // Cygnus, the Northern Cross: Deneb, Sadr, Albireo, and the wings δ and ε.
  blue: {
    lines: 'M17.2 3.4 L12.6 10 L9.4 15.2 L6 21 M6.4 6.2 L12.6 10 L18.8 13.8',
    stars: [
      [17.2, 3.4, 2.1],
      [12.6, 10, 1.6],
      [9.4, 15.2, 1],
      [6, 21, 1.5],
      [6.4, 6.2, 1.3],
      [18.8, 13.8, 1.3],
    ],
  },
  // Scorpius: the claws, red Antares, and the long curved tail up to Shaula.
  red: {
    lines:
      'M19.6 3 L18 6.2 L18.6 9.6 M18 6.2 L14 9.6 L12 12.6 L10.2 15.4 L8.8 18.6 L9.8 21.6 L13.2 22.6 L16.6 21.4 L18.8 18.8 L18.2 16.2',
    stars: [
      [19.6, 3, 1.2],
      [18, 6.2, 1.3],
      [18.6, 9.6, 1],
      [14, 9.6, 2.3],
      [12, 12.6, 1],
      [10.2, 15.4, 1.1],
      [8.8, 18.6, 1],
      [9.8, 21.6, 1],
      [13.2, 22.6, 1],
      [16.6, 21.4, 1.1],
      [18.8, 18.8, 1.1],
      [18.2, 16.2, 1.5],
    ],
  },
  // Cassiopeia: the W of ε, δ, γ, Schedar and Caph.
  orange: {
    lines: 'M2.8 8.4 L7.8 14.4 L12 9.4 L16.2 15.6 L21.2 9.2',
    stars: [
      [2.8, 8.4, 1.3],
      [7.8, 14.4, 1.5],
      [12, 9.4, 1.8],
      [16.2, 15.6, 1.8],
      [21.2, 9.2, 1.6],
    ],
  },
};

/** The star figure of a constellation, drawn in `currentColor`. */
export function Asterism({ color, size = 20, className = '' }: AsterismProps): JSX.Element {
  const figure = ASTERISMS[color];
  return (
    <svg
      className={`asterism ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      data-asterism={color}
    >
      <path
        d={figure.lines}
        fill="none"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.55"
      />
      {figure.stars.map(([x, y, r]) => (
        <circle key={`${String(x)}-${String(y)}`} cx={x} cy={y} r={r} fill="currentColor" />
      ))}
    </svg>
  );
}
