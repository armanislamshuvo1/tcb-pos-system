'use client';

import React, { useState, useMemo } from 'react';
import Header from '../components/Header';
import CategoryTabs from '../components/pos/CategoryTabs';
import SearchBar from '../components/pos/SearchBar';
import ProductGrid from '../components/pos/ProductGrid';
import ActiveTicket from '../components/pos/ActiveTicket';
import Link from 'next/link';
import { ShoppingCart, ChevronRight, ArrowLeft } from 'lucide-react';
import { 
  useCategoriesQuery, 
  useProductsQuery, 
  useStaffQuery, 
  usePresetDiscountsQuery, 
  useCustomersQuery, 
  useCreateCustomerMutation, 
  useCheckoutTransactionMutation 
} from '../hooks/queries/useCatalogQueries';
import { useAuth } from '../context/AuthContext';
import { useCartStore } from '../store/useCartStore';
import { formatCurrency } from '../utils/currency';

export default function PosPage() {
  const { currency } = useAuth();
  const { addItem, items, globalDiscount, notes, getTotals } = useCartStore();
  const totals = getTotals();
  const [mobileActiveView, setMobileActiveView] = useState('catalog'); // 'catalog' | 'ticket'

  const { data: categories = [], isLoading: categoriesLoading } = useCategoriesQuery();
  const { data: products = [], isLoading: productsLoading } = useProductsQuery();
  const { data: staffMembers = [] } = useStaffQuery();
  const { data: presetDiscounts = [] } = usePresetDiscountsQuery();
  const { data: customers = [] } = useCustomersQuery();
  
  const createCustomerMutation = useCreateCustomerMutation();
  const checkoutMutation = useCheckoutTransactionMutation();

  const [activeCategoryId, setActiveCategoryId] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const loading = categoriesLoading || productsLoading;

  const handleCreateCustomer = async ({ name, phone }) => {
    return await createCustomerMutation.mutateAsync({ name, phone });
  };

  // Real-time catalog filtering
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Category filter
      if (activeCategoryId !== 'all') {
        const prodCatId = product.categoryId?._id || product.categoryId;
        if (prodCatId !== activeCategoryId) return false;
      }

      // Keyword search filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchesName = product.name?.toLowerCase().includes(term);
        const matchesSku = product.sku?.toLowerCase().includes(term);
        const matchesCat = product.categoryNameSnapshot?.toLowerCase().includes(term);
        return matchesName || matchesSku || matchesCat;
      }

      return true;
    });
  }, [products, activeCategoryId, searchTerm]);

  // Checkout API call
  const handleCheckout = async ({ 
    status, 
    paymentMethod, 
    customerId,
    customerName,
    staffMemberId, 
    tabType, 
    roomNumber, 
    guestName, 
    notes: customNotes 
  }) => {
    const idempotencyKey = `pos_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const payload = {
      items: items.map((i) => ({
        productId: i.productId,
        categoryId: i.categoryId || undefined,
        productNameSnapshot: i.productNameSnapshot,
        skuSnapshot: i.skuSnapshot,
        categoryNameSnapshot: i.categoryNameSnapshot,
        unitPriceInCents: i.unitPriceInCents,
        quantity: i.quantity,
        lineDiscountType: i.lineDiscountType,
        lineDiscountValue: i.lineDiscountValue
      })),
      globalDiscount,
      status,
      paymentMethod,
      customerId: customerId || null,
      customerName: customerName || null,
      staffMemberId: staffMemberId || null,
      tabType: tabType || (roomNumber ? 'ROOM' : (customerName ? 'CUSTOMER' : (staffMemberId ? 'STAFF' : 'NONE'))),
      roomNumber: roomNumber || null,
      guestName: guestName || null,
      notes: customNotes !== undefined ? customNotes : notes
    };

    return await checkoutMutation.mutateAsync({ payload, idempotencyKey, staffMembers });
  };

  return (
    <div className="h-screen h-dvh max-h-screen bg-slate-950 text-white flex flex-col overflow-hidden">
      <Header />

      {/* Responsive Full-Screen Layout: Single Pane on Mobile (< md), Side-by-Side on Tablet & PC (>= md) */}
      <main className="flex-1 min-h-0 w-full max-w-[1750px] mx-auto p-2 sm:p-3 md:p-4 gap-3 sm:gap-4 overflow-hidden flex flex-col md:flex-row">
        {/* Left Column: Product Catalog & Search */}
        <div className={`w-full md:w-7/12 lg:w-7/12 xl:w-3/5 flex flex-col h-full min-h-0 overflow-hidden space-y-2.5 sm:space-y-3 ${
          mobileActiveView === 'ticket' ? 'hidden md:flex' : 'flex'
        }`}>
          {/* Quick Search Row with left padding so floating menu button sits cleanly */}
          <div className="pl-13 sm:pl-15">
            <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
          </div>

          {/* Dynamic Category Tabs */}
          <CategoryTabs
            categories={categories}
            activeCategoryId={activeCategoryId}
            onSelectCategory={setActiveCategoryId}
          />

          {/* Touch-First Product Grid */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-1 pb-16 md:pb-4 touch-pan-y">
            {loading ? (
              <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
                Loading product catalog...
              </div>
            ) : (
              <ProductGrid products={filteredProducts} onAddToCart={addItem} />
            )}
          </div>

          {/* Mobile Bottom Bar for Quick Ticket Access */}
          <div className="md:hidden mt-auto -mx-2 -mb-2 p-2.5 sm:p-3 bg-slate-900/95 border-t border-slate-800 backdrop-blur-md flex items-center justify-between gap-2 shadow-2xl shrink-0">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-xs relative shrink-0">
                <ShoppingCart className="w-4 h-4" />
                {totals.itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-500 text-black text-[10px] font-black flex items-center justify-center shadow">
                    {totals.itemCount}
                  </span>
                )}
              </div>
              <div className="truncate">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {totals.itemCount} {totals.itemCount === 1 ? 'item' : 'items'} in cart
                </div>
                <div className="text-sm font-black text-amber-400 font-mono">
                  {formatCurrency(totals.grandTotalInCents, currency)}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMobileActiveView('ticket')}
              className="flex items-center space-x-1.5 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/25 active:scale-95 transition cursor-pointer shrink-0"
            >
              <span>View Ticket</span>
              <ChevronRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </div>

        {/* Right Column: Active Ticket & Checkout */}
        <div className={`w-full md:w-5/12 lg:w-5/12 xl:w-2/5 h-full min-h-0 overflow-hidden flex-col ${
          mobileActiveView === 'ticket' ? 'flex' : 'hidden md:flex'
        }`}>
          {/* Mobile Back to Catalog Button */}
          <div className="md:hidden pb-2 pl-13 sm:pl-15 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={() => setMobileActiveView('catalog')}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-amber-400 text-xs font-bold border border-slate-700 active:scale-95 transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Catalog ({filteredProducts.length})</span>
            </button>
            <span className="text-xs font-bold text-slate-400">
              Active Ticket ({totals.itemCount})
            </span>
          </div>

          <div className="flex-1 min-h-0">
            <ActiveTicket
              customers={customers}
              onCreateCustomer={handleCreateCustomer}
              staffMembers={staffMembers}
              presetDiscounts={presetDiscounts}
              onCheckout={handleCheckout}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
