import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { safeLoad, safeSave } from '../../utils/storage';
import { useAuth } from '../auth/AuthContext';
import { useUi } from '../ui/UiContext';

const PartnerContext = createContext(null);

const STORAGE_KEY = 'partners';
const DEFAULT_PARTNERS = [
  { id: 1, name: 'Dapur Merifa', contact: '0812-xxxx-xxxx', notes: 'Owner utama' },
];

export const PartnerProvider = ({ children }) => {
  const { getAuthHeaders } = useAuth();
  const { showToast } = useUi();
  const [partners, setPartners] = useState(() => safeLoad(STORAGE_KEY, DEFAULT_PARTNERS));

  useEffect(() => {
    safeSave(STORAGE_KEY, partners);
  }, [partners]);

  const refetchPartners = useCallback(async () => {
    try {
      const resp = await fetch('/api/partners');
      if (resp.ok) {
        const list = await resp.json();
        if (Array.isArray(list)) setPartners(list);
      }
    } catch (error) {
      console.warn('[partner] refetchPartners failed', error);
    }
  }, []);

  useEffect(() => {
    refetchPartners();
  }, [refetchPartners]);

  const addPartner = useCallback(async (partnerData) => {
    const optimistic = { ...partnerData, id: Date.now() };
    setPartners((prev) => [...prev, optimistic]);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/partners', {
        method: 'POST',
        headers,
        body: JSON.stringify(partnerData),
      });
      if (!res.ok) throw new Error('Gagal menambah mitra');
      await refetchPartners();
      showToast('Mitra ditambahkan.');
    } catch (error) {
      console.error('[partner] addPartner failed', error);
      showToast('Gagal menambah mitra.');
      setPartners((prev) => prev.filter((partner) => partner.id !== optimistic.id));
    }
  }, [getAuthHeaders, refetchPartners, showToast]);

  const editPartner = useCallback(async (id, partnerData) => {
    const prevSnapshot = partners;
    setPartners((prev) => prev.map((partner) => (partner.id === id ? { ...partner, ...partnerData } : partner)));
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/partners', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ id, ...partnerData }),
      });
      if (!res.ok) throw new Error('Gagal memperbarui mitra');
      await refetchPartners();
      showToast('Mitra diperbarui.');
    } catch (error) {
      console.error('[partner] editPartner failed', error);
      showToast('Gagal memperbarui mitra.');
      setPartners(prevSnapshot);
    }
  }, [getAuthHeaders, partners, refetchPartners, showToast]);

  const deletePartner = useCallback(async (id) => {
    const prevSnapshot = partners;
    setPartners((prev) => prev.filter((partner) => partner.id !== id));
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/partners?id=${id}`, { method: 'DELETE', headers });
      if (res.status !== 204 && !res.ok) throw new Error('Gagal menghapus mitra');
      showToast('Mitra dihapus.');
    } catch (error) {
      console.error('[partner] deletePartner failed', error);
      showToast('Gagal menghapus mitra.');
      setPartners(prevSnapshot);
    }
  }, [getAuthHeaders, partners, showToast]);

  const value = useMemo(() => ({
    partners,
    addPartner,
    editPartner,
    deletePartner,
    refetchPartners,
  }), [partners, addPartner, editPartner, deletePartner, refetchPartners]);

  return <PartnerContext.Provider value={value}>{children}</PartnerContext.Provider>;
};

export const usePartners = () => {
  const context = useContext(PartnerContext);
  if (!context) {
    throw new Error('usePartners must be used within PartnerProvider');
  }
  return context;
};
