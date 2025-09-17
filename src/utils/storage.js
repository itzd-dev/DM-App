export const safeLoad = (key, fallback) => {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.warn('[storage] Failed to load key', key, error);
    return fallback;
  }
};

export const safeSave = (key, value) => {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  } catch (error) {
    console.warn('[storage] Failed to save key', key, error);
  }
};

export const safeRemove = (key) => {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(key);
    }
  } catch (error) {
    console.warn('[storage] Failed to remove key', key, error);
  }
};
