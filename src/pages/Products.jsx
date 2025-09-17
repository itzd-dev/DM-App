
import React from 'react';
import { useAppContext } from '../contexts/AppContext';
import ProductCard from '../components/ProductCard';
import SkeletonCard from '../components/SkeletonCard';

const Products = () => {
  const { products, currentCategoryFilter, isLoading } = useAppContext();

  const productsToRender = currentCategoryFilter
    ? products.filter((p) => p.category === currentCategoryFilter)
    : products;

  return (
    <section id="page-products" className="page-section p-4">
      <div id="all-products" className="grid grid-cols-2 gap-4">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          productsToRender.map(product => (
            <ProductCard key={product.id} product={product} />
          ))
        )}
      </div>
    </section>
  );
};

export default Products;
