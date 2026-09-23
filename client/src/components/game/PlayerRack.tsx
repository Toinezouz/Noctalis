import type { ClassifyResult, CompareResult, Tile as TileData, TileColor } from '@noctalis/shared';
import { Paravent } from './Paravent.js';
import { Rack } from './Rack.js';

export interface PlayerRackProps {
  name: string;
  colors: TileColor[];
  /** Renseigne uniquement a la fin de la partie (revelation). */
  revealedFaces?: TileData[] | null;
  classifications: ClassifyResult[];
  comparisons: CompareResult[];
  selectedPosition?: number | null;
  onSelectPosition?: (position: number) => void;
  connected?: boolean;
}

/**
 * Mon support : mes 5 etoiles restent face cachee (leur numero n'existe pas
 * cote client), entourees des 6 encoches et des etoiles jaugees.
 */
export function PlayerRack({
  name,
  colors,
  revealedFaces = null,
  classifications,
  comparisons,
  selectedPosition,
  onSelectPosition,
  connected = true,
}: PlayerRackProps): JSX.Element {
  return (
    <div className="player-zone player-zone--mine">
      <Rack
        ownerName={name}
        colors={colors}
        faces={revealedFaces}
        classifications={classifications}
        comparisons={comparisons}
        selectedPosition={selectedPosition ?? null}
        onSelectPosition={onSelectPosition}
      />
      <Paravent name={name} side="mine" connected={connected} />
    </div>
  );
}
