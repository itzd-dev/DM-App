import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import AdminBottomNav from './AdminBottomNav';
import Button from './ui/Button';

const AdminLayout = ({ children }) => {
  const { adminPage, setAdminPage, logout, toggleTheme, theme } = useAppContext();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-tachometer-alt' },
    { id: 'orders', label: 'Manajemen Order', icon: 'fa-box-open' },
    { id: 'products', label: 'Manajemen Produk', icon: 'fa-cogs' },
    { id: 'customers', label: 'Manajemen Pelanggan', icon: 'fa-users' },
    { id: 'promotions', label: 'Promosi', icon: 'fa-tags' },
    { id: 'partners', label: 'Mitra', icon: 'fa-handshake' },
  ];

  return (
    <div className="flex flex-col h-screen mobile-container pb-16 dark:text-slate-100">
      <header className="sticky top-0 bg-brand-primary dark:bg-[#2a211a] text-white p-4 flex justify-between items-center shadow-md z-20 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-white">
            <i className="fas fa-bars"></i>
          </button>
          <h1 className="text-lg font-bold">Admin Panel</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="text-white/90 hover:text-white transition-transform hover:scale-110"
            aria-label="Toggle theme"
          >
            <i className={`fas ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
          </button>
          <Button onClick={logout} variant="danger" className="px-3 py-1.5 text-sm">
            Logout
          </Button>
        </div>
      </header>
      <div className="flex flex-grow overflow-hidden">
        <aside className="hidden"></aside>
        <main className="flex-grow p-4 overflow-y-auto bg-brand-bg dark:bg-[#211a15] transition-colors">
          {children}
        </main>
      </div>
      <AdminBottomNav />
    </div>
  );
};

export default AdminLayout;
