import { getTileByNumber } from '@gotfive/shared';
import { useI18n } from '../../i18n/index.js';

export interface DeductionCellProps {
  /** Seule donnee necessaire : le numero. Couleur et points viennent de la
   * source de verite partagee (aucune valeur codee en dur ici). */
  number: number;
  crossed: boolean;
  onToggle: (n: number) => void;
  /** La tuile est-elle deja visible au centre de la table ? */
  revealed?: boolean;
}

/**
 * Une case de la fiche : fond colore, gros numero, points sous le numero,
 * et, si elle est barree, une croix au feutre volontairement irreguliere.
 */
export function DeductionCell({
  number,
  crossed,
  onToggle,
  revealed = false,
}: DeductionCellProps): JSX.Element {
  const { t, color: colorName, points: pointsLabel } = useI18n();
  const tile = getTileByNumber(number);
  // Irregularite deterministe : chaque case a "sa" croix, stable d'un rendu
  // a l'autre, mais aucune n'est identique a sa voisine.
  const wobble = ((number * 37) % 9) - 4;
  const drift = ((number * 53) % 7) - 3;

  return (
    <button
      type="button"
      className={`sheet-cell ${crossed ? 'is-crossed' : ''} ${revealed ? 'is-revealed' : ''}`.trim()}
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
