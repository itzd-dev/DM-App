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
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 bg-white flex justify-around w-full max-w-[375px] z-20 border-t border-brand-subtle md:hidden">
      {navItems.map(item => (
        <button
          key={item.id}
          onClick={() => setAdminPage(item.id)}
          className={`flex-1 py-3 text-center ${adminPage === item.id ? 'text-brand-primary' : 'text-brand-text-light'}`}>
          <i className={`fas ${item.icon} text-lg`}></i>
          <span className={`block text-xs ${adminPage === item.id ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
        </button>
      ))}
    </nav>
  );
};

export default AdminBottomNav;
