// dapurmerifa/api/products.js

// Ini adalah contoh serverless function untuk Vercel.
// Anda akan mengembangkan ini lebih lanjut untuk berinteraksi dengan database Anda (misalnya Supabase).

module.exports = async (req, res) => {
  // Mengizinkan semua origin untuk pengembangan.
  // Di produksi, Anda harus membatasi ini ke domain frontend Anda.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests (OPTIONS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    // Contoh data dummy. Nantinya akan diganti dengan data dari database.
    const products = [
      { id: 1, name: "Dimsum Ayam (dari API)", price: 20000, currentStock: 95, isAvailable: true, stockHistory: [{ date: '2025-09-01', quantity: 100, type: 'initial' }] },
      { id: 2, name: "Risol Beef Mayo (dari API)", price: 16000, currentStock: 120, isAvailable: true, stockHistory: [{ date: '2025-09-01', quantity: 120, type: 'initial' }] },
      { id: 3, name: "Produk Baru (dari API)", price: 25000, currentStock: 50, isAvailable: true, stockHistory: [{ date: '2025-09-01', quantity: 50, type: 'initial' }] },
    ];
    res.status(200).json(products);
  } else if (req.method === 'POST') {
    // Contoh untuk menambahkan produk baru
    const newProduct = req.body;
    // Di sini Anda akan menyimpan newProduct ke database
    // Untuk contoh ini, kita hanya mengembalikan produk yang diterima dengan ID dummy
    const addedProduct = { ...newProduct, id: Date.now() };
    res.status(201).json(addedProduct);
  } else {
    res.status(405).json({ message: 'Metode tidak diizinkan.' });
  }
};
