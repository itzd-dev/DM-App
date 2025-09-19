import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useUi } from '../ui/UiContext';
import { supabase } from '../../lib/supabaseClient';

const CatalogContext = createContext(null);

const normalizeProduct = (product) => ({
  id: product.id,
  name: product.name ?? '',
  price: Number(product.price ?? 0),
  category: product.category ?? '',
  image: product.image ?? 'https://placehold.co/400x400/EAE0D5/3D2C1D?text=Produk',
  description: product.description ?? '',
  owner: product.owner ?? '',
  featured: Boolean(product.featured ?? false),
  tags: Array.isArray(product.tags) ? product.tags : [],
  allergens: Array.isArray(product.allergens) ? product.allergens : [],
  rating: Number(product.rating ?? 0),
  reviewCount: Number(product.reviewCount ?? product.review_count ?? 0),
  soldCount: Number(product.soldCount ?? product.sold_count ?? 0),
  reviews: Array.isArray(product.reviews) ? product.reviews : [],
  isAvailable: product.isAvailable ?? product.is_available ?? true,
  currentStock: Number(product.currentStock ?? product.current_stock ?? 0),
  stockHistory: Array.isArray(product.stockHistory) ? product.stockHistory : (product.stock_history ?? []),
});

export const CatalogProvider = ({ children }) => {
  const { getAuthHeaders } = useAuth();
  const { showToast } = useUi();

  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentCategoryFilter, setCurrentCategoryFilter] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState(null);

  const selectProduct = useCallback((productId) => {
    setSelectedProductId(productId);
  }, []);

  const selectedProduct = useMemo(() => {
    if (!selectedProductId) return null;
    return products.find((product) => product.id === selectedProductId) ?? null;
  }, [products, selectedProductId]);

  const refetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const resp = await fetch('/api/products');
      if (resp.ok) {
        const list = await resp.json();
        if (Array.isArray(list)) {
          setProducts(list.map(normalizeProduct));
          return;
        }
      }
    } catch (error) {
      console.warn('[catalog] refetchProducts API fallback', error);
      showToast('Gagal memuat daftar produk.');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    refetchProducts();

    if (!supabase) return;

    const channel = supabase
      .channel('db-products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
        console.log('[catalog] realtime change', payload);
        refetchProducts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetchProducts]);

  const addProduct = useCallback(async (productData) => {
    const today = new Date().toISOString().slice(0, 10);
    const initialStock = productData.currentStock !== undefined ? Number(productData.currentStock) : 0;
    const priceNumber = productData.price !== undefined && productData.price !== '' ? Number(productData.price) : 0;
    const isAvailable = productData.isAvailable !== undefined ? Boolean(productData.isAvailable) : true;
    const featured = productData.featured !== undefined ? Boolean(productData.featured) : false;

    const payload = {
      ...productData,
      price: priceNumber,
      isAvailable,
      featured,
      rating: 0,
      reviewCount: 0,
      soldCount: 0,
      reviews: [],
      tags: productData.tags && productData.tags.length ? productData.tags : ['New'],
      currentStock: initialStock,
      stockHistory: [{ date: today, quantity: initialStock, type: 'initial' }],
    };

    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/products', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(errText || 'Gagal menambah produk');
      }
      showToast(`${productData.name} berhasil ditambahkan.`);
    } catch (error) {
      console.error('[catalog] addProduct failed', error);
      showToast('Gagal menambah produk. Cek nilai harga/stok dan API.');
    }
  }, [getAuthHeaders, showToast]);

  const editProduct = useCallback(async (productId, updatedData) => {
    const prevSnapshot = products;
    const current = products.find((product) => product.id === productId);
    if (!current) return;

    const optimistic = {
      ...current,
      ...updatedData,
      currentStock: updatedData.currentStock !== undefined ? Number(updatedData.currentStock) : current.currentStock,
      price: updatedData.price !== undefined && updatedData.price !== '' ? Number(updatedData.price) : current.price,
    };

    setProducts((prev) => prev.map((product) => (product.id === productId ? optimistic : product)));

    try {
      const body = { id: productId, ...updatedData };
      if (body.price !== undefined && body.price !== '') body.price = Number(body.price);
      if (body.currentStock !== undefined) body.currentStock = Number(body.currentStock);

      const headers = await getAuthHeaders();
      const res = await fetch('/api/products', {
        method: 'PUT',
        headers,
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(errText || 'Gagal memperbarui produk');
      }
      showToast(`${updatedData.name} berhasil diperbarui.`);
    } catch (error) {
      console.error('[catalog] editProduct failed', error);
      setProducts(prevSnapshot);
      showToast('Gagal memperbarui produk. Perubahan dibatalkan.');
    }
  }, [getAuthHeaders, products, showToast]);

  const updateProductStock = useCallback(async (productId, addedQuantity) => {
    const prevSnapshot = products;
    const current = products.find((product) => product.id === productId);
    if (!current) return;

    const add = Number(addedQuantity) || 0;
    const today = new Date().toISOString().slice(0, 10);
    const history = Array.isArray(current.stockHistory) ? [...current.stockHistory] : [];
    const idx = history.findIndex((entry) => entry.date === today && entry.type === 'addition');
    if (idx !== -1) history[idx] = { ...history[idx], quantity: Number(history[idx].quantity || 0) + add };
    else history.push({ date: today, quantity: add, type: 'addition' });

    const optimistic = { ...current, currentStock: current.currentStock + add, stockHistory: history };
    setProducts((prev) => prev.map((product) => (product.id === productId ? optimistic : product)));

    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/products', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ id: productId, op: 'add_stock', addedQuantity: add }),
      });
      if (!res.ok) throw new Error('Gagal menambah stok');
      showToast('Stok produk diperbarui.');
    } catch (error) {
      console.error('[catalog] updateProductStock failed', error);
      setProducts(prevSnapshot);
      showToast('Gagal memperbarui stok. Perubahan dibatalkan.');
    }
  }, [getAuthHeaders, products, showToast]);

  const deleteProduct = useCallback(async (productId) => {
    const prevSnapshot = products;
    setProducts((prev) => prev.filter((product) => product.id !== productId));
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/products?id=${productId}`, { method: 'DELETE', headers });
      if (res.status !== 204 && !res.ok) throw new Error('Gagal menghapus produk');
      showToast('Produk berhasil dihapus.');
    } catch (error) {
      console.error('[catalog] deleteProduct failed', error);
      setProducts(prevSnapshot);
      showToast('Gagal menghapus produk. Perubahan dibatalkan.');
    }
  }, [getAuthHeaders, products, showToast]);

  const toggleProductAvailability = useCallback(async (productId) => {
    const current = products.find((product) => product.id === productId);
    const nextStatus = !(current?.isAvailable ?? true);

    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/products', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ id: productId, isAvailable: nextStatus }),
      });
      if (!res.ok) throw new Error('Gagal mengubah status');
      showToast('Status ketersediaan produk diperbarui.');
    } catch (error) {
      console.error('[catalog] toggleProductAvailability failed', error);
      showToast('Gagal memperbarui status produk.');
    }
  }, [getAuthHeaders, showToast, products]);

  const adjustInventoryAfterSale = useCallback((cartItems) => {
    setProducts((prevProducts) => prevProducts.map((product) => {
      const cartItem = cartItems.find((item) => item.id === product.id);
      if (!cartItem) return product;
      const newStock = product.currentStock - cartItem.quantity;
      const today = new Date().toISOString().slice(0, 10);
      const updatedStockHistory = Array.isArray(product.stockHistory) ? [...product.stockHistory] : [];
      const existingEntryIndex = updatedStockHistory.findIndex((entry) => entry.date === today && entry.type === 'sale');

      if (existingEntryIndex !== -1) {
        updatedStockHistory[existingEntryIndex].quantity -= cartItem.quantity;
      } else {
        updatedStockHistory.push({ date: today, quantity: -cartItem.quantity, type: 'sale' });
      }

      return {
        ...product,
        currentStock: newStock >= 0 ? newStock : 0,
        stockHistory: updatedStockHistory,
      };
    }));
  }, []);

  const value = useMemo(() => ({
    products,
    isLoading,
    currentCategoryFilter,
    setCurrentCategoryFilter,
    selectedProduct,
    selectProduct,
    refetchProducts,
    addProduct,
    editProduct,
    deleteProduct,
    toggleProductAvailability,
    updateProductStock,
    adjustInventoryAfterSale,
  }), [
    products,
    isLoading,
    currentCategoryFilter,
    selectedProduct,
    selectProduct,
    refetchProducts,
    addProduct,
    editProduct,
    deleteProduct,
    toggleProductAvailability,
    updateProductStock,
    adjustInventoryAfterSale,
  ]);

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
};

export const useCatalog = () => {
  const context = useContext(CatalogContext);
  if (!context) {
    throw new Error('useCatalog must be used within CatalogProvider');
  }
  return context;
};
