import type { PlayerCredentials } from '@noctalis/shared';
import { isThemePreference, type ThemePreference } from './theme.js';

/**
 * Local persistence.
 * NEVER store secret game information here: only session credentials (room,
 * playerId, token) and the player's *own* deductions (crossed numbers,
 * guesses).
 */

const SESSION_KEY = 'noctalis:session';
const PREFS_KEY = 'noctalis:prefs';

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
    /* private browsing or quota: the game still works */
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
    /* nothing to do */
  }
}

export interface Preferences {
  /** Remembered name, so it need not be typed every game. */
  name: string;
  soundEnabled: boolean;
  /** Has the tutorial been seen already? */
  onboardingDone: boolean;
  /** Chosen language ('fr' | 'en' | 'es'); empty = detected automatically. */
  language: string;
  /** Theme: 'auto' follows the device, otherwise 'light' or 'dark'. */
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
  // A damaged value (manual edit, older version) must not leave the page
  // without a theme: fall back to automatic detection.
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

/** Star chart key: one chart per (room, player). */
export function deductionKey(roomCode: string, playerId: string): string {
  return `noctalis:sheet:${roomCode}:${playerId}`;
}

export interface StoredDeduction {
  /** Numbers crossed out. */
  crossed: number[];
  /** The five guesses (free strings, to allow partial input). */
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
    /* nothing to do */
  }
}
