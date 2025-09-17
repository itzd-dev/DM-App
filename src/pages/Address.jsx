import React, { useState, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';

const Address = () => {
  const { loggedInUser, customerProfiles, saveShippingAddress, goBack } = useAppContext();
  const prof = loggedInUser?.email ? (customerProfiles[loggedInUser.email] || {}) : {};
  const [form, setForm] = useState({ recipient: '', phone: '', line: '', city: '', postal: '' });

  useEffect(() => {
    if (prof && prof.shippingAddress) {
      setForm({
        recipient: prof.shippingAddress.recipient || '',
        phone: prof.shippingAddress.phone || '',
        line: prof.shippingAddress.line || '',
        city: prof.shippingAddress.city || '',
        postal: prof.shippingAddress.postal || '',
      });
    }
  }, [loggedInUser?.email]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const onSubmit = (e) => { e.preventDefault(); saveShippingAddress(form); };

  return (
    <section className="page-section p-4">
      <h2 className="text-xl font-bold text-brand-primary mb-4">Alamat Pengiriman</h2>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="text-sm text-brand-text-light">Penerima</label>
          <input name="recipient" value={form.recipient} onChange={onChange} className="w-full mt-1 px-4 py-2 border border-brand-subtle rounded-lg" required />
        </div>
        <div>
          <label className="text-sm text-brand-text-light">Telepon</label>
          <input name="phone" value={form.phone} onChange={onChange} className="w-full mt-1 px-4 py-2 border border-brand-subtle rounded-lg" required />
        </div>
        <div>
          <label className="text-sm text-brand-text-light">Alamat</label>
          <textarea name="line" value={form.line} onChange={onChange} rows="3" className="w-full mt-1 px-4 py-2 border border-brand-subtle rounded-lg" required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-brand-text-light">Kota</label>
            <input name="city" value={form.city} onChange={onChange} className="w-full mt-1 px-4 py-2 border border-brand-subtle rounded-lg" required />
          </div>
          <div>
            <label className="text-sm text-brand-text-light">Kode Pos</label>
            <input name="postal" value={form.postal} onChange={onChange} className="w-full mt-1 px-4 py-2 border border-brand-subtle rounded-lg" required />
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={goBack} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg">Kembali</button>
          <button type="submit" className="bg-brand-primary text-white font-bold py-2 px-4 rounded-lg">Simpan</button>
        </div>
      </form>
    </section>
  );
};

export default Address;

