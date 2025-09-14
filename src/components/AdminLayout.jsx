import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import AdminBottomNav from './AdminBottomNav';

const AdminLayout = ({ children }) => {
  const { adminPage, setAdminPage, logout } = useAppContext();
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
    <div className="flex flex-col h-screen mobile-container pb-16 md:pb-0">
      <header className="sticky top-0 bg-brand-primary text-white p-4 flex justify-between items-center shadow-md z-20 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-white">
            <i className="fas fa-bars"></i>
          </button>
          <h1 className="text-lg font-bold">Admin Panel</h1>
        </div>
        <button onClick={logout} className="text-sm font-semibold">Logout</button>
      </header>
      <div className="flex flex-grow overflow-hidden">
        <aside className={`hidden md:block bg-gray-100 border-r border-brand-subtle transition-all duration-300 flex-shrink-0 ${isSidebarOpen ? 'w-56' : 'w-20'}`}>
          <nav className="p-4 space-y-2">
            {navItems.map(item => (
              <button 
                key={item.id} 
                onClick={() => setAdminPage(item.id)}
                title={item.label}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-3 overflow-hidden ${adminPage === item.id ? 'bg-brand-subtle text-brand-primary' : 'text-brand-text-light hover:bg-gray-200'}`}>
                <i className={`fas ${item.icon} w-5 text-center text-lg`}></i>
                <span className={`${isSidebarOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}>{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>
        <main className="flex-grow p-4 md:p-6 overflow-y-auto bg-brand-bg">
          {children}
        </main>
      </div>
      <AdminBottomNav />
    </div>
  );
};

export default AdminLayout;
