
import React from 'react';
import Header from './Header';
import BottomNav from './BottomNav';

const Layout = ({ children }) => {
  return (
    <div className="mobile-container relative pb-24 dark:text-slate-100">
      <Header />
      <main id="main-content" className="relative">
        {children}
      </main>
      <BottomNav />
    </div>
  );
};

export default Layout;
