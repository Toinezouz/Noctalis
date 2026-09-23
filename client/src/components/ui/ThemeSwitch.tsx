import { useI18n, type MessageKey } from '../../i18n/index.js';
import { Icon, type IconName } from './Icon.js';
import { IconButton } from './IconButton.js';
import { THEME_PREFERENCES, nextThemePreference, type ThemePreference } from '../../lib/theme.js';

/** Label and icon of each choice. */
const ENTRIES: Record<ThemePreference, { icon: IconName; label: MessageKey }> = {
  auto: { icon: 'auto', label: 'theme.auto' },
  light: { icon: 'sun', label: 'theme.light' },
  dark: { icon: 'moon', label: 'theme.dark' },
};

export interface ThemeSwitchProps {
  value: ThemePreference;
  onChange: (value: ThemePreference) => void;
  /**
   * Compact version: a single button cycling through the three choices. The
   * game header is busy enough already; the home screen shows all three.
   */
  compact?: boolean;
}

/** Theme choice: automatic (follows the device), light or dark. */
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
        <Icon name={current.icon} />
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
            <Icon name={entry.icon} size={18} />
            <span>{t(entry.label)}</span>
          </button>
        );
      })}
    </div>
  );
}
