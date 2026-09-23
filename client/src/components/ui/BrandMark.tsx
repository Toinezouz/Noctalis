export interface BrandMarkProps {
  /** `xl` for the home and end screens, `sm` for the game header. */
  size?: 'sm' | 'xl';
  /** Title tag: `h1` on the home screen, `span` elsewhere. */
  as?: 'h1' | 'p' | 'span';
  className?: string;
}

/**
 * The UMBRASTRA mark: a disc of night carrying stars joined by the lines of a
 * constellation, followed by the name. Drawn in SVG within the project, with
 * no dependency and no external resource.
 */
export function BrandMark({ size = 'sm', as = 'span', className = '' }: BrandMarkProps): JSX.Element {
  const Tag = as;
  return (
    <Tag className={`brand brand--${size} ${className}`.trim()}>
      <svg
        className="brand__glyph"
        viewBox="0 0 64 64"
        role="img"
        aria-label="UMBRASTRA"
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
      <span className="brand__word">UMBRASTRA</span>
    </Tag>
  );
}
