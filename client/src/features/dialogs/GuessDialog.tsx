import { useEffect, useState } from 'react';
import {
  SECRET_TILE_COUNT,
  TILE_COUNT,
  getTileByNumber,
  isValidTileNumber,
  validateGuessShape,
  type GuessIssue,
} from '@noctalis/shared';
import { useI18n, type MessageKey } from '../../i18n/index.js';
import { Button } from '../../components/ui/Button.js';
import { Modal } from '../../components/ui/Modal.js';
import { Tile } from '../../components/game/Tile.js';

export interface GuessDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (numbers: number[]) => void;
  /** Values pre-filled from the star chart. */
  initial?: string[];
  busy?: boolean;
}

/**
 * The CONSTELLATION! call: five whole numbers from 1 to 60, in ascending
 * order, one star of each constellation. One call per player.
 */
export function GuessDialog({
  open,
  onClose,
  onSubmit,
  initial,
  busy = false,
}: GuessDialogProps): JSX.Element | null {
  const { t, points: pointsLabel } = useI18n();
  const [values, setValues] = useState<string[]>(['', '', '', '', '']);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (open) {
      setValues(initial && initial.length === SECRET_TILE_COUNT ? [...initial] : ['', '', '', '', '']);
      setConfirming(false);
    }
  }, [open, initial]);

  if (!open) {
    return null;
  }

  const parsed = values.map((v) => Number.parseInt(v, 10));
  const check = validateGuessShape(parsed.map((n) => (Number.isNaN(n) ? -1 : n)));
  const valid = check.ok;

  const ISSUE_KEYS: Record<GuessIssue, MessageKey> = {
    count: 'guess.errorCount',
    range: 'guess.errorRange',
    order: 'guess.errorOrder',
    colors: 'guess.errorColors',
  };

  return (
    <Modal
      open={open}
      title={t('guess.title')}
      onClose={onClose}
      actions={
        confirming ? (
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setConfirming(false);
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="gold"
              disabled={busy}
              data-testid="confirm-guess"
              onClick={() => {
                if (check.ok) {
                  onSubmit(check.numbers);
                }
              }}
            >
              {t('guess.submit')}
            </Button>
          </>
        ) : (
          <Button
            variant="gold"
            disabled={!valid || busy}
            data-testid="submit-guess"
            onClick={() => {
              setConfirming(true);
            }}
          >
            {t('guess.submit')}
          </Button>
        )
      }
    >
      <p>{t('guess.warning')}</p>
      <div className="guess-dialog__inputs">
        {values.map((value, index) => {
          const n = Number.parseInt(value, 10);
          const tile = isValidTileNumber(n) ? getTileByNumber(n) : null;
          return (
            <label className="guess-dialog__cell" key={index} data-color={tile?.color}>
              <span className="visually-hidden">{t('guess.inputAria', { index: index + 1 })}</span>
              <input
                className="guess-dialog__input"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={2}
                placeholder="?"
                value={value}
                data-testid={`announce-input-${String(index)}`}
                disabled={confirming}
                onChange={(event) => {
                  const next = [...values];
                  next[index] = event.target.value.replace(/\D/g, '').slice(0, 2);
                  setValues(next);
                }}
              />
              {tile ? <span className="badge badge--muted">{pointsLabel(tile.points)}</span> : null}
            </label>
          );
        })}
      </div>

      {valid ? (
        <div className="guess-dialog__preview">
          {check.numbers.map((n) => (
            <Tile key={n} tile={getTileByNumber(n)} size="sm" />
          ))}
        </div>
      ) : (
        <p className="field__error" role="alert" data-testid="guess-error">
          {check.ok ? '' : t(ISSUE_KEYS[check.issue], { count: SECRET_TILE_COUNT, max: TILE_COUNT })}
        </p>
      )}

      {confirming ? (
        <p className="center" style={{ fontWeight: 800 }}>
          {t('guess.confirm', { count: SECRET_TILE_COUNT, max: TILE_COUNT })}
        </p>
      ) : null}
    </Modal>
  );
}
