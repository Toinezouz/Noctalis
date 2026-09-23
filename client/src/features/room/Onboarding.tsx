import { useState } from 'react';
import { COLOR_ORDER, getTileByNumber } from '@noctalis/shared';
import { useI18n, type MessageKey } from '../../i18n/index.js';
import { Modal } from '../../components/ui/Modal.js';
import { Button } from '../../components/ui/Button.js';
import { Tile } from '../../components/game/Tile.js';
import { TileBack } from '../../components/game/TileBack.js';
import { Icon } from '../../components/ui/Icon.js';

export interface OnboardingProps {
  open: boolean;
  onClose: () => void;
}

const STEPS = [1, 2, 3, 4, 5, 6, 7] as const;

/** A small picture for each step, drawn with the game's own pieces. */
function StepPicture({ step }: { step: number }): JSX.Element {
  switch (step) {
    case 1:
      return (
        <div className="onboarding__picture">
          {COLOR_ORDER.map((color, position) => (
            <TileBack key={color} color={color} position={position} size="sm" />
          ))}
        </div>
      );
    case 2:
      return (
        <div className="onboarding__picture">
          {[6, 17, 28, 39, 50].map((n) => (
            <Tile key={n} tile={getTileByNumber(n)} size="sm" />
          ))}
        </div>
      );
    case 3:
      return (
        <div className="onboarding__picture onboarding__picture--sky">
          {[12, 33, 45].map((n) => (
            <Tile key={n} tile={getTileByNumber(n)} size="sm" />
          ))}
        </div>
      );
    case 4:
      return (
        <div className="onboarding__picture">
          <TileBack color="green" position={0} size="sm" />
          <span className="onboarding__slot">
            <Tile tile={getTileByNumber(22)} size="xs" />
          </span>
          <TileBack color="pink" position={1} size="sm" />
          <TileBack color="blue" position={2} size="sm" />
        </div>
      );
    case 5:
      return (
        <div className="onboarding__picture">
          <Tile tile={getTileByNumber(24)} size="sm" />
          <span className="onboarding__vs" aria-hidden="true">
            <Icon name="gauge" size={28} />
          </span>
          <TileBack color="red" position={3} size="sm" />
        </div>
      );
    case 6:
      return (
        <div className="onboarding__picture">
          <Icon name="chart" size={56} className="onboarding__big-icon" />
        </div>
      );
    default:
      return (
        <div className="onboarding__picture">
          <Icon name="star" size={56} className="onboarding__big-icon onboarding__big-icon--gold" />
        </div>
      );
  }
}

/** A short tutorial shown when a very first game starts. */
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
        <StepPicture step={current} />
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
