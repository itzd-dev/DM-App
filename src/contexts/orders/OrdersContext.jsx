import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useCart } from '../cart/CartContext';
import { useCatalog } from '../catalog/CatalogContext';
import { useUi } from '../ui/UiContext';
import { useUserData } from '../user/UserContext';
import { useNavigation } from '../navigation/NavigationContext';
import { formatRupiah } from '../../utils/format';
import { supabase } from '../../lib/supabaseClient';

const OrdersContext = createContext(null);

const DEFAULT_ORDERS = [
  { id: 'DM-12345', customer: 'Andi', total: 88000, status: 'Selesai', items: [{ id: 1, name: 'Dimsum Ayam', quantity: 2, price: 18000 }, { id: 9, name: 'Risol Beef Mayo', quantity: 2, price: 15000 }], date: '2025-09-12' },
  { id: 'DM-12346', customer: 'Bunga', total: 45000, status: 'Selesai', items: [{ id: 35, name: 'Maryam Ayam Moza BBQ', quantity: 1, price: 45000 }], date: '2025-09-12' },
  { id: 'DM-12347', customer: 'Citra', total: 120000, status: 'Selesai', items: [{ id: 40, name: 'Kebab Daging Mini', quantity: 3, price: 40000 }], date: '2025-09-11' },
  { id: 'DM-12348', customer: 'Doni', total: 75000, status: 'Selesai', items: [{ id: 30, name: 'Makaroni Keju 500g', quantity: 1, price: 65000 }, { id: 25, name: 'Cireng Salju', quantity: 1, price: 10000 }], date: '2025-09-10' },
  { id: 'DM-12349', customer: 'Eka', total: 35000, status: 'Selesai', items: [{ id: 33, name: 'Maryam Premium Cokelat', quantity: 1, price: 35000 }], date: '2025-09-10' },
  { id: 'DM-12350', customer: 'Fani', total: 90000, status: 'Selesai', items: [{ id: 48, name: 'Pempek Lampung', quantity: 2, price: 45000 }], date: '2025-09-09' },
  { id: 'DM-12351', customer: 'Gery', total: 56000, status: 'Selesai', items: [{ id: 21, name: 'Sosis Solo', quantity: 2, price: 28000 }], date: '2025-09-08' },
];

export const OrdersProvider = ({ children }) => {
  const { loggedInUser, getAuthHeaders } = useAuth();
  const { cart, setCart, appliedDiscount, setAppliedDiscount, pointsDiscount, setPointsDiscount } = useCart();
  const { adjustInventoryAfterSale } = useCatalog();
  const { showToast } = useUi();
  const { setCustomerPoints, refetchLoyalty, fetchAllCustomerPoints } = useUserData();
  const { navigateTo } = useNavigation();

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [lastOrderDetails, setLastOrderDetails] = useState({});
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  const refetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const resp = await fetch('/api/orders');
      if (resp.ok) {
        const list = await resp.json();
        if (Array.isArray(list)) setOrders(list);
      }
    } catch (error) {
      console.warn('[orders] refetchOrders failed', error);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    refetchOrders();

    if (!supabase) return;

    const channel = supabase
      .channel('db-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        console.log('[orders] realtime change', payload);
        refetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetchOrders]);

  const updateOrderStatus = useCallback(async (orderId, newStatus) => {
    setUpdatingOrderId(orderId);
    const prevSnapshot = orders;
    const orderToUpdate = orders.find(o => o.id === orderId);

    setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order)));
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      });
      if (!res.ok) throw new Error('Gagal update status order');

      if (newStatus === 'Selesai' && orderToUpdate) {
        const pointsEarned = Math.floor(orderToUpdate.total / 10000);
        if (pointsEarned > 0 && orderToUpdate.customerEmail !== 'guest@example.com') {
          try {
            const headers = await getAuthHeaders();
            await fetch('/api/loyalty', {
              method: 'POST',
              headers,
              body: JSON.stringify({
                op: 'earn',
                amount: pointsEarned,
                email: orderToUpdate.customerEmail,
              }),
            });
            await fetchAllCustomerPoints();
            showToast(`${orderToUpdate.customer} mendapatkan ${pointsEarned} poin.`);
          } catch (error) {
            console.warn('[orders] updateOrderStatus loyalty earn failed', error);
            showToast('Gagal menambahkan poin loyalitas.', { type: 'error' });
          }
        }
      } else {
        showToast('Status pesanan diperbarui.');
      }
    } catch (error) {
      console.error('[orders] updateOrderStatus failed', error);
      setOrders(prevSnapshot);
      showToast('Gagal update status. Perubahan dibatalkan.', { type: 'error' });
      throw error;
    } finally {
      setUpdatingOrderId(null);
    }
  }, [orders, showToast, getAuthHeaders, fetchAllCustomerPoints]);

  const placeOrder = useCallback(() => {
    if (cart.length === 0) return;

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = 10000;
    let total = subtotal + shipping;

    if (appliedDiscount) {
      total -= appliedDiscount.type === 'percentage' ? subtotal * appliedDiscount.discount : appliedDiscount.discount;
    }

    const pointsUsedAmount = Number(pointsDiscount || 0);
    const pointsRedeemed = Math.floor(pointsUsedAmount / 100);

    const newOrderBase = {
      customer: loggedInUser ? loggedInUser.name : 'Pembeli Baru',
      customerEmail: loggedInUser ? loggedInUser.email : 'guest@example.com',
      items: [...cart],
      total: total > 0 ? total : 0,
      status: 'Menunggu Pembayaran',
      discount: appliedDiscount,
      pointsDiscount: pointsUsedAmount,
      pointsRedeemed: pointsRedeemed > 0 ? pointsRedeemed : 0,
      date: new Date().toISOString().slice(0, 10),
    };

    setAppliedDiscount(null);
    adjustInventoryAfterSale(cart);

    (async () => {
      try {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newOrderBase),
        });
        if (res.ok) {
          const saved = await res.json();
          setOrders((prev) => [saved, ...prev]);
          setLastOrderDetails(saved);
        } else {
          const fallbackId = `DM-${Date.now().toString().slice(-5).padStart(5, '0')}`;
          const newOrder = { id: fallbackId, ...newOrderBase };
          setOrders((prev) => [newOrder, ...prev]);
          setLastOrderDetails(newOrder);
        }
      } catch (error) {
        const fallbackId = `DM-${Date.now().toString().slice(-5).padStart(5, '0')}`;
        const newOrder = { id: fallbackId, ...newOrderBase };
        setOrders((prev) => [newOrder, ...prev]);
        setLastOrderDetails(newOrder);
      } finally {
        navigateTo('order-success');
      }
    })();
  }, [
    cart,
    appliedDiscount,
    pointsDiscount,
    loggedInUser,
    adjustInventoryAfterSale,
    getAuthHeaders,
    refetchLoyalty,
    setCustomerPoints,
    showToast,
    setAppliedDiscount,
    navigateTo,
  ]);

  const backToHome = useCallback(() => {
    setCart([]);
    setAppliedDiscount(null);
    setPointsDiscount(0);
    navigateTo('home');
  }, [navigateTo, setAppliedDiscount, setCart, setPointsDiscount]);

  const exportOrdersToCsv = useCallback(() => {
    const csvEscape = (value) => {
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const headers = ['ID Order', 'Customer', 'Total', 'Status', 'Tanggal', 'Produk'];
    const rows = orders.map((order) => {
      const productList = order.items
        .map((item) => `${item.name} (${item.quantity}x) @ ${formatRupiah(item.price)}`)
        .join('; ');
      return [
        csvEscape(order.id),
        csvEscape(order.customer),
        csvEscape(order.total),
        csvEscape(order.status),
        csvEscape(order.date),
        csvEscape(productList),
      ].join(',');
    });

    const csvContent = [headers.map(csvEscape).join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'laporan_orderan_dapur_merifa.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Laporan orderan berhasil diunduh.');
  }, [orders, showToast]);

  const value = useMemo(() => ({
    orders,
    setOrders,
    ordersLoading,
    lastOrderDetails,
    setLastOrderDetails,
    updatingOrderId,
    refetchOrders,
    updateOrderStatus,
    placeOrder,
    backToHome,
    exportOrdersToCsv,
  }), [
    orders,
    ordersLoading,
    lastOrderDetails,
    updatingOrderId,
    refetchOrders,
    updateOrderStatus,
    placeOrder,
    backToHome,
    exportOrdersToCsv,
  ]);

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
};

export const useOrders = () => {
  const context = useContext(OrdersContext);
  if (!context) {
    throw new Error('useOrders must be used within OrdersProvider');
  }
  return context;
};