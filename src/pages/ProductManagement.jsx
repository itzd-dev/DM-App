import React, { useState, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';

const ProductManagement = () => {
  const { products, formatRupiah, addProduct, editProduct, deleteProduct, toggleProductAvailability, updateProductStock } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [stockToAdd, setStockToAdd] = useState(0);
  const [tempObjectUrl, setTempObjectUrl] = useState(null);

  const openModal = (product = null) => {
    if (product) {
      setFormData(product);
    } else {
      setFormData({ name: '', category: '', price: 0, description: '', image: '', isAvailable: true, currentStock: 0 }); // Initialize currentStock for new products
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({});
    // Revoke temporary object URL to prevent memory leaks
    if (tempObjectUrl) {
      try { URL.revokeObjectURL(tempObjectUrl); } catch {}
      setTempObjectUrl(null);
    }
  };

  const openStockModal = (productId) => {
    setSelectedProductId(productId);
    setStockToAdd(0); // Reset stock to add
    setIsStockModalOpen(true);
  };

  const closeStockModal = () => {
    setIsStockModalOpen(false);
    setSelectedProductId(null);
    setStockToAdd(0);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStockInputChange = (e) => {
    setStockToAdd(Number(e.target.value));
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const newImage = e.target.files[0];
      // Revoke previous preview if any
      if (tempObjectUrl) {
        try { URL.revokeObjectURL(tempObjectUrl); } catch {}
      }
      const objUrl = URL.createObjectURL(newImage);
      setTempObjectUrl(objUrl);
      setFormData(prev => ({ ...prev, image: objUrl }));
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (formData.id) { // Editing existing product
      editProduct(formData.id, formData);
    } else { // Adding new product
      addProduct(formData);
    }
    closeModal();
  };

  const handleAddStock = () => {
    if (selectedProductId && stockToAdd > 0) {
      updateProductStock(selectedProductId, stockToAdd);
      closeStockModal();
    }
  };

  const handleDelete = (productId) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
      deleteProduct(productId);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-brand-primary">Manajemen Produk</h2>
        <button onClick={() => openModal()} className="bg-brand-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-opacity-90 transition text-sm">
          + Tambah Produk
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="space-y-3">
          {products.map((product, index) => (
            <div key={product.id} className="border border-brand-subtle rounded-lg p-3 flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <span className="font-bold text-brand-text text-lg w-12 text-center">{product.id}.</span>
                <img src={product.image} alt={product.name} className="w-16 h-16 rounded-md object-cover" />
                <div>
                  <p className="font-bold text-brand-text">{product.name}</p>
                  <p className="text-sm text-brand-text-light">{product.category} / {formatRupiah(product.price)}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${product.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {product.isAvailable ? 'Tersedia' : 'Stok Habis'}
                    </span>
                    <span className={"text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700"}>
                      Stok: {product.currentStock}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <button onClick={() => openModal(product)} className="bg-blue-500 text-white px-3 py-1 rounded-lg text-xs">Edit</button>
                <button onClick={() => openStockModal(product.id)} className="bg-purple-500 text-white px-3 py-1 rounded-lg text-xs">Tambah Stok</button> {/* Open stock modal */}
                <button onClick={() => toggleProductAvailability(product.id)} className={`${product.isAvailable ? 'bg-orange-500' : 'bg-green-500'} text-white px-3 py-1 rounded-lg text-xs`}>
                  {product.isAvailable ? 'Stok Habis' : 'Tersedia'}
                </button>
                <button onClick={() => handleDelete(product.id)} className="bg-red-500 text-white px-3 py-1 rounded-lg text-xs">Hapus</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
            <h3 className="text-lg font-bold text-brand-primary mb-4">
              {formData.id ? 'Edit Produk' : 'Tambah Produk Baru'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left side for Image */}
                <div className="md:col-span-1">
                  <label className="text-sm font-medium text-brand-text-light">Gambar Produk (1:1)</label>
                  <div className="mt-1 w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                    {formData.image ? (
                      <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-gray-400">Preview Gambar</span>
                    )}
                  </div>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="mt-2 text-sm" />
                  <p className="text-xs text-gray-500 mt-1">*Gambar tidak tersimpan permanen. Akan hilang jika aplikasi di-refresh.</p>
                </div>

                {/* Right side for details */}
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-brand-text-light">Nama Produk</label>
                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full mt-1 px-4 py-2 border border-brand-subtle rounded-lg" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-brand-text-light">Kategori</label>
                      <input type="text" name="category" value={formData.category} onChange={handleInputChange} className="w-full mt-1 px-4 py-2 border border-brand-subtle rounded-lg" required />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-brand-text-light">Harga</label>
                      <input type="number" name="price" value={formData.price} onChange={handleInputChange} className="w-full mt-1 px-4 py-2 border border-brand-subtle rounded-lg" required />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-brand-text-light">Stok Saat Ini</label> {/* Stock input */}
                      <input type="number" name="currentStock" value={formData.currentStock} onChange={handleInputChange} className="w-full mt-1 px-4 py-2 border border-brand-subtle rounded-lg" required />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-brand-text-light">Deskripsi</label>
                    <textarea name="description" rows="3" value={formData.description} onChange={handleInputChange} className="w-full mt-1 px-4 py-2 border border-brand-subtle rounded-lg"></textarea>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-brand-subtle mt-6">
                <button type="button" onClick={closeModal} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg">Batal</button>
                <button type="submit" className="bg-brand-primary text-white font-bold py-2 px-4 rounded-lg">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Input Modal */}
      {isStockModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-brand-primary mb-4">Tambah Stok Produk</h3>
            <div className="mb-4">
              <label className="text-sm font-medium text-brand-text-light">Jumlah Stok yang Ditambahkan</label>
              <input
                type="number"
                value={stockToAdd}
                onChange={handleStockInputChange}
                className="w-full mt-1 px-4 py-2 border border-brand-subtle rounded-lg"
                min="1"
                required
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button type="button" onClick={closeStockModal} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg">Batal</button>
              <button type="button" onClick={handleAddStock} className="bg-brand-primary text-white font-bold py-2 px-4 rounded-lg">Tambah</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;
