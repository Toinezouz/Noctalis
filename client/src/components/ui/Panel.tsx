import type { ReactNode } from 'react';

export interface PanelProps {
  title?: ReactNode;
  children: ReactNode;
  className?: string;
  flat?: boolean;
  /** Shown to the right of the title (counter, button...). */
  aside?: ReactNode;
  id?: string;
}

export function Panel({ title, children, className = '', flat, aside, id }: PanelProps): JSX.Element {
  return (
    <section id={id} className={`panel ${flat ? 'panel--flat' : ''} ${className}`.trim()}>
      {title ? (
        <h2 className="panel__title">
          <span>{title}</span>
          {aside ? <span style={{ marginLeft: 'auto' }}>{aside}</span> : null}
        </h2>
      ) : null}
      {children}
    </section>
  );
}
