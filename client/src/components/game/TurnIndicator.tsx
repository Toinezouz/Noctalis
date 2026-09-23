import type { GamePhase } from '@noctalis/shared';
import { useI18n } from '../../i18n/index.js';

export interface TurnIndicatorProps {
  phase: GamePhase;
  isMyTurn: boolean;
  mustAnswer: boolean;
  activeName: string;
  opponentName: string;
  turn: number;
  eliminated: boolean;
}

/**
 * Banniere d'etat : elle explique en permanence ce que le joueur doit faire,
 * ou ce que l'on attend de l'adversaire. Aucune zone ne reste muette.
 */
export function TurnIndicator({
  phase,
  isMyTurn,
  mustAnswer,
  activeName,
  opponentName,
  turn,
  eliminated,
}: TurnIndicatorProps): JSX.Element {
  const { t } = useI18n();

  let tone: 'mine' | 'theirs' | 'answer' | 'over' = isMyTurn ? 'mine' : 'theirs';
  let title = '';
  let detail = '';

  if (phase === 'GAME_OVER') {
    tone = 'over';
    title = t('turn.gameOver');
    detail = t('turn.gameOverDetail');
  } else if (mustAnswer) {
    tone = 'answer';
    title = t('turn.mustAnswer');
    detail =
      phase === 'WAITING_FOR_CLASSIFY'
        ? t('turn.mustClassify', { name: opponentName })
        : t('turn.mustCompare', { name: opponentName });
  } else if (phase === 'WAITING_FOR_CLASSIFY') {
    title = isMyTurn ? t('turn.hintAsked') : t('turn.of', { name: activeName });
    detail = t('turn.waitingClassify', { name: opponentName });
  } else if (phase === 'WAITING_FOR_COMPARE') {
    title = isMyTurn ? t('turn.hintAsked') : t('turn.of', { name: activeName });
    detail = t('turn.waitingCompare', { name: opponentName });
  } else if (eliminated) {
    tone = 'theirs';
    title = t('turn.eliminated');
    detail = t('turn.eliminatedDetail', { name: activeName });
  } else if (isMyTurn) {
    title = t('turn.yours');
    detail = phase === 'TURN_REVEAL' ? t('turn.yoursReveal') : t('turn.yoursHint');
  } else {
    title = t('turn.of', { name: activeName });
    detail =
      phase === 'TURN_REVEAL'
        ? t('turn.othersReveal', { name: activeName })
        : t('turn.othersHint', { name: activeName });
  }

  return (
    <div className={`turn-indicator turn-indicator--${tone}`} role="status" aria-live="polite">
      <span className="turn-indicator__turn">{t('turn.counter', { turn })}</span>
      <span className="turn-indicator__text">
        <strong>{title}</strong>
        <span>{detail}</span>
      </span>
      {(phase === 'WAITING_FOR_CLASSIFY' || phase === 'WAITING_FOR_COMPARE') && !mustAnswer ? (
        <span className="waiting-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      ) : null}
    </div>
  );
}
