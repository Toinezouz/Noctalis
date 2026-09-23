import type { ButtonHTMLAttributes, ReactNode } from 'react';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required label: an icon button must always be announced. */
  label: string;
  children: ReactNode;
}

export function IconButton({
  label,
  children,
  className = '',
  type = 'button',
  ...rest
}: IconButtonProps): JSX.Element {
  return (
    <button
      type={type}
      className={`icon-btn ${className}`.trim()}
      aria-label={label}
      title={label}
      {...rest}
    >
      <span aria-hidden="true">{children}</span>
    </button>
  );
}
