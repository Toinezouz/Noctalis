import { getTileByNumber } from '@gotfive/shared';
import { useI18n } from '../../i18n/index.js';
import { Button } from '../../components/ui/Button.js';
import { Modal } from '../../components/ui/Modal.js';
import { Tile } from '../../components/game/Tile.js';

export interface CompareDialogProps {
  open: boolean;
  tileNumber: number;
  position: number;
  /** Les vrais numeros du demandeur, visibles par le repondeur. */
  askerSecretNumbers: number[];
  askerName: string;
  /** Reponse veritable calculee par le serveur. */
  truth: boolean;
  onSubmit: (answer: boolean) => void;
  busy?: boolean;
}

/**
 * Reponse a COMPARER. L'interface ne propose que la reponse juste : le
 * repondeur ne peut pas mentir, et le serveur recalcule de toute facon.
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
          =?
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
