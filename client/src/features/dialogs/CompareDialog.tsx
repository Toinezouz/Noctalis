import { getTileByNumber } from '@umbrastra/shared';
import { useI18n } from '../../i18n/index.js';
import { Button } from '../../components/ui/Button.js';
import { Modal } from '../../components/ui/Modal.js';
import { Tile } from '../../components/game/Tile.js';

export interface CompareDialogProps {
  open: boolean;
  tileNumber: number;
  position: number;
  /** The asker's real numbers, visible to the responder. */
  askerSecretNumbers: number[];
  askerName: string;
  /** True answer, computed by the server. */
  truth: boolean;
  onSubmit: (answer: boolean) => void;
  busy?: boolean;
}

/**
 * Answer to GAUGE. Only the right answer is offered: the responder cannot
 * lie, and the server works it out again anyway.
 */
export function CompareDialog({
  open,
  tileNumber,
  position,
  askerSecretNumbers,
  askerName,
  truth,
  onSubmit,
  busy = false,
}: CompareDialogProps): JSX.Element | null {
  const { t, points: pointsLabel } = useI18n();
  if (!open) {
    return null;
  }
  const answerLabel = truth ? t('compare.yes') : t('compare.no');
  const publicTile = getTileByNumber(tileNumber);
  const secretNumber = askerSecretNumbers[position];
  const secretTile = secretNumber ? getTileByNumber(secretNumber) : null;

  return (
    <Modal
      open={open}
      mandatory
      title={t('compare.title', { name: askerName })}
      actions={
        <Button
          variant={truth ? 'success' : 'danger'}
          data-testid="confirm-compare-answer"
          disabled={busy}
          onClick={() => {
            onSubmit(truth);
          }}
        >
          {t('compare.answer', { answer: answerLabel })}
        </Button>
      }
    >
      <div className="compare-dialog">
        <div className="compare-dialog__side">
          <span className="muted">{t('compare.publicTile')}</span>
          <Tile tile={publicTile} size="lg" />
          <span className="badge">{pointsLabel(publicTile.points)}</span>
        </div>
        <span className="compare-dialog__vs" aria-hidden="true">
          ⟷
        </span>
        <div className="compare-dialog__side">
          <span className="muted">
            {t('compare.positionOf', { position: position + 1, name: askerName })}
          </span>
          {secretTile ? <Tile tile={secretTile} size="lg" /> : null}
          {secretTile ? <span className="badge">{pointsLabel(secretTile.points)}</span> : null}
        </div>
      </div>
      <p className="center">{t('compare.question', { answer: answerLabel })}</p>
    </Modal>
  );
}
