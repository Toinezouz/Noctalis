import { getTileByNumber } from '@umbrastra/shared';
import { useI18n } from '../../i18n/index.js';

export interface DeductionCellProps {
  /** The only data needed: the number. Constellation and brightness come
   * from the shared source of truth (nothing hard-coded here). */
  number: number;
  crossed: boolean;
  onToggle: (n: number) => void;
  /** Is this star already visible in the middle of the table? */
  revealed?: boolean;
  /** Is this star on someone else's rack (so it cannot be mine)? */
  held?: boolean;
}

/**
 * One cell of the chart: tinted background, large number, brightness below
 * it and, when crossed out, a deliberately uneven felt-pen cross.
 */
export function DeductionCell({
  number,
  crossed,
  onToggle,
  revealed = false,
  held = false,
}: DeductionCellProps): JSX.Element {
  const { t, color: colorName, points: pointsLabel } = useI18n();
  const tile = getTileByNumber(number);
  // Deterministic unevenness: each cell has "its" cross, stable across
  // renders, but no two neighbours look the same.
  const wobble = ((number * 37) % 9) - 4;
  const drift = ((number * 53) % 7) - 3;

  return (
    <button
      type="button"
      className={['sheet-cell', crossed ? 'is-crossed' : '', revealed ? 'is-revealed' : '', held ? 'is-held' : '']
        .filter(Boolean)
        .join(' ')}
      data-color={tile.color}
      data-number={number}
      data-testid={`sheet-cell-${String(number)}`}
      aria-pressed={crossed}
      onClick={() => {
        onToggle(number);
      }}
      aria-label={[
        t('sheet.cellLabel', {
          number,
          color: colorName(tile.color),
          points: pointsLabel(tile.points),
          state: crossed ? t('sheet.cellCrossed') : t('sheet.cellAvailable'),
        }),
        revealed ? t('sheet.cellRevealed') : null,
        held ? t('sheet.cellHeld') : null,
      ]
        .filter(Boolean)
        .join(', ')}
    >
      <span className="sheet-cell__number">{number}</span>
      <span className="sheet-cell__points" aria-hidden="true">
        {Array.from({ length: tile.points }, (_, i) => (
          <span key={i} className="sheet-cell__dot" />
        ))}
      </span>
      {revealed ? (
        <span className="sheet-cell__revealed" aria-hidden="true" title={t('sheet.cellRevealed')} />
      ) : null}
      {held ? (
        <span className="sheet-cell__held" aria-hidden="true" title={t('sheet.cellHeld')} />
      ) : null}
      {crossed ? (
        <svg
          className="sheet-cell__cross"
          viewBox="0 0 40 40"
          aria-hidden="true"
          style={{ transform: `rotate(${String(wobble)}deg)` }}
        >
          <path
            d={`M6 ${String(7 + drift)} C 14 14, 26 24, ${String(34 + drift / 2)} 33`}
            className="sheet-cell__stroke"
          />
          <path
            d={`M${String(34 - drift)} 6 C 26 15, 15 25, 7 ${String(33 + drift / 2)}`}
            className="sheet-cell__stroke sheet-cell__stroke--second"
          />
        </svg>
      ) : null}
    </button>
  );
}
