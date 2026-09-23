import { useState } from 'react';
import { useI18n, type MessageKey } from '../../i18n/index.js';
import { Modal } from '../../components/ui/Modal.js';
import { Button } from '../../components/ui/Button.js';

export interface OnboardingProps {
  open: boolean;
  onClose: () => void;
}

const STEPS = [1, 2, 3, 4, 5, 6, 7] as const;
const ICONS = ['🙈', '👀', '🎴', '📥', '⚖️', '📋', '🖐'];

/** Tutoriel court affiche au lancement de la toute premiere partie. */
export function Onboarding({ open, onClose }: OnboardingProps): JSX.Element | null {
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  if (!open) {
    return null;
  }
  const current = STEPS[step]!;
  const isLast = step === STEPS.length - 1;

  return (
    <Modal
      open={open}
      title={t('onboarding.title')}
      onClose={onClose}
      actions={
        <>
          <Button variant="secondary" onClick={onClose} data-testid="skip-onboarding">
            {t('onboarding.skip')}
          </Button>
          <Button
            variant="primary"
            data-testid="next-onboarding"
            onClick={() => {
              if (isLast) {
                onClose();
              } else {
                setStep((value) => value + 1);
              }
            }}
          >
            {isLast ? t('onboarding.play') : t('onboarding.next')}
          </Button>
        </>
      }
    >
      <div className="onboarding">
        <span className="onboarding__icon" aria-hidden="true">
          {ICONS[step]}
        </span>
        <h3>{t(`onboarding.${String(current)}.title` as MessageKey)}</h3>
        <p>{t(`onboarding.${String(current)}.text` as MessageKey)}</p>
        <div
          className="onboarding__dots"
          aria-label={t('onboarding.step', { current: step + 1, total: STEPS.length })}
        >
          {STEPS.map((value, index) => (
            <span key={value} className={index === step ? 'is-active' : ''} />
          ))}
        </div>
      </div>
    </Modal>
  );
}
