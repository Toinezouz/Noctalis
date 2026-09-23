import type { ClassifyResult, CompareResult, Tile as TileData, TileColor } from '@gotfive/shared';
import { Paravent } from './Paravent.js';
import { Rack } from './Rack.js';

export interface OpponentRackProps {
  name: string;
  colors: TileColor[];
  /** Les tuiles de l'adversaire : je vois leurs numeros. */
  faces: TileData[] | null;
  classifications: ClassifyResult[];
  comparisons: CompareResult[];
  connected?: boolean;
}

/** Le support d'en face : ses tuiles sont visibles, les miennes ne le sont pas. */
export function OpponentRack({
  name,
  colors,
  faces,
  classifications,
  comparisons,
  connected = true,
}: OpponentRackProps): JSX.Element {
  return (
    <div className="player-zone player-zone--opponent">
      <Paravent name={name} side="opponent" connected={connected} />
      <Rack
        ownerName={name}
        colors={colors}
        faces={faces}
        classifications={classifications}
        comparisons={comparisons}
        compact
      />
    </div>
  );
}
