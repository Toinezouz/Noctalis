import { useI18n } from '../../i18n/index.js';
import { SPONSORS_URL } from '../../lib/project.js';

export interface SupportLinkProps {
  /** `inline` dans le pied de page, `button` dans la fenetre A propos. */
  variant?: 'inline' | 'button';
}

/**
 * Lien de soutien, vers GitHub Sponsors et nulle part ailleurs.
 *
 * Il n'interrompt jamais une partie, n'ouvre aucune fenetre surgissante et ne
 * conditionne aucune fonctionnalite : NOCTALIS est entierement gratuit, et le
 * reste.
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
      <span aria-hidden="true">♥</span> {t('support.link')}
    </a>
  );
}
