import React, { useState } from 'react';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Filter, 
  FileSpreadsheet, 
  ChevronRight, 
  DollarSign,
  Tag,
  Scale
} from 'lucide-react';
import { SearchFilterBar } from '../common/SearchFilterBar';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { storageService } from '../../services/storageService';
import { FinancialCalculator } from '../../services/calculationService';
import { ExportService } from '../../services/exportService';
import { Account, AccountType } from '../../types/financial';

export const ChartOfAccountsView: React.FC = () => {
  const state = storageService.getState();
  const accounts = state.accounts;

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Account State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('Administration Expense');
  const [description, setDescription] = useState('');
  const [normalBalance, setNormalBalance] = useState<'Debit' | 'Credit'>('Debit');

  const filteredAccounts = accounts.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.code.includes(searchQuery) ||
      a.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === 'all' || a.type === typeFilter;

    return matchesSearch && matchesType;
  });

  const totalAssets = accounts
    .filter((a) => ['Cash and Cash Equivalents', 'Trade Receivables', 'Other Current Assets', 'Property, Plant and Equipment'].includes(a.type))
    .reduce((sum, a) => sum + (a.currentBalance || 0), 0);

  const totalLiabilities = accounts
    .filter((a) => ['Current Liabilities', 'Non-current Liabilities'].includes(a.type))
    .reduce((sum, a) => sum + (a.currentBalance || 0), 0);

  const totalEquity = accounts
    .filter((a) => ['Equity', 'Retained Earnings'].includes(a.type))
    .reduce((sum, a) => sum + (a.currentBalance || 0), 0);

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name) {
      alert('Please fill in Account Code and Name.');
      return;
    }

    const newAcc: Account = {
      id: `acc-${Date.now()}`,
      code,
      name,
      type,
      isActive: true,
      description,
      normalBalance,
      currentBalance: 0,
      previousYearBalance: 0,
    };

    storageService.addAccount(newAcc);
    setShowAddModal(false);
    setCode('');
    setName('');
    setDescription('');
  };

  const handleExportExcel = () => {
    const headers = [
      'Account Code',
      'Account Title',
      'Account Classification',
      'Normal Balance',
      'Current Balance (RWF)',
      'Previous Year (RWF)',
      'Status',
    ];

    const rows = filteredAccounts.map((a) => [
      a.code,
      a.name,
      a.type,
      a.normalBalance,
      a.currentBalance,
      a.previousYearBalance,
      a.isActive ? 'Active' : 'Inactive',
    ]);

    ExportService.exportToExcel('Chart of Accounts', 'FabLab_ChartOfAccounts', headers, rows);
  };

  const accountTypes: AccountType[] = [
    'Revenue',
    'Cost of Sales',
    'Administration Expense',
    'Other Income',
    'Other Expense',
    'Cash and Cash Equivalents',
    'Trade Receivables',
    'Other Current Assets',
    'Property, Plant and Equipment',
    'Current Liabilities',
    'Equity',
    'Retained Earnings',
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Chart of Accounts (COA)</h2>
            <Badge variant="purple">Standard Ledger Structure</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            General ledger numbering hierarchy across Assets (1000s), Liabilities (2000s), Equity (3000s), Revenue (4000s), Cost of Sales (5000s), and Administrative Expenses (6000s).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Account</span>
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <p className="text-xs text-slate-500 font-semibold">Total Active Accounts</p>
          <p className="text-xl font-bold text-slate-900 font-mono mt-1">{accounts.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Across 6 financial classes</p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <p className="text-xs text-slate-500 font-semibold">Total Assets (1000s)</p>
          <p className="text-xl font-bold text-emerald-700 font-mono mt-1">
            {FinancialCalculator.formatRWF(totalAssets)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Cash, AR & Equipment</p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <p className="text-xs text-slate-500 font-semibold">Total Liabilities (2000s)</p>
          <p className="text-xl font-bold text-rose-700 font-mono mt-1">
            {FinancialCalculator.formatRWF(totalLiabilities)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Payables & Accruals</p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <p className="text-xs text-slate-500 font-semibold">Total Equity (3000s)</p>
          <p className="text-xl font-bold text-blue-700 font-mono mt-1">
            {FinancialCalculator.formatRWF(totalEquity)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Capital & Retained Earnings</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search account title, code (e.g. '6010'), type..."
        filters={[
          {
            label: 'Classification',
            value: typeFilter,
            onChange: setTypeFilter,
            options: [
              { label: 'All Classifications', value: 'all' },
              ...accountTypes.map((t) => ({ label: t, value: t })),
            ],
          },
        ]}
        onExportExcel={handleExportExcel}
      />

      {/* Accounts Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Code</th>
                <th className="py-3.5 px-4">Account Title</th>
                <th className="py-3.5 px-4">Classification</th>
                <th className="py-3.5 px-4 text-center">Normal Balance</th>
                <th className="py-3.5 px-4 text-right">Current Balance (RWF)</th>
                <th className="py-3.5 px-4 text-right">Prev Year</th>
                <th className="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredAccounts.map((a) => {
                const isDebit = a.normalBalance === 'Debit';
                return (
                  <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{a.code}</td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-bold text-slate-900">{a.name}</p>
                        <p className="text-[11px] text-slate-400">{a.description}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[11px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md font-semibold">
                        {a.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono ${
                          isDebit
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {a.normalBalance}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {FinancialCalculator.formatRWF(a.currentBalance)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-400">
                      {FinancialCalculator.formatRWF(a.previousYearBalance)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={a.isActive ? 'success' : 'neutral'} size="sm">
                        {a.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Account Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Create New General Ledger Account"
          subtitle="Define official accounting code, normal balance rule, and financial statement classification."
          maxWidth="lg"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateAccount}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md"
              >
                Create Account
              </button>
            </div>
          }
        >
          <form onSubmit={handleCreateAccount} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Account Code *</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. 6050"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Normal Balance *</label>
                <select
                  value={normalBalance}
                  onChange={(e) => setNormalBalance(e.target.value as 'Debit' | 'Credit')}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                >
                  <option value="Debit">Debit (Asset / Expense)</option>
                  <option value="Credit">Credit (Liability / Equity / Revenue)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Account Title / Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Special Project Drone Fabrication Costs"
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Classification *</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as AccountType)}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
              >
                {accountTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Description / Usage Notes</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Tracks direct materials and components consumed during rapid prototyping jobs."
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
