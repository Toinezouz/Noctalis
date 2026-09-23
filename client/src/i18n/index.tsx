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
import { fr, type MessageKey, type Messages } from './fr.js';
import { es } from './es.js';

export type Language = 'fr' | 'es';

export const LANGUAGES: readonly { code: Language; label: string; flag: string }[] = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
];

const CATALOGUES: Record<Language, Messages> = { fr, es };

export type TranslateParams = Record<string, string | number>;

export interface I18nApi {
  lang: Language;
  setLang: (lang: Language) => void;
  /** Traduit une cle, en remplacant les variables {…}. */
  t: (key: MessageKey, params?: TranslateParams) => string;
  /** Nom localise d'une constellation de etoile. */
  color: (color: TileColor) => string;
  /** Libelle localise d'une des 6 encoches de SITUER. */
  slot: (slot: number) => string;
  /** "1 point" / "2 eclats" dans la langue courante. */
  points: (count: number) => string;
}

const I18nContext = createContext<I18nApi | null>(null);

/** Langue par defaut : celle du navigateur si elle est connue, sinon francais. */
export function detectLanguage(stored?: string | null): Language {
  if (stored === 'fr' || stored === 'es') {
    return stored;
  }
  if (typeof navigator !== 'undefined') {
    const candidates = [navigator.language, ...(navigator.languages ?? [])];
    for (const candidate of candidates) {
      const code = candidate?.slice(0, 2).toLowerCase();
      if (code === 'es') {
        return 'es';
      }
      if (code === 'fr') {
        return 'fr';
      }
    }
  }
  return 'fr';
}

/** Remplace les variables {nom} d'un message. */
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
      interpolate(catalogue[key] ?? fr[key] ?? key, params);
    return {
      lang,
      setLang,
      t,
      color: (color: TileColor) => t(`color.${color}` as MessageKey),
      slot: (slot: number) => t(`slot.${String(slot)}` as MessageKey),
      points: (count: number) =>
        `${String(count)} ${count > 1 ? t('common.points') : t('common.point')}`,
    };
  }, [lang, setLang]);

  return <I18nContext.Provider value={api}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nApi {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n doit etre utilise dans un I18nProvider');
  }
  return context;
}

/**
 * Traduction hors composant (rare) : utilise le catalogue demande.
 * `COLOR_LABELS` du paquet partage reste la reference cote serveur.
 */
export function translate(lang: Language, key: MessageKey, params?: TranslateParams): string {
  return interpolate(CATALOGUES[lang][key] ?? fr[key] ?? key, params);
}

export { COLOR_LABELS };
export type { MessageKey, Messages };
