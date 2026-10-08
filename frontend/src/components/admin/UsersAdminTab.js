'use client';

import React, { useState } from 'react';
import { UserPlus, Building2, Edit2, Trash2, X } from 'lucide-react';

export default function UsersAdminTab({
  users = [],
  companies = [],
  company,
  role,
  currentUser,
  onCreateUser,
  onUpdateUser,
  onDeleteUser
}) {
  // Create User Form State
  const [userFullName, setUserFullName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userEmployeeCode, setUserEmployeeCode] = useState('');
  const [userRole, setUserRole] = useState('staff');
  const [userPassword, setUserPassword] = useState('1234');
  const [userCompanyId, setUserCompanyId] = useState('');
  const [userFilterCompany, setUserFilterCompany] = useState('ALL');

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState(null);
  const [editUserFullName, setEditUserFullName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserEmployeeCode, setEditUserEmployeeCode] = useState('');
  const [editUserRole, setEditUserRole] = useState('staff');
  const [editUserCompanyId, setEditUserCompanyId] = useState('');
  const [editUserPinCode, setEditUserPinCode] = useState('');
  const [editUserIsActive, setEditUserIsActive] = useState(true);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const success = await onCreateUser({
      fullName: userFullName,
      email: userEmail,
      employeeCode: userEmployeeCode,
      role: userRole,
      password: userPassword,
      companyId: userCompanyId
    });
    if (success) {
      setUserFullName('');
      setUserEmail('');
      setUserEmployeeCode('');
      setUserPassword('1234');
      setUserCompanyId('');
    }
  };

  const openEditModal = (u) => {
    setEditingUser(u);
    setEditUserFullName(u.fullName || '');
    setEditUserEmail(u.email || '');
    setEditUserEmployeeCode(u.employeeCode || '');
    setEditUserRole(u.role || 'staff');
    setEditUserCompanyId(u.companyId?._id || u.companyId || '');
    setEditUserPinCode('');
    setEditUserIsActive(u.isActive !== false);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const success = await onUpdateUser({
      id: editingUser._id,
      fullName: editUserFullName,
      email: editUserEmail,
      employeeCode: editUserEmployeeCode,
      role: editUserRole,
      companyId: editUserCompanyId,
      pinCode: editUserPinCode,
      isActive: editUserIsActive
    });
    if (success) {
      setEditingUser(null);
    }
  };

  const displayedUsers = users.filter((u) => {
    if (role !== 'system_admin' || userFilterCompany === 'ALL') return true;
    if (userFilterCompany === 'NONE') return !u.companyId;
    return (u.companyId?._id || u.companyId) === userFilterCompany;
  });

  return (
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

        <form onSubmit={handleFormSubmit} className="space-y-3 text-sm">
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
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              required
              value={userPassword}
              onChange={(e) => setUserPassword(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="1234"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-center tracking-widest focus:ring-2 focus:ring-amber-500 focus:outline-none text-base"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Numeric PIN entered on the POS numpad to unlock the terminal and ring up sales.
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
                    ••••
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
                  <div className="flex items-center justify-end space-x-1.5">
                    <button
                      type="button"
                      onClick={() => openEditModal(u)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-750 text-amber-400 rounded-lg transition inline-flex items-center space-x-1 cursor-pointer"
                      title="Edit User Profile"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span className="text-xs font-semibold">Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteUser(u._id, u.fullName)}
                      disabled={u._id === (currentUser?._id || currentUser?.id || currentUser?.mongoId)}
                      className="p-1.5 bg-slate-800 hover:bg-red-950/80 text-slate-400 hover:text-red-400 rounded-lg transition inline-flex items-center space-x-1 cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed"
                      title={u._id === (currentUser?._id || currentUser?.id || currentUser?.mongoId) ? "Cannot delete your own logged-in account" : "Delete User"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="text-xs font-semibold">Delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* EDIT USER MODAL */}
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
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3 text-sm">
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
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Reset PIN Code (Optional, 4-6 Digits)
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditUserPinCode('1234')}
                    className="text-[11px] text-amber-400 hover:text-amber-300 underline cursor-pointer"
                  >
                    Set to 1234
                  </button>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={editUserPinCode}
                  onChange={(e) => setEditUserPinCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Leave blank to keep existing PIN"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-center tracking-widest focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
                >
                  Save User Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
