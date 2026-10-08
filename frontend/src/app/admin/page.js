'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import { useAxiosSecure } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { 
  FolderKanban, 
  CheckCircle, 
  AlertCircle 
} from 'lucide-react';

import AdminNavigation from '../../components/admin/AdminNavigation';
import ProductsAdminTab from '../../components/admin/ProductsAdminTab';
import CategoriesAdminTab from '../../components/admin/CategoriesAdminTab';
import CustomersAdminTab from '../../components/admin/CustomersAdminTab';
import UsersAdminTab from '../../components/admin/UsersAdminTab';
import DiscountsAdminTab from '../../components/admin/DiscountsAdminTab';
import SettingsAdminTab from '../../components/admin/SettingsAdminTab';
import CompaniesAdminTab from '../../components/admin/CompaniesAdminTab';

export default function AdminCatalogPage() {
  const router = useRouter();
  const axiosSecure = useAxiosSecure();
  const queryClient = useQueryClient();
  const { user, role, currency, company, updateActiveCompany } = useAuth();

  // Route Guard: Non-admins cannot access the admin dashboard
  useEffect(() => {
    if (role && role !== 'admin' && role !== 'system_admin') {
      router.replace('/');
    }
  }, [role, router]);

  const [activeTab, setActiveTab] = useState('products'); // 'products', 'categories', 'customers', 'users', 'discounts', 'settings', 'companies'
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [users, setUsers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  const fetchCatalogData = async () => {
    try {
      setLoading(true);
      const [catRes, prodRes, discRes, userRes, custRes] = await Promise.all([
        axiosSecure.get('/api/categories').catch(() => null),
        axiosSecure.get('/api/products?activeOnly=false').catch(() => null),
        axiosSecure.get('/api/discounts/admin').catch(() => null),
        axiosSecure.get('/api/admin/users').catch(() => null),
        axiosSecure.get('/api/customers').catch(() => null)
      ]);

      if (catRes?.data?.success) {
        setCategories(catRes.data.data);
      }
      if (prodRes?.data?.success) {
        setProducts(prodRes.data.data);
      }
      if (discRes?.data?.success) setDiscounts(discRes.data.data);
      if (userRes?.data?.success) setUsers(userRes.data.data);
      if (custRes?.data?.success) setCustomers(custRes.data.data);

      if (role === 'system_admin') {
        const compRes = await axiosSecure.get('/api/companies').catch(() => null);
        if (compRes?.data?.success) setCompanies(compRes.data.data);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.catalog.all });
    }
  };

  const fetchCompanies = async () => {
    try {
      const res = await axiosSecure.get('/api/companies');
      if (res.data?.success) {
        setCompanies(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch companies:', err);
    }
  };

  useEffect(() => {
    fetchCatalogData();
  }, [axiosSecure, role]);

  // =========================================================================
  // CATEGORY HANDLERS (Create, Edit, Delete)
  // =========================================================================
  const handleCreateCategory = async ({ name, order, color }) => {
    setMessage(null);
    try {
      const res = await axiosSecure.post('/api/categories/admin', {
        name,
        displayOrder: Number(order),
        colorCode: color
      });

      if (res.data?.success) {
        setMessage({ type: 'success', text: `Category "${name}" created successfully!` });
        fetchCatalogData();
        return true;
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to create category' });
    }
    return false;
  };

  const handleUpdateCategory = async ({ id, name, order, color }) => {
    setMessage(null);
    try {
      const res = await axiosSecure.put(`/api/categories/admin/${id}`, {
        name,
        displayOrder: Number(order),
        colorCode: color
      });
      if (res.data?.success) {
        setMessage({ type: 'success', text: `Category "${name}" updated successfully!` });
        fetchCatalogData();
        return true;
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update category' });
    }
    return false;
  };

  const handleDeleteCategory = async (catId, catName) => {
    if (!window.confirm(`Are you sure you want to remove the category "${catName}"?`)) return;
    try {
      await axiosSecure.delete(`/api/categories/admin/${catId}`);
      setMessage({ type: 'success', text: `Category "${catName}" removed!` });
      fetchCatalogData();
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to delete category' });
    }
  };

  // =========================================================================
  // PRODUCT HANDLERS (Create, Edit, Delete)
  // =========================================================================
  const handleCreateProduct = async ({
    sku,
    name,
    categoryId,
    priceDollars,
    costDollars,
    stock,
    discountType,
    discountValue
  }) => {
    setMessage(null);

    const priceCents = Math.round(parseFloat(priceDollars) * 100);
    const costCents = Math.round(parseFloat(costDollars || '0') * 100);

    if (isNaN(priceCents) || priceCents <= 0) {
      setMessage({ type: 'error', text: 'Please provide a valid selling price greater than 0' });
      return false;
    }

    if (!categoryId) {
      setMessage({ type: 'error', text: 'Please select a target Category for this product.' });
      return false;
    }

    let discountVal = 0;
    if (discountType === 'fixed_cents') {
      discountVal = Math.round(parseFloat(discountValue || '0') * 100);
    } else if (discountType === 'percentage') {
      discountVal = parseFloat(discountValue || '0');
    }

    try {
      const res = await axiosSecure.post('/api/products/admin', {
        sku: sku.trim().toUpperCase(),
        name: name.trim(),
        categoryId,
        priceInCents: priceCents,
        costInCents: costCents,
        stockQuantity: Number(stock),
        discountType,
        discountValue: discountVal
      });

      if (res.data?.success) {
        setMessage({ type: 'success', text: `Product "${name}" added to catalog successfully!` });
        fetchCatalogData();
        return true;
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to create product' });
    }
    return false;
  };

  const handleUpdateProduct = async ({
    id,
    sku,
    name,
    categoryId,
    priceDollars,
    costDollars,
    stock,
    discountType,
    discountValue
  }) => {
    setMessage(null);
    const priceCents = Math.round(parseFloat(priceDollars) * 100);
    const costCents = Math.round(parseFloat(costDollars || '0') * 100);

    let discountVal = 0;
    if (discountType === 'fixed_cents') {
      discountVal = Math.round(parseFloat(discountValue || '0') * 100);
    } else if (discountType === 'percentage') {
      discountVal = parseFloat(discountValue || '0');
    }

    try {
      const res = await axiosSecure.put(`/api/products/admin/${id}`, {
        sku: sku.trim().toUpperCase(),
        name: name.trim(),
        categoryId,
        priceInCents: priceCents,
        costInCents: costCents,
        stockQuantity: Number(stock),
        discountType,
        discountValue: discountVal
      });

      if (res.data?.success) {
        setMessage({ type: 'success', text: `Product "${name}" updated successfully!` });
        fetchCatalogData();
        return true;
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update product' });
    }
    return false;
  };

  const handleDeleteProduct = async (productId, productName) => {
    if (!window.confirm(`Are you sure you want to remove "${productName}" from the catalog?`)) return;
    try {
      await axiosSecure.delete(`/api/products/admin/${productId}`);
      setMessage({ type: 'success', text: `Product "${productName}" deleted from catalog!` });
      fetchCatalogData();
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to delete product' });
    }
  };

  // =========================================================================
  // CUSTOMER HANDLERS
  // =========================================================================
  const handleCreateCustomer = async ({ name, phone, email, notes }) => {
    setMessage(null);
    if (!name.trim()) {
      setMessage({ type: 'error', text: 'Customer name is required' });
      return false;
    }
    try {
      const res = await axiosSecure.post('/api/customers', {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        notes: notes.trim()
      });
      if (res.data?.success) {
        setMessage({ type: 'success', text: `Customer "${name}" added successfully!` });
        fetchCatalogData();
        return true;
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to add customer' });
    }
    return false;
  };

  // =========================================================================
  // USER / STAFF HANDLERS
  // =========================================================================
  const handleCreateUser = async ({ fullName, email, employeeCode, role: uRole, password, companyId }) => {
    setMessage(null);

    if (!/^\d{4,6}$/.test(password.trim())) {
      setMessage({ type: 'error', text: 'PIN code must be between 4 and 6 numeric digits (e.g. 1234)' });
      return false;
    }

    try {
      const payload = {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        employeeCode: employeeCode.trim().toUpperCase(),
        role: uRole,
        password: password.trim(),
        pinCode: password.trim()
      };

      if (role === 'system_admin' && companyId) {
        payload.companyId = companyId;
      }

      const res = await axiosSecure.post('/api/admin/create', payload);

      if (res.data?.success) {
        setMessage({ 
          type: 'success', 
          text: `User "${fullName}" (${uRole.toUpperCase()}) registered successfully!` 
        });
        fetchCatalogData();
        return true;
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to register user' });
    }
    return false;
  };

  const handleUpdateUser = async ({ id, fullName, email, employeeCode, role: uRole, companyId, pinCode, isActive }) => {
    setMessage(null);
    try {
      const payload = {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        employeeCode: employeeCode.trim().toUpperCase(),
        role: uRole,
        isActive
      };
      if (pinCode && pinCode.trim()) {
        if (!/^\d{4,6}$/.test(pinCode.trim())) {
          setMessage({ type: 'error', text: 'PIN code must be between 4 and 6 numeric digits (e.g. 1234)' });
          return false;
        }
        payload.pinCode = pinCode.trim();
      }
      if (role === 'system_admin') {
        payload.companyId = companyId || null;
      }

      const res = await axiosSecure.put(`/api/admin/users/${id}`, payload);
      if (res.data?.success) {
        setMessage({ type: 'success', text: `User "${fullName}" updated successfully!` });
        fetchCatalogData();
        return true;
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update user' });
    }
    return false;
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to permanently delete user "${userName}"? This action cannot be undone.`)) {
      return;
    }
    try {
      const res = await axiosSecure.delete(`/api/admin/users/${userId}`);
      if (res.data?.success) {
        setMessage({ type: 'success', text: `User "${userName}" deleted successfully!` });
        fetchCatalogData();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to delete user' });
    }
  };

  // =========================================================================
  // COMPANY SETTINGS & CURRENCY HANDLERS
  // =========================================================================
  const handleSaveCurrencySettings = async ({ currencyCode, currencySymbol, displayName }) => {
    setMessage(null);
    try {
      const res = await axiosSecure.put('/api/companies/my/settings', {
        currency: {
          code: currencyCode.trim().toUpperCase(),
          symbol: currencySymbol.trim()
        },
        branding: {
          displayName: displayName.trim()
        }
      });

      if (res.data?.success) {
        setMessage({ type: 'success', text: 'Currency and company settings updated successfully!' });
        updateActiveCompany(res.data.data);
        return true;
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update settings' });
    }
    return false;
  };

  // =========================================================================
  // B2B COMPANY HANDLERS (System Admin)
  // =========================================================================
  const handleCreateCompany = async (payload) => {
    setMessage(null);
    try {
      const res = await axiosSecure.post('/api/companies', payload);

      if (res.data?.success) {
        const adminMsg = res.data.data?.initialAdmin
          ? ` with Admin "${res.data.data.initialAdmin.fullName}" (${res.data.data.initialAdmin.email})`
          : '';
        setMessage({ type: 'success', text: `Company "${payload.name}" provisioned successfully${adminMsg}!` });
        fetchCompanies();
        fetchCatalogData();
        return true;
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to create company' });
    }
    return false;
  };

  const handleAssignCompanyAdmin = async (company, payload) => {
    setMessage(null);
    try {
      const res = await axiosSecure.post(`/api/companies/${company._id}/admins`, payload);

      if (res.data?.success) {
        setMessage({ type: 'success', text: `Admin "${payload.fullName}" provisioned for ${company.name} successfully!` });
        fetchCompanies();
        fetchCatalogData();
        return true;
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to assign company admin' });
    }
    return false;
  };

  const handleUpdateCompany = async (companyId, payload) => {
    setMessage(null);
    try {
      const res = await axiosSecure.put(`/api/companies/${companyId}`, payload);

      if (res.data?.success) {
        setMessage({ type: 'success', text: `Company "${payload.name}" updated successfully!` });
        fetchCompanies();
        return true;
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update company' });
    }
    return false;
  };

  // =========================================================================
  // DISCOUNT HANDLERS (Create, Delete)
  // =========================================================================
  const handleCreateDiscount = async ({ name, type, target, productId, value, isPreset }) => {
    setMessage(null);
    const val = type === 'fixed_cents' ? Math.round(parseFloat(value) * 100) : Number(value);

    try {
      const res = await axiosSecure.post('/api/discounts/admin', {
        name,
        type,
        target,
        productId: target === 'specific_product' ? productId : undefined,
        value: val,
        isPresetButton: isPreset,
        displayOrder: 1
      });

      if (res.data?.success) {
        setMessage({ type: 'success', text: `Discount button "${name}" created successfully!` });
        fetchCatalogData();
        return true;
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to create discount' });
    }
    return false;
  };

  const handleDeleteDiscount = async (discountId, discName) => {
    if (!window.confirm(`Delete discount "${discName}"?`)) return;
    try {
      await axiosSecure.delete(`/api/discounts/admin/${discountId}`);
      setMessage({ type: 'success', text: `Discount "${discName}" removed!` });
      fetchCatalogData();
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to delete discount' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 pt-14 sm:p-6 space-y-6">
        {/* Header & Section Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center space-x-2.5">
              <FolderKanban className="w-7 h-7 text-amber-400" />
              <span>Admin Management Dashboard</span>
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Full CRUD management for catalog products, categories, staff accounts, and discounts.
            </p>
          </div>

          <AdminNavigation
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            productsCount={products.length}
            categoriesCount={categories.length}
            customersCount={customers.length}
            usersCount={users.length}
            discountsCount={discounts.length}
            companiesCount={companies.length}
            role={role}
            onOpenCompaniesTab={() => setActiveTab('companies')}
          />
        </div>

        {/* Notification Toast */}
        {message && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between text-sm shadow-md animate-in fade-in slide-in-from-top-2 ${
              message.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-800/80 text-emerald-300'
                : 'bg-rose-950/80 border-rose-800/80 text-rose-300'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0" />
              )}
              <span className="font-semibold">{message.text}</span>
            </div>
            <button
              onClick={() => setMessage(null)}
              className="text-xs underline hover:text-white cursor-pointer ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 1: PRODUCTS                                                           */}
        {/* ========================================================================= */}
        {activeTab === 'products' && (
          <ProductsAdminTab
            categories={categories}
            products={products}
            currency={currency}
            onCreateProduct={handleCreateProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
          />
        )}

        {/* ========================================================================= */}
        {/* TAB 2: CATEGORIES                                                         */}
        {/* ========================================================================= */}
        {activeTab === 'categories' && (
          <CategoriesAdminTab
            categories={categories}
            onCreateCategory={handleCreateCategory}
            onUpdateCategory={handleUpdateCategory}
            onDeleteCategory={handleDeleteCategory}
          />
        )}

        {/* ========================================================================= */}
        {/* TAB 3: CUSTOMERS DIRECTORY                                                */}
        {/* ========================================================================= */}
        {activeTab === 'customers' && (
          <CustomersAdminTab
            customers={customers}
            onCreateCustomer={handleCreateCustomer}
          />
        )}

        {/* ========================================================================= */}
        {/* TAB 4: USERS / STAFF                                                      */}
        {/* ========================================================================= */}
        {activeTab === 'users' && (
          <UsersAdminTab
            users={users}
            companies={companies}
            company={company}
            role={role}
            currentUser={user}
            onCreateUser={handleCreateUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
          />
        )}

        {/* ========================================================================= */}
        {/* TAB 5: 1-CLICK DISCOUNTS                                                  */}
        {/* ========================================================================= */}
        {activeTab === 'discounts' && (
          <DiscountsAdminTab
            products={products}
            discounts={discounts}
            currency={currency}
            onCreateDiscount={handleCreateDiscount}
            onDeleteDiscount={handleDeleteDiscount}
          />
        )}

        {/* ========================================================================= */}
        {/* TAB 6: SETTINGS & CURRENCY                                                */}
        {/* ========================================================================= */}
        {activeTab === 'settings' && (
          <SettingsAdminTab
            currency={currency}
            company={company}
            onSaveSettings={handleSaveCurrencySettings}
          />
        )}

        {/* ========================================================================= */}
        {/* TAB 7: B2B MULTI-TENANT COMPANIES (System Admin Only)                     */}
        {/* ========================================================================= */}
        {activeTab === 'companies' && role === 'system_admin' && (
          <CompaniesAdminTab
            companies={companies}
            onCreateCompany={handleCreateCompany}
            onUpdateCompany={handleUpdateCompany}
            onAssignAdmin={handleAssignCompanyAdmin}
          />
        )}
      </main>
    </div>
  );
}
