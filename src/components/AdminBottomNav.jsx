import React from 'react';
import { useAppContext } from '../contexts/AppContext';

const AdminBottomNav = () => {
  const { adminPage, setAdminPage } = useAppContext();

  const navItems = [
    { id: 'dashboard', icon: 'fa-tachometer-alt', label: 'Dashboard' },
    { id: 'orders', icon: 'fa-box-open', label: 'Order' },
    { id: 'products', icon: 'fa-cogs', label: 'Produk' },
    { id: 'customers', icon: 'fa-users', label: 'Pelanggan' },
    { id: 'promotions', icon: 'fa-tags', label: 'Promo' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#2a211a] flex justify-around max-w-[375px] mx-auto z-20 border-t border-brand-subtle dark:border-white/10 md:hidden">
      {navItems.map(item => (
        <button
          key={item.id}
          onClick={() => setAdminPage(item.id)}
          className={`flex-1 py-3 text-center transition-colors ${adminPage === item.id ? 'text-brand-primary dark:text-amber-200' : 'text-brand-text-light dark:text-slate-300 hover:text-brand-primary'}`}>
          <i className={`fas ${item.icon} text-lg`}></i>
          <span className={`block text-xs ${adminPage === item.id ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
        </button>
      ))}
    </nav>
  );
};

export default AdminBottomNav;
