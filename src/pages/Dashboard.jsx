import React, { useMemo } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const { orders, formatRupiah, exportOrdersToCsv } = useAppContext();

  // Memoized data processing for charts
  const { salesData, topProducts } = useMemo(() => {
    // Process sales data
    const salesByDate = {};
    orders.forEach(order => {
      if (order.status === 'Selesai') {
        const date = order.date;
        if (!salesByDate[date]) {
          salesByDate[date] = { date, total: 0 };
        }
        salesByDate[date].total += order.total;
      }
    });
    const sortedSalesData = Object.values(salesByDate).sort((a, b) => new Date(a.date) - new Date(b.date));

    // Process top products data
    const productCounts = {};
    orders.forEach(order => {
      if (order.status === 'Selesai') {
        order.items.forEach(item => {
          if (!productCounts[item.name]) {
            productCounts[item.name] = { name: item.name, jumlah: 0 };
          }
          productCounts[item.name].jumlah += item.quantity;
        });
      }
    });
    const sortedTopProducts = Object.values(productCounts).sort((a, b) => b.jumlah - a.jumlah).slice(0, 5);

    return { salesData: sortedSalesData, topProducts: sortedTopProducts };
  }, [orders]);

  const totalRevenue = salesData.reduce((sum, data) => sum + data.total, 0);
  const totalOrders = orders.length;

  return (
    <div>
      <h2 className="text-2xl font-bold text-brand-primary mb-4">Dashboard</h2>
      <button onClick={exportOrdersToCsv} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition text-sm mb-6">
        <i className="fas fa-file-excel mr-2"></i> Export Laporan CSV
      </button>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h4 className="text-sm font-medium text-brand-text-light mb-1">Total Pendapatan (Selesai)</h4>
          <p className="text-3xl font-bold text-brand-primary">{formatRupiah(totalRevenue)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md md:justify-self-end">
          <h4 className="text-sm font-medium text-brand-text-light mb-1">Total Orderan</h4>
          <p className="text-3xl font-bold text-brand-primary">{totalOrders}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md md:col-span-2">
          <h4 className="text-sm font-medium text-brand-text-light mb-1">Produk Terlaris</h4>
          <p className="text-2xl font-bold text-brand-primary">{topProducts[0]?.name || 'N/A'}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Sales Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-brand-text mb-4">Grafik Penjualan Harian</h3>
          <ResponsiveContainer width="100%" aspect={1.6}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis tickFormatter={(value) => new Intl.NumberFormat('id-ID').format(value)} fontSize={12} />
              <Tooltip formatter={(value) => formatRupiah(value)} />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#634832" strokeWidth={2} name="Pendapatan" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-brand-text mb-4">5 Produk Terlaris</h3>
          <ResponsiveContainer width="100%" aspect={1.6}>
            <BarChart data={topProducts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={120} fontSize={12} />
              <Tooltip formatter={(value) => `${value} pcs`} />
              <Legend />
              <Bar dataKey="jumlah" fill="#E67E22" name="Jumlah Terjual" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
