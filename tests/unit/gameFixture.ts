import { type GameState, type PlayerSeed, type Rng, createGame, createSeededRng } from '@noctalis/shared';

/** The two players of the test scenarios: Alice hosts. */
export const PLAYER_SEEDS: PlayerSeed[] = [
  { id: 'alice', name: 'Alice', isHost: true },
  { id: 'bob', name: 'Bob', isHost: false },
];

/**
 * Deterministic game in which Alice has the lead on the first turn.
 *
 * The first player is drawn at random: seeds are tried one after the other
 * until one picks Alice. The result stays perfectly reproducible (same seed
 * => same game) and scenarios stay readable, without guessing who starts.
 */
export function gameStartedByAlice(seed = 42): { state: GameState; rng: Rng } {
  for (let candidate = seed; candidate < seed + 64; candidate += 1) {
    const rng = createSeededRng(candidate);
    const state = createGame(PLAYER_SEEDS, rng);
    if (state.activePlayerId === 'alice') {
      return { state, rng };
    }
  }
  throw new Error(`no seed from ${String(seed)} lets Alice start`);
}
