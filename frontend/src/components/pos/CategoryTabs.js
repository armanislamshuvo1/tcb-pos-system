'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function CategoryTabs({ categories, activeCategoryId, onSelectCategory }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollability = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 5);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 5);
  }, []);

  useEffect(() => {
    // Check after DOM layout paint
    const timer = setTimeout(checkScrollability, 100);
    window.addEventListener('resize', checkScrollability);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkScrollability);
    };
  }, [categories, checkScrollability]);

  const scrollByAmount = (amount) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
      setTimeout(checkScrollability, 300);
    }
  };

  // Convert vertical mouse wheel into horizontal scroll over category tabs
  const handleWheel = (e) => {
    if (scrollRef.current && e.deltaY !== 0) {
      scrollRef.current.scrollLeft += e.deltaY;
      checkScrollability();
    }
  };

  const hasMultipleCategories = categories && categories.length > 3;

  return (
    <div className="relative flex items-center w-full">
      {/* Scroll Left Button */}
      {hasMultipleCategories && (
        <button
          type="button"
          onClick={() => scrollByAmount(-220)}
          aria-label="Scroll categories left"
          className={`shrink-0 mr-1.5 w-8 h-8 rounded-xl border flex items-center justify-center transition-all cursor-pointer shadow-sm ${
            canScrollLeft
              ? 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-slate-700 active:scale-95'
              : 'bg-slate-900/60 text-slate-600 border-slate-800/80 cursor-not-allowed'
          }`}
          disabled={!canScrollLeft}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}

      {/* Categories Scrollable Row */}
      <div
        ref={scrollRef}
        onScroll={checkScrollability}
        onWheel={handleWheel}
        className="flex-1 flex items-center space-x-2 overflow-x-auto pb-1.5 pt-0.5 scroll-smooth touch-pan-x scrollbar-thin"
      >
        <button
          type="button"
          onClick={() => onSelectCategory('all')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all shrink-0 shadow-sm cursor-pointer ${
            activeCategoryId === 'all'
              ? 'bg-amber-500 text-black shadow-amber-500/20'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-750 hover:text-white border border-slate-700/60'
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
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center space-x-2 shrink-0 shadow-sm cursor-pointer ${
                isActive
                  ? 'bg-amber-500 text-black shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-750 hover:text-white border border-slate-700/60'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                style={{ backgroundColor: category.colorCode || '#3B82F6' }}
              />
              <span>{category.name.toUpperCase()}</span>
            </button>
          );
        })}
      </div>

      {/* Scroll Right Button */}
      {hasMultipleCategories && (
        <button
          type="button"
          onClick={() => scrollByAmount(220)}
          aria-label="Scroll categories right"
          className={`shrink-0 ml-1.5 w-8 h-8 rounded-xl border flex items-center justify-center transition-all cursor-pointer shadow-sm ${
            canScrollRight
              ? 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-slate-700 active:scale-95'
              : 'bg-slate-900/60 text-slate-600 border-slate-800/80 cursor-not-allowed'
          }`}
          disabled={!canScrollRight}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
