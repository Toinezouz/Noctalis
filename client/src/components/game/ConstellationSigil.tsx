import type { TileColor } from '@umbrastra/shared';

export interface ConstellationSigilProps {
  color: TileColor;
  /** Rendered size in pixels (the drawing is square). */
  size?: number;
  className?: string;
}

interface Figure {
  /** Lines joining the stars, as SVG path data. */
  lines: string;
  /** Stars: [x, y, radius]. */
  stars: readonly (readonly [number, number, number])[];
}

/**
 * One small, original star figure per constellation, drawn on a 24×24 grid.
 * They let players tell constellations apart by shape as well as by colour,
 * which matters for colour-blind players.
 */
const FIGURES: Record<TileColor, Figure> = {
  // Lyra: a bright star above a small parallelogram.
  green: {
    lines: 'M12 3.8 L8.6 10.2 M12 3.8 L15.2 11.4 M8.6 10.2 L15.2 11.4 L16.4 19.6 L9.6 18.2 Z',
    stars: [
      [12, 3.8, 2.3],
      [8.6, 10.2, 1.5],
      [15.2, 11.4, 1.5],
      [16.4, 19.6, 1.5],
      [9.6, 18.2, 1.5],
    ],
  },
  // Aurora: an arc of light with its curtain hanging below.
  pink: {
    lines: 'M3 16.5 Q12 1.5 21 16.5 M8 12 L8 19 M12 8.5 L12 20.5 M16 12 L16 19',
    stars: [
      [3, 16.5, 1.5],
      [12, 8.6, 2.1],
      [21, 16.5, 1.5],
      [8, 19, 1.1],
      [16, 19, 1.1],
    ],
  },
  // Cygnus: the long neck and open wings of a swan in flight.
  blue: {
    lines: 'M12 2.8 L12 21.2 M3.4 12.4 L12 9.4 L20.6 12.4',
    stars: [
      [12, 2.8, 1.5],
      [12, 9.4, 2.2],
      [3.4, 12.4, 1.5],
      [20.6, 12.4, 1.5],
      [12, 21.2, 1.7],
    ],
  },
  // Ember: a flame rising from a glowing coal.
  red: {
    lines: 'M12 3 L16.6 11 L14.2 13 L17.4 20 L6.6 20 L9.8 13 L7.6 10.4 Z',
    stars: [
      [12, 3, 1.7],
      [16.6, 11, 1.4],
      [7.6, 10.4, 1.4],
      [17.4, 20, 1.4],
      [6.6, 20, 1.4],
      [12, 16.4, 2.1],
    ],
  },
  // Phoenix: wings spread wide above a long tail.
  orange: {
    lines: 'M2.8 6.6 L7.8 11.8 L12 15.6 L16.2 11.8 L21.2 6.6 M12 15.6 L12 21.4',
    stars: [
      [2.8, 6.6, 1.5],
      [7.8, 11.8, 1.3],
      [12, 15.6, 2.2],
      [16.2, 11.8, 1.3],
      [21.2, 6.6, 1.5],
      [12, 21.4, 1.3],
    ],
  },
};

/** The sigil of a constellation, drawn in `currentColor`. */
export function ConstellationSigil({
  color,
  size = 20,
  className = '',
}: ConstellationSigilProps): JSX.Element {
  const figure = FIGURES[color];
  return (
    <svg
      className={`sigil ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      data-sigil={color}
    >
      <path
        d={figure.lines}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.62"
      />
      {figure.stars.map(([x, y, r]) => (
        <circle key={`${String(x)}-${String(y)}`} cx={x} cy={y} r={r} fill="currentColor" />
      ))}
    </svg>
  );
}
