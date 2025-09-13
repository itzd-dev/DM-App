
import React from 'react';

const SkeletonCard = () => {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <div className="w-full h-32 skeleton"></div>
      <div className="p-3">
        <div className="h-4 w-3/4 skeleton mb-2"></div>
        <div className="h-4 w-1/2 skeleton"></div>
        <div className="h-8 w-full skeleton mt-4"></div>
      </div>
    </div>
  );
};

export default SkeletonCard;
