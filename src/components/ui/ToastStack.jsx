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
    container: 'bg-[#EBF8F2] border border-[#38A169]/40',
    icon: 'fa-check-circle text-[#2F855A]',
  },
  error: {
    container: 'bg-[#FFF5F5] border border-[#E53E3E]/40',
    icon: 'fa-times-circle text-[#C53030]',
  },
  info: {
    container: 'bg-[#EBF8FF] border border-[#3182CE]/40',
    icon: 'fa-info-circle text-[#2B6CB0]',
  },
  warning: {
    container: 'bg-[#FFFAF0] border border-[#DD6B20]/40',
    icon: 'fa-exclamation-triangle text-[#C05621]',
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
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3">
      {toasts.map(({ id, title, message, variant = 'info', duration = 4000 }) => {
        const style = variantStyles[variant] || variantStyles.info;
        return (
          <div
            key={id}
            className={`w-72 max-w-[90vw] rounded-xl shadow-lg px-4 py-3 transition-transform transform translate-y-0 opacity-100 ${style.container}`}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-3">
                <i className={`fas ${style.icon} mt-1 text-lg`} aria-hidden="true"></i>
                <div>
                  {title && <h4 className="text-sm font-semibold text-brand-text mb-1">{title}</h4>}
                  <p className="text-sm text-brand-text-light leading-snug">{message}</p>
                </div>
              </div>
              <button
                className="text-xs text-brand-text-light hover:text-brand-text"
                onClick={() => removeToast(id)}
                aria-label="Tutup notifikasi"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="mt-3 h-[3px] rounded-full bg-gradient-to-r from-brand-primary/40 to-transparent"></div>
          </div>
        );
      })}
    </div>
  );
};

export default ToastStack;
