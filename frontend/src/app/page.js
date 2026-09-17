'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Header from '../components/Header';
import CategoryTabs from '../components/pos/CategoryTabs';
import SearchBar from '../components/pos/SearchBar';
import ProductGrid from '../components/pos/ProductGrid';
import ActiveTicket from '../components/pos/ActiveTicket';
import Link from 'next/link';
import { Monitor, Smartphone, AlertTriangle } from 'lucide-react';
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
  const [customers, setCustomers] = useState([]);
  
  const [activeCategoryId, setActiveCategoryId] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Load Catalog & Configuration
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [catRes, prodRes, staffRes, discRes, custRes] = await Promise.all([
          axiosSecure.get('/api/categories').catch(() => null),
          axiosSecure.get('/api/products').catch(() => null),
          axiosSecure.get('/api/staff').catch(() => null),
          axiosSecure.get('/api/discounts/presets').catch(() => null),
          axiosSecure.get('/api/customers').catch(() => null)
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
        if (custRes?.data?.success) setCustomers(custRes.data.data);
      } catch (err) {
        console.error('Failed to load POS data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [axiosSecure]);

  const handleCreateCustomer = async ({ name, phone }) => {
    try {
      const res = await axiosSecure.post('/api/customers', { name, phone });
      if (res.data?.success) {
        setCustomers((prev) => {
          const exists = prev.some((c) => c._id === res.data.data._id);
          return exists ? prev : [res.data.data, ...prev];
        });
        return res.data.data;
      }
    } catch (err) {
      console.error('Failed to create customer:', err);
      throw err;
    }
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
            staffNameSnapshot: staffMembers.find((s) => s._id === staffMemberId)?.fullName,
            roomNumber: payload.roomNumber,
            guestName: payload.guestName
          }
        };
      }
      throw error;
    }
  };

  return (
    <div className="h-screen max-h-screen bg-slate-950 text-white flex flex-col overflow-hidden">
      <Header />

      {/* Mobile Device Notice - Displayed only on screens smaller than tablet (< md / 768px) */}
      <div className="block md:hidden flex-1 p-4 flex flex-col items-center justify-center text-center overflow-y-auto">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 my-auto">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Monitor className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Tablet & PC Recommended</span>
            </div>
            <h2 className="text-xl font-extrabold text-white">
              POS System Not Suitable for Mobile
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              This Point-of-Sale terminal is designed for touch tablets (e.g. iPad) and PC displays to show the product catalog and active cart side-by-side. Phone screens cannot safely accommodate fast checkout operations.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-850 border border-slate-800 text-left space-y-2">
            <div className="text-xs font-bold text-slate-300 flex items-center space-x-2">
              <Smartphone className="w-4 h-4 text-amber-400" />
              <span>Instructions for Staff:</span>
            </div>
            <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
              <li>Open this terminal on a POS tablet or desktop computer</li>
              <li>If already on a tablet, rotate your screen to <strong>Landscape mode</strong></li>
            </ul>
          </div>

          {/* Quick Mobile Navigation Links */}
          <div className="pt-2 space-y-2">
            <Link
              href="/tabs"
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-bold transition"
            >
              <span>Go to Staff Tab Management</span>
            </Link>
            <Link
              href="/ledger"
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-bold transition"
            >
              <span>Go to Transaction Ledger</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Side-by-Side Layout for Tablet and PC (md breakpoint and up) */}
      <main className="hidden md:flex flex-1 min-h-0 w-full max-w-[1750px] mx-auto p-3 sm:p-4 gap-3 sm:gap-4 overflow-hidden">
        {/* Left Column: Product Catalog & Search (Products on the left) */}
        <div className="w-7/12 lg:w-7/12 xl:w-3/5 flex flex-col h-full min-h-0 overflow-hidden space-y-2.5 sm:space-y-3">
          {/* Quick Search */}
          <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />

          {/* Dynamic Category Tabs */}
          <CategoryTabs
            categories={categories}
            activeCategoryId={activeCategoryId}
            onSelectCategory={setActiveCategoryId}
          />

          {/* Touch-First Product Grid */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-2 pb-12 touch-pan-y">
            {loading ? (
              <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
                Loading product catalog...
              </div>
            ) : (
              <ProductGrid products={filteredProducts} onAddToCart={addItem} />
            )}
          </div>
        </div>

        {/* Right Column: Active Ticket & Checkout (Cart on the right) */}
        <div className="w-5/12 lg:w-5/12 xl:w-2/5 h-full min-h-0 overflow-hidden">
          <ActiveTicket
            customers={customers}
            onCreateCustomer={handleCreateCustomer}
            staffMembers={staffMembers}
            presetDiscounts={presetDiscounts}
            onCheckout={handleCheckout}
          />
        </div>
      </main>
    </div>
  );
}
