import { COLOR_ORDER, type RevealedTile, type TileColor } from '@umbrastra/shared';
import { useI18n } from '../../i18n/index.js';
import { Tile } from './Tile.js';

export interface PublicTilePoolProps {
  tiles: RevealedTile[];
  selectedNumber: number | null;
  onSelect?: (tileNumber: number) => void;
  selectable: boolean;
  reserveByColor: Record<TileColor, number>;
  /** Number of the last revealed star (highlighted). */
  lastRevealed?: number | null;
}

/** The shared sky: every revealed star not yet used for a hint. */
export function PublicTilePool({
  tiles,
  selectedNumber,
  onSelect,
  selectable,
  reserveByColor,
  lastRevealed = null,
}: PublicTilePoolProps): JSX.Element {
  const { t, color: colorName } = useI18n();
  // A star used for a hint has joined a rack: it leaves the middle. The full
  // memory stays available to the star chart.
  const available = tiles.filter((entry) => !entry.used);
  const sorted = [...available].sort((a, b) => a.tile.number - b.tile.number);
  const total = COLOR_ORDER.reduce((sum, color) => sum + reserveByColor[color], 0);

  return (
    <div className="pool">
      <div className="pool__head">
        <h2 className="panel__title" style={{ margin: 0 }}>
          {t('pool.title')}
          <span className="badge badge--muted">{available.length}</span>
        </h2>
        <div className="pool__reserve" aria-label={t('pool.reserve', { count: total })}>
          {COLOR_ORDER.map((color) => (
            <span
              key={color}
              className="pool__reserve-chip"
              data-color={color}
              title={t('pool.reserveColor', {
                count: reserveByColor[color],
                color: colorName(color),
              })}
            >
              <span className="visually-hidden">
                {t('pool.reserveColor', { count: reserveByColor[color], color: colorName(color) })}
              </span>
              <span aria-hidden="true">{reserveByColor[color]}</span>
            </span>
          ))}
        </div>
      </div>
      <div className="pool__tiles" role="list">
        {sorted.map((revealed) => (
          <div role="listitem" key={revealed.tile.id}>
            <Tile
              tile={revealed.tile}
              size="sm"
              selected={selectedNumber === revealed.tile.number}
              animate={lastRevealed === revealed.tile.number}
              onClick={
                selectable && onSelect
                  ? () => {
                      onSelect(revealed.tile.number);
                    }
                  : undefined
              }
              labelSuffix={selectable ? t('pool.selectable') : undefined}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
