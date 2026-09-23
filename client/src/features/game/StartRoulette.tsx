import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../../i18n/index.js';
import { useMediaQuery } from '../../hooks/useMediaQuery.js';
import { playSound } from '../../lib/audio.js';
import { Button } from '../../components/ui/Button.js';
import { sectorCenter, sectorSize, spinAngle } from '../../lib/roulette.js';

/** Duree de la rotation, calee sur la transition CSS. */
export const SPIN_MS = 2600;
/** Temps d'affichage du resultat avant fermeture automatique. */
export const HOLD_MS = 2400;
/** Tours complets avant l'arret. */
const TURNS = 5;
/** Un instant avant de lancer la roue : le navigateur doit avoir peint 0 deg. */
const KICK_MS = 60;

/** Constellations des secteurs, dans l'ordre des joueurs. */
const SECTOR_COLORS = ['var(--t-blue)', 'var(--t-pink)', 'var(--t-green)', 'var(--t-orange)'];

export interface StartRoulettePlayer {
  id: string;
  name: string;
}

export interface StartRouletteProps {
  players: StartRoulettePlayer[];
  /** Joueur tire au sort par le serveur. La roue ne fait que le montrer. */
  startingPlayerId: string;
  myId: string;
  onDone: () => void;
}

/**
 * Annonce du tirage au sort : une roue tourne puis s'arrete sur le joueur qui
 * commence. Le resultat vient du serveur (`startingPlayerId`) : l'animation ne
 * decide rien, elle raconte.
 */
export function StartRoulette({
  players,
  startingPlayerId,
  myId,
  onDone,
}: StartRouletteProps): JSX.Element | null {
  const { t } = useI18n();
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  const count = players.length;
  const index = players.findIndex((p) => p.id === startingPlayerId);
  // Decalage tire une fois : la roue ne s'arrete pas toujours pile au centre.
  const [offset] = useState(() => Math.random() * 2 - 1);
  const rotation = useMemo(
    () => (index < 0 || count === 0 ? 0 : spinAngle(index, count, TURNS, offset)),
    [index, count, offset],
  );

  const [spin, setSpin] = useState(0);
  const [landed, setLanded] = useState(false);

  useEffect(() => {
    if (reduceMotion) {
      setSpin(rotation);
      setLanded(true);
      return;
    }
    const kick = setTimeout(() => {
      setSpin(rotation);
    }, KICK_MS);
    const land = setTimeout(() => {
      setLanded(true);
      playSound('turn');
    }, KICK_MS + SPIN_MS);
    return () => {
      clearTimeout(kick);
      clearTimeout(land);
    };
  }, [reduceMotion, rotation]);

  // Fermeture automatique : personne ne reste bloque devant l'animation.
  useEffect(() => {
    if (!landed) {
      return;
    }
    const timer = setTimeout(onDone, HOLD_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [landed, onDone]);

  if (index < 0) {
    return null;
  }

  const starter = players[index]!;
  const iStart = starter.id === myId;
  const gradient = players
    .map((_, i) => {
      const color = SECTOR_COLORS[i % SECTOR_COLORS.length]!;
      return `${color} ${String(i * sectorSize(count))}deg ${String((i + 1) * sectorSize(count))}deg`;
    })
    .join(', ');

  return (
    <div className="roulette-backdrop" data-testid="roulette">
      <div
        className={`roulette ${landed ? 'is-landed' : 'is-spinning'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="roulette-title"
      >
        <h2 className="roulette__title" id="roulette-title">
          {landed ? t('roulette.landed', { name: starter.name }) : t('roulette.question')}
        </h2>

        <div
          className="roulette__wheel"
          style={
            {
              '--spin': `${String(Math.round(spin))}deg`,
              '--spin-ms': `${String(SPIN_MS)}ms`,
            } as React.CSSProperties
          }
        >
          <div
            className="roulette__disc"
            style={{ background: `conic-gradient(${gradient})` }}
            aria-hidden="true"
          />
          <div className="roulette__labels" aria-hidden="true">
            {players.map((player, i) => (
              <div
                className="roulette__label"
                key={player.id}
                style={{ '--angle': `${String(sectorCenter(i, count))}deg` } as React.CSSProperties}
              >
                <span className="roulette__label-text">{player.name}</span>
              </div>
            ))}
          </div>
          <span className="roulette__pointer" aria-hidden="true" />
          <span className="roulette__hub" aria-hidden="true">
            🎲
          </span>
        </div>

        <p className="roulette__note" role="status" data-testid="roulette-note">
          {landed
            ? iStart
              ? t('roulette.youStart')
              : t('roulette.opponentStarts', { name: starter.name })
            : t('roulette.drawing')}
        </p>

        <Button
          variant={landed ? 'primary' : 'secondary'}
          onClick={onDone}
          data-testid="roulette-continue"
          autoFocus
        >
          {landed ? t('roulette.go') : t('roulette.skip')}
        </Button>
      </div>
    </div>
  );
}
