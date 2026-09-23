import { MIN_PLAYERS, getTileByNumber, type PublicGameState } from '@umbrastra/shared';
import { useI18n } from '../../i18n/index.js';
import { Button } from '../../components/ui/Button.js';
import { Tile } from '../../components/game/Tile.js';
import { BrandMark } from '../../components/ui/BrandMark.js';

export interface GameOverScreenProps {
  state: PublicGameState;
  myId: string;
  onRematch: () => void;
  onHome: () => void;
  rematchReady: string[];
  /** Ids of the players still in the room. */
  seated: string[];
}

/** Soft colours of the celebration sparks, one per constellation. */
const SPARK_COLORS = ['green', 'pink', 'blue', 'red', 'orange'] as const;

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

  return (
    <div className="game-over" data-testid="game-over">
      {iWon ? (
        <div className="game-over__sparks" aria-hidden="true">
          {Array.from({ length: 28 }, (_, i) => (
            <span
              key={i}
              data-color={SPARK_COLORS[i % SPARK_COLORS.length]}
              style={{
                left: `${String((i * 37) % 100)}%`,
                top: `${String((i * 53) % 90)}%`,
                animationDelay: `${String((i % 7) * 0.22)}s`,
              }}
            />
          ))}
        </div>
      ) : null}

      <div className="game-over__card panel">
        <BrandMark size="xl" as="p" className="game-over__title" />
        <p className="game-over__result" data-testid="game-over-result">
          {winner
            ? iWon
              ? t('over.winnerYou', { name: winner.name })
              : t('over.winnerOther', { name: winner.name })
            : t('over.draw')}
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
