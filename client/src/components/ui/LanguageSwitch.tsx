import { LANGUAGES, useI18n } from '../../i18n/index.js';

export interface LanguageSwitchProps {
  /** Version compacte (bandeau de jeu) ou etendue (accueil). */
  compact?: boolean;
}

/** Selecteur de langue : francais / espagnol. */
export function LanguageSwitch({ compact = false }: LanguageSwitchProps): JSX.Element {
  const { lang, setLang, t } = useI18n();

  return (
    <div
      className={`lang-switch ${compact ? 'lang-switch--compact' : ''}`.trim()}
      role="group"
      aria-label={t('header.language')}
    >
      {!compact ? <span className="lang-switch__label">{t('home.language')}</span> : null}
      {LANGUAGES.map((entry) => (
        <button
          key={entry.code}
          type="button"
          className={`lang-switch__button ${lang === entry.code ? 'is-active' : ''}`.trim()}
          aria-pressed={lang === entry.code}
          data-testid={`lang-${entry.code}`}
          onClick={() => {
            setLang(entry.code);
          }}
        >
          <span aria-hidden="true">{entry.flag}</span>
          <span className={compact ? 'visually-hidden' : ''}>{entry.label}</span>
        </button>
      ))}
    </div>
  );
}
