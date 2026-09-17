'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function CategoryTabs({ categories, activeCategoryId, onSelectCategory }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollStart, setScrollStart] = useState(0);

  const checkScrollability = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const hasLeft = el.scrollLeft > 4;
    const hasRight = el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
    setCanScrollLeft(hasLeft);
    setCanScrollRight(hasRight);
  }, []);

  useEffect(() => {
    checkScrollability();
    window.addEventListener('resize', checkScrollability);
    return () => window.removeEventListener('resize', checkScrollability);
  }, [categories, checkScrollability]);

  const handleScroll = () => {
    checkScrollability();
  };

  const scrollByAmount = (amount) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  // Convert vertical mouse wheel into horizontal scroll
  const handleWheel = (e) => {
    if (e.deltaY !== 0 && scrollRef.current) {
      scrollRef.current.scrollLeft += e.deltaY;
      checkScrollability();
    }
  };

  // Mouse drag to scroll
  const handleMouseDown = (e) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollStart(scrollRef.current.scrollLeft);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollRef.current.scrollLeft = scrollStart - walk;
    checkScrollability();
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className="relative flex items-center group/cat">
      {/* Scroll Left Button */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scrollByAmount(-200)}
          aria-label="Scroll categories left"
          className="absolute left-0 z-10 w-7 h-7 -ml-1 rounded-full bg-slate-800/95 border border-slate-700 text-slate-200 hover:text-amber-400 hover:bg-slate-750 shadow-md flex items-center justify-center transition cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}

      {/* Categories Scrollable Row */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        className={`flex items-center space-x-2 overflow-x-auto pb-1.5 pt-0.5 scroll-smooth no-scrollbar select-none cursor-grab ${
          isDragging ? 'cursor-grabbing' : ''
        }`}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <button
          type="button"
          onClick={() => onSelectCategory('all')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all shrink-0 shadow-sm ${
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
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center space-x-2 shrink-0 shadow-sm ${
                isActive
                  ? 'bg-amber-500 text-black shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
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
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scrollByAmount(200)}
          aria-label="Scroll categories right"
          className="absolute right-0 z-10 w-7 h-7 -mr-1 rounded-full bg-slate-800/95 border border-slate-700 text-slate-200 hover:text-amber-400 hover:bg-slate-750 shadow-md flex items-center justify-center transition cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
