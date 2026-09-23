import { useCallback, useEffect, useMemo, useState } from 'react';
import { SECRET_TILE_COUNT, TILE_COUNT } from '@noctalis/shared';
import {
  clearDeduction,
  deductionKey,
  loadDeduction,
  saveDeduction,
  type StoredDeduction,
} from '../../lib/storage.js';

export interface DeductionApi {
  /** Numeros barres au feutre. */
  crossed: ReadonlySet<number>;
  isCrossed: (n: number) => boolean;
  /** Premier clic : barre. Second clic : restaure. */
  toggle: (n: number) => void;
  /** Les 5 hypotheses courantes (chaines libres, saisie partielle possible). */
  guesses: string[];
  setGuess: (index: number, value: string) => void;
  /** Efface tout : numeros barres et hypotheses. */
  reset: () => void;
  crossedCount: number;
  /** Les hypotheses forment-elles une annonce valide ? */
  guessNumbers: number[] | null;
}

const EMPTY: StoredDeduction = { crossed: [], guesses: ['', '', '', '', ''] };

/**
 * Fiche de deduction : 100 % locale et privee.
 * Rien n'est envoye au serveur, rien n'est partage avec l'adversaire, et
 * aucun secret de jeu n'est stocke - uniquement le raisonnement du joueur.
 */
export function useDeductionSheet(roomCode: string | null, playerId: string | null): DeductionApi {
  const key = roomCode && playerId ? deductionKey(roomCode, playerId) : null;
  const [state, setState] = useState<StoredDeduction>(EMPTY);

  useEffect(() => {
    setState(key ? loadDeduction(key) : EMPTY);
  }, [key]);

  const persist = useCallback(
    (next: StoredDeduction) => {
      setState(next);
      if (key) {
        saveDeduction(key, next);
      }
    },
    [key],
  );

  const toggle = useCallback(
    (n: number) => {
      if (!Number.isInteger(n) || n < 1 || n > TILE_COUNT) {
        return;
      }
      const crossed = new Set(state.crossed);
      if (crossed.has(n)) {
        crossed.delete(n);
      } else {
        crossed.add(n);
      }
      persist({ ...state, crossed: [...crossed].sort((a, b) => a - b) });
    },
    [persist, state],
  );

  const setGuess = useCallback(
    (index: number, value: string) => {
      if (index < 0 || index >= SECRET_TILE_COUNT) {
        return;
      }
      const cleaned = value.replace(/\D/g, '').slice(0, 2);
      const guesses = [...state.guesses];
      guesses[index] = cleaned;
      persist({ ...state, guesses });
    },
    [persist, state],
  );

  const reset = useCallback(() => {
    persist({ crossed: [], guesses: ['', '', '', '', ''] });
    if (key) {
      clearDeduction(key);
    }
  }, [key, persist]);

  const crossedSet = useMemo(() => new Set(state.crossed), [state.crossed]);

  const guessNumbers = useMemo(() => {
    const parsed = state.guesses.map((g) => Number.parseInt(g, 10));
    if (parsed.some((n) => !Number.isInteger(n) || n < 1 || n > TILE_COUNT)) {
      return null;
    }
    return parsed;
  }, [state.guesses]);

  return {
    crossed: crossedSet,
    isCrossed: (n: number) => crossedSet.has(n),
    toggle,
    guesses: state.guesses,
    setGuess,
    reset,
    crossedCount: crossedSet.size,
    guessNumbers,
  };
}
