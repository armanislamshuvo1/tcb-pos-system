'use client';

import React from 'react';
import { 
  Package, 
  Layers, 
  UserCheck, 
  Users, 
  Tag, 
  Coins, 
  Crown 
} from 'lucide-react';

export default function AdminNavigation({
  activeTab,
  setActiveTab,
  productsCount = 0,
  categoriesCount = 0,
  customersCount = 0,
  usersCount = 0,
  discountsCount = 0,
  companiesCount = 0,
  role,
  onOpenCompaniesTab
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
      <button
        type="button"
        onClick={() => setActiveTab('products')}
        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
          activeTab === 'products' ? 'bg-amber-500 text-black shadow-md' : 'text-slate-400 hover:text-white'
        }`}
      >
        <Package className="w-3.5 h-3.5" />
        <span>1. Products ({productsCount})</span>
      </button>

      <button
        type="button"
        onClick={() => setActiveTab('categories')}
        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
          activeTab === 'categories' ? 'bg-amber-500 text-black shadow-md' : 'text-slate-400 hover:text-white'
        }`}
      >
        <Layers className="w-3.5 h-3.5" />
        <span>2. Categories ({categoriesCount})</span>
      </button>

      <button
        type="button"
        onClick={() => setActiveTab('customers')}
        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
          activeTab === 'customers' ? 'bg-amber-500 text-black shadow-md' : 'text-slate-400 hover:text-white'
        }`}
      >
        <UserCheck className="w-3.5 h-3.5" />
        <span>3. Customers ({customersCount})</span>
      </button>

      <button
        type="button"
        onClick={() => setActiveTab('users')}
        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
          activeTab === 'users' ? 'bg-amber-500 text-black shadow-md' : 'text-slate-400 hover:text-white'
        }`}
      >
        <Users className="w-3.5 h-3.5" />
        <span>4. Users & Staff ({usersCount})</span>
      </button>

      <button
        type="button"
        onClick={() => setActiveTab('discounts')}
        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
          activeTab === 'discounts' ? 'bg-amber-500 text-black shadow-md' : 'text-slate-400 hover:text-white'
        }`}
      >
        <Tag className="w-3.5 h-3.5" />
        <span>5. Discounts ({discountsCount})</span>
      </button>

      <button
        type="button"
        onClick={() => setActiveTab('settings')}
        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
          activeTab === 'settings' ? 'bg-amber-500 text-black shadow-md' : 'text-slate-400 hover:text-white'
        }`}
      >
        <Coins className="w-3.5 h-3.5" />
        <span>6. Currency & Settings</span>
      </button>

      {role === 'system_admin' && (
        <button
          type="button"
          onClick={() => {
            setActiveTab('companies');
            if (onOpenCompaniesTab) onOpenCompaniesTab();
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
            activeTab === 'companies' ? 'bg-amber-500 text-black shadow-md' : 'text-amber-400/90 hover:text-amber-300'
          }`}
        >
          <Crown className="w-3.5 h-3.5 text-amber-400" />
          <span>7. B2B Companies ({companiesCount})</span>
        </button>
      )}
    </div>
  );
}
