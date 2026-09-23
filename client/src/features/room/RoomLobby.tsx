import { useState } from 'react';
import type { RoomState } from '@noctalis/shared';
import { useI18n } from '../../i18n/index.js';
import { Button } from '../../components/ui/Button.js';
import { Panel } from '../../components/ui/Panel.js';
import { BrandMark } from '../../components/ui/BrandMark.js';

export interface RoomLobbyProps {
  room: RoomState;
  myId: string;
  onStart: () => void;
  onLeave: () => void;
  busy?: boolean;
}

/** Salon d'attente : code a partager, joueurs presents, lancement de la partie. */
export function RoomLobby({ room, myId, onStart, onLeave, busy = false }: RoomLobbyProps): JSX.Element {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const me = room.players.find((p) => p.id === myId);
  const isHost = me?.isHost ?? false;

  const copy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(room.code);
      setCopied(true);
      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="lobby">
      <BrandMark size="xl" as="h1" className="center" />

      <Panel className="lobby__card">
        <p className="center" style={{ fontWeight: 800 }}>
          {t('lobby.share')}
        </p>
        <div className="lobby__code" data-testid="room-code">
          {room.code.split('').map((char, index) => (
            <span className="lobby__char" key={`${char}-${String(index)}`}>
              {char}
            </span>
          ))}
        </div>
        <div className="row" style={{ justifyContent: 'center' }}>
          <Button variant="secondary" onClick={() => void copy()} data-testid="copy-code">
            {copied ? t('lobby.copied') : t('lobby.copy')}
          </Button>
        </div>

        <div className="lobby__players">
          {[0, 1].map((index) => {
            const player = room.players[index];
            return (
              <div
                className={`lobby__player ${player ? 'is-ready' : 'is-waiting'}`}
                key={index}
                data-testid={`lobby-player-${String(index)}`}
              >
                <span className="lobby__avatar" aria-hidden="true">
                  {player ? player.name.slice(0, 1).toUpperCase() : '?'}
                </span>
                <span>
                  <strong>{player ? player.name : t('lobby.waitingPlayer')}</strong>
                  <br />
                  <span className="muted" style={{ fontSize: 'var(--fs-sm)' }}>
                    {player
                      ? `${player.isHost ? t('lobby.host') : t('lobby.guest')} — ${
                          player.connected ? t('common.online') : t('common.offline')
                        }`
                      : t('lobby.waitingHint')}
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
              {room.canStart ? t('lobby.start') : t('lobby.waitingSecond')}
            </Button>
          ) : (
            <p className="center" data-testid="waiting-host">
              {room.canStart ? t('lobby.waitingHost') : t('lobby.waitingSecond')}
            </p>
          )}
          <Button variant="secondary" onClick={onLeave} data-testid="leave-room">
            {t('lobby.leave')}
          </Button>
        </div>
      </Panel>
    </div>
  );
}
