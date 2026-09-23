import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Icon, type IconName } from '../components/ui/Icon.js';

export type ToastKind = 'info' | 'success' | 'error' | 'warning';

export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastApi {
  push: (message: string, kind?: ToastKind, durationMs?: number) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const ICONS: Record<ToastKind, IconName> = {
  info: 'star',
  success: 'crown',
  error: 'close',
  warning: 'help',
};

export function ToastProvider({ children }: { children: ReactNode }): JSX.Element {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const push = useCallback((message: string, kind: ToastKind = 'info', durationMs = 3600) => {
    const id = nextId.current;
    nextId.current += 1;
    // Three notifications at most: beyond that, the oldest ones leave.
    setToasts((current) => [...current.slice(-2), { id, kind, message }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id));
    }, durationMs);
  }, []);

  const api = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast--${toast.kind}`} role="status">
            <span className="toast__icon" aria-hidden="true">
              <Icon name={ICONS[toast.kind]} size={20} />
            </span>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToasts(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToasts must be used inside a ToastProvider');
  }
  return context;
}
