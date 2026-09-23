import type { ClassifyResult, CompareResult, Tile as TileData, TileColor } from '@umbrastra/shared';
import { Paravent } from './Paravent.js';
import { Rack } from './Rack.js';

export interface OpponentRackProps {
  playerId: string;
  name: string;
  colors: TileColor[];
  /** Their stars: I can read their numbers. */
  faces: TileData[] | null;
  classifications: ClassifyResult[];
  comparisons: CompareResult[];
  connected?: boolean;
  active?: boolean;
  answering?: boolean;
  out?: boolean;
}

/** Someone else's rack: their stars face up, since only mine are hidden from me. */
export function OpponentRack({
  playerId,
  name,
  colors,
  faces,
  classifications,
  comparisons,
  connected = true,
  active = false,
  answering = false,
  out = false,
}: OpponentRackProps): JSX.Element {
  return (
    <div
      className={`player-zone player-zone--opponent ${active ? 'is-active' : ''}`.trim()}
      data-player-id={playerId}
    >
      <Paravent
        name={name}
        side="opponent"
        connected={connected}
        active={active}
        answering={answering}
        out={out}
      />
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
