import { useEffect, useRef, type ReactNode } from 'react';
import { IconButton } from './IconButton.js';

/**
 * Verrou de defilement partage : deux modales peuvent etre ouvertes en meme
 * temps (tutoriel + demande d'indice obligatoire). Sans compteur, la fermeture
 * de la seconde restaurerait `overflow: hidden` et bloquerait la page.
 */
let scrollLocks = 0;
let previousBodyOverflow = '';

function lockScroll(): void {
  if (scrollLocks === 0) {
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  scrollLocks += 1;
}

function unlockScroll(): void {
  scrollLocks = Math.max(0, scrollLocks - 1);
  if (scrollLocks === 0) {
    document.body.style.overflow = previousBodyOverflow;
  }
}

export interface ModalProps {
  open: boolean;
  title: ReactNode;
  children: ReactNode;
  onClose?: () => void;
  /** Actions affichees en pied de modale. */
  actions?: ReactNode;
  wide?: boolean;
  /** Empeche la fermeture (etapes obligatoires : repondre a un indice). */
  mandatory?: boolean;
  labelledBy?: string;
}

/**
 * Modale accessible : focus piege, fermeture au clavier (sauf etape
 * obligatoire), restitution du focus a la fermeture.
 */
export function Modal({
  open,
  title,
  children,
  onClose,
  actions,
  wide,
  mandatory = false,
}: ModalProps): JSX.Element | null {
  const dialogRef = useRef<HTMLDivElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    lastFocused.current = document.activeElement as HTMLElement | null;
    const node = dialogRef.current;
    const focusable = node?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    (focusable?.[0] ?? node)?.focus();

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && !mandatory && onClose) {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !node) {
        return;
      }
      const items = [...node.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
      )];
      if (items.length === 0) {
        return;
      }
      const first = items[0]!;
      const last = items[items.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    lockScroll();
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      unlockScroll();
      lastFocused.current?.focus();
    };
  }, [open, mandatory, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !mandatory && onClose) {
          onClose();
        }
      }}
    >
      <div
        className={`modal ${wide ? 'modal--wide' : ''}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        ref={dialogRef}
        tabIndex={-1}
      >
        <h2 className="modal__title">{title}</h2>
        {!mandatory && onClose ? (
          <span className="modal__close">
            <IconButton label="Fermer" onClick={onClose}>
              ✕
            </IconButton>
          </span>
        ) : null}
        {children}
        {actions ? <div className="modal__actions">{actions}</div> : null}
      </div>
    </div>
  );
}
