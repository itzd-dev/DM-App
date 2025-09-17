import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';

const Partners = () => {
  const { partners, addPartner, editPartner, deletePartner } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', contact: '', notes: '' });
  const [editingId, setEditingId] = useState(null);

  const openAdd = () => {
    setEditingId(null);
    setFormData({ name: '', contact: '', notes: '' });
    setIsModalOpen(true);
  };

  const openEdit = (p) => {
    setEditingId(p.id);
    setFormData({ name: p.name || '', contact: p.contact || '', notes: p.notes || '' });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: '', contact: '', notes: '' });
  };

  const handleInput = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.name) return;
    if (editingId) {
      editPartner(editingId, formData);
    } else {
      addPartner(formData);
    }
    closeModal();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-brand-primary">Mitra</h2>
        <button onClick={openAdd} className="bg-brand-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-opacity-90 transition text-sm">+ Tambah Mitra</button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4">
        {partners.length === 0 ? (
          <p className="text-sm text-brand-text-light">Belum ada mitra terdaftar.</p>
        ) : (
          <div className="space-y-3">
            {partners.map((p, idx) => (
              <div key={p.id} className="border border-brand-subtle rounded-lg p-3 flex justify-between items-start">
                <div>
                  <p className="font-bold text-brand-text">{p.name}</p>
                  {p.contact && <p className="text-sm text-brand-text-light">Kontak: {p.contact}</p>}
                  {p.notes && <p className="text-xs text-brand-text-light mt-1">Catatan: {p.notes}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(p)} className="bg-blue-500 text-white px-3 py-1 rounded-lg text-xs">Edit</button>
                  <button onClick={() => deletePartner(p.id)} className="bg-red-500 text-white px-3 py-1 rounded-lg text-xs">Hapus</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-brand-primary mb-4">{editingId ? 'Edit Mitra' : 'Tambah Mitra'}</h3>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="text-sm font-medium text-brand-text-light">Nama Mitra</label>
                <input type="text" name="name" value={formData.name} onChange={handleInput} className="w-full mt-1 px-4 py-2 border border-brand-subtle rounded-lg" required />
              </div>
              <div>
                <label className="text-sm font-medium text-brand-text-light">Kontak</label>
                <input type="text" name="contact" value={formData.contact} onChange={handleInput} className="w-full mt-1 px-4 py-2 border border-brand-subtle rounded-lg" placeholder="Nomor/Email" />
              </div>
              <div>
                <label className="text-sm font-medium text-brand-text-light">Catatan</label>
                <textarea name="notes" rows="3" value={formData.notes} onChange={handleInput} className="w-full mt-1 px-4 py-2 border border-brand-subtle rounded-lg" placeholder="Keterangan tambahan"></textarea>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-brand-subtle">
                <button type="button" onClick={closeModal} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg">Batal</button>
                <button type="submit" className="bg-brand-primary text-white font-bold py-2 px-4 rounded-lg">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Partners;

