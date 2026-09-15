'use client';

import React from 'react';
import { Plus, Package } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/currency';

export default function ProductGrid({ products, onAddToCart }) {
  const { currency } = useAuth();

  if (!products || products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-slate-800/40 rounded-2xl border border-slate-700/60 p-6 text-center">
        <Package className="w-12 h-12 text-slate-500 mb-3" />
        <h4 className="text-white font-semibold text-base">No Products Found</h4>
        <p className="text-slate-400 text-xs mt-1">Try selecting a different category or clearing your search filter.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-2.5 sm:gap-3">
      {products.map((product) => {
        const priceFormatted = (product.priceInCents / 100).toFixed(2);
        const categoryColor = product.categoryId?.colorCode || '#3B82F6';

        return (
          <button
            key={product._id}
            type="button"
            onClick={() => onAddToCart(product)}
            className="group relative flex flex-col justify-between p-3.5 bg-slate-800/80 hover:bg-slate-750 active:scale-[0.98] border border-slate-700/70 hover:border-amber-500/80 rounded-2xl text-left transition-all duration-150 shadow-sm hover:shadow-md cursor-pointer select-none"
          >
            {/* Top Row: Category tag and SKU */}
            <div className="flex items-center justify-between w-full mb-2">
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white tracking-wider uppercase truncate max-w-[110px]"
                style={{ backgroundColor: categoryColor }}
              >
                {product.categoryNameSnapshot || product.categoryId?.name || 'Item'}
              </span>
              <span className="text-[10px] font-mono text-slate-400">{product.sku}</span>
            </div>

            {/* Middle: Product Name */}
            <div className="my-1">
              <h3 className="text-white font-semibold text-sm leading-snug line-clamp-2 group-hover:text-amber-400 transition-colors">
                {product.name}
              </h3>
            </div>

            {/* Bottom Row: Price and Quick Add */}
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-700/50 w-full">
              <span className="text-amber-400 font-extrabold text-base tracking-tight">
                {formatCurrency(product.priceInCents, currency)}
              </span>
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 group-hover:bg-amber-500 text-amber-400 group-hover:text-black flex items-center justify-center transition-colors">
                <Plus className="w-4 h-4" />
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
