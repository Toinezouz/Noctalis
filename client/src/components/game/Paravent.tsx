import { useI18n } from '../../i18n/index.js';

export interface ParaventProps {
  name: string;
  /** Cote de table : change l'inclinaison du paravent. */
  side: 'mine' | 'opponent';
  connected?: boolean;
}

/**
 * Paravent virtuel : carton imprime violet/magenta, legerement courbe, avec un
 * motif numerique original (chiffres et pastilles dessines en SVG).
 */
export function Paravent({ name, side, connected = true }: ParaventProps): JSX.Element {
  const { t } = useI18n();
  return (
    <div className={`paravent paravent--${side}`} aria-hidden="true">
      <svg className="paravent__art" viewBox="0 0 400 80" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`paravent-${side}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7d31c9" />
            <stop offset="55%" stopColor="#6a2bae" />
            <stop offset="100%" stopColor="#4a1a80" />
          </linearGradient>
          <pattern
            id={`paravent-pattern-${side}`}
            width="56"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <text x="6" y="26" fontSize="18" fontFamily="Fredoka Variable, sans-serif" fill="rgba(255,255,255,0.14)">
              5
            </text>
            <circle cx="40" cy="12" r="5" fill="rgba(255,201,60,0.18)" />
            <circle cx="30" cy="32" r="3" fill="rgba(240,90,156,0.24)" />
          </pattern>
        </defs>
        <rect width="400" height="80" fill={`url(#paravent-${side})`} />
        <rect width="400" height="80" fill={`url(#paravent-pattern-${side})`} />
        <rect y="70" width="400" height="10" fill="rgba(21,8,34,0.28)" />
      </svg>
      <span className="paravent__label">
        {name}
        {connected ? '' : ` (${t('common.offline')})`}
      </span>
    </div>
  );
}
