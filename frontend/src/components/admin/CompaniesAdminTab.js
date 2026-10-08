'use client';

import React, { useState } from 'react';
import { 
  Building2, 
  Crown, 
  UserPlus, 
  Edit2, 
  X 
} from 'lucide-react';

export default function CompaniesAdminTab({
  companies = [],
  onCreateCompany,
  onUpdateCompany,
  onAssignAdmin
}) {
  // Create Company Form State
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
  const [editingCompany, setEditingCompany] = useState(null);
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

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
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

    const success = await onCreateCompany(payload);
    if (success) {
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

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    const payload = {
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
    };

    const success = await onUpdateCompany(editingCompany._id, payload);
    if (success) {
      setEditingCompany(null);
    }
  };

  const handleAssignAdminSubmit = async (e) => {
    e.preventDefault();
    if (!assigningAdminCompany) return;

    const payload = {
      fullName: newAdminFullName.trim(),
      email: newAdminEmail.trim().toLowerCase(),
      employeeCode: newAdminEmployeeCode.trim().toUpperCase(),
      pinCode: newAdminPin.trim() || '1234',
      password: newAdminPin.trim() || '1234'
    };

    const success = await onAssignAdmin(assigningAdminCompany, payload);
    if (success) {
      setAssigningAdminCompany(null);
      setNewAdminFullName('');
      setNewAdminEmail('');
      setNewAdminEmployeeCode('');
      setNewAdminPin('1234');
    }
  };

  return (
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

        <form onSubmit={handleCreateSubmit} className="space-y-3 text-sm">
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

      {/* ========================================================================= */}
      {/* EDIT COMPANY MODAL                                                        */}
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

            <form onSubmit={handleUpdateSubmit} className="space-y-3 text-sm">
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
      {/* ASSIGN / PROVISION COMPANY ADMIN MODAL                                    */}
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

            <form onSubmit={handleAssignAdminSubmit} className="space-y-3 text-sm">
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
    </div>
  );
}
