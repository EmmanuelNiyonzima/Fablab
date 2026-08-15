import React, { useState } from 'react';
import { 
  Settings, 
  Building2, 
  RotateCcw, 
  Save, 
  ShieldCheck, 
  Database, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { storageService } from '../../services/storageService';

export const SettingsView: React.FC = () => {
  const state = storageService.getState();
  const [orgName, setOrgName] = useState('FabLab Rwanda Limited');
  const [tin, setTin] = useState('101234567');
  const [currency, setCurrency] = useState('RWF (Rwandan Franc)');
  const [vatRate, setVatRate] = useState('18% (RRA Standard)');
  const [fiscalYear, setFiscalYear] = useState('1 January - 31 December');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetData = () => {
    if (
      confirm(
        'Are you sure you want to reset the system database back to the factory verified state? All test edits will be restored.'
      )
    ) {
      storageService.resetToFactoryDefaults();
      alert('System database reset to initial verified FabLab financial dataset.');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">System & Organization Settings</h2>
            <Badge variant="purple">Configuration & Database Controls</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Entity legal profile, tax compliance rules, accounting standards, and local storage data management.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Organization Profile */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSaveSettings} className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Legal Entity Profile & Tax Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Legal Entity Name *</label>
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">RRA Tax Identification Number (TIN) *</label>
                <input
                  type="text"
                  required
                  value={tin}
                  onChange={(e) => setTin(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Reporting Currency</label>
                <input
                  type="text"
                  disabled
                  value={currency}
                  className="w-full p-2.5 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Standard Value Added Tax (VAT)</label>
                <input
                  type="text"
                  disabled
                  value={vatRate}
                  className="w-full p-2.5 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-medium"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700">Accounting Fiscal Year</label>
                <input
                  type="text"
                  disabled
                  value={fiscalYear}
                  className="w-full p-2.5 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-medium"
                />
              </div>
            </div>

            <div className="pt-3 flex items-center justify-between">
              {savedSuccess ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" />
                  Settings saved successfully!
                </span>
              ) : (
                <span />
              )}

              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Entity Settings</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Database Controls & Backup */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Data Persistence & Reset
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              All transactions, journal vouchers, budgets, and policies are stored safely in your browser local storage with instant auto-save.
            </p>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400">Database Engine</span>
              <p className="text-xs font-bold text-slate-900">Synchronous Browser Persistence</p>
              <p className="text-[11px] text-emerald-700 font-mono font-semibold">100% Offline Ready</p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleResetData}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-rose-600" />
                <span>Reset to Factory Verified Data</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
