import { createContext, useCallback, useContext } from 'react';

const UiContext = createContext(null);

export const UiProvider = ({ children }) => {
  const showToast = useCallback((message) => {
    if (!message) return;
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) existingToast.remove();
    const toast = document.createElement('div');
    toast.className = 'toast-notification fixed bottom-24 left-1/2 -translate-x-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg shadow-lg z-50 font-medium text-sm';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
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
