import { Modal } from '../../components/ui/Modal.js';
import { SupportLink } from '../../components/ui/SupportLink.js';
import { useI18n } from '../../i18n/index.js';
import {
  GITHUB_URL,
  LICENSE_NAME,
  LICENSE_URL,
  PROJECT_NAME,
  PROJECT_VERSION,
} from '../../lib/project.js';

export interface AboutDialogProps {
  open: boolean;
  onClose: () => void;
}

/** About: what the project is, where its code lives, and how to support it. */
export function AboutDialog({ open, onClose }: AboutDialogProps): JSX.Element | null {
  const { t } = useI18n();
  if (!open) {
    return null;
  }
  return (
    <Modal open title={t('about.title')} onClose={onClose}>
      <div className="about" data-testid="about-dialog">
        <p className="about__version">
          {PROJECT_NAME} <span className="muted">v{PROJECT_VERSION}</span>
        </p>
        <p>{t('about.description')}</p>
        <p>{t('about.openSource')}</p>

        <dl className="about__list">
          <dt>{t('about.codeLabel')}</dt>
          <dd>
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
              {GITHUB_URL.replace('https://', '')}
            </a>
          </dd>
          <dt>{t('about.licenseLabel')}</dt>
          <dd>
            <a href={LICENSE_URL} target="_blank" rel="noopener noreferrer">
              {LICENSE_NAME}
            </a>
          </dd>
        </dl>

        <p className="about__support">{t('support.text')}</p>
        <SupportLink variant="button" />
      </div>
    </Modal>
  );
}
