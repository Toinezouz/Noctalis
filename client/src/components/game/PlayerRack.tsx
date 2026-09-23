import type { ClassifyResult, CompareResult, Tile as TileData, TileColor } from '@noctalis/shared';
import { Paravent } from './Paravent.js';
import { Rack } from './Rack.js';

export interface PlayerRackProps {
  name: string;
  colors: TileColor[];
  /** Only filled in at the end of the game (final reveal). */
  revealedFaces?: TileData[] | null;
  classifications: ClassifyResult[];
  comparisons: CompareResult[];
  selectedPosition?: number | null;
  onSelectPosition?: (position: number) => void;
  connected?: boolean;
  active?: boolean;
  answering?: boolean;
  out?: boolean;
}

/**
 * My rack: my five stars stay eclipsed (their numbers do not exist on this
 * side), surrounded by the six gaps and by the stars that were gauged.
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
  active = false,
  answering = false,
  out = false,
}: PlayerRackProps): JSX.Element {
  return (
    <div className={`player-zone player-zone--mine ${active ? 'is-active' : ''}`.trim()}>
      <Rack
        ownerName={name}
        colors={colors}
        faces={revealedFaces}
        classifications={classifications}
        comparisons={comparisons}
        selectedPosition={selectedPosition ?? null}
        onSelectPosition={onSelectPosition}
      />
      <Paravent
        name={name}
        side="mine"
        connected={connected}
        active={active}
        answering={answering}
        out={out}
      />
    </div>
  );
}
