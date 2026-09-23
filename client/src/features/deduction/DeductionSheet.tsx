import { useState } from 'react';
import { COLOR_ORDER, SHEET_GRID, TILE_COUNT } from '@gotfive/shared';
import { useI18n } from '../../i18n/index.js';
import { Button } from '../../components/ui/Button.js';
import { IconButton } from '../../components/ui/IconButton.js';
import { Modal } from '../../components/ui/Modal.js';
import { DeductionCell } from './DeductionCell.js';
import { DeductionGuessRow } from './DeductionGuessRow.js';
import type { DeductionApi } from './deductionStore.js';

export interface DeductionSheetProps {
  sheet: DeductionApi;
  /** Numeros deja revelés au centre (simple repere, aucun barrage automatique). */
  revealedNumbers: number[];
  /** Fermeture (panneau lateral sur desktop, plein ecran sur mobile). */
  onClose?: () => void;
  /** Propose de reporter les 5 hypotheses dans la tentative GOT FIVE!. */
  onUseForGotFive?: () => void;
  fullscreen?: boolean;
}

/**
 * Fiche de deduction : reproduction du principe de la fiche officielle.
 * 5 cases d'hypotheses, fleche croissante, puis la grille 1-60 en 5 lignes de
 * couleur et 12 colonnes. Tout est prive et persistant localement.
 */
export function DeductionSheet({
  sheet,
  revealedNumbers,
  onClose,
  onUseForGotFive,
  fullscreen = false,
}: DeductionSheetProps): JSX.Element {
  const { t, color: colorName } = useI18n();
  const [confirmReset, setConfirmReset] = useState(false);
  const revealed = new Set(revealedNumbers);

  return (
    <aside
      className={`sheet ${fullscreen ? 'sheet--fullscreen' : ''}`.trim()}
      aria-label={t('sheet.title')}
      data-testid="deduction-sheet"
    >
      <header className="sheet__header">
        <div>
          <h2 className="sheet__title">{t('sheet.title')}</h2>
          <p className="sheet__subtitle muted">{t('sheet.subtitle')}</p>
        </div>
        {onClose ? (
          <IconButton label={t('sheet.close')} onClick={onClose} data-testid="close-sheet">
            ✕
          </IconButton>
        ) : null}
      </header>

      <DeductionGuessRow guesses={sheet.guesses} onChange={sheet.setGuess} />

      <div className="sheet__grid-wrap">
        <div className="sheet__columns" aria-hidden="true">
          {Array.from({ length: SHEET_GRID[0]?.length ?? 0 }, (_, i) => (
            <span key={i}>{i + 1}</span>
          ))}
        </div>
        <div className="sheet__grid" role="grid" aria-label={t('sheet.gridLabel', { count: TILE_COUNT })}>
          {SHEET_GRID.map((row, rowIndex) => (
            <div className="sheet__row" role="row" key={COLOR_ORDER[rowIndex]}>
              <span className="sheet__row-label" data-color={COLOR_ORDER[rowIndex]} role="rowheader">
                <span className="visually-hidden">
                  {t('sheet.rowLabel', { color: colorName(COLOR_ORDER[rowIndex]!) })}
                </span>
                <span aria-hidden="true" className="sheet__row-chip" />
              </span>
              {row.map((tile) => (
                <span role="gridcell" key={tile.id}>
                  <DeductionCell
                    number={tile.number}
                    crossed={sheet.isCrossed(tile.number)}
                    onToggle={sheet.toggle}
                    revealed={revealed.has(tile.number)}
                  />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <footer className="sheet__footer">
        <p className="sheet__legend muted">
          {t('sheet.legend')} <span className="sheet__legend-dot" aria-hidden="true" />{' '}
          {t('sheet.legendEnd')}
        </p>
        <div className="sheet__actions">
          <span className="badge badge--muted" data-testid="crossed-count">
            {t('sheet.crossedCount', { count: sheet.crossedCount, total: TILE_COUNT })}
          </span>
          {onUseForGotFive ? (
            <Button size="sm" variant="gold" onClick={onUseForGotFive}>
              {t('sheet.useForGotFive')}
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setConfirmReset(true);
            }}
            data-testid="reset-sheet"
          >
            {t('sheet.reset')}
          </Button>
        </div>
      </footer>

      <Modal
        open={confirmReset}
        title={t('sheet.resetTitle')}
        onClose={() => {
          setConfirmReset(false);
        }}
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setConfirmReset(false);
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              data-testid="confirm-reset"
              onClick={() => {
                sheet.reset();
                setConfirmReset(false);
              }}
            >
              {t('sheet.resetConfirm')}
            </Button>
          </>
        }
      >
        <p>{t('sheet.resetText')}</p>
      </Modal>
    </aside>
  );
}
