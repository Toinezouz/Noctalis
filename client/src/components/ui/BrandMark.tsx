export interface BrandMarkProps {
  /** `xl` pour l'accueil et la fin de partie, `sm` pour le bandeau de jeu. */
  size?: 'sm' | 'xl';
  /** Balise du titre : `h1` sur l'accueil, `span` ailleurs. */
  as?: 'h1' | 'p' | 'span';
  className?: string;
}

/**
 * Marque de NOCTALIS : un disque de nuit portant cinq etoiles reliees par les
 * traits d'une constellation, suivi du nom. Entierement dessinee en SVG dans
 * le projet, sans dependance ni ressource externe.
 */
export function BrandMark({ size = 'sm', as = 'span', className = '' }: BrandMarkProps): JSX.Element {
  const Tag = as;
  return (
    <Tag className={`brand brand--${size} ${className}`.trim()}>
      <svg
        className="brand__glyph"
        viewBox="0 0 64 64"
        role="img"
        aria-label="NOCTALIS"
        focusable="false"
      >
        <circle cx="32" cy="32" r="30" className="brand__disc" />
        <path
          d="M17 41 L26 24 L39 32 L47 19 M26 24 L34 45"
          className="brand__lines"
          fill="none"
          strokeLinecap="round"
        />
        <g className="brand__stars">
          <circle cx="17" cy="41" r="2.6" />
          <circle cx="39" cy="32" r="2.6" />
          <circle cx="47" cy="19" r="2.2" />
          <circle cx="34" cy="45" r="3" />
        </g>
        <path
          d="M26 17.5 L27.1 22.9 L32.5 24 L27.1 25.1 L26 30.5 L24.9 25.1 L19.5 24 L24.9 22.9 Z"
          className="brand__nova"
        />
      </svg>
      <span className="brand__word">NOCTALIS</span>
    </Tag>
  );
}
