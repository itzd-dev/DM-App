import { useEffect, useState, useCallback } from 'react';

let listeners = [];
let toastId = 0;

export const notifyToastListeners = (toast) => {
  listeners.forEach((listener) => listener(toast));
};

export const subscribeToastListeners = (listener) => {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
};

const variantStyles = {
  success: {
    border: 'border-[#38A169]/60',
    badge: 'border-[#38A169]',
    icon: 'fa-check text-[#38A169]',
  },
  error: {
    border: 'border-[#E53E3E]/60',
    badge: 'border-[#E53E3E]',
    icon: 'fa-times text-[#E53E3E]',
  },
  info: {
    border: 'border-[#3182CE]/60',
    badge: 'border-[#3182CE]',
    icon: 'fa-info text-[#3182CE]',
  },
  warning: {
    border: 'border-[#DD6B20]/60',
    badge: 'border-[#DD6B20]',
    icon: 'fa-exclamation text-[#DD6B20]',
  },
};

const ToastStack = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribeToastListeners((toast) => {
      setToasts((prev) => {
        const next = [...prev, toast];
        return next;
      });
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const timers = toasts.map(({ id, duration = 4000 }) =>
      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, duration)
    );
    return () => timers.forEach(clearTimeout);
  }, [toasts]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
      {toasts.map(({ id, title, message, variant = 'info', duration = 4000 }) => {
        const style = variantStyles[variant] || variantStyles.info;
        return (
          <div
            key={id}
            className={`w-64 max-w-[85vw] flex items-center gap-3 rounded-lg border ${style.border} bg-white shadow-[0_10px_25px_rgba(0,0,0,0.12)] px-3 py-2 text-brand-text transition-transform`}
          >
            <div className={`flex items-center justify-center h-9 w-9 rounded-full border ${style.badge} bg-white shadow-sm`}
              aria-hidden="true"
            >
              <i className={`fas ${style.icon}`}></i>
            </div>
            <div className="flex-1">
              {title && <p className="text-xs font-semibold text-brand-text leading-tight">{title}</p>}
              <p className="text-xs text-brand-text-light leading-tight mt-0.5">{message}</p>
            </div>
            <button
              className="text-[10px] text-brand-text-light hover:text-brand-text ml-2"
              onClick={() => removeToast(id)}
              aria-label="Tutup notifikasi"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ToastStack;
