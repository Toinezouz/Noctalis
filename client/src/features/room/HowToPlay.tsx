import { getTileByNumber } from '@noctalis/shared';
import { useI18n } from '../../i18n/index.js';
import { Modal } from '../../components/ui/Modal.js';
import { Button } from '../../components/ui/Button.js';
import { Tile } from '../../components/game/Tile.js';
import { TileBack } from '../../components/game/TileBack.js';

export interface HowToPlayProps {
  open: boolean;
  onClose: () => void;
}

/** Regles illustrees avec les vrais composants du jeu (aucune image externe). */
export function HowToPlay({ open, onClose }: HowToPlayProps): JSX.Element | null {
  const { t } = useI18n();
  if (!open) {
    return null;
  }
  return (
    <Modal
      open={open}
      wide
      title={t('howto.title')}
      onClose={onClose}
      actions={
        <Button variant="primary" onClick={onClose}>
          {t('common.understood')}
        </Button>
      }
    >
      <ol className="howto">
        <li>
          <h3>{t('howto.1.title')}</h3>
          <p>{t('howto.1.text')}</p>
          <div className="howto__row">
            <TileBack color="green" position={0} />
            <TileBack color="pink" position={1} />
            <TileBack color="blue" position={2} />
            <TileBack color="red" position={3} />
            <TileBack color="orange" position={4} />
          </div>
        </li>
        <li>
          <h3>{t('howto.2.title')}</h3>
          <p>{t('howto.2.text')}</p>
          <div className="howto__row">
            <Tile tile={getTileByNumber(6)} />
            <Tile tile={getTileByNumber(22)} />
            <Tile tile={getTileByNumber(38)} />
            <Tile tile={getTileByNumber(44)} />
            <Tile tile={getTileByNumber(55)} />
          </div>
        </li>
        <li>
          <h3>{t('howto.3.title')}</h3>
          <p>{t('howto.3.text')}</p>
        </li>
        <li>
          <h3>{t('howto.4.title')}</h3>
          <p>{t('howto.4.text')}</p>
        </li>
        <li>
          <h3>{t('howto.5.title')}</h3>
          <p>{t('howto.5.text')}</p>
          <ul>
            <li>{t('howto.5.classify')}</li>
            <li>{t('howto.5.compare')}</li>
          </ul>
          <p>{t('howto.5.note')}</p>
        </li>
        <li>
          <h3>{t('howto.6.title')}</h3>
          <p>{t('howto.6.text')}</p>
        </li>
        <li>
          <h3>{t('howto.7.title')}</h3>
          <p>{t('howto.7.text')}</p>
        </li>
      </ol>
    </Modal>
  );
}
