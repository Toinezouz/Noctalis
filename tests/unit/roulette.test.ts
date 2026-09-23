import { describe, expect, it } from 'vitest';
import {
  sectorAtPointer,
  sectorCenter,
  sectorSize,
  spinAngle,
} from '../../client/src/lib/roulette.js';

describe('geometry of the wheel', () => {
  it('cuts the disc into equal sectors', () => {
    expect(sectorSize(2)).toBe(180);
    expect(sectorSize(4)).toBe(90);
    expect(() => sectorSize(0)).toThrow(RangeError);
  });

  it('puts the centre of each sector at the right angle', () => {
    expect(sectorCenter(0, 2)).toBe(90);
    expect(sectorCenter(1, 2)).toBe(270);
    expect(sectorCenter(0, 4)).toBe(45);
    expect(sectorCenter(3, 4)).toBe(315);
  });

  it('always brings the target sector under the pointer', () => {
    for (let count = 2; count <= 6; count += 1) {
      for (let index = 0; index < count; index += 1) {
        for (const offset of [-1, -0.7, -0.25, 0, 0.25, 0.7, 1]) {
          const rotation = spinAngle(index, count, 5, offset);
          expect(
            sectorAtPointer(rotation, count),
            `secteur ${String(index)} sur ${String(count)}, decalage ${String(offset)}`,
          ).toBe(index);
        }
      }
    }
  });

  it('spins forward: several full turns, never backwards', () => {
    for (let index = 0; index < 2; index += 1) {
      const rotation = spinAngle(index, 2, 5);
      expect(rotation).toBeGreaterThan(4 * 360);
      expect(rotation).toBeLessThan(5 * 360);
    }
  });

  it('keeps the offset inside the sector: never on an edge', () => {
    // An absurd offset is brought back within bounds, and stays inside.
    const rotation = spinAngle(0, 2, 5, 12);
    expect(sectorAtPointer(rotation, 2)).toBe(0);
    const angle = ((-rotation % 360) + 360) % 360;
    expect(angle).toBeGreaterThan(5);
    expect(angle).toBeLessThan(175);
  });

  it('refuses a spin without a full turn', () => {
    expect(() => spinAngle(0, 2, 0)).toThrow(RangeError);
  });
});
