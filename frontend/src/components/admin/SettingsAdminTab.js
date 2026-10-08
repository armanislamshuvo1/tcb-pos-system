'use client';

import React, { useState, useEffect } from 'react';
import { Coins } from 'lucide-react';
import { SUPPORTED_CURRENCIES } from '../../utils/currency';

export default function SettingsAdminTab({
  currency,
  company,
  onSaveSettings
}) {
  const [settingCurrencyCode, setSettingCurrencyCode] = useState(currency?.code || 'MYR');
  const [settingCurrencySymbol, setSettingCurrencySymbol] = useState(currency?.symbol || 'RM');
  const [settingDisplayName, setSettingDisplayName] = useState(company?.branding?.displayName || '');
  const [settingsSaving, setSettingsSaving] = useState(false);

  useEffect(() => {
    if (currency?.code) setSettingCurrencyCode(currency.code);
    if (currency?.symbol) setSettingCurrencySymbol(currency.symbol);
    if (company?.branding?.displayName) setSettingDisplayName(company.branding.displayName);
  }, [currency, company]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSettingsSaving(true);
    try {
      await onSaveSettings({
        currencyCode: settingCurrencyCode,
        currencySymbol: settingCurrencySymbol,
        displayName: settingDisplayName
      });
    } finally {
      setSettingsSaving(false);
    }
  };

  return (
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

      <form onSubmit={handleFormSubmit} className="space-y-4 text-sm">
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
                className={`p-2.5 rounded-xl text-left border transition cursor-pointer ${
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
  );
}
