/**
 * Light and dark themes.
 *
 * The player's choice is 'auto' (follow the device), 'light' or 'dark'. The
 * *resolved* theme is only ever 'light' or 'dark': that is what goes on
 * `<html>`, so the stylesheet has a single dark block to maintain
 * (`:root[data-theme='dark']`).
 */

export const THEME_PREFERENCES = ['auto', 'light', 'dark'] as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[number];
export type ResolvedTheme = 'light' | 'dark';

/** Media query of the device theme. */
export const DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)';

/** Storage key of the preference (see `storage.ts`). */
export const THEME_STORAGE_KEY = 'noctalis:prefs';

export function isThemePreference(value: unknown): value is ThemePreference {
  return (
    typeof value === 'string' && (THEME_PREFERENCES as readonly string[]).includes(value)
  );
}

/** Effective theme: 'auto' follows the device, anything else wins. */
export function resolveTheme(
  preference: ThemePreference,
  systemPrefersDark: boolean,
): ResolvedTheme {
  if (preference === 'auto') {
    return systemPrefersDark ? 'dark' : 'light';
  }
  return preference;
}

/** Next preference in the auto -> light -> dark -> auto cycle. */
export function nextThemePreference(preference: ThemePreference): ThemePreference {
  const index = THEME_PREFERENCES.indexOf(preference);
  return THEME_PREFERENCES[(index + 1) % THEME_PREFERENCES.length]!;
}

/** Colour of the browser bar (mobile), per theme: the page background. */
export const THEME_COLORS: Record<ResolvedTheme, string> = {
  light: '#f2ecdf',
  dark: '#070b1a',
};

/**
 * Applies the theme to the document and updates `theme-color` (the colour
 * of the browser bar on phones).
 */
export function applyTheme(theme: ResolvedTheme): void {
  if (typeof document === 'undefined') {
    return;
  }
  document.documentElement.dataset['theme'] = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', THEME_COLORS[theme]);
  }
}
