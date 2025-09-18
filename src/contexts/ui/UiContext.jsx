import { createContext, useCallback, useContext } from 'react';
import { notifyToastListeners } from '../../components/ui/ToastStack';

const UiContext = createContext(null);

export const UiProvider = ({ children }) => {

  const showToast = useCallback((message, options = {}) => {
    if (!message) return;
    const id = ++notifyToastListeners._id || (notifyToastListeners._id = 1);
    notifyToastListeners({
      id,
      message,
      title: options.title,
      variant: options.variant || 'info',
      duration: options.duration || 4000,
    });
  }, []);

  return (
    <UiContext.Provider value={{ showToast }}>
      {children}
    </UiContext.Provider>
  );
};

export const useUi = () => {
  const context = useContext(UiContext);
  if (!context) {
    throw new Error('useUi must be used within UiProvider');
  }
  return context;
};
