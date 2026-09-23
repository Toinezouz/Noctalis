import type { PublicPlayer } from '@umbrastra/shared';
import { useI18n } from '../../i18n/index.js';

export interface PlayerStatusProps {
  player: PublicPlayer;
  isMe: boolean;
  isActive: boolean;
}

/** Identity pill: name, connection, call made, out of the race. */
export function PlayerStatus({ player, isMe, isActive }: PlayerStatusProps): JSX.Element {
  const { t } = useI18n();

  return (
    <div className={`player-status ${isActive ? 'is-active' : ''} ${player.left ? 'is-left' : ''}`.trim()}>
      <span className="player-status__avatar" aria-hidden="true">
        {player.name.slice(0, 1).toUpperCase()}
      </span>
      <span className="player-status__body">
        <span className="player-status__name">
          {player.name}
          {isMe ? <span className="player-status__me"> {t('common.you')}</span> : null}
        </span>
        <span className="player-status__tags">
          {player.left ? (
            <span className="badge badge--muted">{t('status.left')}</span>
          ) : (
            <>
              <span
                className={`player-status__dot ${player.connected ? 'is-online' : 'is-offline'}`}
                aria-hidden="true"
              />
              <span className="player-status__net">
                {player.connected ? t('common.online') : t('common.offline')}
              </span>
            </>
          )}
          {player.eliminated && !player.left ? (
            <span className="badge badge--danger">{t('status.eliminated')}</span>
          ) : null}
          {player.guessUsed && !player.eliminated ? (
            <span className="badge badge--gold">{t('status.announceUsed')}</span>
          ) : null}
        </span>
      </span>
    </div>
  );
}
