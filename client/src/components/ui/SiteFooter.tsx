import { useI18n } from '../../i18n/index.js';
import { GITHUB_URL, LICENSE_NAME, LICENSE_URL, PROJECT_NAME } from '../../lib/project.js';
import { SupportLink } from './SupportLink.js';

export interface SiteFooterProps {
  /** Ouvre la fenetre A propos. */
  onOpenAbout: () => void;
}

/** Pied de page discret : projet, code, licence, soutien. */
export function SiteFooter({ onOpenAbout }: SiteFooterProps): JSX.Element {
  const { t } = useI18n();
  return (
    <footer className="site-footer">
      <span className="site-footer__name">{PROJECT_NAME}</span>
      <span aria-hidden="true">·</span>
      <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
        {t('footer.code')}
      </a>
      <span aria-hidden="true">·</span>
      <a href={LICENSE_URL} target="_blank" rel="noopener noreferrer">
        {LICENSE_NAME}
      </a>
      <span aria-hidden="true">·</span>
      <button type="button" className="site-footer__about" onClick={onOpenAbout} data-testid="about-open">
        {t('footer.about')}
      </button>
      <span aria-hidden="true">·</span>
      <SupportLink />
    </footer>
  );
}
