'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Header from '../components/Header';
import CategoryTabs from '../components/pos/CategoryTabs';
import SearchBar from '../components/pos/SearchBar';
import ProductGrid from '../components/pos/ProductGrid';
import ActiveTicket from '../components/pos/ActiveTicket';
import { useAxiosSecure } from '../hooks/useApi';
import { useCartStore } from '../store/useCartStore';
import { offlineDb } from '../utils/offlineDb';

export default function PosPage() {
  const axiosSecure = useAxiosSecure();
  const { addItem, items, globalDiscount, notes } = useCartStore();

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [presetDiscounts, setPresetDiscounts] = useState([]);
  
  const [activeCategoryId, setActiveCategoryId] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Load Catalog & Configuration
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [catRes, prodRes, staffRes, discRes] = await Promise.all([
          axiosSecure.get('/api/categories').catch(() => null),
          axiosSecure.get('/api/products').catch(() => null),
          axiosSecure.get('/api/staff').catch(() => null),
          axiosSecure.get('/api/discounts/presets').catch(() => null)
        ]);

        if (catRes?.data?.success) {
          setCategories(catRes.data.data);
          // Cache to IndexedDB
          offlineDb.categories.bulkPut(catRes.data.data).catch(() => {});
        } else {
          // Offline fallback
          const cachedCats = await offlineDb.categories.toArray();
          if (cachedCats.length > 0) setCategories(cachedCats);
        }

        if (prodRes?.data?.success) {
          setProducts(prodRes.data.data);
          offlineDb.products.bulkPut(prodRes.data.data).catch(() => {});
        } else {
          const cachedProds = await offlineDb.products.toArray();
          if (cachedProds.length > 0) setProducts(cachedProds);
        }

        if (staffRes?.data?.success) setStaffMembers(staffRes.data.data);
        if (discRes?.data?.success) setPresetDiscounts(discRes.data.data);
      } catch (err) {
        console.error('Failed to load POS data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [axiosSecure]);

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
  const handleCheckout = async ({ status, paymentMethod, staffMemberId }) => {
    const idempotencyKey = `pos_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const payload = {
      items: items.map((i) => ({
        productId: i.productId,
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
      staffMemberId,
      notes
    };

    try {
      const response = await axiosSecure.post('/api/transactions', payload, {
        headers: { 'x-idempotency-key': idempotencyKey }
      });
      return response.data;
    } catch (error) {
      // Offline transaction queueing
      if (!navigator.onLine) {
        const clientTxnUuid = `OFFLINE_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        await offlineDb.offlineQueue.add({
          clientTxnUuid,
          payload,
          timestamp: new Date().toISOString(),
          status: 'PENDING_SYNC'
        });

        return {
          success: true,
          data: {
            txnNumber: `${clientTxnUuid} (Queued)`,
            status,
            grandTotalInCents: items.reduce((acc, i) => acc + i.finalLineTotalInCents, 0),
            staffNameSnapshot: staffMembers.find((s) => s._id === staffMemberId)?.fullName
          }
        };
      }
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Product Catalog & Search (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-3">
          {/* Quick Search */}
          <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />

          {/* Dynamic Category Tabs */}
          <CategoryTabs
            categories={categories}
            activeCategoryId={activeCategoryId}
            onSelectCategory={setActiveCategoryId}
          />

          {/* Touch-First Product Grid */}
          <div className="flex-1 overflow-y-auto pr-1">
            {loading ? (
              <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
                Loading product catalog...
              </div>
            ) : (
              <ProductGrid products={filteredProducts} onAddToCart={addItem} />
            )}
          </div>
        </div>

        {/* Right Column: Active Ticket & Checkout (5 Cols) */}
        <div className="lg:col-span-5 h-[calc(100vh-6rem)] sticky top-20">
          <ActiveTicket
            staffMembers={staffMembers}
            presetDiscounts={presetDiscounts}
            onCheckout={handleCheckout}
          />
        </div>
      </main>
    </div>
  );
}
