'use client';

import React, { useState } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';

export default function CategoriesAdminTab({
  categories = [],
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory
}) {
  const [catName, setCatName] = useState('');
  const [catOrder, setCatOrder] = useState('0');
  const [catColor, setCatColor] = useState('#D97706');

  // Edit Category Modal State
  const [editingCategory, setEditingCategory] = useState(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatOrder, setEditCatOrder] = useState('0');
  const [editCatColor, setEditCatColor] = useState('#3B82F6');

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const success = await onCreateCategory({
      name: catName,
      order: catOrder,
      color: catColor
    });
    if (success) {
      setCatName('');
      setCatOrder('0');
    }
  };

  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setEditCatName(cat.name || '');
    setEditCatOrder(String(cat.displayOrder || 0));
    setEditCatColor(cat.colorCode || '#3B82F6');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const success = await onUpdateCategory({
      id: editingCategory._id,
      name: editCatName,
      order: editCatOrder,
      color: editCatColor
    });
    if (success) {
      setEditingCategory(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Create Category Form */}
      <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Add Product Category</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Categories generate the filter pills across the POS touch screen.
          </p>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-3 text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Category Name *</label>
            <input
              type="text"
              required
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="e.g. Seasonal Specials"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Display Sort Order</label>
            <input
              type="number"
              value={catOrder}
              onChange={(e) => setCatOrder(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Accent Badge Color</label>
            <input
              type="color"
              value={catColor}
              onChange={(e) => setCatColor(e.target.value)}
              className="w-full h-10 p-1 bg-slate-800 border border-slate-700 rounded-xl cursor-pointer"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm rounded-xl transition shadow-md mt-2 cursor-pointer"
          >
            Create Category
          </button>
        </form>
      </div>

      {/* Existing Categories Table with Edit & Delete */}
      <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <h2 className="text-base font-bold text-white mb-4">Configured Categories ({categories.length})</h2>
        <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden">
          {categories.map((cat) => (
            <div key={cat._id} className="p-3.5 flex items-center justify-between bg-slate-850 hover:bg-slate-800 transition">
              <div className="flex items-center space-x-3">
                <span
                  className="w-4 h-4 rounded-full inline-block shrink-0 shadow-sm"
                  style={{ backgroundColor: cat.colorCode }}
                />
                <div>
                  <span className="font-bold text-white text-sm">{cat.name}</span>
                  <span className="text-xs text-slate-400 block font-mono">slug: {cat.slug}</span>
                </div>
              </div>
              <div className="flex items-center space-x-3 text-xs">
                <span className="text-slate-400">Order: {cat.displayOrder}</span>
                <button
                  type="button"
                  onClick={() => openEditModal(cat)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-750 text-amber-400 rounded-lg transition cursor-pointer"
                  title="Edit Category"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteCategory(cat._id, cat.name)}
                  className="p-1.5 bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400 rounded-lg transition cursor-pointer"
                  title="Delete Category"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* EDIT CATEGORY MODAL */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Edit2 className="w-4 h-4 text-amber-400" />
                <span>Edit Category: {editingCategory.name}</span>
              </h3>
              <button
                onClick={() => setEditingCategory(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={editCatName}
                  onChange={(e) => setEditCatName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Display Sort Order</label>
                <input
                  type="number"
                  value={editCatOrder}
                  onChange={(e) => setEditCatOrder(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Accent Badge Color</label>
                <input
                  type="color"
                  value={editCatColor}
                  onChange={(e) => setEditCatColor(e.target.value)}
                  className="w-full h-10 p-1 bg-slate-800 border border-slate-700 rounded-xl cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
