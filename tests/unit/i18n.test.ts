import { describe, expect, it } from 'vitest';
import { en } from '../../client/src/i18n/en.js';
import { fr } from '../../client/src/i18n/fr.js';
import { es } from '../../client/src/i18n/es.js';
import { detectLanguage, interpolate, LANGUAGES } from '../../client/src/i18n/index.js';
import { COLOR_ORDER, CLASSIFY_SLOT_COUNT } from '@noctalis/shared';

const CATALOGUES = { en, fr, es } as const;
type Key = keyof typeof en;

/** Variables {…} found in a message. */
function placeholders(text: string): string[] {
  return [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]!).sort();
}

describe('translation catalogues', () => {
  it('offers French, English and Spanish', () => {
    expect(LANGUAGES.map((l) => l.code)).toEqual(['fr', 'en', 'es']);
  });

  it('every language covers exactly the keys of the English reference', () => {
    const reference = Object.keys(en).sort();
    expect(Object.keys(fr).sort()).toEqual(reference);
    expect(Object.keys(es).sort()).toEqual(reference);
  });

  it('no message is empty', () => {
    for (const [lang, catalogue] of Object.entries(CATALOGUES)) {
      for (const [key, value] of Object.entries(catalogue)) {
        expect(value.trim().length, `${lang}: empty message ${key}`).toBeGreaterThan(0);
      }
    }
  });

  it('variables are the same in every language', () => {
    for (const key of Object.keys(en) as Key[]) {
      expect(placeholders(fr[key]), `fr: variables differ for ${key}`).toEqual(placeholders(en[key]));
      expect(placeholders(es[key]), `es: variables differ for ${key}`).toEqual(placeholders(en[key]));
    }
  });

  it('names the 5 constellations and the 6 gaps in every language', () => {
    for (const catalogue of Object.values(CATALOGUES)) {
      for (const color of COLOR_ORDER) {
        expect(catalogue[`color.${color}` as Key]).toBeTruthy();
      }
      for (let slot = 0; slot < CLASSIFY_SLOT_COUNT; slot += 1) {
        expect(catalogue[`slot.${String(slot)}` as Key]).toBeTruthy();
      }
    }
  });

  it('really translates: messages differ from one language to another', () => {
    // A few keys stay the same (brand, abbreviations): check that the vast
    // majority of each catalogue is translated.
    const keys = Object.keys(en) as Key[];
    for (const [a, b] of [
      [en, fr],
      [en, es],
      [fr, es],
    ] as const) {
      const different = keys.filter((key) => a[key] !== b[key]);
      expect(different.length / keys.length).toBeGreaterThan(0.9);
    }
  });

  it('fills in variables and leaves unknown ones untouched', () => {
    expect(interpolate('Turn {turn}: {name}', { turn: 3, name: 'Alice' })).toBe('Turn 3: Alice');
    expect(interpolate('Hello {name}', {})).toBe('Hello {name}');
    expect(interpolate('No variable')).toBe('No variable');
  });

  it('detects the language: saved choice, then browser, then English', () => {
    expect(detectLanguage('es')).toBe('es');
    expect(detectLanguage('fr')).toBe('fr');
    expect(detectLanguage('en')).toBe('en');
    // Unknown value: back to browser detection (none here), then English.
    expect(detectLanguage('de')).toBe('en');
    expect(detectLanguage(null)).toBe('en');
  });
});

describe('the words players read', () => {
  it('never talks tech: no server, data, token or session', () => {
    const forbidden = /\b(serveur|server|servidor|données|datos|data|socket|token|jeton|session|sesión|client|cliente)\b/i;
    for (const [lang, catalogue] of Object.entries(CATALOGUES)) {
      for (const [key, value] of Object.entries(catalogue)) {
        expect(forbidden.test(value), `${lang}: technical word in ${key}: "${value}"`).toBe(false);
      }
    }
  });

  it('writes inclusively, without median dots', () => {
    // « 2 à 4 personnes · en ligne » is a separator; a dot glued inside a
    // word (« joueur·euse ») is what we avoid.
    const glued = /\p{Ll}[·•]\p{Ll}/u;
    expect(glued.test('joueur·euse')).toBe(true);
    for (const [lang, catalogue] of Object.entries(CATALOGUES)) {
      for (const [key, value] of Object.entries(catalogue)) {
        expect(glued.test(value), `${lang}: median dot in ${key}: "${value}"`).toBe(false);
      }
    }
  });

  it('French and Spanish name nobody\'s gender', () => {
    // Words that would assume the reader's gender, or the gender of the
    // people at the table.
    const gendered: Record<'fr' | 'es', RegExp> = {
      fr: /\b(joueurs?|joueuses?|observateurs?|observatrices?|rivale?s?|connectée?s?|déconnectée?s?|éliminée?s?|sûre?s?|invitée?s?|toi-même)\b/i,
      es: /\b(jugador(es)?|jugadoras?|conectad[oa]s?|eliminad[oa]s?|(?<!la )bienvenid[oa]s?|segur[oa]s?|invitad[oa]s?|anfitri[oó]n(a)?)\b/i,
    };
    for (const lang of ['fr', 'es'] as const) {
      for (const [key, value] of Object.entries(CATALOGUES[lang])) {
        expect(gendered[lang].test(value), `${lang}: gendered word in ${key}: "${value}"`).toBe(false);
      }
    }
  });
});
