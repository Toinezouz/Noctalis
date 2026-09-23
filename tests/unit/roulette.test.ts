import { describe, expect, it } from 'vitest';
import {
  sectorAtPointer,
  sectorCenter,
  sectorSize,
  spinAngle,
} from '../../client/src/lib/roulette.js';

describe('geometrie de la roulette', () => {
  it('decoupe le disque en secteurs egaux', () => {
    expect(sectorSize(2)).toBe(180);
    expect(sectorSize(4)).toBe(90);
    expect(() => sectorSize(0)).toThrow(RangeError);
  });

  it('place le centre de chaque secteur au bon angle', () => {
    expect(sectorCenter(0, 2)).toBe(90);
    expect(sectorCenter(1, 2)).toBe(270);
    expect(sectorCenter(0, 4)).toBe(45);
    expect(sectorCenter(3, 4)).toBe(315);
  });

  it('amene toujours le secteur vise sous l aiguille', () => {
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

  it('tourne vers l avant : plusieurs tours complets, jamais en arriere', () => {
    for (let index = 0; index < 2; index += 1) {
      const rotation = spinAngle(index, 2, 5);
      expect(rotation).toBeGreaterThan(4 * 360);
      expect(rotation).toBeLessThan(5 * 360);
    }
  });

  it('borne le decalage au secteur : jamais sur un bord', () => {
    // Un decalage aberrant est ramene dans les limites, et reste interieur.
    const rotation = spinAngle(0, 2, 5, 12);
    expect(sectorAtPointer(rotation, 2)).toBe(0);
    const angle = ((-rotation % 360) + 360) % 360;
    expect(angle).toBeGreaterThan(5);
    expect(angle).toBeLessThan(175);
  });

  it('refuse une rotation sans tour complet', () => {
    expect(() => spinAngle(0, 2, 0)).toThrow(RangeError);
  });
});
