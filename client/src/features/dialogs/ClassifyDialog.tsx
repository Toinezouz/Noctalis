import { useState } from 'react';
import { getTileByNumber } from '@noctalis/shared';
import { useI18n } from '../../i18n/index.js';
import { Button } from '../../components/ui/Button.js';
import { Modal } from '../../components/ui/Modal.js';
import { ClassifySlotPicker } from '../../components/game/ClassifySlots.js';
import { Tile } from '../../components/game/Tile.js';

export interface ClassifyDialogProps {
  open: boolean;
  tileNumber: number;
  /** The asker's real numbers: I can see them, that is the whole game. */
  askerSecretNumbers: number[];
  askerName: string;
  onSubmit: (slot: number) => void;
  busy?: boolean;
}

/**
 * Answer to PLACE. The player points at the gap; the server works out and
 * applies the exact position anyway.
 */
export function ClassifyDialog({
  open,
  tileNumber,
  askerSecretNumbers,
  askerName,
  onSubmit,
  busy = false,
}: ClassifyDialogProps): JSX.Element | null {
  const { t, slot: slotLabel } = useI18n();
  const [slot, setSlot] = useState<number | null>(null);
  if (!open) {
    return null;
  }

  return (
    <Modal
      open={open}
      mandatory
      title={t('classify.title', { name: askerName, tile: tileNumber })}
      wide
      actions={
        <Button
          variant="primary"
          disabled={slot === null || busy}
          data-testid="confirm-classify"
          onClick={() => {
            if (slot !== null) {
              onSubmit(slot);
              setSlot(null);
            }
          }}
        >
          {slot === null
            ? t('classify.choose')
            : t('classify.confirm', { slot: slotLabel(slot) })}
        </Button>
      }
    >
      <p>{t('classify.instruction', { tile: tileNumber, name: askerName })}</p>
      <div className="dialog-tile-row">
        <Tile tile={getTileByNumber(tileNumber)} size="lg" />
      </div>
      <ClassifySlotPicker
        secretNumbers={askerSecretNumbers}
        tileNumber={tileNumber}
        value={slot}
        onChange={setSlot}
        disabled={busy}
      />
    </Modal>
  );
}
