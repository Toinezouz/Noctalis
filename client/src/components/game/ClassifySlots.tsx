import { getTileByNumber, type ClassifyResult } from '@gotfive/shared';
import { useI18n } from '../../i18n/index.js';
import { TileStack } from './TileStack.js';
import { Tile } from './Tile.js';

export interface ClassifySlotProps {
  slot: number;
  results: ClassifyResult[];
  ownerName: string;
}

/** Une des 6 encoches du support : elle accueille les tuiles classees. */
export function ClassifySlot({ slot, results, ownerName }: ClassifySlotProps): JSX.Element {
  const { t, slot: slotLabel } = useI18n();
  const tiles = results.map((r) => getTileByNumber(r.tileNumber));
  const label =
    tiles.length === 0
      ? t('rack.slotEmpty', { slot: slotLabel(slot), name: ownerName })
      : t('rack.slotFilled', {
          slot: slotLabel(slot),
          name: ownerName,
          count: tiles.length,
          tiles: tiles.map((tile) => tile.number).join(', '),
        });

  return (
    <div
      className={`classify-slot ${tiles.length > 0 ? 'classify-slot--filled' : ''}`}
      data-slot={slot}
      role="group"
      aria-label={label}
    >
      <span className="classify-slot__notch" aria-hidden="true" />
      <TileStack tiles={tiles} size="xs" />
    </div>
  );
}

export interface ClassifySlotPickerProps {
  /** Les 5 numeros secrets du demandeur, visibles par le repondeur. */
  secretNumbers: number[];
  /** Tuile a classer. */
  tileNumber: number;
  value: number | null;
  onChange: (slot: number) => void;
  disabled?: boolean;
}

/**
 * Selecteur des 6 positions, utilise par l'adversaire pour repondre a CLASSER.
 * Il voit les vrais numeros : il lui suffit de designer l'encoche.
 */
export function ClassifySlotPicker({
  secretNumbers,
  tileNumber,
  value,
  onChange,
  disabled = false,
}: ClassifySlotPickerProps): JSX.Element {
  const { t, slot: slotLabel } = useI18n();
  const tile = getTileByNumber(tileNumber);

  const slotButton = (index: number): JSX.Element => (
    <button
      type="button"
      role="radio"
      aria-checked={value === index}
      className={`slot-picker__slot ${value === index ? 'is-selected' : ''}`}
      onClick={() => {
        onChange(index);
      }}
      disabled={disabled}
      aria-label={t('classify.slotAria', { slot: slotLabel(index), tile: tileNumber })}
    >
      {value === index ? <Tile tile={tile} size="xs" /> : <span aria-hidden="true">+</span>}
    </button>
  );

  return (
    <div className="slot-picker" role="radiogroup" aria-label={t('classify.pickerLabel')}>
      {secretNumbers.map((secret, index) => (
        <div className="slot-picker__cell" key={`group-${String(index)}`}>
          {slotButton(index)}
          <Tile
            tile={getTileByNumber(secret)}
            size="sm"
            labelSuffix={t('tile.positionOf', { position: index + 1, name: '' }).trim()}
          />
        </div>
      ))}
      <div className="slot-picker__cell">{slotButton(secretNumbers.length)}</div>
    </div>
  );
}
