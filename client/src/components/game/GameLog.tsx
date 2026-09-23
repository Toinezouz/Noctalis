import { useEffect, useRef } from 'react';
import type { LogEntry, LogKind } from '@noctalis/shared';
import { useI18n, type MessageKey } from '../../i18n/index.js';
import { Icon, type IconName } from '../ui/Icon.js';

const ICONS: Record<LogKind, IconName> = {
  system: 'dice',
  reveal: 'eye',
  'hint-request': 'help',
  classify: 'place',
  compare: 'gauge',
  turn: 'turn',
  guess: 'crown',
  connection: 'plug',
};

export interface GameLogProps {
  entries: LogEntry[];
  /** Limited height in the side panel, free in full screen. */
  compact?: boolean;
}

/**
 * Public history: facts only, never secret information. The server sends a
 * code and its parameters; the sentence is built here, in the player's
 * language.
 */
export function GameLog({ entries, compact = true }: GameLogProps): JSX.Element {
  const { t, slot } = useI18n();
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const node = listRef.current;
    if (node) {
      node.scrollTop = node.scrollHeight;
    }
  }, [entries.length]);

  const render = (entry: LogEntry): string => {
    const params = { ...entry.params };
    // The gap label depends on the language too.
    if (typeof params['slot'] === 'number') {
      params['slot'] = slot(params['slot']).toLowerCase();
    }
    const key: MessageKey =
      entry.code === 'compare-answered'
        ? params['match'] === true
          ? 'log.compare-answered.yes'
          : 'log.compare-answered.no'
        : (`log.${entry.code}` as MessageKey);
    return t(key, params as Record<string, string | number>);
  };

  return (
    <ol
      className={`game-log ${compact ? 'game-log--compact' : ''}`.trim()}
      ref={listRef}
      aria-label={t('log.title')}
    >
      {entries.length === 0 ? (
        <li className="game-log__empty muted">{t('log.empty')}</li>
      ) : null}
      {entries.map((entry) => (
        <li className="game-log__item" key={entry.id} data-kind={entry.kind}>
          <span className="game-log__icon" aria-hidden="true">
            <Icon name={ICONS[entry.kind]} size={16} />
          </span>
          <span>{render(entry)}</span>
        </li>
      ))}
    </ol>
  );
}
