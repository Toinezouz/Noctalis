import { useI18n } from '../../i18n/index.js';
import { SPONSORS_URL } from '../../lib/project.js';
import { Icon } from './Icon.js';

export interface SupportLinkProps {
  /** `inline` in the footer, `button` in the About dialog. */
  variant?: 'inline' | 'button';
}

/**
 * The support link, to GitHub Sponsors and nowhere else.
 *
 * It never interrupts a game, never pops up and never unlocks anything:
 * UMBRASTRA is entirely free, and stays that way.
 */
export function SupportLink({ variant = 'inline' }: SupportLinkProps): JSX.Element {
  const { t } = useI18n();
  return (
    <a
      className={variant === 'button' ? 'support-link support-link--button' : 'support-link'}
      href={SPONSORS_URL}
      target="_blank"
      rel="noopener noreferrer"
      data-testid="support-link"
    >
      <Icon name="heart" size={16} /> {t('support.link')}
    </a>
  );
}
