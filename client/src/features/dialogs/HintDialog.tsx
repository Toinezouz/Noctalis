import { useState } from 'react';
import { getTileByNumber, type SecretTileView } from '@umbrastra/shared';
import { useI18n } from '../../i18n/index.js';
import { Button } from '../../components/ui/Button.js';
import { Modal } from '../../components/ui/Modal.js';
import { Tile } from '../../components/game/Tile.js';
import { TileBack } from '../../components/game/TileBack.js';

export interface HintDialogProps {
  open: boolean;
  tileNumber: number | null;
  /** My five stars (constellation and position only). */
  myTiles: SecretTileView[];
  /** Who will answer: the next person in the turn order. */
  responderName: string;
  onClose: () => void;
  onClassify: (tileNumber: number) => void;
  onCompare: (tileNumber: number, position: number) => void;
  busy?: boolean;
}

/** Step 2 of a turn: choose the kind of hint for the selected star. */
export function HintDialog({
  open,
  tileNumber,
  myTiles,
  responderName,
  onClose,
  onClassify,
  onCompare,
  busy = false,
}: HintDialogProps): JSX.Element | null {
  const { t } = useI18n();
  const [mode, setMode] = useState<'choose' | 'compare'>('choose');
  const [position, setPosition] = useState<number | null>(null);

  if (!open || tileNumber === null) {
    return null;
  }
  const tile = getTileByNumber(tileNumber);

  const close = (): void => {
    setMode('choose');
    setPosition(null);
    onClose();
  };

  return (
    <Modal
      open={open}
      title={t('hint.title', { tile: tileNumber })}
      onClose={close}
      actions={
        mode === 'compare' ? (
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setMode('choose');
                setPosition(null);
              }}
            >
              {t('common.back')}
            </Button>
            <Button
              variant="primary"
              disabled={position === null || busy}
              data-testid="confirm-compare"
              onClick={() => {
                if (position !== null) {
                  onCompare(tileNumber, position);
                  setMode('choose');
                  setPosition(null);
                }
              }}
            >
              {t('hint.confirmCompare')}
            </Button>
          </>
        ) : null
      }
    >
      <div className="hint-dialog">
        <div className="hint-dialog__tile">
          <Tile tile={tile} size="lg" />
        </div>

        {mode === 'choose' ? (
          <div className="hint-dialog__choices">
            <button
              type="button"
              className="hint-choice"
              data-testid="choose-classify"
              disabled={busy}
              onClick={() => {
                onClassify(tileNumber);
              }}
            >
              <span className="hint-choice__title">{t('hint.classify')}</span>
              <span className="hint-choice__text">
                {t('hint.classifyText', { name: responderName })}
              </span>
            </button>
            <button
              type="button"
              className="hint-choice"
              data-testid="choose-compare"
              disabled={busy}
              onClick={() => {
                setMode('compare');
              }}
            >
              <span className="hint-choice__title">{t('hint.compare')}</span>
              <span className="hint-choice__text">
                {t('hint.compareText', { name: responderName })}
              </span>
            </button>
          </div>
        ) : (
          <div className="hint-dialog__positions">
            <p className="muted">{t('hint.choosePosition')}</p>
            <div className="hint-dialog__rack">
              {myTiles.map((myTile) => (
                <TileBack
                  key={myTile.position}
                  color={myTile.color}
                  position={myTile.position}
                  highlighted={position === myTile.position}
                  onClick={() => {
                    setPosition(myTile.position);
                  }}
                  labelSuffix={t('tile.comparePosition')}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
