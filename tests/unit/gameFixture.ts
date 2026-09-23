import { type GameState, type PlayerSeed, type Rng, createGame, createSeededRng } from '@noctalis/shared';

/** Les deux joueurs des scenarios de test : Alice est l'hote. */
export const PLAYER_SEEDS: PlayerSeed[] = [
  { id: 'alice', name: 'Alice', isHost: true },
  { id: 'bob', name: 'Bob', isHost: false },
];

/**
 * Partie deterministe dont Alice a la main au premier tour.
 *
 * Le premier joueur est tire au sort : on avance de graine en graine jusqu'a
 * celle qui designe Alice. Le resultat reste parfaitement reproductible (meme
 * graine => meme partie) et les scenarios restent lisibles, sans avoir a
 * deviner qui commence a chaque ligne.
 */
export function gameStartedByAlice(seed = 42): { state: GameState; rng: Rng } {
  for (let candidate = seed; candidate < seed + 64; candidate += 1) {
    const rng = createSeededRng(candidate);
    const state = createGame(PLAYER_SEEDS, rng);
    if (state.activePlayerId === 'alice') {
      return { state, rng };
    }
  }
  throw new Error(`aucune graine a partir de ${String(seed)} ne fait commencer Alice`);
}
