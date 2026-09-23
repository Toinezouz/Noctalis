import { useEffect, useRef } from 'react';
import type { LogEntry, LogKind } from '@noctalis/shared';
import { useI18n, type MessageKey } from '../../i18n/index.js';

const ICONS: Record<LogKind, string> = {
  system: '🎲',
  reveal: '🃏',
  'hint-request': '❓',
  classify: '📥',
  compare: '⚖️',
  turn: '🔄',
  guess: '🏆',
  connection: '🔌',
};

export interface GameLogProps {
  entries: LogEntry[];
  /** Hauteur limitee en panneau lateral, libre en plein ecran. */
  compact?: boolean;
}

/**
 * Historique public : jamais d'information secrete, uniquement les faits.
 * Le serveur envoie un code et ses parametres ; la phrase est construite ici,
 * dans la langue du joueur.
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
    // Le libelle d'encoche depend aussi de la langue.
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
            {ICONS[entry.kind]}
          </span>
          <span>{render(entry)}</span>
        </li>
      ))}
    </ol>
  );
}
