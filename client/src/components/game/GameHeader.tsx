import { useI18n } from '../../i18n/index.js';
import { IconButton } from '../ui/IconButton.js';
import { Button } from '../ui/Button.js';
import { LanguageSwitch } from '../ui/LanguageSwitch.js';
import { ThemeSwitch } from '../ui/ThemeSwitch.js';
import type { ThemePreference } from '../../lib/theme.js';

export interface GameHeaderProps {
  roomCode: string;
  soundEnabled: boolean;
  onToggleSound: () => void;
  theme: ThemePreference;
  onThemeChange: (value: ThemePreference) => void;
  onOpenHelp: () => void;
  onOpenSheet: () => void;
  onLeave: () => void;
  /** Bouton GOT FIVE! : toujours accessible pendant la partie. */
  onGotFive?: () => void;
  gotFiveDisabled?: boolean;
  showSheetButton: boolean;
  online: boolean;
}

/** Bandeau de jeu : identite, code de partie, outils, GOT FIVE!. */
export function GameHeader({
  roomCode,
  soundEnabled,
  onToggleSound,
  theme,
  onThemeChange,
  onOpenHelp,
  onOpenSheet,
  onLeave,
  onGotFive,
  gotFiveDisabled = false,
  showSheetButton,
  online,
}: GameHeaderProps): JSX.Element {
  const { t } = useI18n();

  return (
    <header className="game-header">
      <div className="game-header__brand">
        <span className="brand brand--sm">
          GOT <em>FIVE!</em>
        </span>
        <span className="game-header__code">
          <span className="visually-hidden">{t('header.roomCode')}</span>
          {roomCode}
        </span>
        <span className={`game-header__net ${online ? 'is-online' : 'is-offline'}`} role="status">
          {online ? t('header.online') : t('header.reconnecting')}
        </span>
      </div>

      <div className="game-header__tools">
        {onGotFive ? (
          <Button
            variant="gold"
            onClick={onGotFive}
            disabled={gotFiveDisabled}
            data-testid="got-five-button"
          >
            🖐 {t('header.gotFive')}
          </Button>
        ) : null}
        {showSheetButton ? (
          <Button variant="secondary" onClick={onOpenSheet} data-testid="open-sheet">
            📋 {t('header.sheet')}
          </Button>
        ) : null}
        <LanguageSwitch compact />
        <ThemeSwitch compact value={theme} onChange={onThemeChange} />
        <IconButton
          label={soundEnabled ? t('header.soundOn') : t('header.soundOff')}
          aria-pressed={soundEnabled}
          onClick={onToggleSound}
        >
          {soundEnabled ? '🔊' : '🔇'}
        </IconButton>
        <IconButton label={t('header.help')} onClick={onOpenHelp}>
          ?
        </IconButton>
        <IconButton label={t('header.quit')} onClick={onLeave}>
          ⏻
        </IconButton>
      </div>
    </header>
  );
}
