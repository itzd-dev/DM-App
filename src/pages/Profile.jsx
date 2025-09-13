import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';

const Profile = () => {
  const { logout, navigateTo, loggedInUser, customerPoints, customerProfiles, redeemPoints, formatRupiah, products } = useAppContext();
  const [pointsToRedeem, setPointsToRedeem] = useState(0);

  const userEmail = loggedInUser?.email;
  const userName = loggedInUser?.name;
  const currentPoints = customerPoints[userEmail] || 0;
  const userProfile = customerProfiles[userEmail];
  const favoriteProducts = userProfile?.favoriteProducts?.map(id => products.find(p => p.id === id)).filter(Boolean) || [];

  const handleRedeemPoints = () => {
    if (pointsToRedeem > 0) {
      const discountAmount = redeemPoints(pointsToRedeem);
      if (discountAmount > 0) {
        // Optionally, apply this discount to a temporary cart or show a message
        // For now, redeemPoints already shows a toast.
        setPointsToRedeem(0);
      }
    }
  };

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
      <div className="bg-brand-bg rounded-lg border border-brand-subtle p-4 mb-4">
        <h3 className="font-semibold text-brand-primary mb-2">Poin Loyalitas Anda</h3>
        <p className="text-2xl font-bold text-brand-text mb-2">{currentPoints} Poin</p>
        <p className="text-sm text-brand-text-light">100 poin = Rp 10.000 diskon (contoh)</p>
        <div className="flex mt-3 space-x-2">
          <input 
            type="number" 
            value={pointsToRedeem}
            onChange={(e) => setPointsToRedeem(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-full px-3 py-2 border border-brand-subtle rounded-lg text-sm"
            placeholder="Jumlah poin untuk ditukar"
          />
          <button onClick={handleRedeemPoints} className="bg-brand-accent text-white font-bold py-2 px-4 rounded-lg text-sm">
            Tukar
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

      <div className="space-y-2">
        <a href="#" className="flex justify-between items-center p-4 bg-brand-bg rounded-lg hover:bg-brand-subtle transition border border-brand-subtle">
          <span className="font-medium text-sm text-brand-text">
            <i className="fas fa-history mr-3 w-5 text-center text-brand-primary"></i>Riwayat Pesanan
          </span>
          <i className="fas fa-chevron-right text-brand-text-light text-xs"></i>
        </a>
        <a href="#" onClick={() => navigateTo('wishlist')} className="flex justify-between items-center p-4 bg-brand-bg rounded-lg hover:bg-brand-subtle transition border border-brand-subtle">
          <span className="font-medium text-sm text-brand-text">
            <i className="fas fa-heart mr-3 w-5 text-center text-brand-primary"></i>Wishlist
          </span>
          <i className="fas fa-chevron-right text-brand-text-light text-xs"></i>
        </a>
        <a href="#" className="flex justify-between items-center p-4 bg-brand-bg rounded-lg hover:bg-brand-subtle transition border border-brand-subtle">
          <span className="font-medium text-sm text-brand-text">
            <i className="fas fa-map-marker-alt mr-3 w-5 text-center text-brand-primary"></i>Alamat Pengiriman
          </span>
          <i className="fas fa-chevron-right text-brand-text-light text-xs"></i>
        </a>
        <a href="#" className="flex justify-between items-center p-4 bg-brand-bg rounded-lg hover:bg-brand-subtle transition border border-brand-subtle">
          <span className="font-medium text-sm text-brand-text">
            <i className="fas fa-cog mr-3 w-5 text-center text-brand-primary"></i>Pengaturan
          </span>
          <i className="fas fa-chevron-right text-brand-text-light text-xs"></i>
        </a>
        <a href="#" onClick={logout} className="flex justify-between items-center p-4 bg-brand-bg rounded-lg hover:bg-brand-subtle transition text-red-500 border border-brand-subtle">
          <span className="font-medium text-sm">
            <i className="fas fa-sign-out-alt mr-3 w-5 text-center"></i>Keluar
          </span>
        </a>
      </div>
    </section>
  );
};

export default Profile;