/**
 * Theme clair / sombre.
 *
 * Le choix du joueur vaut 'auto' (suivre le systeme), 'light' ou 'dark'. Le
 * theme *resolu* ne vaut, lui, que 'light' ou 'dark' : c'est lui qu'on pose
 * sur `<html>`, si bien que la feuille de style n'a qu'un seul bloc sombre a
 * maintenir (`:root[data-theme='dark']`).
 */

export const THEME_PREFERENCES = ['auto', 'light', 'dark'] as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[number];
export type ResolvedTheme = 'light' | 'dark';

/** Media query du theme systeme. */
export const DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)';

/** Cle de la preference dans le stockage local (cf. `storage.ts`). */
export const THEME_STORAGE_KEY = 'noctalis:prefs';

export function isThemePreference(value: unknown): value is ThemePreference {
  return (
    typeof value === 'string' && (THEME_PREFERENCES as readonly string[]).includes(value)
  );
}

/** Theme effectif : 'auto' suit le systeme, le reste s'impose. */
export function resolveTheme(
  preference: ThemePreference,
  systemPrefersDark: boolean,
): ResolvedTheme {
  if (preference === 'auto') {
    return systemPrefersDark ? 'dark' : 'light';
  }
  return preference;
}

/** Preference suivante dans le cycle auto -> clair -> sombre -> auto. */
export function nextThemePreference(preference: ThemePreference): ThemePreference {
  const index = THEME_PREFERENCES.indexOf(preference);
  return THEME_PREFERENCES[(index + 1) % THEME_PREFERENCES.length]!;
}

/** Constellation de la barre de navigateur (mobile), par theme. */
export const THEME_COLORS: Record<ResolvedTheme, string> = {
  light: '#f3efe6',
  dark: '#0b1022',
};

/**
 * Applique le theme au document. Pose aussi `color-scheme` (barres de
 * defilement et controles natifs) et met a jour `theme-color`.
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
