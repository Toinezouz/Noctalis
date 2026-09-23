import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { COLOR_LABELS } from '@noctalis/shared';
import type { TileColor } from '@noctalis/shared';
import { en, type MessageKey, type Messages } from './en.js';
import { fr } from './fr.js';
import { es } from './es.js';

export type Language = 'fr' | 'en' | 'es';

/**
 * Languages on offer, each named in its own language. No flags: a flag
 * stands for a country, not for the many people who speak a language.
 */
export const LANGUAGES: readonly { code: Language; label: string; short: string }[] = [
  { code: 'fr', label: 'Français', short: 'FR' },
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'es', label: 'Español', short: 'ES' },
];

const CATALOGUES: Record<Language, Messages> = { fr, en, es };

function isLanguage(value: unknown): value is Language {
  return value === 'fr' || value === 'en' || value === 'es';
}

export type TranslateParams = Record<string, string | number>;

export interface I18nApi {
  lang: Language;
  setLang: (lang: Language) => void;
  /** Translates a key, filling in the {…} variables. */
  t: (key: MessageKey, params?: TranslateParams) => string;
  /** Localised name of a constellation. */
  color: (color: TileColor) => string;
  /** Localised label of one of the six PLACE gaps. */
  slot: (slot: number) => string;
  /** "1 spark" / "2 sparks" in the current language. */
  points: (count: number) => string;
}

const I18nContext = createContext<I18nApi | null>(null);

/**
 * Default language: the first of the browser's languages we know, otherwise
 * English, which the largest number of people can read.
 */
export function detectLanguage(stored?: string | null): Language {
  if (isLanguage(stored)) {
    return stored;
  }
  if (typeof navigator !== 'undefined') {
    const candidates = [navigator.language, ...(navigator.languages ?? [])];
    for (const candidate of candidates) {
      const code = candidate?.slice(0, 2).toLowerCase();
      if (isLanguage(code)) {
        return code;
      }
    }
  }
  return 'en';
}

/** Fills in the {name} variables of a message. */
export function interpolate(template: string, params?: TranslateParams): string {
  if (!params) {
    return template;
  }
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = params[key];
    return value === undefined ? match : String(value);
  });
}

export interface I18nProviderProps {
  children: ReactNode;
  initialLanguage: Language;
  onLanguageChange?: (lang: Language) => void;
}

export function I18nProvider({
  children,
  initialLanguage,
  onLanguageChange,
}: I18nProviderProps): JSX.Element {
  const [lang, setLangState] = useState<Language>(initialLanguage);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = CATALOGUES[lang]['app.title'];
  }, [lang]);

  const setLang = useCallback(
    (next: Language) => {
      setLangState(next);
      onLanguageChange?.(next);
    },
    [onLanguageChange],
  );

  const api = useMemo<I18nApi>(() => {
    const catalogue = CATALOGUES[lang];
    const t = (key: MessageKey, params?: TranslateParams): string =>
      interpolate(catalogue[key] ?? en[key] ?? key, params);
    return {
      lang,
      setLang,
      t,
      color: (color: TileColor) => t(`color.${color}` as MessageKey),
      slot: (slot: number) => t(`slot.${String(slot)}` as MessageKey),
      points: (count: number) =>
        count > 1 ? t('common.points', { count }) : t('common.point', { count }),
    };
  }, [lang, setLang]);

  return <I18nContext.Provider value={api}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nApi {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used inside an I18nProvider');
  }
  return context;
}

/**
 * Translation outside a component (rare): uses the requested catalogue.
 * The shared `COLOR_LABELS` stay the reference on the server side.
 */
export function translate(lang: Language, key: MessageKey, params?: TranslateParams): string {
  return interpolate(CATALOGUES[lang][key] ?? en[key] ?? key, params);
}

export { COLOR_LABELS };
export type { MessageKey, Messages };
