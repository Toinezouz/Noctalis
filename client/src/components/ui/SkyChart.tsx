import { COLOR_ORDER } from '@umbrastra/shared';
import { ASTERISMS } from '../game/Asterism.js';

/** Deterministic background stars (a tiny linear congruential generator). */
function backgroundStars(count: number): { x: number; y: number; r: number }[] {
  let seed = 7;
  const next = (): number => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const stars: { x: number; y: number; r: number }[] = [];
  while (stars.length < count) {
    const x = next() * 400;
    const y = next() * 400;
    const r = 0.5 + next() * next() * 1.4;
    if ((x - 200) ** 2 + (y - 200) ** 2 < 190 ** 2) {
      stars.push({ x, y, r });
    }
  }
  return stars;
}

const STARS = backgroundStars(70);
/** Hour circles of right ascension: every 2 hours. */
const MERIDIANS = Array.from({ length: 12 }, (_, i) => i * 30);
const HOUR_LABELS = [
  { text: '0h', angle: 0 },
  { text: '6h', angle: 90 },
  { text: '12h', angle: 180 },
  { text: '18h', angle: 270 },
];

/**
 * Decorative sky chart drawn behind the title of the home screen, like a
 * planisphere: circles of declination, hour circles of right ascension, the
 * celestial pole at the centre and the five constellations of the game,
 * turning slowly with the sky. Purely ornamental, hidden from assistive
 * technologies.
 */
export function SkyChart(): JSX.Element {
  return (
    <div className="skychart" aria-hidden="true">
      <svg className="skychart__sky" viewBox="0 0 400 400" focusable="false">
        <circle cx="200" cy="200" r="196" className="skychart__line" />
        {[150, 100, 50].map((r) => (
          <circle key={r} cx="200" cy="200" r={r} className="skychart__line skychart__line--soft" />
        ))}
        {MERIDIANS.map((angle) => (
          <line
            key={angle}
            x1="200"
            y1="200"
            x2="200"
            y2="4"
            className="skychart__line skychart__line--soft"
            transform={`rotate(${String(angle)} 200 200)`}
          />
        ))}
        {HOUR_LABELS.map(({ text, angle }) => (
          <text
            key={text}
            x="200"
            y="22"
            className="skychart__label"
            transform={`rotate(${String(angle)} 200 200)`}
          >
            {text}
          </text>
        ))}
        {STARS.map(({ x, y, r }) => (
          <circle key={`${x.toFixed(1)}-${y.toFixed(1)}`} cx={x} cy={y} r={r} className="skychart__star" />
        ))}
        {/* The celestial pole. */}
        <path d="M200 192 V208 M192 200 H208" className="skychart__pole" />
        {COLOR_ORDER.map((color, index) => {
          // The five constellations spread on the outer part of the chart, away from
          // the text in the middle.
          const angle = (index * 360) / COLOR_ORDER.length;
          const figure = ASTERISMS[color];
          return (
            <g
              key={color}
              data-color={color}
              className="skychart__constellation"
              transform={`rotate(${String(angle + 18)} 200 200) translate(173 20) scale(2.25)`}
            >
              <path d={figure.lines} className="skychart__figure" />
              {figure.stars.map(([x, y, r]) => (
                <circle key={`${String(x)}-${String(y)}`} cx={x} cy={y} r={r * 0.8} />
              ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
