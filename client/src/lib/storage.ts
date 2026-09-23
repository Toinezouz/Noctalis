import type { PlayerCredentials } from '@gotfive/shared';
import { isThemePreference, type ThemePreference } from './theme.js';

/**
 * Persistance locale.
 * ATTENTION : on ne stocke jamais d'information secrete de jeu ici. Seulement
 * les identifiants de session (room, playerId, jeton) et les deductions
 * *personnelles* du joueur (numeros barres, hypotheses).
 */

const SESSION_KEY = 'gotfive:session';
const PREFS_KEY = 'gotfive:prefs';

function readJson<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* mode navigation privee ou quota : le jeu reste fonctionnel */
  }
}

export function loadSession(): PlayerCredentials | null {
  const session = readJson<PlayerCredentials>(SESSION_KEY);
  if (
    session &&
    typeof session.roomCode === 'string' &&
    typeof session.playerId === 'string' &&
    typeof session.token === 'string'
  ) {
    return session;
  }
  return null;
}

export function saveSession(credentials: PlayerCredentials): void {
  writeJson(SESSION_KEY, credentials);
}

export function clearSession(): void {
  try {
    window.localStorage.removeItem(SESSION_KEY);
  } catch {
    /* rien a faire */
  }
}

export interface Preferences {
  /** Pseudo memorise pour ne pas le retaper a chaque partie. */
  name: string;
  soundEnabled: boolean;
  /** Le tutoriel a-t-il deja ete vu ? */
  onboardingDone: boolean;
  /** Langue choisie ('fr' | 'es'), vide = detection automatique. */
  language: string;
  /** Theme : 'auto' suit le systeme, sinon 'light' ou 'dark'. */
  theme: ThemePreference;
}

const DEFAULT_PREFS: Preferences = {
  name: '',
  soundEnabled: true,
  onboardingDone: false,
  language: '',
  theme: 'auto',
};

export function loadPreferences(): Preferences {
  const stored = readJson<Partial<Preferences>>(PREFS_KEY) ?? {};
  const prefs = { ...DEFAULT_PREFS, ...stored };
  // Une valeur abimee (edition manuelle, ancienne version) ne doit pas laisser
  // le document sans theme : on retombe sur la detection automatique.
  if (!isThemePreference(prefs.theme)) {
    prefs.theme = 'auto';
  }
  return prefs;
}

export function savePreferences(prefs: Partial<Preferences>): Preferences {
  const next = { ...loadPreferences(), ...prefs };
  writeJson(PREFS_KEY, next);
  return next;
}

/** Cle de la fiche de deduction : une fiche par (partie, joueur). */
export function deductionKey(roomCode: string, playerId: string): string {
  return `gotfive:sheet:${roomCode}:${playerId}`;
}

export interface StoredDeduction {
  /** Numeros barres au feutre. */
  crossed: number[];
  /** Les 5 hypotheses (chaines libres pour permettre la saisie partielle). */
  guesses: string[];
}

export function loadDeduction(key: string): StoredDeduction {
  const stored = readJson<Partial<StoredDeduction>>(key);
  return {
    crossed: Array.isArray(stored?.crossed)
      ? stored.crossed.filter((n) => Number.isInteger(n) && n >= 1 && n <= 60)
      : [],
    guesses:
      Array.isArray(stored?.guesses) && stored.guesses.length === 5
        ? stored.guesses.map((g) => (typeof g === 'string' ? g.slice(0, 2) : ''))
        : ['', '', '', '', ''],
  };
}

export function saveDeduction(key: string, value: StoredDeduction): void {
  writeJson(key, value);
}

export function clearDeduction(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* rien a faire */
  }
}
