import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../contexts/AppContext';
import ProductManagementSkeleton from '../components/ProductManagementSkeleton';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';
import { uploadImage } from '../lib/uploadImage';

const ProductManagement = () => {
  const {
    products,
    partners,
    formatRupiah,
    addProduct,
    editProduct,
    deleteProduct,
    toggleProductAvailability,
    updateProductStock,
    isLoading,
    showToast,
  } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [stockToAdd, setStockToAdd] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [openActionsId, setOpenActionsId] = useState(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isStockSaving, setIsStockSaving] = useState(false);
  const touchStoreRef = useRef({});

  const openModal = (product = null) => {
    if (product) {
      setFormData(product);
      setPreviewUrl(product.image || null);
    } else {
      setFormData({ name: '', category: '', price: 0, description: '', image: '', isAvailable: true, currentStock: 0, owner: '' }); // Initialize currentStock for new products
      setPreviewUrl(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({});
    if (previewUrl && previewUrl.startsWith('blob:')) {
      try { URL.revokeObjectURL(previewUrl); } catch {}
    }
    setPreviewUrl(null);
    setUploadingImage(false);
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

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (previewUrl && previewUrl.startsWith('blob:')) {
      try { URL.revokeObjectURL(previewUrl); } catch {}
    }

    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    setUploadingImage(true);

    try {
      showToast && showToast('Mengunggah gambar…');
      const uploadedUrl = await uploadImage(file);
      if (!uploadedUrl) throw new Error('URL gambar kosong');
      setFormData((prev) => ({ ...prev, image: uploadedUrl }));
      setPreviewUrl(uploadedUrl);
      showToast && showToast('Gambar berhasil diunggah');
    } catch (error) {
      console.error('[ProductManagement] upload image failed', error);
      showToast && showToast('Upload gambar gagal, coba lagi');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSavingProduct(true);
    try {
      if (formData.id) {
        await editProduct(formData.id, formData);
      } else {
        await addProduct(formData);
      }
      closeModal();
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleAddStock = async () => {
    if (selectedProductId && stockToAdd > 0) {
      setIsStockSaving(true);
      try {
        await updateProductStock(selectedProductId, stockToAdd);
        closeStockModal();
      } finally {
        setIsStockSaving(false);
      }
    }
  };

  const handleDelete = (productId) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
      deleteProduct(productId);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-brand-primary">Manajemen Produk</h2>
        <Button
          onClick={() => openModal()}
          disabled={isSavingProduct || isStockSaving || uploadingImage}
          className="px-3 py-2 text-sm"
        >
          + Tambah Produk
        </Button>
      </div>

      <div className="bg-white border border-brand-subtle rounded-lg shadow-md p-4">
        {isLoading ? (
          <ProductManagementSkeleton />
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-brand-text-light">
            <p className="font-medium">Belum ada produk yang tercatat.</p>
            <p className="text-sm mt-1">Gunakan tombol “+ Tambah Produk” untuk menambahkan data baru.</p>
          </div>
        ) : (
          <div className="space-y-3">
          {products.map((product) => (
            <div
              key={product.id}
              className="border border-brand-subtle rounded-lg p-3 bg-white transition-transform hover:-translate-y-1"
              onTouchStart={(e) => {
                const t = e.touches && e.touches[0];
                if (!t) return;
                touchStoreRef.current[product.id] = { x: t.clientX, y: t.clientY, time: Date.now() };
              }}
              onTouchEnd={(e) => {
                const start = touchStoreRef.current[product.id];
                const t = e.changedTouches && e.changedTouches[0];
                if (!start || !t) return;
                const dx = t.clientX - start.x;
                const dy = t.clientY - start.y;
                if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy)) {
                  setOpenActionsId((cur) => (cur === product.id ? null : product.id));
                }
              }}
              onClick={() => setOpenActionsId((cur) => (cur === product.id ? null : product.id))}
            >
              <div className="flex items-center space-x-3">
                <span className="font-bold text-brand-text text-lg w-12 text-center">{product.id}.</span>
                <img src={product.image} alt={product.name} className="w-16 h-16 rounded-md object-cover" />
                <div>
                  <p className="font-bold text-brand-text">{product.name}</p>
                  <p className="text-sm text-brand-text-light">{product.category} / {formatRupiah(product.price)}</p>
                  {product.owner && (
                    <p className="text-xs text-brand-text-light mt-0.5">Pemilik: <span className="font-medium text-brand-text">{product.owner}</span></p>
                  )}
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
              {/* Actions (swipe to reveal on mobile; always visible on desktop) */}
              <div className={`${openActionsId === product.id ? 'grid' : 'hidden'} grid-cols-2 gap-2 mt-3`}>
                <Button onClick={(e) => { e.stopPropagation(); openModal(product); }} variant="info" className="h-9 text-xs px-3">
                  Edit
                </Button>
                <Button onClick={(e) => { e.stopPropagation(); openStockModal(product.id); }} variant="purple" className="h-9 text-xs px-3">
                  Tambah Stok
                </Button>
                <Button
                  onClick={(e) => { e.stopPropagation(); toggleProductAvailability(product.id); }}
                  variant={product.isAvailable ? 'warning' : 'success'}
                  className="h-9 text-xs px-3"
                >
                  {product.isAvailable ? 'Stok Habis' : 'Tersedia'}
                </Button>
                <Button onClick={(e) => { e.stopPropagation(); handleDelete(product.id); }} variant="danger" className="h-9 text-xs px-3">
                  Hapus
                </Button>
              </div>
            </div>
          ))}
          </div>
        )}
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
                      {previewUrl || formData.image ? (
                        <img src={previewUrl || formData.image} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs text-gray-400">Preview Gambar</span>
                      )}
                    </div>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="mt-2 text-sm" />
                    <p className="text-xs text-gray-500 mt-1">
                      *Gambar otomatis diunggah ke Supabase Storage saat dipilih.
                    </p>
                    {uploadingImage && <p className="text-xs text-brand-primary mt-1">Mengunggah…</p>}
                  </div>

                {/* Right side for details */}
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-brand-text-light">Nama Produk</label>
                    <Input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-brand-text-light">Kategori</label>
                      <CategorySelect value={formData.category} onChange={(v) => setFormData(prev => ({ ...prev, category: v }))} products={products} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-brand-text-light">Harga</label>
                      <Input type="number" name="price" value={formData.price} onChange={handleInputChange} required />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-brand-text-light">Stok Saat Ini</label> {/* Stock input */}
                      <Input type="number" name="currentStock" value={formData.currentStock} onChange={handleInputChange} required />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-brand-text-light">Pemilik Produk (Mitra)</label>
                    <PartnerSelect value={formData.owner || ''} onChange={(v) => setFormData(prev => ({ ...prev, owner: v }))} partnersLocal={partners} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-brand-text-light">Deskripsi</label>
                    <Textarea name="description" rows="3" value={formData.description} onChange={handleInputChange} />
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-brand-subtle mt-6">
                <Button
                  type="button"
                  onClick={closeModal}
                  variant="secondary"
                  disabled={isSavingProduct || uploadingImage}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isSavingProduct || uploadingImage}
                >
                  {isSavingProduct ? 'Menyimpan…' : 'Simpan'}
                </Button>
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
              <Input
                type="number"
                value={stockToAdd}
                onChange={handleStockInputChange}
                min="1"
                required
              />
            </div>
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                onClick={closeStockModal}
                variant="secondary"
                disabled={isStockSaving}
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={handleAddStock}
                disabled={isStockSaving}
              >
                {isStockSaving ? 'Menyimpan…' : 'Tambah'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;

// Helper component: category dropdown built from existing products
const CategorySelect = ({ value, onChange, products }) => {
  const categories = Array.from(new Set((products || []).map(p => p.category).filter(Boolean))).sort();
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full mt-1 px-4 py-2 border border-brand-subtle rounded-lg bg-white"
      required
    >
      <option value="" disabled>Pilih kategori</option>
      {categories.map((c) => (
        <option key={c} value={c}>{c}</option>
      ))}
    </select>
  );
};

// Helper component: partner dropdown fetched from API (fallback ke local partners)
const PartnerSelect = ({ value, onChange, partnersLocal = [] }) => {
  const [options, setOptions] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch('/api/partners');
        if (res.ok) {
          const rows = await res.json();
          if (active && Array.isArray(rows)) {
            setOptions(rows.map(r => r.name).filter(Boolean));
            setLoading(false);
            return;
          }
        }
      } catch (_) {}
      // fallback ke partnersLocal
      if (active) {
        setOptions(Array.from(new Set(partnersLocal.map(p => p.name).filter(Boolean))).sort());
        setLoading(false);
      }
    };
    load();
    return () => { active = false };
  }, [partnersLocal]);

  if (loading) {
    return <div className="mt-1 text-xs text-brand-text-light">Memuat mitra…</div>;
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full mt-1 px-4 py-2 border border-brand-subtle rounded-lg bg-white"
    >
      <option value="">Pilih mitra (opsional)</option>
      {options.map((name) => (
        <option key={name} value={name}>{name}</option>
      ))}
    </select>
  );
};
