import { COLOR_ORDER } from '@umbrastra/shared';
import { ConstellationSigil } from '../game/ConstellationSigil.js';

/**
 * Decorative astrolabe drawn behind the title of the home screen: graduated
 * rings, a slowly turning rete and the five constellation sigils. Purely
 * ornamental, hidden from assistive technologies.
 */
export function Astrolabe(): JSX.Element {
  const ticks = Array.from({ length: 72 }, (_, i) => i * 5);
  return (
    <div className="astrolabe" aria-hidden="true">
      <svg className="astrolabe__rings" viewBox="0 0 400 400" focusable="false">
        <circle cx="200" cy="200" r="196" className="astrolabe__line" />
        <circle cx="200" cy="200" r="178" className="astrolabe__line astrolabe__line--soft" />
        <circle cx="200" cy="200" r="120" className="astrolabe__line astrolabe__line--soft" />
        <circle cx="200" cy="200" r="64" className="astrolabe__line astrolabe__line--soft" />
        {ticks.map((angle) => (
          <line
            key={angle}
            x1="200"
            y1={angle % 30 === 0 ? 4 : 8}
            x2="200"
            y2="18"
            className="astrolabe__tick"
            transform={`rotate(${String(angle)} 200 200)`}
          />
        ))}
      </svg>
      <div className="astrolabe__rete">
        {COLOR_ORDER.map((color, index) => {
          // Five sigils evenly spread on the outer ring, the first at the top.
          const angle = (index * 2 * Math.PI) / COLOR_ORDER.length;
          return (
            <span
              key={color}
              className="astrolabe__sigil"
              data-color={color}
              style={{
                left: `${String(50 + 46.5 * Math.sin(angle))}%`,
                top: `${String(50 - 46.5 * Math.cos(angle))}%`,
              }}
            >
              <ConstellationSigil color={color} size={26} />
            </span>
          );
        })}
      </div>
    </div>
  );
}
