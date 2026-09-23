import { useState } from 'react';
import { MAX_PLAYERS, MIN_PLAYERS, type RoomState } from '@noctalis/shared';
import { useI18n } from '../../i18n/index.js';
import { Button } from '../../components/ui/Button.js';
import { Panel } from '../../components/ui/Panel.js';
import { BrandMark } from '../../components/ui/BrandMark.js';
import { buildInviteLink } from '../../lib/invite.js';
import { canShareNatively, copyText } from '../../lib/clipboard.js';

export interface RoomLobbyProps {
  room: RoomState;
  myId: string;
  onStart: () => void;
  onLeave: () => void;
  busy?: boolean;
}

type CopyFeedback = 'idle' | 'link' | 'code' | 'failed';

/** Waiting room: the link to share, who is here, and the start button. */
export function RoomLobby({ room, myId, onStart, onLeave, busy = false }: RoomLobbyProps): JSX.Element {
  const { t, lang } = useI18n();
  const [feedback, setFeedback] = useState<CopyFeedback>('idle');
  const me = room.players.find((p) => p.id === myId);
  const isHost = me?.isHost ?? false;
  const count = room.players.length;
  const hostName = room.players.find((p) => p.isHost)?.name ?? '';

  const inviteLink = buildInviteLink(window.location.origin, room.code, lang);
  const nativeShare = canShareNatively();

  const flash = (value: CopyFeedback): void => {
    setFeedback(value);
    if (value !== 'failed') {
      window.setTimeout(() => {
        setFeedback('idle');
      }, 2500);
    }
  };

  const copy = async (what: 'link' | 'code'): Promise<void> => {
    const done = await copyText(what === 'link' ? inviteLink : room.code);
    flash(done ? what : 'failed');
  };

  const shareLink = async (): Promise<void> => {
    if (!nativeShare) {
      await copy('link');
      return;
    }
    try {
      await navigator.share({
        title: 'NOCTALIS',
        text: t('lobby.shareText', { code: room.code }),
        url: inviteLink,
      });
    } catch {
      // Closing the share sheet is not an error worth showing.
    }
  };

  return (
    <div className="lobby">
      <BrandMark size="xl" as="h1" className="center" />

      <Panel className="lobby__card">
        <p className="lobby__share">{t('lobby.share', { max: MAX_PLAYERS - 1 })}</p>
        <div className="lobby__invite">
          <input
            className="lobby__link"
            type="text"
            readOnly
            value={inviteLink}
            aria-label={t('lobby.inviteLabel')}
            data-testid="invite-link"
            onFocus={(event) => {
              event.currentTarget.select();
            }}
          />
          <Button variant="primary" onClick={() => void shareLink()} data-testid="copy-link">
            {feedback === 'link'
              ? t('lobby.linkCopied')
              : nativeShare
                ? t('lobby.shareLink')
                : t('lobby.copyLink')}
          </Button>
        </div>
        <p className="lobby__feedback" role="status" data-testid="copy-feedback">
          {feedback === 'failed' ? t('lobby.copyFailed') : ''}
        </p>

        <p className="lobby__or">{t('lobby.orCode')}</p>
        <div className="lobby__code-row">
          <div className="lobby__code" data-testid="room-code">
            {room.code.split('').map((char, index) => (
              <span className="lobby__char" key={`${char}-${String(index)}`}>
                {char}
              </span>
            ))}
          </div>
          <Button variant="secondary" size="sm" onClick={() => void copy('code')} data-testid="copy-code">
            {feedback === 'code' ? t('lobby.copied') : t('lobby.copy')}
          </Button>
        </div>

        <div className="lobby__players" data-count={count}>
          {Array.from({ length: MAX_PLAYERS }, (_, index) => {
            const player = room.players[index];
            return (
              <div
                className={`lobby__player ${player ? 'is-ready' : 'is-waiting'}`}
                key={index}
                data-testid={`lobby-player-${String(index)}`}
              >
                <span className="lobby__avatar" aria-hidden="true">
                  {player ? player.name.slice(0, 1).toUpperCase() : '✦'}
                </span>
                <span className="lobby__who">
                  <strong>{player ? player.name : t('lobby.freeSeat')}</strong>
                  <span className="muted">
                    {player
                      ? [
                          player.id === myId ? t('common.you') : null,
                          player.isHost ? t('lobby.host') : null,
                          player.connected ? null : t('common.offline'),
                        ]
                          .filter(Boolean)
                          .join(' · ')
                      : index < MIN_PLAYERS
                        ? t('lobby.neededSeat')
                        : t('lobby.optionalSeat')}
                  </span>
                </span>
              </div>
            );
          })}
        </div>

        <div className="lobby__actions">
          {isHost ? (
            <Button
              size="lg"
              variant="primary"
              disabled={!room.canStart || busy}
              onClick={onStart}
              data-testid="start-game"
            >
              {room.canStart ? t('lobby.start', { count }) : t('lobby.waitingSecond')}
            </Button>
          ) : (
            <p className="center lobby__wait" data-testid="waiting-host">
              {room.canStart ? t('lobby.waitingHost', { name: hostName }) : t('lobby.waitingSecond')}
            </p>
          )}
          {room.canStart && count < MAX_PLAYERS ? (
            <p className="center muted lobby__more">{t('lobby.roomForMore', { count: MAX_PLAYERS - count })}</p>
          ) : null}
          <Button variant="secondary" onClick={onLeave} data-testid="leave-room">
            {t('lobby.leave')}
          </Button>
        </div>
      </Panel>
    </div>
  );
}
