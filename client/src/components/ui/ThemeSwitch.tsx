import { useI18n, type MessageKey } from '../../i18n/index.js';
import { IconButton } from './IconButton.js';
import { THEME_PREFERENCES, nextThemePreference, type ThemePreference } from '../../lib/theme.js';

/** Libelle et pictogramme de chaque choix. */
const ENTRIES: Record<ThemePreference, { icon: string; label: MessageKey }> = {
  auto: { icon: '\u{1F317}', label: 'theme.auto' },
  light: { icon: '\u2600\uFE0F', label: 'theme.light' },
  dark: { icon: '\u{1F319}', label: 'theme.dark' },
};

export interface ThemeSwitchProps {
  value: ThemePreference;
  onChange: (value: ThemePreference) => void;
  /**
   * Version compacte : un seul bouton qui fait defiler les trois choix. Le
   * bandeau de jeu est deja charge ; trois pastilles de plus y seraient de
   * trop. L'accueil, lui, affiche les trois choix cote a cote.
   */
  compact?: boolean;
}

/** Choix du theme : automatique (systeme), clair ou sombre. */
export function ThemeSwitch({ value, onChange, compact = false }: ThemeSwitchProps): JSX.Element {
  const { t } = useI18n();
  const current = ENTRIES[value];

  if (compact) {
    return (
      <IconButton
        label={t('theme.current', { mode: t(current.label) })}
        data-testid="theme-cycle"
        data-theme-value={value}
        onClick={() => {
          onChange(nextThemePreference(value));
        }}
      >
        {current.icon}
      </IconButton>
    );
  }

  return (
    <div className="theme-switch" role="group" aria-label={t('theme.label')}>
      <span className="theme-switch__label">{t('theme.label')}</span>
      {THEME_PREFERENCES.map((preference) => {
        const entry = ENTRIES[preference];
        const active = value === preference;
        return (
          <button
            key={preference}
            type="button"
            className={`theme-switch__button ${active ? 'is-active' : ''}`.trim()}
            aria-pressed={active}
            data-testid={`theme-${preference}`}
            onClick={() => {
              onChange(preference);
            }}
          >
            <span aria-hidden="true">{entry.icon}</span>
            <span>{t(entry.label)}</span>
          </button>
        );
      })}
    </div>
  );
}
