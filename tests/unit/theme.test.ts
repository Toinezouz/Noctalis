import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_THEME,
  THEME_COLORS,
  THEMES,
  isTheme,
  otherTheme,
} from '../../client/src/lib/theme.js';
import { en } from '../../client/src/i18n/en.js';
import { fr } from '../../client/src/i18n/fr.js';
import { es } from '../../client/src/i18n/es.js';

/** Relative luminance of a #rrggbb colour (WCAG formula). */
function luminance(hex: string): number {
  const value = hex.replace('#', '');
  const channels = [0, 2, 4].map((i) => Number.parseInt(value.slice(i, i + 2), 16) / 255);
  const linear = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * linear[0]! + 0.7152 * linear[1]! + 0.0722 * linear[2]!;
}

/** WCAG contrast ratio between two colours. */
function contrast(a: string, b: string): number {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high! + 0.05) / (low! + 0.05);
}

/** Value of a token, read from the stylesheet. */
function token(name: string, theme: 'light' | 'dark'): string {
  const css = readTokens();
  const block =
    theme === 'light'
      ? css.slice(css.indexOf(':root {'), css.indexOf(":root[data-theme='dark']"))
      : css.slice(css.indexOf(":root[data-theme='dark']"));
  const match = new RegExp(`${name}:\\s*(#[0-9a-fA-F]{3,8})`).exec(block);
  if (!match) {
    throw new Error(`token not found: ${name} (${theme})`);
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

describe('theme choice', () => {
  it('offers exactly light and dark, and starts with the night sky', () => {
    expect(THEMES).toEqual(['light', 'dark']);
    expect(DEFAULT_THEME).toBe('dark');
  });

  it('switches to the other theme', () => {
    expect(otherTheme('light')).toBe('dark');
    expect(otherTheme('dark')).toBe('light');
  });

  it('refuses an invalid stored value, including the old "auto"', () => {
    expect(isTheme('dark')).toBe(true);
    expect(isTheme('light')).toBe(true);
    expect(isTheme('auto')).toBe(false);
    expect(isTheme('DARK')).toBe(false);
    expect(isTheme(null)).toBe(false);
    expect(isTheme(undefined)).toBe(false);
  });

  it('names both choices in every language', () => {
    for (const catalogue of [en, fr, es]) {
      for (const key of ['theme.label', 'theme.light', 'theme.dark'] as const) {
        expect(catalogue[key].trim().length).toBeGreaterThan(0);
      }
    }
    expect(fr['theme.dark']).not.toBe(es['theme.dark']);
  });
});

describe('the five constellation colours', () => {
  const colors = ['green', 'pink', 'blue', 'red', 'orange'] as const;

  it('carry readable text on a flat fill (star chart cells, counters)', () => {
    // Numbers there are bold and short: the WCAG threshold for large text.
    for (const color of colors) {
      const ratio = contrast(token(`--t-${color}-ink`, 'light'), token(`--t-${color}`, 'light'));
      expect(ratio, `${color}: ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(3);
    }
  });

  it('stay well away from the colours of the game UMBRASTRA started from', () => {
    // The green, pink, blue, red and orange of that earlier project.
    const original = ['#2fb061', '#f05a9c', '#2aa7e0', '#e8453c', '#f79020'];
    const rgb = (hex: string): number[] =>
      [0, 2, 4].map((i) => Number.parseInt(hex.replace('#', '').slice(i, i + 2), 16));
    const distance = (a: string, b: string): number =>
      Math.hypot(...rgb(a).map((value, i) => value - rgb(b)[i]!));
    for (const color of colors) {
      const face = token(`--t-${color}`, 'light');
      for (const old of original) {
        expect(distance(face, old), `${color} ${face} too close to ${old}`).toBeGreaterThan(55);
      }
    }
  });
});

describe('readability of both themes', () => {
  // AA asks for 4.5:1 for body text, 3:1 for large text.
  const pairs: [string, string, string, number][] = [
    ['--c-ink', '--c-paper', 'text on a panel', 4.5],
    ['--c-ink', '--c-cream', 'text on the page', 4.5],
    ['--c-ink-soft', '--c-paper', 'secondary text on a panel', 4.5],
    ['--c-ink-soft', '--c-cream', 'secondary text on the page', 4.5],
    ['--c-violet', '--c-paper', 'accent on a panel', 3],
    ['--c-violet', '--c-cream', 'titles on the page', 3],
    ['--c-gold', '--c-paper', '"your turn" title', 3],
    ['--c-magenta', '--c-cream', 'tagline on the home screen', 3],
  ];

  for (const theme of ['light', 'dark'] as const) {
    for (const [fg, bg, label, minimum] of pairs) {
      it(`${theme}: ${label} stays readable`, () => {
        const ratio = contrast(token(fg, theme), token(bg, theme));
        expect(ratio, `${fg} on ${bg} = ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(minimum);
      });
    }
  }

  it('the browser bar follows the theme', () => {
    expect(THEME_COLORS.light.toLowerCase()).toBe(token('--c-cream', 'light').toLowerCase());
    expect(THEME_COLORS.dark.toLowerCase()).toBe(token('--c-cream', 'dark').toLowerCase());
  });

  it('constellation colours are the same in both themes', () => {
    // Otherwise the star chart would no longer match the table.
    const css = readTokens();
    const dark = css.slice(css.indexOf(":root[data-theme='dark']"));
    for (const family of ['--t-green', '--t-pink', '--t-blue', '--t-red', '--t-orange']) {
      expect(dark).not.toContain(`${family}:`);
    }
  });
});
