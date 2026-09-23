/**
 * Light and dark themes.
 *
 * Each person picks one, and that choice is the only thing that decides:
 * the device's own setting is not consulted. The theme goes on `<html>`, so
 * the stylesheet has a single dark block to maintain
 * (`:root[data-theme='dark']`).
 */

export const THEMES = ['light', 'dark'] as const;
export type Theme = (typeof THEMES)[number];

/** Theme of a first visit: the night sky, which is what the game is about. */
export const DEFAULT_THEME: Theme = 'dark';

/** Storage key of the preference (see `storage.ts`). */
export const THEME_STORAGE_KEY = 'umbrastra:prefs';

export function isTheme(value: unknown): value is Theme {
  return typeof value === 'string' && (THEMES as readonly string[]).includes(value);
}

/** The other theme: what the one-button switch of the game header does. */
export function otherTheme(theme: Theme): Theme {
  return theme === 'dark' ? 'light' : 'dark';
}

/** Colour of the browser bar (mobile), per theme: the page background. */
export const THEME_COLORS: Record<Theme, string> = {
  light: '#f2ecdf',
  dark: '#070b1a',
};

/**
 * Applies the theme to the document and updates `theme-color` (the colour
 * of the browser bar on phones).
 */
export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') {
    return;
  }
  document.documentElement.dataset['theme'] = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', THEME_COLORS[theme]);
  }
}
