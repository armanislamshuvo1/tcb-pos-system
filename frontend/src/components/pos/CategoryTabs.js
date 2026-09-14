'use client';

import React from 'react';

export default function CategoryTabs({ categories, activeCategoryId, onSelectCategory }) {
  return (
    <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
      <button
        type="button"
        onClick={() => onSelectCategory('all')}
        className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all shadow-sm ${
          activeCategoryId === 'all'
            ? 'bg-amber-500 text-black shadow-amber-500/20'
            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
        }`}
      >
        ALL PRODUCTS
      </button>

      {categories.map((category) => {
        const isActive = activeCategoryId === category._id;
        return (
          <button
            key={category._id}
            type="button"
            onClick={() => onSelectCategory(category._id)}
            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex items-center space-x-2 shadow-sm ${
              isActive
                ? 'bg-amber-500 text-black shadow-amber-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: category.colorCode || '#3B82F6' }}
            />
            <span>{category.name.toUpperCase()}</span>
          </button>
        );
      })}
    </div>
  );
}
