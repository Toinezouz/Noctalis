import { LANGUAGES, useI18n, type Language } from '../../i18n/index.js';

export interface LanguageSwitchProps {
  /** Compact version (game header) or full version (home screen). */
  compact?: boolean;
}

/** Language choice: French, English or Spanish. */
export function LanguageSwitch({ compact = false }: LanguageSwitchProps): JSX.Element {
  const { lang, setLang, t } = useI18n();

  if (compact) {
    // A native list: three languages fit in one small pill, and it works the
    // same with a mouse, a finger or a screen reader.
    return (
      <label className="lang-select">
        <span className="visually-hidden">{t('header.language')}</span>
        <select
          className="lang-select__input"
          value={lang}
          data-testid="lang-select"
          onChange={(event) => {
            setLang(event.target.value as Language);
          }}
        >
          {LANGUAGES.map((entry) => (
            <option key={entry.code} value={entry.code}>
              {entry.short} · {entry.label}
            </option>
          ))}
        </select>
        <span className="lang-select__short" aria-hidden="true">
          {LANGUAGES.find((entry) => entry.code === lang)?.short}
        </span>
      </label>
    );
  }

  return (
    <div className="lang-switch" role="group" aria-label={t('header.language')}>
      <span className="lang-switch__label">{t('home.language')}</span>
      {LANGUAGES.map((entry) => (
        <button
          key={entry.code}
          type="button"
          className={`lang-switch__button ${lang === entry.code ? 'is-active' : ''}`.trim()}
          aria-pressed={lang === entry.code}
          lang={entry.code}
          data-testid={`lang-${entry.code}`}
          onClick={() => {
            setLang(entry.code);
          }}
        >
          {entry.label}
        </button>
      ))}
    </div>
  );
}
