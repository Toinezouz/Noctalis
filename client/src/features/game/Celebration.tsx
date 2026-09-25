import { getTileByNumber, type Tile as TileData } from '@umbrastra/shared';
import { Tile } from '../../components/game/Tile.js';

export interface CelebrationProps {
  /** The winner's five stars, in order; empty when nobody won. */
  stars: TileData[];
  title: string;
}

/**
 * Where the five stars light up, as percentages of the stage: an arc that
 * crowns the eclipse, like a constellation rising above the horizon.
 */
const ARC = [200, 238, 270, 302, 340].map((degrees) => {
  const radians = (degrees * Math.PI) / 180;
  return { x: 50 + 38 * Math.cos(radians), y: 60 + 46 * Math.sin(radians) };
});

/** Shooting stars: start point (%), delay (s) and length, fixed for a calm rhythm. */
const METEORS = [
  { x: 8, y: 6, delay: 2.4, length: 120 },
  { x: 38, y: 2, delay: 3.6, length: 90 },
  { x: 70, y: 10, delay: 2.9, length: 140 },
  { x: 20, y: 22, delay: 5.1, length: 100 },
  { x: 86, y: 4, delay: 4.4, length: 110 },
  { x: 55, y: 16, delay: 6.3, length: 80 },
];

/**
 * The opening of the end screen: a total eclipse, the flash of the diamond
 * ring, then the winner's constellation lighting up star by star and drawing
 * itself, under a shower of shooting stars. When nobody won, the eclipse
 * alone stays: the sky kept its secrets. Purely visual: the result itself is
 * written in the card below, for screen readers too.
 */
export function Celebration({ stars, title }: CelebrationProps): JSX.Element {
  const won = stars.length > 0;
  return (
    <div className={`celebration ${won ? 'is-won' : 'is-draw'}`} aria-hidden="true">
      <div className="celebration__sky" />
      {won
        ? METEORS.map((m, i) => (
            <span
              key={i}
              className="celebration__meteor"
              style={
                {
                  left: `${String(m.x)}%`,
                  top: `${String(m.y)}%`,
                  width: `${String(m.length)}px`,
                  animationDelay: `${String(m.delay)}s`,
                }
              }
            />
          ))
        : null}

      <div className="celebration__stage">
        <div className="celebration__eclipse">
          <span className="celebration__corona" />
          <span className="celebration__moon" />
          {won ? <span className="celebration__bead" /> : null}
        </div>
        {won ? <span className="celebration__flash" /> : null}

        {won ? (
          <>
            <svg className="celebration__lines" viewBox="0 0 100 100" preserveAspectRatio="none">
              {ARC.slice(1).map((point, i) => (
                // A path rather than a line: browsers honour `pathLength` on
                // paths, which lets the stroke draw itself from 0 to 1.
                <path
                  key={i}
                  d={`M${String(ARC[i]!.x)} ${String(ARC[i]!.y)} L${String(point.x)} ${String(point.y)}`}
                  pathLength={1}
                  style={{ animationDelay: `${String(2.1 + i * 0.28)}s` }}
                />
              ))}
            </svg>
            {stars.slice(0, ARC.length).map((tile, i) => (
              <span
                key={tile.id}
                className="celebration__star"
                style={
                  {
                    left: `${String(ARC[i]!.x)}%`,
                    top: `${String(ARC[i]!.y)}%`,
                    animationDelay: `${String(1.7 + i * 0.28)}s`,
                  }
                }
              >
                <Tile tile={getTileByNumber(tile.number)} size="md" />
              </span>
            ))}
          </>
        ) : null}
      </div>

      <p className="celebration__title">{title}</p>
    </div>
  );
}
