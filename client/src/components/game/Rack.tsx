import {
  CLASSIFY_SLOT_COUNT,
  getTileByNumber,
  type ClassifyResult,
  type CompareResult,
  type Tile as TileData,
  type TileColor,
} from '@gotfive/shared';
import { useI18n } from '../../i18n/index.js';
import { ClassifySlot } from './ClassifySlots.js';
import { CompareArea } from './CompareArea.js';
import { Tile } from './Tile.js';
import { TileBack } from './TileBack.js';

export interface RackProps {
  ownerName: string;
  /** Couleurs des 5 tuiles, dans l'ordre des positions (donnee publique). */
  colors: TileColor[];
  /**
   * Faces visibles des 5 tuiles. Fournies pour l'adversaire (que je vois) ou
   * a la revelation finale. `null` pour mes propres tuiles pendant la partie.
   */
  faces: TileData[] | null;
  classifications: ClassifyResult[];
  comparisons: CompareResult[];
  /** Position selectionnee (choix d'une position pour COMPARER). */
  selectedPosition?: number | null;
  onSelectPosition?: (position: number) => void;
  compact?: boolean;
}

/**
 * Support de jeu : 5 tuiles encadrees par les 6 encoches de CLASSER, avec la
 * fleche de l'ordre croissant et, sous chaque tuile, les tuiles COMPAREES.
 */
export function Rack({
  ownerName,
  colors,
  faces,
  classifications,
  comparisons,
  selectedPosition = null,
  onSelectPosition,
  compact = false,
}: RackProps): JSX.Element {
  const { t } = useI18n();
  const slots = Array.from({ length: CLASSIFY_SLOT_COUNT }, (_, slot) =>
    classifications.filter((c) => c.slot === slot),
  );

  return (
    <div className={`rack ${compact ? 'rack--compact' : ''}`.trim()}>
      <div className="rack__board">
        <div className="rack__track">
          {colors.map((color, position) => (
            <div className="rack__cell" key={`cell-${String(position)}`}>
              <ClassifySlot slot={position} results={slots[position] ?? []} ownerName={ownerName} />
              <div className="rack__column">
                {faces && faces[position] ? (
                  <Tile
                    tile={faces[position]}
                    size={compact ? 'sm' : 'md'}
                    selected={selectedPosition === position}
                    onClick={onSelectPosition ? () => { onSelectPosition(position); } : undefined}
                    labelSuffix={t('tile.positionOf', {
                      position: position + 1,
                      name: ownerName,
                    })}
                  />
                ) : (
                  <TileBack
                    color={color}
                    position={position}
                    size={compact ? 'sm' : 'md'}
                    highlighted={selectedPosition === position}
                    onClick={onSelectPosition ? () => { onSelectPosition(position); } : undefined}
                  />
                )}
                <CompareArea
                  position={position}
                  ownerName={ownerName}
                  results={comparisons.filter((c) => c.position === position)}
                />
              </div>
            </div>
          ))}
          <div className="rack__cell rack__cell--last">
            <ClassifySlot
              slot={CLASSIFY_SLOT_COUNT - 1}
              results={slots[CLASSIFY_SLOT_COUNT - 1] ?? []}
              ownerName={ownerName}
            />
          </div>
        </div>
        <div className="rack__arrow" aria-hidden="true">
          <span>{t('rack.small')}</span>
          <span className="rack__arrow-line" />
          <span>{t('rack.big')}</span>
        </div>
      </div>
    </div>
  );
}

/** Convertit une liste de numeros en tuiles completes. */
export function facesFromNumbers(numbers: number[] | undefined | null): TileData[] | null {
  return numbers ? numbers.map((n) => getTileByNumber(n)) : null;
}
