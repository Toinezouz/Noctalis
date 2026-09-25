import { MIN_PLAYERS, getTileByNumber, type PublicGameState } from '@umbrastra/shared';
import { useI18n } from '../../i18n/index.js';
import { Button } from '../../components/ui/Button.js';
import { Tile } from '../../components/game/Tile.js';
import { Celebration } from './Celebration.js';

export interface GameOverScreenProps {
  state: PublicGameState;
  myId: string;
  onRematch: () => void;
  onHome: () => void;
  rematchReady: string[];
  /** Ids of the players still in the room. */
  seated: string[];
}

/** End screen: the result, everybody's five stars, and another round. */
export function GameOverScreen({
  state,
  myId,
  onRematch,
  onHome,
  rematchReady,
  seated,
}: GameOverScreenProps): JSX.Element {
  const { t } = useI18n();
  const winner = state.players.find((p) => p.id === state.winnerId) ?? null;
  const iWon = state.winnerId === myId;
  const iAskedRematch = rematchReady.includes(myId);
  const readyCount = rematchReady.filter((id) => seated.includes(id)).length;
  const enoughPlayers = seated.length >= MIN_PLAYERS;
  const othersWaiting = readyCount > 0 && !iAskedRematch;
  const winnerStars = winner ? (state.finalReveal?.[winner.id] ?? []) : [];
  const resultText = winner
    ? iWon
      ? t('over.winnerYou', { name: winner.name })
      : t('over.winnerOther', { name: winner.name })
    : t('over.draw');

  return (
    <div className={`game-over ${winner ? 'has-winner' : 'no-winner'}`} data-testid="game-over">
      <Celebration
        stars={winnerStars}
        title={winner ? t('header.announce') : t('over.drawTitle')}
      />

      <div className="game-over__card panel">
        <p className="game-over__result" data-testid="game-over-result">
          {resultText}
        </p>

        <div className="game-over__reveal">
          {state.order
            .map((id) => state.players.find((p) => p.id === id))
            .map((player) => {
              if (!player) {
                return null;
              }
              const tiles = state.finalReveal?.[player.id] ?? [];
              return (
                <div
                  className={`game-over__player ${player.id === state.winnerId ? 'is-winner' : ''}`.trim()}
                  key={player.id}
                >
                  <h3>
                    {player.name}
                    {player.id === myId ? <span className="muted"> {t('common.you')}</span> : null}
                    {player.left ? (
                      <span className="badge badge--muted">{t('status.left')}</span>
                    ) : player.eliminated ? (
                      <span className="badge badge--danger">{t('status.eliminated')}</span>
                    ) : null}
                  </h3>
                  <div className="game-over__tiles">
                    {tiles.map((tile) => (
                      <Tile key={tile.id} tile={getTileByNumber(tile.number)} size="sm" animate />
                    ))}
                  </div>
                </div>
              );
            })}
        </div>

        {state.guesses.length > 0 ? (
          <ul className="game-over__guesses">
            {state.guesses.map((guess, index) => {
              const player = state.players.find((p) => p.id === guess.playerId);
              return (
                <li key={`${guess.playerId}-${String(index)}`}>
                  {t(guess.correct ? 'over.guessLineOk' : 'over.guessLineKo', {
                    name: player?.name ?? '',
                    numbers: guess.numbers.join(' · '),
                  })}
                </li>
              );
            })}
          </ul>
        ) : null}

        <div className="game-over__actions">
          <Button
            variant="primary"
            size="lg"
            onClick={onRematch}
            disabled={iAskedRematch || !enoughPlayers}
            data-testid="rematch"
          >
            {iAskedRematch ? t('over.waitingReplay') : t('over.replay')}
          </Button>
          <Button variant="secondary" size="lg" onClick={onHome} data-testid="back-home">
            {t('over.home')}
          </Button>
        </div>
        {enoughPlayers && (othersWaiting || iAskedRematch) ? (
          <p className="center game-over__rematch" data-testid="rematch-count">
            {t('over.replayCount', { ready: readyCount, total: seated.length })}
          </p>
        ) : null}
        {!enoughPlayers ? <p className="center muted">{t('over.everyoneLeft')}</p> : null}
      </div>
    </div>
  );
}
