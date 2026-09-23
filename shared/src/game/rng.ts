/**
 * Generateur pseudo-aleatoire injectable. Le serveur utilise `defaultRng`
 * (base sur `Math.random`), les tests utilisent `createSeededRng` pour obtenir
 * des parties parfaitement reproductibles.
 */
export type Rng = () => number;

/** RNG par defaut : `Math.random`. */
export const defaultRng: Rng = () => Math.random();

/** RNG deterministe (mulberry32). Meme graine => meme partie. */
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

/** Entier dans [0, max). */
export function randomInt(rng: Rng, max: number): number {
  return Math.floor(rng() * max);
}

/** Element aleatoire d'un tableau non vide. */
export function pickRandom<T>(rng: Rng, items: readonly T[]): T {
  if (items.length === 0) {
    throw new RangeError('pickRandom: tableau vide');
  }
  return items[randomInt(rng, items.length)]!;
}
