import { getTileByNumber, type PublicGameState } from '@noctalis/shared';
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
  opponentPresent: boolean;
}

/** Ecran de fin : vainqueur, revelation des 10 etoiles secretes, rejouer. */
export function GameOverScreen({
  state,
  myId,
  onRematch,
  onHome,
  rematchReady,
  opponentPresent,
}: GameOverScreenProps): JSX.Element {
  const { t } = useI18n();
  const winner = state.players.find((p) => p.id === state.winnerId) ?? null;
  const iWon = state.winnerId === myId;
  const iAskedRematch = rematchReady.includes(myId);
  const opponentAskedRematch = rematchReady.some((id) => id !== myId);

  return (
    <div className="game-over" data-testid="game-over">
      {iWon ? (
        <div className="game-over__confetti" aria-hidden="true">
          {Array.from({ length: 24 }, (_, i) => (
            <span
              key={i}
              style={{
                left: `${String((i * 4.1) % 100)}%`,
                animationDelay: `${String((i % 8) * 0.18)}s`,
                background: ['#2FB061', '#F05A9C', '#2AA7E0', '#E8453C', '#F79020', '#FFC93C'][
                  i % 6
                ],
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
          {state.players.map((player) => {
            const tiles = state.finalReveal?.[player.id] ?? [];
            return (
              <div className="game-over__player" key={player.id}>
                <h3>
                  {player.name}
                  {player.id === myId ? ` ${t('common.you')}` : ''}
                  {player.eliminated ? (
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
                  {t('over.guessLine', {
                    name: player?.name ?? '',
                    numbers: guess.numbers.join(' - '),
                  })}{' '}
                  {guess.correct ? `✅ ${t('over.guessOk')}` : `❌ ${t('over.guessKo')}`}
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
            disabled={iAskedRematch || !opponentPresent}
            data-testid="rematch"
          >
            {iAskedRematch ? t('over.waitingReplay') : t('over.replay')}
          </Button>
          <Button variant="secondary" size="lg" onClick={onHome} data-testid="back-home">
            {t('over.home')}
          </Button>
        </div>
        {opponentAskedRematch && !iAskedRematch ? (
          <p className="center" style={{ fontWeight: 800 }}>
            {t('over.opponentWantsReplay')}
          </p>
        ) : null}
        {!opponentPresent ? (
          <p className="center muted">{t('over.opponentLeft')}</p>
        ) : null}
      </div>
    </div>
  );
}
