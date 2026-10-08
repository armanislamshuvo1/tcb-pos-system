'use client';

import React, { useState } from 'react';
import { Plus, Tag, Edit2, Trash2, X } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

export default function ProductsAdminTab({
  categories = [],
  products = [],
  currency,
  onCreateProduct,
  onUpdateProduct,
  onDeleteProduct
}) {
  // Create Product Form State
  const [prodSku, setProdSku] = useState('');
  const [prodName, setProdName] = useState('');
  const [prodCategoryId, setProdCategoryId] = useState(categories[0]?._id || '');
  const [prodPriceDollars, setProdPriceDollars] = useState('');
  const [prodCostDollars, setProdCostDollars] = useState('');
  const [prodStock, setProdStock] = useState('100');
  const [prodDiscountType, setProdDiscountType] = useState('none');
  const [prodDiscountValue, setProdDiscountValue] = useState('');

  // Edit Modal State
  const [editingProduct, setEditingProduct] = useState(null);
  const [editSku, setEditSku] = useState('');
  const [editName, setEditName] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editPriceDollars, setEditPriceDollars] = useState('');
  const [editCostDollars, setEditCostDollars] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editDiscountType, setEditDiscountType] = useState('none');
  const [editDiscountValue, setEditDiscountValue] = useState('');

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const success = await onCreateProduct({
      sku: prodSku,
      name: prodName,
      categoryId: prodCategoryId || categories[0]?._id,
      priceDollars: prodPriceDollars,
      costDollars: prodCostDollars,
      stock: prodStock,
      discountType: prodDiscountType,
      discountValue: prodDiscountValue
    });
    if (success) {
      setProdSku('');
      setProdName('');
      setProdPriceDollars('');
      setProdCostDollars('');
      setProdDiscountType('none');
      setProdDiscountValue('');
    }
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setEditSku(product.sku || '');
    setEditName(product.name || '');
    setEditCategoryId(product.categoryId?._id || product.categoryId || '');
    setEditPriceDollars((product.priceInCents / 100).toFixed(2));
    setEditCostDollars((product.costInCents / 100).toFixed(2));
    setEditStock(String(product.stockQuantity || 0));
    setEditDiscountType(product.discountType || 'none');
    setEditDiscountValue(
      product.discountType === 'fixed_cents'
        ? (product.discountValue ? (product.discountValue / 100).toFixed(2) : '')
        : (product.discountValue ? String(product.discountValue) : '')
    );
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const success = await onUpdateProduct({
      id: editingProduct._id,
      sku: editSku,
      name: editName,
      categoryId: editCategoryId,
      priceDollars: editPriceDollars,
      costDollars: editCostDollars,
      stock: editStock,
      discountType: editDiscountType,
      discountValue: editDiscountValue
    });
    if (success) {
      setEditingProduct(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Create Product Form */}
      <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Add Product into Category</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Specify category, name, SKU, prices, and initial stock.
          </p>
        </div>

        {categories.length === 0 ? (
          <div className="p-4 bg-amber-950/40 border border-amber-800/60 rounded-xl text-amber-300 text-xs">
            No categories exist. Create a category under <strong>2. Categories</strong> first.
          </div>
        ) : (
          <form onSubmit={handleFormSubmit} className="space-y-3 text-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Target Category *
              </label>
              <select
                value={prodCategoryId || categories[0]?._id}
                onChange={(e) => setProdCategoryId(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Product SKU *</label>
              <input
                type="text"
                required
                value={prodSku}
                onChange={(e) => setProdSku(e.target.value)}
                placeholder="e.g. COF-CAP-01"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono uppercase focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Product Name *</label>
              <input
                type="text"
                required
                value={prodName}
                onChange={(e) => setProdName(e.target.value)}
                placeholder="e.g. Iced Vanilla Latte"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Selling Price ({currency?.symbol || 'RM'}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={prodPriceDollars}
                  onChange={(e) => setProdPriceDollars(e.target.value)}
                  placeholder="5.50"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Cost Price ({currency?.symbol || 'RM'})
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={prodCostDollars}
                  onChange={(e) => setProdCostDollars(e.target.value)}
                  placeholder="1.50"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Stock Quantity</label>
              <input
                type="number"
                value={prodStock}
                onChange={(e) => setProdStock(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            {/* Product Discount Controls */}
            <div className="p-3 bg-slate-850/90 border border-slate-750 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-amber-300 flex items-center space-x-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Product Discount (Optional)</span>
                </label>
                {prodDiscountType !== 'none' && (
                  <button
                    type="button"
                    onClick={() => {
                      setProdDiscountType('none');
                      setProdDiscountValue('');
                    }}
                    className="text-[11px] text-slate-400 hover:text-red-400 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Discount Type</label>
                  <select
                    value={prodDiscountType}
                    onChange={(e) => setProdDiscountType(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="none">No Discount</option>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed_cents">Fixed ({currency?.symbol || 'RM'})</option>
                  </select>
                </div>

                {prodDiscountType !== 'none' && (
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      {prodDiscountType === 'percentage' ? 'Percentage (% Off)' : `Amount Off (${currency?.symbol || 'RM'})`}
                    </label>
                    <input
                      type="number"
                      step={prodDiscountType === 'percentage' ? '1' : '0.01'}
                      min="0"
                      max={prodDiscountType === 'percentage' ? '100' : undefined}
                      value={prodDiscountValue}
                      onChange={(e) => setProdDiscountValue(e.target.value)}
                      placeholder={prodDiscountType === 'percentage' ? '10' : '1.00'}
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Live Calculated Price Preview */}
              {prodDiscountType !== 'none' && parseFloat(prodDiscountValue) > 0 && parseFloat(prodPriceDollars) > 0 && (() => {
                const orig = parseFloat(prodPriceDollars);
                const val = parseFloat(prodDiscountValue);
                let disc = 0;
                if (prodDiscountType === 'percentage') {
                  disc = (orig * val) / 100;
                } else {
                  disc = val;
                }
                const finalPrice = Math.max(0, orig - disc);
                return (
                  <div className="text-[11px] bg-emerald-950/60 border border-emerald-800/80 rounded-lg px-2.5 py-1.5 text-emerald-300 flex items-center justify-between">
                    <span>Discounted Price:</span>
                    <div className="space-x-1.5 font-bold">
                      <span className="text-slate-400 line-through text-[10px]">
                        {currency?.symbol || 'RM'} {orig.toFixed(2)}
                      </span>
                      <span className="text-emerald-400 font-mono">
                        {currency?.symbol || 'RM'} {finalPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm rounded-xl transition shadow-md mt-2 cursor-pointer"
            >
              Save Product to Catalog
            </button>
          </form>
        )}
      </div>

      {/* Products Table with Complete EDIT & DELETE Actions */}
      <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 overflow-x-auto shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white">Catalog Inventory ({products.length})</h2>
            <span className="text-xs text-slate-400">Manage, edit prices/stock, or remove products</span>
          </div>
        </div>

        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-xs text-slate-400 uppercase bg-slate-850/80">
              <th className="py-2.5 px-3 font-semibold">SKU / Item</th>
              <th className="py-2.5 px-3 font-semibold">Category</th>
              <th className="py-2.5 px-3 font-semibold">Price</th>
              <th className="py-2.5 px-3 font-semibold">Cost</th>
              <th className="py-2.5 px-3 font-semibold">Stock</th>
              <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {products.map((p) => {
              const hasDiscount = p.discountType && p.discountType !== 'none' && p.discountValue > 0;
              let discCents = 0;
              if (hasDiscount) {
                if (p.discountType === 'percentage') {
                  discCents = Math.round((p.priceInCents * p.discountValue) / 100);
                } else if (p.discountType === 'fixed_cents') {
                  discCents = Math.min(p.priceInCents, Math.round(p.discountValue));
                }
              }
              const effectivePriceInCents = Math.max(0, p.priceInCents - discCents);

              return (
                <tr key={p._id} className="hover:bg-slate-850/60 transition">
                  <td className="py-3 px-3">
                    <div className="font-bold text-white">{p.name}</div>
                    <div className="font-mono text-xs text-slate-400">{p.sku}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-amber-400 border border-slate-700 font-semibold">
                      {p.categoryNameSnapshot || p.categoryId?.name}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    {hasDiscount ? (
                      <div>
                        <div className="font-mono font-bold text-amber-400">
                          {formatCurrency(effectivePriceInCents, currency)}
                        </div>
                        <div className="flex items-center space-x-1.5 mt-0.5">
                          <span className="text-[11px] font-mono text-slate-400 line-through">
                            {formatCurrency(p.priceInCents, currency)}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {p.discountType === 'percentage' ? `-${p.discountValue}%` : `-${formatCurrency(p.discountValue, currency)}`}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="font-mono font-bold text-amber-400">
                        {formatCurrency(p.priceInCents, currency)}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-400">
                    {formatCurrency(p.costInCents, currency)}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-300">
                    {p.stockQuantity}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        type="button"
                        onClick={() => openEditModal(p)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-750 text-amber-400 rounded-lg transition cursor-pointer"
                        title="Edit Product"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteProduct(p._id, p.name)}
                        className="p-1.5 bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400 rounded-lg transition cursor-pointer"
                        title="Delete Product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* EDIT PRODUCT MODAL (POPUP DIALOG) */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Edit2 className="w-4 h-4 text-amber-400" />
                <span>Edit Product: {editingProduct.name}</span>
              </h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                <select
                  value={editCategoryId}
                  onChange={(e) => setEditCategoryId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                >
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">SKU</label>
                <input
                  type="text"
                  required
                  value={editSku}
                  onChange={(e) => setEditSku(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Selling Price ({currency?.symbol || 'RM'})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editPriceDollars}
                    onChange={(e) => setEditPriceDollars(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Cost Price ({currency?.symbol || 'RM'})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editCostDollars}
                    onChange={(e) => setEditCostDollars(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Stock Quantity</label>
                <input
                  type="number"
                  value={editStock}
                  onChange={(e) => setEditStock(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
              </div>

              {/* Product Discount Controls */}
              <div className="p-3 bg-slate-850/90 border border-slate-750 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-amber-300 flex items-center space-x-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    <span>Product Discount (Optional)</span>
                  </label>
                  {editDiscountType !== 'none' && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditDiscountType('none');
                        setEditDiscountValue('');
                      }}
                      className="text-[11px] text-slate-400 hover:text-red-400 cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Discount Type</label>
                    <select
                      value={editDiscountType}
                      onChange={(e) => setEditDiscountType(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    >
                      <option value="none">No Discount</option>
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed_cents">Fixed ({currency?.symbol || 'RM'})</option>
                    </select>
                  </div>

                  {editDiscountType !== 'none' && (
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        {editDiscountType === 'percentage' ? 'Percentage (% Off)' : `Amount Off (${currency?.symbol || 'RM'})`}
                      </label>
                      <input
                        type="number"
                        step={editDiscountType === 'percentage' ? '1' : '0.01'}
                        min="0"
                        max={editDiscountType === 'percentage' ? '100' : undefined}
                        value={editDiscountValue}
                        onChange={(e) => setEditDiscountValue(e.target.value)}
                        placeholder={editDiscountType === 'percentage' ? '10' : '1.00'}
                        className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* Live Calculated Price Preview */}
                {editDiscountType !== 'none' && parseFloat(editDiscountValue) > 0 && parseFloat(editPriceDollars) > 0 && (() => {
                  const orig = parseFloat(editPriceDollars);
                  const val = parseFloat(editDiscountValue);
                  let disc = 0;
                  if (editDiscountType === 'percentage') {
                    disc = (orig * val) / 100;
                  } else {
                    disc = val;
                  }
                  const finalPrice = Math.max(0, orig - disc);
                  return (
                    <div className="text-[11px] bg-emerald-950/60 border border-emerald-800/80 rounded-lg px-2.5 py-1.5 text-emerald-300 flex items-center justify-between">
                      <span>Discounted Price:</span>
                      <div className="space-x-1.5 font-bold">
                        <span className="text-slate-400 line-through text-[10px]">
                          {currency?.symbol || 'RM'} {orig.toFixed(2)}
                        </span>
                        <span className="text-emerald-400 font-mono">
                          {currency?.symbol || 'RM'} {finalPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
