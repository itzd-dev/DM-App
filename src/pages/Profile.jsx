import React, { useState, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';

const Profile = () => {
  const { logout, navigateTo, loggedInUser, customerPoints, customerProfiles, redeemPoints, formatRupiah, products, wishlist, userIdentities, linkGoogle, getAuthHeaders, cart, appliedDiscount, pointsDiscount } = useAppContext();
  const [pointsToRedeem, setPointsToRedeem] = useState('');
  const [history, setHistory] = useState([]);
  const [apiPoints, setApiPoints] = useState(null);

  const userEmail = loggedInUser?.email;
  const userName = loggedInUser?.name;
  const currentPoints = (apiPoints !== null ? apiPoints : (customerPoints[userEmail] || 0));
  const userProfile = customerProfiles[userEmail];
  const favoriteProducts = userProfile?.favoriteProducts?.map(id => products.find(p => p.id === id)).filter(Boolean) || [];
  // Hitung batas maksimal poin yang bisa diredeem saat ini (berdasarkan keranjang aktif)
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  let discountAmount = 0;
  if (appliedDiscount) {
    discountAmount = appliedDiscount.type === 'percentage' ? subtotal * appliedDiscount.discount : appliedDiscount.discount;
  }
  const remainingCurrencyCap = Math.max(0, subtotal - discountAmount - (pointsDiscount || 0));
  const maxBySubtotalPoints = Math.floor(remainingCurrencyCap / 100); // 1 poin = Rp100 (50 poin = Rp5.000)
  const balancePoints = currentPoints;
  const maxAllowed = Math.floor(Math.min(balancePoints, maxBySubtotalPoints) / 50) * 50; // kelipatan 50

  // Simple recommendations: prioritize categories from favorites, exclude wishlist; fallback to featured/top sold
  const wishIds = wishlist || [];
  const preferredCategories = Array.from(new Set(favoriteProducts.map(p => p.category).filter(Boolean)));
  let recommended = products
    .filter(p => preferredCategories.includes(p.category) && !wishIds.includes(p.id))
    .slice(0, 6);
  if (recommended.length < 6) {
    const extra = products
      .filter(p => p.featured && !wishIds.includes(p.id) && !recommended.find(r => r.id === p.id))
      .slice(0, 6 - recommended.length);
    recommended = [...recommended, ...extra];
  }
  if (recommended.length < 6) {
    const extra2 = products
      .filter(p => !wishIds.includes(p.id) && !recommended.find(r => r.id === p.id))
      .sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0))
      .slice(0, 6 - recommended.length);
    recommended = [...recommended, ...extra2];
  }

  const handleRedeemPoints = () => {
    const n = parseInt(pointsToRedeem, 10) || 0;
    if (n > 0) {
      const discountAmount = redeemPoints(n);
      if (discountAmount > 0) {
        setPointsToRedeem('');
        setApiPoints((prev) => (prev !== null ? Math.max(0, prev - n) : prev));
      }
    }
  };

  useEffect(() => {
    // Fetch points + history from API
    (async () => {
      try {
        const headers = await (typeof getAuthHeaders === 'function' ? getAuthHeaders() : {});
        const [r1, r2] = await Promise.all([
          fetch('/api/loyalty', { headers }),
          fetch('/api/loyalty?history=1', { headers })
        ]);
        if (r1.ok) {
          const d1 = await r1.json();
          if (typeof d1.points === 'number') setApiPoints(d1.points);
        }
        if (r2.ok) {
          const d2 = await r2.json();
          setHistory(Array.isArray(d2.history) ? d2.history : []);
        }
      } catch (_) {}
    })();
  }, []);

  // Refresh on tab focus to always show authoritative points
  useEffect(() => {
    const onVis = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const headers = await (typeof getAuthHeaders === 'function' ? getAuthHeaders() : {});
        const r = await fetch('/api/loyalty', { headers });
        if (r.ok) {
          const d = await r.json();
          if (typeof d.points === 'number') setApiPoints(d.points);
        }
      } catch (_) {}
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  return (
    <section id="page-profile" className="page-section py-4 px-8">
      <div className="text-center mb-6">
        <img
          src="https://placehold.co/100x100/EAE0D5/634832?text=User"
          alt="Avatar Pengguna"
          className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-brand-primary"
        />
        <h2 className="text-xl font-semibold text-brand-primary">
          {userName || 'Pengguna'}
        </h2>
        <p className="text-brand-text-light font-light text-sm">
          {userEmail || 'guest@email.com'}
        </p>
      </div>

      {/* Loyalty Points Section */}
      <div className="bg-brand-bg rounded-lg border border-brand-subtle p-4 mb-4 text-center">
        <h3 className="font-semibold text-brand-primary mb-2">Poin Loyalitas Anda</h3>
        <p className="text-2xl font-bold text-brand-text mb-2">{currentPoints} Poin</p>
        <p className="text-sm text-brand-text-light">Gunakan poin saat di Keranjang atau Checkout.</p>
        <div className="flex justify-center mt-3">
          <button onClick={() => navigateTo('cart')} className="bg-brand-primary text-white font-bold py-2 px-4 rounded-lg text-sm">
            Tukar Poin di Keranjang
          </button>
        </div>
      </div>

      {/* Favorite Products Section */}
      {favoriteProducts.length > 0 && (
        <div className="bg-brand-bg rounded-lg border border-brand-subtle p-4 mb-4">
          <h3 className="font-semibold text-brand-primary mb-2">Produk Favorit Anda</h3>
          <div className="grid grid-cols-2 gap-3">
            {favoriteProducts.map(product => (
              <div key={product.id} className="flex flex-col items-center text-center">
                <img src={product.image} alt={product.name} className="w-16 h-16 object-cover rounded-md mb-1" />
                <p className="text-xs font-medium text-brand-text truncate w-full">{product.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Account */}
      <div className="bg-brand-bg rounded-lg border border-brand-subtle p-4 mb-4">
        <h3 className="font-semibold text-brand-primary mb-3">Akun</h3>
        <div className="flex items-center justify-between mb-2 text-sm">
          <span className="text-brand-text-light">Email</span>
          <span className="text-brand-text font-medium">{userEmail || '-'}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-brand-text-light">Koneksi</span>
          {Array.isArray(userIdentities) && userIdentities.some(id => id.provider === 'google') ? (
            <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">Google</span>
          ) : (
            <button onClick={linkGoogle} className="text-xs bg-white border border-brand-subtle px-3 py-1 rounded hover:bg-brand-bg">Hubungkan Google</button>
          )}
        </div>
      </div>

      {/* Recommendations Section */}
      {recommended.length > 0 && (
        <div className="bg-brand-bg rounded-lg border border-brand-subtle p-4 mb-4">
          <h3 className="font-semibold text-brand-primary mb-2">Rekomendasi Untuk Anda</h3>
          <div className="grid grid-cols-3 gap-3">
            {recommended.map(product => (
              <div key={product.id} className="flex flex-col items-center text-center" onClick={() => navigateTo('product-detail', { context: { productId: product.id } })}>
                <img src={product.image} alt={product.name} className="w-16 h-16 object-cover rounded-md mb-1" />
                <p className="text-[11px] font-medium text-brand-text truncate w-full">{product.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}


      <div className="space-y-2">
        <button type="button" onClick={() => navigateTo('message-history')} className="w-full text-left flex justify-between items-center p-4 bg-brand-bg rounded-lg hover:bg-brand-subtle transition border border-brand-subtle">
          <span className="font-medium text-sm text-brand-text">
            <i className="fas fa-envelope mr-3 w-5 text-center text-brand-primary"></i>Riwayat Pesan
          </span>
          <i className="fas fa-chevron-right text-brand-text-light text-xs" aria-hidden="true"></i>
        </button>
        <button type="button" onClick={() => navigateTo('order-history')} className="w-full text-left flex justify-between items-center p-4 bg-brand-bg rounded-lg hover:bg-brand-subtle transition border border-brand-subtle">
          <span className="font-medium text-sm text-brand-text">
            <i className="fas fa-history mr-3 w-5 text-center text-brand-primary"></i>Riwayat Pesanan
          </span>
          <i className="fas fa-chevron-right text-brand-text-light text-xs" aria-hidden="true"></i>
        </button>
        <button type="button" onClick={() => navigateTo('wishlist')} className="w-full text-left flex justify-between items-center p-4 bg-brand-bg rounded-lg hover:bg-brand-subtle transition border border-brand-subtle">
          <span className="font-medium text-sm text-brand-text">
            <i className="fas fa-heart mr-3 w-5 text-center text-brand-primary"></i>Wishlist
          </span>
          <i className="fas fa-chevron-right text-brand-text-light text-xs" aria-hidden="true"></i>
        </button>
        <button type="button" onClick={() => navigateTo('address')} className="w-full text-left flex justify-between items-center p-4 bg-brand-bg rounded-lg hover:bg-brand-subtle transition border border-brand-subtle">
          <span className="font-medium text-sm text-brand-text">
            <i className="fas fa-map-marker-alt mr-3 w-5 text-center text-brand-primary"></i>Alamat Pengiriman
          </span>
          <i className="fas fa-chevron-right text-brand-text-light text-xs" aria-hidden="true"></i>
        </button>
        <button type="button" onClick={() => navigateTo('settings')} className="w-full text-left flex justify-between items-center p-4 bg-brand-bg rounded-lg hover:bg-brand-subtle transition border border-brand-subtle">
          <span className="font-medium text-sm text-brand-text">
            <i className="fas fa-cog mr-3 w-5 text-center text-brand-primary"></i>Pengaturan
          </span>
          <i className="fas fa-chevron-right text-brand-text-light text-xs" aria-hidden="true"></i>
        </button>
        <button type="button" onClick={logout} className="w-full text-left flex justify-between items-center p-4 bg-brand-bg rounded-lg hover:bg-brand-subtle transition text-red-500 border border-brand-subtle">
          <span className="font-medium text-sm">
            <i className="fas fa-sign-out-alt mr-3 w-5 text-center" aria-hidden="true"></i>Keluar
          </span>
        </button>
      </div>
    </section>
  );
};

export default Profile;
