/**
 * Injectable pseudo-random generator. The server uses `defaultRng` (built on
 * `Math.random`); the tests use `createSeededRng` to get perfectly
 * reproducible games.
 */
export type Rng = () => number;

/** Default RNG: `Math.random`. */
export const defaultRng: Rng = () => Math.random();

/** Deterministic RNG (mulberry32). Same seed => same game. */
export function createSeededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Integer in [0, max). */
export function randomInt(rng: Rng, max: number): number {
  return Math.floor(rng() * max);
}

/** Random item of a non-empty array. */
export function pickRandom<T>(rng: Rng, items: readonly T[]): T {
  if (items.length === 0) {
    throw new RangeError('pickRandom: empty array');
  }
  return items[randomInt(rng, items.length)]!;
}
