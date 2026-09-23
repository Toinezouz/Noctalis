import { describe, expect, it } from 'vitest';
import { fr } from '../../client/src/i18n/fr.js';
import { es } from '../../client/src/i18n/es.js';
import { detectLanguage, interpolate, LANGUAGES } from '../../client/src/i18n/index.js';
import { COLOR_ORDER, CLASSIFY_SLOT_COUNT } from '@noctalis/shared';

/** Variables {…} presentes dans un message. */
function placeholders(text: string): string[] {
  return [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]!).sort();
}

describe('catalogues de traduction', () => {
  it('expose les langues proposees a l interface', () => {
    expect(LANGUAGES.map((l) => l.code)).toEqual(['fr', 'es']);
  });

  it('les deux langues couvrent exactement les memes cles', () => {
    const frKeys = Object.keys(fr).sort();
    const esKeys = Object.keys(es).sort();
    expect(esKeys).toEqual(frKeys);
  });

  it('aucun message n est vide', () => {
    for (const [key, value] of Object.entries({ ...fr, ...es })) {
      expect(value.trim().length, `message vide : ${key}`).toBeGreaterThan(0);
    }
  });

  it('les variables sont identiques dans les deux langues', () => {
    for (const key of Object.keys(fr) as (keyof typeof fr)[]) {
      expect(placeholders(es[key]), `variables differentes pour ${String(key)}`).toEqual(
        placeholders(fr[key]),
      );
    }
  });

  it('couvre les 5 couleurs et les 6 encoches dans les deux langues', () => {
    for (const color of COLOR_ORDER) {
      expect(fr[`color.${color}` as keyof typeof fr]).toBeTruthy();
      expect(es[`color.${color}` as keyof typeof fr]).toBeTruthy();
    }
    for (let slot = 0; slot < CLASSIFY_SLOT_COUNT; slot += 1) {
      expect(fr[`slot.${String(slot)}` as keyof typeof fr]).toBeTruthy();
      expect(es[`slot.${String(slot)}` as keyof typeof fr]).toBeTruthy();
    }
  });

  it('traduit reellement : les messages different entre les langues', () => {
    // Quelques cles ne changent pas (marques, abreviations) : on verifie que
    // l'immense majorite du catalogue est bien traduite.
    const keys = Object.keys(fr) as (keyof typeof fr)[];
    const different = keys.filter((key) => fr[key] !== es[key]);
    expect(different.length / keys.length).toBeGreaterThan(0.9);
  });

  it('interpole les variables, et laisse les inconnues intactes', () => {
    expect(interpolate('Tour {turn} : {name}', { turn: 3, name: 'Alice' })).toBe('Tour 3 : Alice');
    expect(interpolate('Bonjour {name}', {})).toBe('Bonjour {name}');
    expect(interpolate('Sans variable')).toBe('Sans variable');
  });

  it('detecte la langue : preference, puis navigateur, puis francais', () => {
    expect(detectLanguage('es')).toBe('es');
    expect(detectLanguage('fr')).toBe('fr');
    // Valeur inconnue : on retombe sur la detection navigateur (absente ici).
    expect(detectLanguage('de')).toBe('fr');
    expect(detectLanguage(null)).toBe('fr');
  });
});
