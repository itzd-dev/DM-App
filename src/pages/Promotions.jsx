import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';

const Promotions = () => {
  const { promotions, addPromotion, deletePromotion } = useAppContext();
  const [code, setCode] = useState('');
  const [discount, setDiscount] = useState('');
  const [type, setType] = useState('percentage');

  const handleAddPromotion = (e) => {
    e.preventDefault();
    if (!code || !discount) {
      alert('Kode dan nilai diskon harus diisi.');
      return;
    }

    const newPromo = {
      code: code.toUpperCase(),
      discount: type === 'percentage' ? parseFloat(discount) / 100 : parseInt(discount),
      type: type,
    };

    addPromotion(newPromo);
    setCode('');
    setDiscount('');
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-brand-primary mb-6">Manajemen Promosi</h2>
      
      {/* Add Promotion Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold text-brand-text mb-3">Tambah Kode Promo Baru</h3>
        <form onSubmit={handleAddPromotion} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-1">
            <label className="text-sm font-medium text-brand-text-light">Kode Promo</label>
            <input type="text" value={code} onChange={(e) => setCode(e.target.value)} className="w-full mt-1 px-4 py-2 border border-brand-subtle rounded-lg" placeholder="e.g., HEMAT10" />
          </div>
          <div className="md:col-span-1">
            <label className="text-sm font-medium text-brand-text-light">Tipe</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full mt-1 px-4 py-2 border border-brand-subtle rounded-lg bg-white">
              <option value="percentage">Persentase (%)</option>
              <option value="fixed">Potongan Tetap (Rp)</option>
            </select>
          </div>
          <div className="md:col-span-1">
            <label className="text-sm font-medium text-brand-text-light">Nilai</label>
            <input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} className="w-full mt-1 px-4 py-2 border border-brand-subtle rounded-lg" placeholder={type === 'percentage' ? '10' : '10000'} />
          </div>
          <div className="md:col-span-1">
            <button type="submit" className="w-full bg-brand-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-opacity-90 transition">Tambah</button>
          </div>
        </form>
      </div>

      {/* List of Promotions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-brand-text mb-3">Daftar Kode Promo Aktif</h3>
        <div className="space-y-3">
          {promotions.map(promo => (
            <div key={promo.code} className="border border-brand-subtle rounded-lg p-3 flex justify-between items-center">
              <div>
                <p className="font-bold text-brand-text text-lg">{promo.code}</p>
                <p className="text-sm text-brand-text-light">
                  {promo.type === 'percentage' 
                    ? `Diskon ${promo.discount * 100}%` 
                    : `Potongan Rp ${promo.discount.toLocaleString('id-ID')}`}
                </p>
              </div>
              <button onClick={() => deletePromotion(promo.code)} className="bg-red-500 text-white px-3 py-1 rounded-lg text-xs">Hapus</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Promotions;