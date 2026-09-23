import { useI18n } from '../../i18n/index.js';

export interface ParaventProps {
  name: string;
  /** Which side of the table: mine sits below my rack, the others above theirs. */
  side: 'mine' | 'opponent';
  connected?: boolean;
  /** Has the lead right now. */
  active?: boolean;
  /** Has to answer a hint right now. */
  answering?: boolean;
  /** Made a wrong call or left: out of the race. */
  out?: boolean;
}

/**
 * The name plate of a rack: a strip of night sky carrying the player's name
 * and what they are up to.
 */
export function Paravent({
  name,
  side,
  connected = true,
  active = false,
  answering = false,
  out = false,
}: ParaventProps): JSX.Element {
  const { t } = useI18n();
  const status = !connected
    ? t('common.offline')
    : answering
      ? t('rack.answering')
      : active
        ? t('rack.playing')
        : out
          ? t('status.eliminated')
          : null;
  const classes = [
    'paravent',
    `paravent--${side}`,
    active ? 'is-active' : '',
    answering ? 'is-answering' : '',
    !connected ? 'is-offline' : '',
    out ? 'is-out' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      <span className="paravent__avatar" aria-hidden="true">
        {name.slice(0, 1).toUpperCase()}
      </span>
      <span className="paravent__label">
        {name}
        {side === 'mine' ? <span className="paravent__me"> {t('common.you')}</span> : null}
      </span>
      {status ? <span className="paravent__status">{status}</span> : null}
    </div>
  );
}
