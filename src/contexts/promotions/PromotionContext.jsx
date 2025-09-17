import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useUi } from '../ui/UiContext';

const PromotionContext = createContext(null);

export const PromotionProvider = ({ children }) => {
  const { getAuthHeaders } = useAuth();
  const { showToast } = useUi();
  const [promotions, setPromotions] = useState([
    { code: 'HEMAT10', discount: 0.1, type: 'percentage' },
    { code: 'DISKON5K', discount: 5000, type: 'fixed' },
  ]);

  const refetchPromotions = useCallback(async () => {
    try {
      const resp = await fetch('/api/promotions');
      if (resp.ok) {
        const list = await resp.json();
        if (Array.isArray(list)) {
          setPromotions(list);
        }
      }
    } catch (error) {
      console.warn('[promo] refetchPromotions failed', error);
    }
  }, []);

  useEffect(() => {
    refetchPromotions();
  }, [refetchPromotions]);

  const addPromotion = useCallback(async (promoData) => {
    setPromotions((prev) => [...prev, promoData]);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/promotions', {
        method: 'POST',
        headers,
        body: JSON.stringify(promoData),
      });
      if (!res.ok) throw new Error('Gagal menambahkan promo');
      showToast('Kode promo berhasil ditambahkan.');
      await refetchPromotions();
    } catch (error) {
      console.error('[promo] addPromotion failed', error);
      showToast('Gagal menambah promo. Perubahan dibatalkan.');
      setPromotions((prev) => prev.filter((promo) => promo.code !== promoData.code));
    }
  }, [getAuthHeaders, refetchPromotions, showToast]);

  const deletePromotion = useCallback(async (code) => {
    const prevSnapshot = promotions;
    setPromotions((prev) => prev.filter((promo) => promo.code !== code));
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/promotions?code=${code}`, { method: 'DELETE', headers });
      if (res.status !== 204 && !res.ok) throw new Error('Gagal menghapus promo');
      showToast('Kode promo dihapus.');
    } catch (error) {
      console.error('[promo] deletePromotion failed', error);
      showToast('Gagal menghapus promo.');
      setPromotions(prevSnapshot);
    }
  }, [getAuthHeaders, promotions, showToast]);

  const value = useMemo(() => ({
    promotions,
    addPromotion,
    deletePromotion,
    refetchPromotions,
  }), [promotions, addPromotion, deletePromotion, refetchPromotions]);

  return <PromotionContext.Provider value={value}>{children}</PromotionContext.Provider>;
};

export const usePromotions = () => {
  const context = useContext(PromotionContext);
  if (!context) {
    throw new Error('usePromotions must be used within PromotionProvider');
  }
  return context;
};
