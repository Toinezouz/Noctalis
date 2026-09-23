import { useI18n, type MessageKey } from '../../i18n/index.js';
import { Icon, type IconName } from './Icon.js';
import { IconButton } from './IconButton.js';
import { THEMES, otherTheme, type Theme } from '../../lib/theme.js';

/** Label and icon of each choice. */
const ENTRIES: Record<Theme, { icon: IconName; label: MessageKey }> = {
  light: { icon: 'sun', label: 'theme.light' },
  dark: { icon: 'moon', label: 'theme.dark' },
};

export interface ThemeSwitchProps {
  value: Theme;
  onChange: (value: Theme) => void;
  /**
   * Compact version: a single button switching to the other theme. The game
   * header is busy enough already; the home screen shows both choices.
   */
  compact?: boolean;
}

/** Theme choice: light or dark. */
export function ThemeSwitch({ value, onChange, compact = false }: ThemeSwitchProps): JSX.Element {
  const { t } = useI18n();

  if (compact) {
    const next = otherTheme(value);
    return (
      <IconButton
        label={t('theme.current', { mode: t(ENTRIES[value].label) })}
        data-testid="theme-toggle"
        data-theme-value={value}
        onClick={() => {
          onChange(next);
        }}
      >
        {/* The icon shows where the button leads: the moon to go dark. */}
        <Icon name={ENTRIES[next].icon} />
      </IconButton>
    );
  }

  return (
    <div className="theme-switch" role="group" aria-label={t('theme.label')}>
      <span className="theme-switch__label">{t('theme.label')}</span>
      {THEMES.map((theme) => {
        const entry = ENTRIES[theme];
        const active = value === theme;
        return (
          <button
            key={theme}
            type="button"
            className={`theme-switch__button ${active ? 'is-active' : ''}`.trim()}
            aria-pressed={active}
            data-testid={`theme-${theme}`}
            onClick={() => {
              onChange(theme);
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
