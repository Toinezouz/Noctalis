export interface BrandMarkProps {
  /** `xl` for the home and end screens, `sm` for the game header. */
  size?: 'sm' | 'xl';
  /** Title tag: `h1` on the home screen, `span` elsewhere. */
  as?: 'h1' | 'p' | 'span';
  className?: string;
}

/**
 * The UMBRASTRA mark: a total solar eclipse. The Moon's disc is the umbra,
 * the shadow the name comes from; around it the corona, and on its edge the
 * last bright bead of sunlight. A few stars show, as they do in the sky
 * during totality. Drawn in SVG within the project, with no dependency.
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
        <circle cx="32" cy="32" r="31" className="brand__sky" />
        <g className="brand__stars">
          <circle cx="12" cy="15" r="1.1" />
          <circle cx="51" cy="49" r="1.3" />
          <circle cx="14" cy="50" r="0.8" />
          <circle cx="50" cy="12" r="0.8" />
        </g>
        <circle cx="32" cy="32" r="19" className="brand__corona brand__corona--outer" />
        <circle cx="32" cy="32" r="17.2" className="brand__corona brand__corona--inner" />
        <circle cx="32" cy="32" r="16" className="brand__moon" />
        <circle cx="43.3" cy="20.7" r="2.4" className="brand__bead" />
        <path d="M43.3 14.8 V26.6 M37.4 20.7 H49.2" className="brand__spikes" />
      </svg>
      <span className="brand__word">UMBRASTRA</span>
    </Tag>
  );
}
