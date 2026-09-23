import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  THEME_COLORS,
  THEME_PREFERENCES,
  isThemePreference,
  nextThemePreference,
  resolveTheme,
} from '../../client/src/lib/theme.js';
import { fr } from '../../client/src/i18n/fr.js';
import { es } from '../../client/src/i18n/es.js';

/** Luminance relative d'une couleur #rrggbb (formule WCAG). */
function luminance(hex: string): number {
  const value = hex.replace('#', '');
  const channels = [0, 2, 4].map((i) => Number.parseInt(value.slice(i, i + 2), 16) / 255);
  const linear = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * linear[0]! + 0.7152 * linear[1]! + 0.0722 * linear[2]!;
}

/** Rapport de contraste WCAG entre deux couleurs. */
function contrast(a: string, b: string): number {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high! + 0.05) / (low! + 0.05);
}

/** Valeur d'un jeton, lue dans la feuille de style. */
function token(name: string, theme: 'light' | 'dark'): string {
  const css = readTokens();
  const block =
    theme === 'light'
      ? css.slice(css.indexOf(':root {'), css.indexOf(":root[data-theme='dark']"))
      : css.slice(css.indexOf(":root[data-theme='dark']"));
  const match = new RegExp(`${name}:\\s*(#[0-9a-fA-F]{3,8})`).exec(block);
  if (!match) {
    throw new Error(`jeton introuvable : ${name} (${theme})`);
  }
  return match[1]!;
}

let cache: string | null = null;
function readTokens(): string {
  cache ??= readFileSync(
    new URL('../../client/src/styles/tokens.css', import.meta.url),
    'utf8',
  );
  return cache;
}

describe('preference de theme', () => {
  it('propose exactement automatique, clair et sombre', () => {
    expect(THEME_PREFERENCES).toEqual(['auto', 'light', 'dark']);
  });

  it('resout « auto » selon le systeme, et impose les autres', () => {
    expect(resolveTheme('auto', true)).toBe('dark');
    expect(resolveTheme('auto', false)).toBe('light');
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });

  it('tourne en boucle sur les trois choix', () => {
    expect(nextThemePreference('auto')).toBe('light');
    expect(nextThemePreference('light')).toBe('dark');
    expect(nextThemePreference('dark')).toBe('auto');
  });

  it('refuse une valeur stockee invalide', () => {
    expect(isThemePreference('dark')).toBe(true);
    expect(isThemePreference('AUTO')).toBe(false);
    expect(isThemePreference(null)).toBe(false);
    expect(isThemePreference(undefined)).toBe(false);
  });

  it('traduit les trois choix dans les deux langues', () => {
    for (const catalogue of [fr, es]) {
      for (const key of ['theme.label', 'theme.auto', 'theme.light', 'theme.dark'] as const) {
        expect(catalogue[key].trim().length).toBeGreaterThan(0);
      }
    }
    expect(fr['theme.dark']).not.toBe(es['theme.dark']);
  });
});

describe('lisibilite des deux themes', () => {
  // AA exige 4,5:1 pour du texte courant, 3:1 pour du grand texte.
  const pairs: [string, string, string, number][] = [
    ['--c-ink', '--c-paper', 'texte sur panneau', 4.5],
    ['--c-ink', '--c-cream', 'texte sur fond de page', 4.5],
    ['--c-ink-soft', '--c-paper', 'texte secondaire sur panneau', 4.5],
    ['--c-ink-soft', '--c-cream', 'texte secondaire sur fond de page', 4.5],
    ['--c-violet', '--c-paper', 'accent sur panneau', 3],
  ];

  for (const theme of ['light', 'dark'] as const) {
    for (const [fg, bg, label, minimum] of pairs) {
      it(`${theme} : ${label} reste lisible`, () => {
        const ratio = contrast(token(fg, theme), token(bg, theme));
        expect(ratio, `${fg} sur ${bg} = ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(minimum);
      });
    }
  }

  it('la barre du navigateur suit le theme', () => {
    expect(THEME_COLORS.light.toLowerCase()).toBe(token('--c-cream', 'light').toLowerCase());
    expect(THEME_COLORS.dark.toLowerCase()).toBe(token('--c-cream', 'dark').toLowerCase());
  });

  it('les couleurs des tuiles sont identiques dans les deux themes', () => {
    // Sinon la fiche de deduction ne correspondrait plus au plateau.
    const css = readTokens();
    const dark = css.slice(css.indexOf(":root[data-theme='dark']"));
    for (const family of ['--t-green', '--t-pink', '--t-blue', '--t-red', '--t-orange']) {
      expect(dark).not.toContain(`${family}:`);
    }
  });
});
