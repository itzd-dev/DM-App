
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useAppContext } from '../contexts/AppContext';
import ProductCard from '../components/ProductCard';
import SkeletonCard from '../components/SkeletonCard';

const Home = () => {
  const { products, setCurrentCategoryFilter, navigateTo, isLoading } = useAppContext();

  const filterByCategory = (category) => {
    setCurrentCategoryFilter(category);
    navigateTo('products');
  }

  const featuredProducts = products.filter(p => p.featured);

  return (
    <section id="page-home" className="page-section p-4">
      <Helmet>
        <title>Dapur Merifa - Home Made Premium Frozen Food</title>
        <meta name="description" content="Selamat datang di Dapur Merifa. Kami menyediakan aneka frozen food premium buatan sendiri dari bahan-bahan berkualitas. Pesan sekarang!" />
      </Helmet>
      <div
        className="relative rounded-lg overflow-hidden mb-6 text-white h-48 flex flex-col justify-end p-5 text-left"
        style={{
          background: `linear-gradient(to top, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.1)), url('https://placehold.co/375x192/EAE0D5/3D2C1D?text=Bahan+Segar') center center/cover`,
        }}
      >
        <h2 className="text-lg font-bold leading-tight">
          Home Made Premium <br /> Frozen Food
        </h2>
        <div className="flex space-x-4 mt-2 text-xs font-light">
          <span>✓ Bahan Alami</span>
          <span>✓ Tanpa MSG</span>
          <span>✓ Resep Keluarga</span>
        </div>
      </div>
      <h3 className="text-lg font-semibold text-brand-primary mb-3">
        Kategori
      </h3>
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div onClick={() => filterByCategory('Dimsum')} className="bg-brand-bg border border-brand-subtle p-2 rounded-lg text-center text-xs font-medium text-brand-text-light cursor-pointer hover:bg-brand-subtle hover:text-brand-primary transition">
          Dimsum
        </div>
        <div onClick={() => filterByCategory('Gohyong')} className="bg-brand-bg border border-brand-subtle p-2 rounded-lg text-center text-xs font-medium text-brand-text-light cursor-pointer hover:bg-brand-subtle hover:text-brand-primary transition">
          Gohyong
        </div>
        <div onClick={() => filterByCategory('Nugget')} className="bg-brand-bg border border-brand-subtle p-2 rounded-lg text-center text-xs font-medium text-brand-text-light cursor-pointer hover:bg-brand-subtle hover:text-brand-primary transition">
          Nugget
        </div>
        <div onClick={() => filterByCategory('Lainnya')} className="bg-brand-bg border border-brand-subtle p-2 rounded-lg text-center text-xs font-medium text-brand-text-light cursor-pointer hover:bg-brand-subtle hover:text-brand-primary transition">
          Lainnya
        </div>
      </div>
      <h3 className="text-lg font-semibold text-brand-primary mb-3">
        Menu Andalan Kami
      </h3>
      <div id="featured-products" className="grid grid-cols-2 gap-4">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          featuredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))
        )}
      </div>
    </section>
  );
};

export default Home;
