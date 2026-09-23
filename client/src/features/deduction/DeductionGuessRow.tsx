import { SECRET_TILE_COUNT, getTileByNumber, isValidTileNumber } from '@noctalis/shared';
import { useI18n } from '../../i18n/index.js';

export interface DeductionGuessRowProps {
  guesses: string[];
  onChange: (index: number, value: string) => void;
}

/**
 * The five guess boxes at the top of the chart, followed by the arrow of the
 * ascending order. These values stay strictly private.
 */
export function DeductionGuessRow({ guesses, onChange }: DeductionGuessRowProps): JSX.Element {
  const { t } = useI18n();
  return (
    <div className="sheet-guess">
      <div className="sheet-guess__cells">
        {Array.from({ length: SECRET_TILE_COUNT }, (_, index) => {
          const raw = guesses[index] ?? '';
          const parsed = Number.parseInt(raw, 10);
          const valid = isValidTileNumber(parsed);
          const color = valid ? getTileByNumber(parsed).color : undefined;
          return (
            <label className="sheet-guess__cell" key={index} data-color={color}>
              <span className="visually-hidden">
                {t('sheet.guessAria', { index: index + 1, count: SECRET_TILE_COUNT })}
              </span>
              <input
                className="sheet-guess__input"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={2}
                value={raw}
                placeholder="?"
                data-testid={`guess-input-${String(index)}`}
                onChange={(event) => {
                  onChange(index, event.target.value);
                }}
              />
              {valid ? (
                <span className="sheet-guess__points" aria-hidden="true">
                  {Array.from({ length: getTileByNumber(parsed).points }, (_, i) => (
                    <span key={i} className="sheet-cell__dot" />
                  ))}
                </span>
              ) : null}
            </label>
          );
        })}
      </div>
      <div className="sheet-guess__arrow" aria-hidden="true">
        <span>{t('sheet.smaller')}</span>
        <span className="sheet-guess__arrow-line" />
        <span>{t('sheet.bigger')}</span>
      </div>
    </div>
  );
}
