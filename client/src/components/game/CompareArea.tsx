import { getTileByNumber, type CompareResult } from '@noctalis/shared';
import { useI18n } from '../../i18n/index.js';
import { Tile } from './Tile.js';

export interface CompareAreaProps {
  /** Gauges made against one given secret position. */
  results: CompareResult[];
  position: number;
  ownerName: string;
}

/**
 * GAUGE area: gauged stars sit right under the position they were measured
 * against, bright for a YES, dimmed for a NO.
 */
export function CompareArea({ results, position, ownerName }: CompareAreaProps): JSX.Element | null {
  const { t } = useI18n();
  if (results.length === 0) {
    return null;
  }
  return (
    <div
      className="compare-area"
      role="group"
      aria-label={t('rack.compareGroup', { position: position + 1, name: ownerName })}
    >
      {results.map((result) => (
        <div className="compare-area__item" key={result.id}>
          <Tile
            tile={getTileByNumber(result.tileNumber)}
            size="xs"
            tilted={!result.match}
            labelSuffix={
              result.match
                ? t('rack.compareYes', { position: position + 1 })
                : t('rack.compareNo', { position: position + 1 })
            }
          />
          <span
            className={`compare-area__answer ${result.match ? 'is-yes' : 'is-no'}`}
            aria-hidden="true"
          >
            {result.match ? t('compare.yes') : t('compare.no')}
          </span>
        </div>
      ))}
    </div>
  );
}
