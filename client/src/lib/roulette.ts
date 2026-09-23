/**
 * Geometry of the opening wheel.
 *
 * The wheel is cut into equal sectors, the first one starting at the top
 * (noon) and going clockwise — exactly the `conic-gradient` convention in
 * CSS. The pointer is fixed at noon (0 degrees).
 *
 * None of these functions picks anyone: the server has already drawn the
 * starting player; this only computes the rotation that brings them under
 * the pointer.
 */

/** Size of a sector, in degrees. */
export function sectorSize(count: number): number {
  if (count < 1) {
    throw new RangeError('sectorSize: at least one sector is needed');
  }
  return 360 / count;
}

/** Angle of the centre of sector `index`, in degrees. */
export function sectorCenter(index: number, count: number): number {
  return index * sectorSize(count) + sectorSize(count) / 2;
}

/**
 * Final rotation (in degrees, always positive) bringing sector `index` under
 * the pointer.
 *
 * @param turns  full turns before stopping (>= 1).
 * @param offset offset inside the sector, from -1 (left edge) to 1 (right
 *               edge): the wheel does not always stop dead centre.
 */
export function spinAngle(index: number, count: number, turns: number, offset = 0): number {
  if (turns < 1) {
    throw new RangeError('spinAngle: at least one full turn is needed');
  }
  const clamped = Math.max(-1, Math.min(1, offset));
  // 0.4: well inside the sector, never on an edge.
  const target = sectorCenter(index, count) + clamped * sectorSize(count) * 0.4;
  return turns * 360 - target;
}

/** Sector under the pointer after a given rotation. */
export function sectorAtPointer(rotation: number, count: number): number {
  const size = sectorSize(count);
  // The wheel turned by `rotation`: the part of the wheel under the pointer
  // is the one that used to sit at angle `-rotation`.
  const angle = (((-rotation % 360) + 360) % 360) % 360;
  return Math.min(count - 1, Math.floor(angle / size));
}
