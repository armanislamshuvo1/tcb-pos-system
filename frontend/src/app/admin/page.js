'use client';

import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import { useAxiosSecure } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, SUPPORTED_CURRENCIES } from '../../utils/currency';
import { 
  FolderKanban, 
  Plus, 
  Package, 
  Tag, 
  CheckCircle, 
  AlertCircle,
  Layers,
  Users,
  UserPlus,
  Edit2,
  Trash2,
  X,
  Coins,
  Building2,
  Crown,
  UserCheck,
  Phone,
  Search
} from 'lucide-react';

export default function AdminCatalogPage() {
  const axiosSecure = useAxiosSecure();
  const { role, currency, company, updateActiveCompany } = useAuth();

  const [activeTab, setActiveTab] = useState('products'); // 'products', 'categories', 'users', 'discounts', 'settings', 'companies'
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [users, setUsers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  // Customer Form State
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custNotes, setCustNotes] = useState('');
  const [custSearch, setCustSearch] = useState('');
  const [custSaving, setCustSaving] = useState(false);

  // Category Form State
  const [catName, setCatName] = useState('');
  const [catOrder, setCatOrder] = useState('0');
  const [catColor, setCatColor] = useState('#D97706');

  // Product Form State (Create)
  const [prodSku, setProdSku] = useState('');
  const [prodName, setProdName] = useState('');
  const [prodCategoryId, setProdCategoryId] = useState('');
  const [prodPriceDollars, setProdPriceDollars] = useState('');
  const [prodCostDollars, setProdCostDollars] = useState('');
  const [prodStock, setProdStock] = useState('100');

  // Product Edit Modal State
  const [editingProduct, setEditingProduct] = useState(null);
  const [editSku, setEditSku] = useState('');
  const [editName, setEditName] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editPriceDollars, setEditPriceDollars] = useState('');
  const [editCostDollars, setEditCostDollars] = useState('');
  const [editStock, setEditStock] = useState('');

  // Category Edit Modal State
  const [editingCategory, setEditingCategory] = useState(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatOrder, setEditCatOrder] = useState('0');
  const [editCatColor, setEditCatColor] = useState('#3B82F6');

  // User & Staff Form State (Create)
  const [userFullName, setUserFullName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userEmployeeCode, setUserEmployeeCode] = useState('');
  const [userRole, setUserRole] = useState('staff');
  const [userPassword, setUserPassword] = useState('password123');
  const [userCompanyId, setUserCompanyId] = useState('');
  const [userFilterCompany, setUserFilterCompany] = useState('ALL');

  // User Edit Modal State
  const [editingUser, setEditingUser] = useState(null);
  const [editUserFullName, setEditUserFullName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserEmployeeCode, setEditUserEmployeeCode] = useState('');
  const [editUserRole, setEditUserRole] = useState('staff');
  const [editUserPinCode, setEditUserPinCode] = useState('');
  const [editUserCompanyId, setEditUserCompanyId] = useState('');
  const [editUserIsActive, setEditUserIsActive] = useState(true);

  // Discount Form State
  const [discName, setDiscName] = useState('');
  const [discType, setDiscType] = useState('percentage');
  const [discTarget, setDiscTarget] = useState('line_item'); // 'line_item', 'specific_product', 'global_ticket'
  const [discProductId, setDiscProductId] = useState('');
  const [discValue, setDiscValue] = useState('10');
  const [discIsPreset, setDiscIsPreset] = useState(true);

  // Company Settings & Active Currency State
  const [settingCurrencyCode, setSettingCurrencyCode] = useState(currency?.code || 'MYR');
  const [settingCurrencySymbol, setSettingCurrencySymbol] = useState(currency?.symbol || 'RM');
  const [settingDisplayName, setSettingDisplayName] = useState(company?.branding?.displayName || '');
  const [settingsSaving, setSettingsSaving] = useState(false);

  // B2B Companies State (System Admin)
  const [editingCompany, setEditingCompany] = useState(null);
  const [companyName, setCompanyName] = useState('');
  const [companyCode, setCompanyCode] = useState('');
  const [companyDisplayName, setCompanyDisplayName] = useState('');
  const [companyLogoText, setCompanyLogoText] = useState('');
  const [companyThemeColor, setCompanyThemeColor] = useState('#F59E0B');
  const [companyCurrencyCode, setCompanyCurrencyCode] = useState('MYR');
  const [companyCurrencySymbol, setCompanyCurrencySymbol] = useState('RM');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');

  // Initial Company Admin State (when provisioning company)
  const [createAdminWithComp, setCreateAdminWithComp] = useState(true);
  const [initAdminFullName, setInitAdminFullName] = useState('');
  const [initAdminEmail, setInitAdminEmail] = useState('');
  const [initAdminEmployeeCode, setInitAdminEmployeeCode] = useState('');
  const [initAdminPin, setInitAdminPin] = useState('1234');

  // Assign Admin Modal State
  const [assigningAdminCompany, setAssigningAdminCompany] = useState(null);
  const [newAdminFullName, setNewAdminFullName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminEmployeeCode, setNewAdminEmployeeCode] = useState('');
  const [newAdminPin, setNewAdminPin] = useState('1234');

  // Edit Company Modal State
  const [editCompName, setEditCompName] = useState('');
  const [editCompCode, setEditCompCode] = useState('');
  const [editCompDisplayName, setEditCompDisplayName] = useState('');
  const [editCompLogoText, setEditCompLogoText] = useState('');
  const [editCompThemeColor, setEditCompThemeColor] = useState('#F59E0B');
  const [editCompCurrencyCode, setEditCompCurrencyCode] = useState('MYR');
  const [editCompCurrencySymbol, setEditCompCurrencySymbol] = useState('RM');
  const [editCompEmail, setEditCompEmail] = useState('');
  const [editCompPhone, setEditCompPhone] = useState('');
  const [editCompAddress, setEditCompAddress] = useState('');
  const [editCompIsActive, setEditCompIsActive] = useState(true);

  // Sync currency/company changes from AuthContext
  useEffect(() => {
    if (currency?.code) setSettingCurrencyCode(currency.code);
    if (currency?.symbol) setSettingCurrencySymbol(currency.symbol);
    if (company?.branding?.displayName) setSettingDisplayName(company.branding.displayName);
  }, [currency, company]);

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
        if (catRes.data.data.length > 0 && !prodCategoryId) {
          setProdCategoryId(catRes.data.data[0]._id);
        }
      }
      if (prodRes?.data?.success) {
        setProducts(prodRes.data.data);
        if (prodRes.data.data.length > 0 && !discProductId) {
          setDiscProductId(prodRes.data.data[0]._id);
        }
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
    }
  };

  const handleCreateCustomerAdmin = async (e) => {
    e.preventDefault();
    setMessage(null);
    if (!custName.trim()) {
      setMessage({ type: 'error', text: 'Customer name is required' });
      return;
    }
    setCustSaving(true);
    try {
      const res = await axiosSecure.post('/api/customers', {
        name: custName.trim(),
        phone: custPhone.trim(),
        email: custEmail.trim(),
        notes: custNotes.trim()
      });
      if (res.data?.success) {
        setMessage({ type: 'success', text: `Customer "${custName}" added successfully!` });
        setCustName('');
        setCustPhone('');
        setCustEmail('');
        setCustNotes('');
        fetchCatalogData();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to add customer' });
    } finally {
      setCustSaving(false);
    }
  };

  useEffect(() => {
    fetchCatalogData();
  }, [axiosSecure, role]);

  // =========================================================================
  // CATEGORY HANDLERS (Create, Edit, Delete)
  // =========================================================================
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    setMessage(null);

    try {
      const res = await axiosSecure.post('/api/categories/admin', {
        name: catName,
        displayOrder: Number(catOrder),
        colorCode: catColor
      });

      if (res.data?.success) {
        setMessage({ type: 'success', text: `Category "${catName}" created successfully!` });
        setCatName('');
        setCatOrder('0');
        fetchCatalogData();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to create category' });
    }
  };

  const openEditCategoryModal = (cat) => {
    setEditingCategory(cat);
    setEditCatName(cat.name);
    setEditCatOrder(String(cat.displayOrder || 0));
    setEditCatColor(cat.colorCode || '#3B82F6');
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    try {
      const res = await axiosSecure.put(`/api/categories/admin/${editingCategory._id}`, {
        name: editCatName,
        displayOrder: Number(editCatOrder),
        colorCode: editCatColor
      });
      if (res.data?.success) {
        setMessage({ type: 'success', text: `Category "${editCatName}" updated successfully!` });
        setEditingCategory(null);
        fetchCatalogData();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update category' });
    }
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
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setMessage(null);

    const priceCents = Math.round(parseFloat(prodPriceDollars) * 100);
    const costCents = Math.round(parseFloat(prodCostDollars || '0') * 100);

    if (isNaN(priceCents) || priceCents <= 0) {
      setMessage({ type: 'error', text: 'Please provide a valid selling price greater than 0' });
      return;
    }

    if (!prodCategoryId) {
      setMessage({ type: 'error', text: 'Please select a target Category for this product.' });
      return;
    }

    try {
      const res = await axiosSecure.post('/api/products/admin', {
        sku: prodSku.trim().toUpperCase(),
        name: prodName.trim(),
        categoryId: prodCategoryId,
        priceInCents: priceCents,
        costInCents: costCents,
        stockQuantity: Number(prodStock)
      });

      if (res.data?.success) {
        setMessage({ type: 'success', text: `Product "${prodName}" added to catalog successfully!` });
        setProdSku('');
        setProdName('');
        setProdPriceDollars('');
        setProdCostDollars('');
        fetchCatalogData();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to create product' });
    }
  };

  const openEditProductModal = (product) => {
    setEditingProduct(product);
    setEditSku(product.sku);
    setEditName(product.name);
    setEditCategoryId(product.categoryId?._id || product.categoryId);
    setEditPriceDollars((product.priceInCents / 100).toFixed(2));
    setEditCostDollars((product.costInCents / 100).toFixed(2));
    setEditStock(String(product.stockQuantity || 0));
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    const priceCents = Math.round(parseFloat(editPriceDollars) * 100);
    const costCents = Math.round(parseFloat(editCostDollars || '0') * 100);

    try {
      const res = await axiosSecure.put(`/api/products/admin/${editingProduct._id}`, {
        sku: editSku.trim().toUpperCase(),
        name: editName.trim(),
        categoryId: editCategoryId,
        priceInCents: priceCents,
        costInCents: costCents,
        stockQuantity: Number(editStock)
      });

      if (res.data?.success) {
        setMessage({ type: 'success', text: `Product "${editName}" updated successfully!` });
        setEditingProduct(null);
        fetchCatalogData();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update product' });
    }
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
  // USER / STAFF HANDLERS
  // =========================================================================
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setMessage(null);

    try {
      const payload = {
        fullName: userFullName.trim(),
        email: userEmail.trim().toLowerCase(),
        employeeCode: userEmployeeCode.trim().toUpperCase(),
        role: userRole,
        password: userPassword,
        pinCode: userPassword
      };

      if (role === 'system_admin' && userCompanyId) {
        payload.companyId = userCompanyId;
      }

      const res = await axiosSecure.post('/api/admin/create', payload);

      if (res.data?.success) {
        setMessage({ 
          type: 'success', 
          text: `User "${userFullName}" (${userRole.toUpperCase()}) registered successfully!` 
        });
        setUserFullName('');
        setUserEmail('');
        setUserEmployeeCode('');
        setUserCompanyId('');
        fetchCatalogData();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to register user' });
    }
  };

  const openEditUserModal = (user) => {
    setEditingUser(user);
    setEditUserFullName(user.fullName || '');
    setEditUserEmail(user.email || '');
    setEditUserEmployeeCode(user.employeeCode || '');
    setEditUserRole(user.role || 'staff');
    setEditUserCompanyId(user.companyId?._id || user.companyId || '');
    setEditUserPinCode('');
    setEditUserIsActive(user.isActive !== false);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        fullName: editUserFullName.trim(),
        email: editUserEmail.trim().toLowerCase(),
        employeeCode: editUserEmployeeCode.trim().toUpperCase(),
        role: editUserRole,
        isActive: editUserIsActive
      };
      if (editUserPinCode.trim()) {
        payload.pinCode = editUserPinCode.trim();
      }
      if (role === 'system_admin') {
        payload.companyId = editUserCompanyId || null;
      }

      const res = await axiosSecure.put(`/api/admin/users/${editingUser._id}`, payload);
      if (res.data?.success) {
        setMessage({ type: 'success', text: `User "${editUserFullName}" updated successfully!` });
        setEditingUser(null);
        fetchCatalogData();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update user' });
    }
  };

  // =========================================================================
  // COMPANY SETTINGS & CURRENCY HANDLERS
  // =========================================================================
  const handleSaveCurrencySettings = async (e) => {
    e.preventDefault();
    setSettingsSaving(true);
    try {
      const res = await axiosSecure.put('/api/companies/my/settings', {
        currency: {
          code: settingCurrencyCode.trim().toUpperCase(),
          symbol: settingCurrencySymbol.trim()
        },
        branding: {
          displayName: settingDisplayName.trim()
        }
      });

      if (res.data?.success) {
        setMessage({ type: 'success', text: 'Currency and company settings updated successfully!' });
        updateActiveCompany(res.data.data);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update settings' });
    } finally {
      setSettingsSaving(false);
    }
  };

  // =========================================================================
  // B2B COMPANY HANDLERS (System Admin)
  // =========================================================================
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

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: companyName.trim(),
        code: companyCode.trim().toUpperCase(),
        branding: {
          displayName: companyDisplayName.trim() || companyName.trim(),
          logoText: companyLogoText.trim() || companyName.trim().charAt(0).toUpperCase(),
          themeColor: companyThemeColor
        },
        currency: {
          code: companyCurrencyCode.trim().toUpperCase(),
          symbol: companyCurrencySymbol.trim()
        },
        contactEmail: companyEmail.trim(),
        contactPhone: companyPhone.trim()
      };

      if (createAdminWithComp && initAdminEmail.trim() && initAdminFullName.trim()) {
        payload.adminUser = {
          fullName: initAdminFullName.trim(),
          email: initAdminEmail.trim().toLowerCase(),
          employeeCode: initAdminEmployeeCode.trim().toUpperCase() || `ADM-${companyCode.trim().toUpperCase()}`,
          pinCode: initAdminPin.trim() || '1234',
          password: initAdminPin.trim() || '1234'
        };
      }

      const res = await axiosSecure.post('/api/companies', payload);

      if (res.data?.success) {
        const adminMsg = res.data.data?.initialAdmin
          ? ` with Admin "${res.data.data.initialAdmin.fullName}" (${res.data.data.initialAdmin.email})`
          : '';
        setMessage({ type: 'success', text: `Company "${companyName}" provisioned successfully${adminMsg}!` });
        setCompanyName('');
        setCompanyCode('');
        setCompanyDisplayName('');
        setCompanyLogoText('');
        setCompanyEmail('');
        setCompanyPhone('');
        setInitAdminFullName('');
        setInitAdminEmail('');
        setInitAdminEmployeeCode('');
        setInitAdminPin('1234');
        fetchCompanies();
        fetchCatalogData();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to create company' });
    }
  };

  const handleAssignCompanyAdmin = async (e) => {
    e.preventDefault();
    if (!assigningAdminCompany) return;
    try {
      const res = await axiosSecure.post(`/api/companies/${assigningAdminCompany._id}/admins`, {
        fullName: newAdminFullName.trim(),
        email: newAdminEmail.trim().toLowerCase(),
        employeeCode: newAdminEmployeeCode.trim().toUpperCase(),
        pinCode: newAdminPin.trim() || '1234',
        password: newAdminPin.trim() || '1234'
      });

      if (res.data?.success) {
        setMessage({ type: 'success', text: `Admin "${newAdminFullName}" provisioned for ${assigningAdminCompany.name} successfully!` });
        setAssigningAdminCompany(null);
        setNewAdminFullName('');
        setNewAdminEmail('');
        setNewAdminEmployeeCode('');
        setNewAdminPin('1234');
        fetchCompanies();
        fetchCatalogData();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to assign company admin' });
    }
  };

  const openEditCompanyModal = (comp) => {
    setEditingCompany(comp);
    setEditCompName(comp.name || '');
    setEditCompCode(comp.code || '');
    setEditCompDisplayName(comp.branding?.displayName || '');
    setEditCompLogoText(comp.branding?.logoText || '');
    setEditCompThemeColor(comp.branding?.themeColor || '#F59E0B');
    setEditCompCurrencyCode(comp.currency?.code || 'MYR');
    setEditCompCurrencySymbol(comp.currency?.symbol || 'RM');
    setEditCompEmail(comp.contactEmail || '');
    setEditCompPhone(comp.contactPhone || '');
    setEditCompAddress(comp.address || '');
    setEditCompIsActive(comp.isActive !== false);
  };

  const handleUpdateCompany = async (e) => {
    e.preventDefault();
    try {
      const res = await axiosSecure.put(`/api/companies/${editingCompany._id}`, {
        name: editCompName.trim(),
        code: editCompCode.trim().toUpperCase(),
        branding: {
          displayName: editCompDisplayName.trim(),
          logoText: editCompLogoText.trim(),
          themeColor: editCompThemeColor
        },
        currency: {
          code: editCompCurrencyCode.trim().toUpperCase(),
          symbol: editCompCurrencySymbol.trim()
        },
        contactEmail: editCompEmail.trim(),
        contactPhone: editCompPhone.trim(),
        address: editCompAddress.trim(),
        isActive: editCompIsActive
      });

      if (res.data?.success) {
        setMessage({ type: 'success', text: `Company "${editCompName}" updated successfully!` });
        setEditingCompany(null);
        fetchCompanies();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update company' });
    }
  };

  // =========================================================================
  // DISCOUNT HANDLERS (Create, Delete)
  // =========================================================================
  const handleCreateDiscount = async (e) => {
    e.preventDefault();
    setMessage(null);

    const val = discType === 'fixed_cents' ? Math.round(parseFloat(discValue) * 100) : Number(discValue);

    try {
      const res = await axiosSecure.post('/api/discounts/admin', {
        name: discName,
        type: discType,
        target: discTarget,
        productId: discTarget === 'specific_product' ? discProductId : undefined,
        value: val,
        isPresetButton: discIsPreset,
        displayOrder: 1
      });

      if (res.data?.success) {
        setMessage({ type: 'success', text: `Discount button "${discName}" created successfully!` });
        setDiscName('');
        fetchCatalogData();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to create discount' });
    }
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

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
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

          <div className="flex flex-wrap items-center gap-1.5 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('products')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                activeTab === 'products' ? 'bg-amber-500 text-black shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>1. Products ({products.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                activeTab === 'categories' ? 'bg-amber-500 text-black shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>2. Categories ({categories.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                activeTab === 'customers' ? 'bg-amber-500 text-black shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>3. Customers ({customers.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                activeTab === 'users' ? 'bg-amber-500 text-black shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>4. Users & Staff ({users.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('discounts')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                activeTab === 'discounts' ? 'bg-amber-500 text-black shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>4. Discounts ({discounts.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                activeTab === 'settings' ? 'bg-amber-500 text-black shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>5. Currency & Settings</span>
            </button>
            {role === 'system_admin' && (
              <button
                onClick={() => { setActiveTab('companies'); fetchCompanies(); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                  activeTab === 'companies' ? 'bg-amber-500 text-black shadow-md' : 'text-amber-400/90 hover:text-amber-300'
                }`}
              >
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>6. B2B Companies ({companies.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Status Feedback Message */}
        {message && (
          <div className={`p-4 rounded-xl text-sm flex items-center justify-between ${
            message.type === 'success' 
              ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-300'
              : 'bg-red-950/80 border border-red-800 text-red-300'
          }`}>
            <div className="flex items-center space-x-2">
              {message.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
              <span>{message.text}</span>
            </div>
            <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 1: PRODUCT MANAGEMENT VIEW (Full CRUD: Create, Read, Update, Delete)   */}
        {/* ========================================================================= */}
        {activeTab === 'products' && (
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
                <form onSubmit={handleCreateProduct} className="space-y-3 text-sm">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Target Category *
                    </label>
                    <select
                      value={prodCategoryId}
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

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm rounded-xl transition shadow-md mt-2"
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
                  {products.map((p) => (
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
                      <td className="py-3 px-3 font-mono font-bold text-amber-400">
                        {formatCurrency(p.priceInCents, currency)}
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
                            onClick={() => openEditProductModal(p)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg transition"
                            title="Edit Product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(p._id, p.name)}
                            className="p-1.5 bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400 rounded-lg transition"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: CATEGORY MANAGEMENT VIEW (CRUD: Create, Read, Update, Delete)      */}
        {/* ========================================================================= */}
        {activeTab === 'categories' && (
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

              <form onSubmit={handleCreateCategory} className="space-y-3 text-sm">
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
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm rounded-xl transition shadow-md mt-2"
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
                        onClick={() => openEditCategoryModal(cat)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg transition"
                        title="Edit Category"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat._id, cat.name)}
                        className="p-1.5 bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400 rounded-lg transition"
                        title="Delete Category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: CUSTOMERS DIRECTORY & MANAGEMENT                                   */}
        {/* ========================================================================= */}
        {activeTab === 'customers' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Create Customer Form */}
            <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
              <div>
                <h2 className="text-base font-bold text-white flex items-center space-x-2">
                  <UserPlus className="w-4 h-4 text-amber-400" />
                  <span>Register New Customer</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Add customer profiles to easily attach them to sales and maintain customer bills.
                </p>
              </div>

              <form onSubmit={handleCreateCustomerAdmin} className="space-y-3 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Customer Full Name *</label>
                  <input
                    type="text"
                    required
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    placeholder="e.g. Michael Wong"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    placeholder="e.g. +60 12-345 6789"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address (Optional)</label>
                  <input
                    type="email"
                    value={custEmail}
                    onChange={(e) => setCustEmail(e.target.value)}
                    placeholder="e.g. michael@example.com"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Notes / Preferences (Optional)</label>
                  <textarea
                    rows={2}
                    value={custNotes}
                    onChange={(e) => setCustNotes(e.target.value)}
                    placeholder="e.g. VIP regular, prefers oat milk..."
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-amber-500 focus:outline-none text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={custSaving || !custName.trim()}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm rounded-xl transition shadow-md mt-2 disabled:opacity-50"
                >
                  {custSaving ? 'Saving Customer...' : 'Save Customer'}
                </button>
              </form>
            </div>

            {/* Customers Directory List */}
            <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="text-base font-bold text-white">Registered Customers ({customers.length})</h2>
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={custSearch}
                    onChange={(e) => setCustSearch(e.target.value)}
                    placeholder="Search name or phone..."
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {customers.filter((c) => {
                if (!custSearch.trim()) return true;
                const term = custSearch.toLowerCase().trim();
                return c.name?.toLowerCase().includes(term) || c.phone?.toLowerCase().includes(term) || c.email?.toLowerCase().includes(term);
              }).length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  {custSearch ? `No customers matching "${custSearch}"` : 'No customers registered yet. Add your first customer using the form on the left.'}
                </div>
              ) : (
                <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden">
                  {customers
                    .filter((c) => {
                      if (!custSearch.trim()) return true;
                      const term = custSearch.toLowerCase().trim();
                      return c.name?.toLowerCase().includes(term) || c.phone?.toLowerCase().includes(term) || c.email?.toLowerCase().includes(term);
                    })
                    .map((cust) => (
                      <div key={cust._id} className="p-3.5 flex items-center justify-between bg-slate-850 hover:bg-slate-800 transition">
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                            {cust.name?.charAt(0)?.toUpperCase() || 'C'}
                          </div>
                          <div className="truncate">
                            <div className="font-bold text-white text-sm truncate">{cust.name}</div>
                            <div className="text-xs text-slate-400 flex items-center space-x-2">
                              {cust.phone && <span className="font-mono">{cust.phone}</span>}
                              {cust.phone && cust.email && <span>•</span>}
                              {cust.email && <span className="truncate">{cust.email}</span>}
                            </div>
                            {cust.notes && (
                              <div className="text-[11px] text-amber-300/80 italic mt-0.5 truncate">
                                &ldquo;{cust.notes}&rdquo;
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right text-[11px] text-slate-500 shrink-0 ml-3">
                          Added {new Date(cust.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: USERS & STAFF MANAGEMENT                                          */}
        {/* ========================================================================= */}
        {activeTab === 'users' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Create User Form */}
            <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
              <div>
                <h2 className="text-base font-bold text-white flex items-center space-x-2">
                  <UserPlus className="w-4 h-4 text-amber-400" />
                  <span>
                    {role === 'system_admin' 
                      ? 'Register User or Tenant Staff' 
                      : `Register Staff for ${company?.branding?.displayName || company?.name || 'Company'}`}
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {role === 'system_admin'
                    ? 'Provision platform accounts, company admins, or staff tied to a B2B company.'
                    : 'Create staff members (who can hold tabs) or cashiers under your company.'}
                </p>
              </div>

              {role === 'admin' && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center space-x-2">
                  <Building2 className="w-4 h-4 shrink-0" />
                  <span>Auto-linked to company: <strong>{company?.branding?.displayName || company?.name || 'My Company'}</strong></span>
                </div>
              )}

              <form onSubmit={handleCreateUser} className="space-y-3 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Account Role *</label>
                  <select
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="staff">Staff Member (Opens Tabs at POS)</option>
                    <option value="cashier">Cashier (Operates POS Terminal)</option>
                    <option value="admin">
                      {role === 'system_admin' ? 'Company Administrator' : 'Company Admin (Co-Manager)'}
                    </option>
                    {role === 'system_admin' && (
                      <option value="system_admin">System Admin (Platform Owner)</option>
                    )}
                  </select>
                </div>

                {role === 'system_admin' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Assign to B2B Company
                    </label>
                    <select
                      value={userCompanyId}
                      onChange={(e) => setUserCompanyId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    >
                      <option value="">Platform Level / No Company</option>
                      {companies.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name} ({c.code})
                        </option>
                      ))}
                    </select>
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Assign this user or admin to a specific B2B client company.
                    </span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={userFullName}
                    onChange={(e) => setUserFullName(e.target.value)}
                    placeholder="e.g. David Miller"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Employee Code *</label>
                  <input
                    type="text"
                    required
                    value={userEmployeeCode}
                    onChange={(e) => setUserEmployeeCode(e.target.value)}
                    placeholder="e.g. STF-104 or CSH-003"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono uppercase focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="david@pos.local"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Terminal PIN Code (4-6 Digits) *
                  </label>
                  <input
                    type="password"
                    maxLength="6"
                    required
                    value={userPassword}
                    onChange={(e) => setUserPassword(e.target.value)}
                    placeholder="1234"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-center tracking-widest focus:ring-2 focus:ring-amber-500 focus:outline-none text-base"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Cashiers type this PIN on the POS numpad to unlock the terminal and ring up sales.
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm rounded-xl transition shadow-md mt-2 cursor-pointer"
                >
                  Register Account
                </button>
              </form>
            </div>

            {/* Users & Staff Directory Table */}
            <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm overflow-x-auto">
              {(() => {
                const displayedUsers = users.filter((u) => {
                  if (role !== 'system_admin' || userFilterCompany === 'ALL') return true;
                  if (userFilterCompany === 'NONE') return !u.companyId;
                  return (u.companyId?._id || u.companyId) === userFilterCompany;
                });

                return (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      <div>
                        <h2 className="text-base font-bold text-white">
                          Registered Users & Staff ({displayedUsers.length})
                        </h2>
                        <span className="text-xs text-slate-400">
                          {role === 'system_admin'
                            ? 'System Admin platform view across all B2B tenant companies'
                            : `Team directory for ${company?.branding?.displayName || company?.name || 'Company'}`}
                        </span>
                      </div>

                      {role === 'system_admin' && (
                        <div className="flex items-center space-x-2 shrink-0">
                          <label className="text-xs text-slate-400 font-medium">Filter Company:</label>
                          <select
                            value={userFilterCompany}
                            onChange={(e) => setUserFilterCompany(e.target.value)}
                            className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-medium focus:ring-1 focus:ring-amber-500 focus:outline-none"
                          >
                            <option value="ALL">All Companies ({users.length})</option>
                            <option value="NONE">Platform Only (No Company)</option>
                            {companies.map((c) => (
                              <option key={c._id} value={c._id}>
                                {c.name} ({c.code})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-800 text-xs text-slate-400 uppercase bg-slate-850/80">
                          <th className="py-2.5 px-3 font-semibold">Employee</th>
                          <th className="py-2.5 px-3 font-semibold">Role</th>
                          {role === 'system_admin' && (
                            <th className="py-2.5 px-3 font-semibold">Company</th>
                          )}
                          <th className="py-2.5 px-3 font-semibold">Login ID</th>
                          <th className="py-2.5 px-3 font-semibold">Terminal PIN</th>
                          <th className="py-2.5 px-3 font-semibold">Status</th>
                          <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {displayedUsers.map((u) => (
                          <tr key={u._id} className="hover:bg-slate-850/60 transition">
                            <td className="py-3 px-3">
                              <div className="font-bold text-white">{u.fullName}</div>
                              <div className="text-xs text-slate-400">{u.email}</div>
                            </td>
                            <td className="py-3 px-3">
                              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border uppercase ${
                                u.role === 'system_admin'
                                  ? 'bg-amber-950/90 text-amber-300 border-amber-500'
                                  : u.role === 'admin' 
                                  ? 'bg-purple-950/80 text-purple-400 border-purple-800'
                                  : u.role === 'cashier'
                                  ? 'bg-amber-950/80 text-amber-400 border-amber-800'
                                  : 'bg-blue-950/80 text-blue-400 border-blue-800'
                              }`}>
                                {u.role === 'system_admin' ? 'SYS ADMIN' : u.role}
                              </span>
                            </td>
                            {role === 'system_admin' && (
                              <td className="py-3 px-3">
                                {u.companyId ? (
                                  <span className="text-xs font-bold text-amber-300 bg-amber-950/60 border border-amber-800/80 px-2 py-0.5 rounded-md inline-block">
                                    {u.companyId.name || u.companyId.code || 'Assigned'}
                                  </span>
                                ) : (
                                  <span className="text-xs text-slate-500 italic">Platform</span>
                                )}
                              </td>
                            )}
                            <td className="py-3 px-3 font-mono font-bold text-amber-400 text-xs">
                              {u.employeeCode}
                            </td>
                            <td className="py-3 px-3 font-mono text-xs text-slate-200">
                              <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700 font-bold text-amber-300">
                                {u.pinCode || '••••'}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              {u.isActive !== false ? (
                                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                                  ACTIVE
                                </span>
                              ) : (
                                <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-800 font-bold">
                                  INACTIVE
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => openEditUserModal(u)}
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg transition inline-flex items-center space-x-1 cursor-pointer"
                                title="Edit User Profile"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span className="text-xs font-semibold">Edit</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: PRESET DISCOUNTS VIEW (With Specific Product Support & Deletes)     */}
        {/* ========================================================================= */}
        {activeTab === 'discounts' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Create Preset Discount Form */}
            <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
              <div>
                <h2 className="text-base font-bold text-white flex items-center space-x-2">
                  <Plus className="w-4 h-4 text-amber-400" />
                  <span>Configure 1-Click Discount</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Preset buttons appear on the cashier active ticket for 1-tap discounts.
                </p>
              </div>

              <form onSubmit={handleCreateDiscount} className="space-y-3 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Discount Label *</label>
                  <input
                    type="text"
                    required
                    value={discName}
                    onChange={(e) => setDiscName(e.target.value)}
                    placeholder="e.g. 15% VIP Special"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Type</label>
                    <select
                      value={discType}
                      onChange={(e) => setDiscType(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed_cents">Fixed Amount ({currency?.symbol || 'RM'})</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Scope</label>
                    <select
                      value={discTarget}
                      onChange={(e) => setDiscTarget(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="line_item">Any Selected Line Item</option>
                      <option value="specific_product">Specific Product</option>
                      <option value="global_ticket">Total Ticket (Global)</option>
                    </select>
                  </div>
                </div>

                {/* If Specific Product selected, show product picker */}
                {discTarget === 'specific_product' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      Choose Target Product *
                    </label>
                    <select
                      value={discProductId}
                      onChange={(e) => setDiscProductId(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-amber-500"
                    >
                      {products.map((prod) => (
                        <option key={prod._id} value={prod._id}>
                          {prod.name} ({formatCurrency(prod.priceInCents, currency)})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Discount Value ({discType === 'percentage' ? '%' : (currency?.symbol || 'RM')})
                  </label>
                  <input
                    type="number"
                    step={discType === 'fixed_cents' ? '0.01' : '1'}
                    required
                    value={discValue}
                    onChange={(e) => setDiscValue(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm rounded-xl transition shadow-md mt-2"
                >
                  Create Discount Button
                </button>
              </form>
            </div>

            {/* Preset Discounts List with Delete */}
            <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
              <h2 className="text-base font-bold text-white mb-4">Configured Cashier Buttons ({discounts.length})</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {discounts.map((d) => (
                  <div key={d._id} className="p-4 bg-slate-850 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white text-sm">{d.name}</div>
                      <div className="text-xs text-slate-400">
                        {d.target === 'specific_product'
                          ? `Only on: ${d.productNameSnapshot || 'Specific item'}`
                          : d.target === 'line_item'
                          ? 'Any Selected Line Item'
                          : 'Global Ticket Scope'}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="font-mono font-bold text-amber-400 text-base">
                        {d.type === 'percentage' ? `${d.value}%` : formatCurrency(d.value, currency)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteDiscount(d._id, d.name)}
                        className="p-1.5 bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400 rounded-lg transition"
                        title="Delete Discount Button"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: COMPANY & CURRENCY SETTINGS                                        */}
        {/* ========================================================================= */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <Coins className="w-5 h-5 text-amber-400" />
                <span>Currency & Company Configuration</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Configure your active trading currency and display settings across all POS terminals.
              </p>
            </div>

            <form onSubmit={handleSaveCurrencySettings} className="space-y-4 text-sm">
              <div className="p-4 rounded-xl bg-slate-850 border border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Active Currency Status
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-2xl font-black text-amber-400 font-mono">
                    {currency?.symbol || 'RM'} ({currency?.code || 'MYR'})
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-semibold">
                    Current Active
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Choose Currency Preset
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SUPPORTED_CURRENCIES.map((curr) => (
                    <button
                      key={curr.code}
                      type="button"
                      onClick={() => {
                        setSettingCurrencyCode(curr.code);
                        setSettingCurrencySymbol(curr.symbol);
                      }}
                      className={`p-2.5 rounded-xl text-left border transition ${
                        settingCurrencyCode === curr.code
                          ? 'bg-amber-500/15 border-amber-500 text-white shadow-sm'
                          : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-750'
                      }`}
                    >
                      <div className="font-bold text-sm text-amber-400">{curr.symbol} - {curr.code}</div>
                      <div className="text-[11px] text-slate-400 truncate">{curr.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Currency Symbol *
                  </label>
                  <input
                    type="text"
                    required
                    value={settingCurrencySymbol}
                    onChange={(e) => setSettingCurrencySymbol(e.target.value)}
                    placeholder="RM, $, S$, €, £"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-center font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Currency ISO Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={settingCurrencyCode}
                    onChange={(e) => setSettingCurrencyCode(e.target.value.toUpperCase())}
                    placeholder="MYR, USD, SGD"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-center font-bold uppercase focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Branding Display Name */}
              <div className="p-4 rounded-xl bg-slate-850 border border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-slate-300">
                  Branding Display Name
                </div>
                <input
                  type="text"
                  value={settingDisplayName}
                  onChange={(e) => setSettingDisplayName(e.target.value)}
                  placeholder="e.g. PoS System or The Coffee Bar"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <span className="text-[11px] text-slate-400 block">
                  Displayed on the POS terminal top bar, receipts, and reports header.
                </span>
              </div>

              <button
                type="submit"
                disabled={settingsSaving}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm rounded-xl transition shadow-md disabled:opacity-50 cursor-pointer"
              >
                {settingsSaving ? 'Saving Settings...' : 'Save Currency & Settings'}
              </button>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: B2B MULTI-TENANT COMPANIES (System Admin Only)                     */}
        {/* ========================================================================= */}
        {activeTab === 'companies' && role === 'system_admin' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Create Company Form */}
            <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
              <div>
                <h2 className="text-base font-bold text-white flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-amber-400" />
                  <span>Provision B2B Company</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Create a new tenant with custom branding, logo, and currency to resell the PoS System.
                </p>
              </div>

              <form onSubmit={handleCreateCompany} className="space-y-3 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Legal Company Name *</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Artisan Cafe Sdn Bhd"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Company Code / Slug *</label>
                  <input
                    type="text"
                    required
                    value={companyCode}
                    onChange={(e) => setCompanyCode(e.target.value)}
                    placeholder="e.g. ARTISAN-HQ"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono uppercase focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Branding Name</label>
                    <input
                      type="text"
                      value={companyDisplayName}
                      onChange={(e) => setCompanyDisplayName(e.target.value)}
                      placeholder="Artisan Cafe"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Logo Badge</label>
                    <input
                      type="text"
                      maxLength="4"
                      value={companyLogoText}
                      onChange={(e) => setCompanyLogoText(e.target.value)}
                      placeholder="AC"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold text-center uppercase focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Currency Code</label>
                    <input
                      type="text"
                      value={companyCurrencyCode}
                      onChange={(e) => setCompanyCurrencyCode(e.target.value.toUpperCase())}
                      placeholder="MYR"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono uppercase focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Currency Symbol</label>
                    <input
                      type="text"
                      value={companyCurrencySymbol}
                      onChange={(e) => setCompanyCurrencySymbol(e.target.value)}
                      placeholder="RM"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                    placeholder="contact@client.com"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Theme Accent Color</label>
                  <input
                    type="color"
                    value={companyThemeColor}
                    onChange={(e) => setCompanyThemeColor(e.target.value)}
                    className="w-full h-10 p-1 bg-slate-800 border border-slate-700 rounded-xl cursor-pointer"
                  />
                </div>

                {/* Initial Company Admin Section */}
                <div className="pt-3 border-t border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Crown className="w-4 h-4 text-amber-400" />
                      <label htmlFor="createAdminWithComp" className="text-xs font-bold text-white cursor-pointer select-none">
                        Assign Initial Company Admin
                      </label>
                    </div>
                    <input
                      type="checkbox"
                      id="createAdminWithComp"
                      checked={createAdminWithComp}
                      onChange={(e) => setCreateAdminWithComp(e.target.checked)}
                      className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                    />
                  </div>

                  {createAdminWithComp && (
                    <div className="p-3.5 bg-slate-850 rounded-xl border border-slate-800 space-y-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-0.5">Admin Full Name *</label>
                        <input
                          type="text"
                          required={createAdminWithComp}
                          value={initAdminFullName}
                          onChange={(e) => setInitAdminFullName(e.target.value)}
                          placeholder="e.g. Johnathan Lee"
                          className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-0.5">Admin Email *</label>
                        <input
                          type="email"
                          required={createAdminWithComp}
                          value={initAdminEmail}
                          onChange={(e) => setInitAdminEmail(e.target.value)}
                          placeholder="admin@client.com"
                          className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-0.5">Admin Code</label>
                          <input
                            type="text"
                            value={initAdminEmployeeCode}
                            onChange={(e) => setInitAdminEmployeeCode(e.target.value)}
                            placeholder={companyCode ? `ADM-${companyCode.toUpperCase()}` : 'ADM-CODE'}
                            className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono uppercase text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-0.5">Terminal PIN</label>
                          <input
                            type="text"
                            maxLength="6"
                            value={initAdminPin}
                            onChange={(e) => setInitAdminPin(e.target.value)}
                            placeholder="1234"
                            className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-center text-xs tracking-widest focus:ring-1 focus:ring-amber-500 focus:outline-none"
                          />
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 block">
                        This admin can log in and manage staff, products, and terminals under this company.
                      </span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm rounded-xl transition shadow-md mt-2 cursor-pointer"
                >
                  Provision Company & Admin
                </button>
              </form>
            </div>

            {/* Companies List */}
            <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm overflow-x-auto">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center space-x-2">
                    <Building2 className="w-4 h-4 text-amber-400" />
                    <span>Active B2B Companies ({companies.length})</span>
                  </h2>
                  <span className="text-xs text-slate-400">Manage client branding, currencies, and tenant accounts</span>
                </div>
              </div>

              <div className="space-y-3">
                {companies.map((comp) => (
                  <div key={comp._id} className="p-4 bg-slate-850 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-3 hover:bg-slate-800/80 transition">
                    <div className="flex items-center space-x-3.5">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-black font-black text-sm shadow-md shrink-0"
                        style={{ backgroundColor: comp.branding?.themeColor || '#F59E0B' }}
                      >
                        {comp.branding?.logoText || comp.name?.charAt(0) || 'P'}
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm flex items-center space-x-2">
                          <span>{comp.branding?.displayName || comp.name}</span>
                          <span className="font-mono text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            {comp.code}
                          </span>
                          {comp.isActive === false && (
                            <span className="text-[10px] bg-red-950 text-red-400 border border-red-800 px-1.5 py-0.5 rounded font-bold">INACTIVE</span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {comp.name} • Currency: <strong className="text-slate-300 font-mono">{comp.currency?.symbol || 'RM'} ({comp.currency?.code || 'MYR'})</strong> • Total Users: {comp.userCount || 0}
                        </div>
                        <div className="text-xs text-slate-300 mt-1.5 flex flex-wrap items-center gap-1.5">
                          <span className="text-slate-400">Company Admin(s):</span>
                          {comp.admins && comp.admins.length > 0 ? (
                            comp.admins.map((adm) => (
                              <span key={adm._id} className="inline-flex items-center space-x-1 bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded text-[11px] font-medium">
                                <Crown className="w-2.5 h-2.5" />
                                <span>{adm.fullName} ({adm.employeeCode})</span>
                              </span>
                            ))
                          ) : (
                            <span className="text-red-400 text-[11px] italic font-semibold">No Admin Assigned</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setAssigningAdminCompany(comp);
                          setNewAdminFullName('');
                          setNewAdminEmail('');
                          setNewAdminEmployeeCode(`ADM-${comp.code}`);
                          setNewAdminPin('1234');
                        }}
                        className="p-2 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 rounded-lg transition inline-flex items-center space-x-1.5 cursor-pointer text-xs font-semibold"
                        title="Assign or Provision Admin"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>+ Assign Admin</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditCompanyModal(comp)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition inline-flex items-center space-x-1.5 cursor-pointer text-xs font-semibold"
                        title="Edit Company Branding"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* EDIT PRODUCT MODAL (POPUP DIALOG)                                         */}
        {/* ========================================================================= */}
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
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateProduct} className="space-y-3 text-sm">
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

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl shadow-md transition"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* EDIT CATEGORY MODAL                                                       */}
        {/* ========================================================================= */}
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
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateCategory} className="space-y-3 text-sm">
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
                    className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl shadow-md transition"
                  >
                    Save Category
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* EDIT USER MODAL                                                           */}
        {/* ========================================================================= */}
        {editingUser && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                  <Edit2 className="w-4 h-4 text-amber-400" />
                  <span>Edit User: {editingUser.fullName}</span>
                </h3>
                <button
                  onClick={() => setEditingUser(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateUser} className="space-y-3 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editUserFullName}
                    onChange={(e) => setEditUserFullName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Employee Code *</label>
                  <input
                    type="text"
                    required
                    value={editUserEmployeeCode}
                    onChange={(e) => setEditUserEmployeeCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono uppercase focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={editUserEmail}
                    onChange={(e) => setEditUserEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Role</label>
                    <select
                      value={editUserRole}
                      onChange={(e) => setEditUserRole(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="staff">Staff Member</option>
                      <option value="cashier">Cashier</option>
                      <option value="admin">Administrator</option>
                      {role === 'system_admin' && (
                        <option value="system_admin">System Admin</option>
                      )}
                    </select>
                  </div>

                  {role === 'system_admin' && (
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Company Assignment</label>
                      <select
                        value={editUserCompanyId}
                        onChange={(e) => setEditUserCompanyId(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="">Platform Level / No Company</option>
                        {companies.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.name} ({c.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Status</label>
                    <select
                      value={editUserIsActive ? 'active' : 'inactive'}
                      onChange={(e) => setEditUserIsActive(e.target.value === 'active')}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Reset PIN Code (Optional, 4-6 Digits)
                  </label>
                  <input
                    type="password"
                    maxLength="6"
                    value={editUserPinCode}
                    onChange={(e) => setEditUserPinCode(e.target.value)}
                    placeholder="Leave blank to keep existing PIN"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-center tracking-widest focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl shadow-md transition"
                  >
                    Save User Profile
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* EDIT COMPANY MODAL (System Admin)                                         */}
        {/* ========================================================================= */}
        {editingCompany && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-amber-400" />
                  <span>Edit Company: {editingCompany.name}</span>
                </h3>
                <button
                  onClick={() => setEditingCompany(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateCompany} className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Company Name</label>
                    <input
                      type="text"
                      required
                      value={editCompName}
                      onChange={(e) => setEditCompName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Company Code</label>
                    <input
                      type="text"
                      required
                      value={editCompCode}
                      onChange={(e) => setEditCompCode(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Branding Name</label>
                    <input
                      type="text"
                      value={editCompDisplayName}
                      onChange={(e) => setEditCompDisplayName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Logo Badge Text</label>
                    <input
                      type="text"
                      maxLength="4"
                      value={editCompLogoText}
                      onChange={(e) => setEditCompLogoText(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-center font-bold uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Currency Code</label>
                    <input
                      type="text"
                      value={editCompCurrencyCode}
                      onChange={(e) => setEditCompCurrencyCode(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Currency Symbol</label>
                    <input
                      type="text"
                      value={editCompCurrencySymbol}
                      onChange={(e) => setEditCompCurrencySymbol(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Email</label>
                    <input
                      type="email"
                      value={editCompEmail}
                      onChange={(e) => setEditCompEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Phone</label>
                    <input
                      type="text"
                      value={editCompPhone}
                      onChange={(e) => setEditCompPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Address</label>
                    <input
                      type="text"
                      value={editCompAddress}
                      onChange={(e) => setEditCompAddress(e.target.value)}
                      placeholder="e.g. 123 Main St, Suite 400"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Status</label>
                    <select
                      value={editCompIsActive ? 'active' : 'inactive'}
                      onChange={(e) => setEditCompIsActive(e.target.value === 'active')}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                    >
                      <option value="active">Active Tenant</option>
                      <option value="inactive">Inactive / Suspended</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Theme Color</label>
                  <input
                    type="color"
                    value={editCompThemeColor}
                    onChange={(e) => setEditCompThemeColor(e.target.value)}
                    className="w-full h-10 p-1 bg-slate-800 border border-slate-700 rounded-xl cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingCompany(null)}
                    className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl shadow-md transition"
                  >
                    Save Company
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ASSIGN / PROVISION COMPANY ADMIN MODAL (System Admin)                     */}
        {/* ========================================================================= */}
        {assigningAdminCompany && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span>Assign Admin for {assigningAdminCompany.name}</span>
                </h3>
                <button
                  onClick={() => setAssigningAdminCompany(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-400">
                Provision a new administrator for <strong>{assigningAdminCompany.name}</strong> ({assigningAdminCompany.code}). This admin can log in and manage company staff, cashiers, and products.
              </p>

              <form onSubmit={handleAssignCompanyAdmin} className="space-y-3 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Admin Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newAdminFullName}
                    onChange={(e) => setNewAdminFullName(e.target.value)}
                    placeholder="e.g. Jane Doe"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="jane@client.com"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Employee ID *</label>
                    <input
                      type="text"
                      required
                      value={newAdminEmployeeCode}
                      onChange={(e) => setNewAdminEmployeeCode(e.target.value)}
                      placeholder={`ADM-${assigningAdminCompany.code}`}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono uppercase focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Terminal PIN (4-6 Digits) *</label>
                    <input
                      type="text"
                      maxLength="6"
                      required
                      value={newAdminPin}
                      onChange={(e) => setNewAdminPin(e.target.value)}
                      placeholder="1234"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-center tracking-widest focus:ring-2 focus:ring-amber-500 focus:outline-none text-base"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setAssigningAdminCompany(null)}
                    className="px-4 py-2 text-xs text-slate-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
                  >
                    Provision Admin
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
