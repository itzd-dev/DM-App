import React from 'react';
import { useAppContext } from '../contexts/AppContext';
import AdminBottomNav from './AdminBottomNav';

const AdminLayout = ({ children }) => {
  const { logout } = useAppContext();

  return (
    <div className="flex flex-col h-screen mobile-container pb-16">
      <header className="sticky top-0 bg-brand-primary text-white p-4 flex justify-between items-center shadow-md z-20 flex-shrink-0">
        <h1 className="text-lg font-bold">Admin Panel</h1>
        <button onClick={logout} className="text-sm font-semibold">Logout</button>
      </header>
      <div className="flex flex-grow overflow-hidden">
        <main className="flex-grow p-4 overflow-y-auto bg-brand-bg">
          {children}
        </main>
      </div>
      <AdminBottomNav />
    </div>
  );
};

export default AdminLayout;
