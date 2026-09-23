import { COLOR_ORDER, type GamePhase, type TileColor } from '@gotfive/shared';
import { useI18n } from '../../i18n/index.js';

export interface ActionPanelProps {
  phase: GamePhase;
  isMyTurn: boolean;
  eliminated: boolean;
  reserveByColor: Record<TileColor, number>;
  onReveal: (color: TileColor) => void;
  selectedTile: number | null;
  activeName: string;
  opponentName: string;
  busy: boolean;
}

/**
 * Panneau d'action : guide le joueur actif a travers les deux etapes
 * obligatoires du tour, et explique l'attente aux autres moments.
 */
export function ActionPanel({
  phase,
  isMyTurn,
  eliminated,
  reserveByColor,
  onReveal,
  selectedTile,
  activeName,
  opponentName,
  busy,
}: ActionPanelProps): JSX.Element {
  const { t, color: colorName } = useI18n();

  const waiting = (text: string): JSX.Element => (
    <div className="action-panel action-panel--waiting">
      <p className="action-panel__hint">{text}</p>
      <span className="waiting-dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
    </div>
  );

  if (phase === 'GAME_OVER') {
    return (
      <div className="action-panel action-panel--waiting">
        <p className="action-panel__hint">{t('action.gameOver')}</p>
      </div>
    );
  }

  if (eliminated && !isMyTurn) {
    return (
      <div className="action-panel action-panel--waiting">
        <p className="action-panel__hint">{t('action.eliminated', { name: activeName })}</p>
      </div>
    );
  }

  if (!isMyTurn) {
    return waiting(
      phase === 'TURN_REVEAL'
        ? t('action.waitingReveal', { name: activeName })
        : phase === 'TURN_HINT'
          ? t('action.waitingHint', { name: activeName })
          : t('action.waitingAnswer', { name: opponentName }),
    );
  }

  if (phase === 'TURN_REVEAL') {
    return (
      <div className="action-panel">
        <p className="action-panel__step">
          <span className="badge">{t('action.step1')}</span> {t('action.step1Title')}
        </p>
        <p className="action-panel__hint">{t('action.step1Hint')}</p>
        <div className="action-panel__colors">
          {COLOR_ORDER.map((color) => {
            const left = reserveByColor[color];
            return (
              <button
                key={color}
                type="button"
                className="color-button"
                data-color={color}
                data-testid={`reveal-${color}`}
                disabled={left === 0 || busy}
                onClick={() => {
                  onReveal(color);
                }}
                aria-label={t('action.revealColor', { color: colorName(color), count: left })}
              >
                <span className="color-button__label">{colorName(color)}</span>
                <span className="color-button__count">{left}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (phase === 'TURN_HINT') {
    return (
      <div className="action-panel">
        <p className="action-panel__step">
          <span className="badge">{t('action.step2')}</span> {t('action.step2Title')}
        </p>
        <p className="action-panel__hint" data-testid="hint-instruction">
          {selectedTile === null
            ? t('action.step2Hint')
            : t('action.step2Selected', { tile: selectedTile })}
        </p>
      </div>
    );
  }

  return waiting(
    `${opponentName} ${
      phase === 'WAITING_FOR_CLASSIFY'
        ? t('action.waitingClassifyShort')
        : t('action.waitingAnswerShort')
    }…`,
  );
}
