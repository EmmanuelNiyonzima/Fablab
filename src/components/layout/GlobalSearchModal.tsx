import React, { useState, useEffect } from 'react';
import { Search, X, ArrowRight, Layers, FileSpreadsheet, Building2, BookOpen, DollarSign, Wallet } from 'lucide-react';
import { storageService } from '../../services/storageService';
import { FinancialCalculator } from '../../services/calculationService';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (module: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');
  const state = storageService.getState();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  // Search categories
  const matchedSharedExpenses = q
    ? state.sharedExpenses.filter(
        (e) =>
          e.description.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q) ||
          e.expenseNumber.toLowerCase().includes(q)
      )
    : [];

  const matchedTransactions = q
    ? state.expenseTransactions.filter(
        (e) =>
          e.description.toLowerCase().includes(q) ||
          e.vendor.toLowerCase().includes(q) ||
          e.expenseNumber.toLowerCase().includes(q)
      )
    : [];

  const matchedAccounts = q
    ? state.accounts.filter(
        (a) => a.name.toLowerCase().includes(q) || a.code.toLowerCase().includes(q)
      )
    : [];

  const matchedOrgs = q
    ? state.organizations.filter(
        (o) =>
          o.name.toLowerCase().includes(q) ||
          o.code.toLowerCase().includes(q) ||
          o.contactPerson.toLowerCase().includes(q)
      )
    : [];

  const matchedJournals = q
    ? state.journalEntries.filter(
        (j) =>
          j.journalNumber.toLowerCase().includes(q) ||
          j.description.toLowerCase().includes(q) ||
          j.reference.toLowerCase().includes(q)
      )
    : [];

  const totalMatches =
    matchedSharedExpenses.length +
    matchedTransactions.length +
    matchedAccounts.length +
    matchedOrgs.length +
    matchedJournals.length;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-start justify-center pt-20 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/70">
          <Search className="w-5 h-5 text-emerald-600 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search expenses, electricity, accounts, organizations, journals... (e.g. 'EUCL', '6000', 'Klab')"
            className="w-full text-sm bg-transparent text-slate-800 placeholder-slate-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {!query && (
            <div className="text-center py-8 text-slate-400 text-xs">
              <p className="font-semibold text-slate-600">Global Financial Search</p>
              <p className="mt-1">Type keywords like "Electricity", "Rent", "Liquid", "Fab Cafe", or account code "6010".</p>
            </div>
          )}

          {query && totalMatches === 0 && (
            <div className="text-center py-8 text-slate-500 text-xs">
              <p className="font-semibold text-slate-700">No financial records found for "{query}"</p>
              <p className="mt-1 text-slate-400">Try searching for a vendor, category, account code, or organization.</p>
            </div>
          )}

          {/* Shared Expenses */}
          {matchedSharedExpenses.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-600" /> Shared Space Expenses ({matchedSharedExpenses.length})
              </p>
              <div className="space-y-1">
                {matchedSharedExpenses.map((exp) => (
                  <div
                    key={exp.id}
                    onClick={() => {
                      onNavigate('shared-expenses');
                      onClose();
                    }}
                    className="p-2.5 rounded-lg hover:bg-emerald-50/60 border border-transparent hover:border-emerald-200 transition-colors flex items-center justify-between cursor-pointer text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900">{exp.description}</span>
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        {exp.expenseNumber} • {exp.category} • {exp.billingFrequency}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-emerald-700">{FinancialCalculator.formatRWF(exp.totalAmount)}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 ml-auto mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chart of Accounts */}
          {matchedAccounts.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-blue-600" /> Chart of Accounts ({matchedAccounts.length})
              </p>
              <div className="space-y-1">
                {matchedAccounts.map((acc) => (
                  <div
                    key={acc.id}
                    onClick={() => {
                      onNavigate('chart-of-accounts');
                      onClose();
                    }}
                    className="p-2.5 rounded-lg hover:bg-blue-50/60 border border-transparent hover:border-blue-200 transition-colors flex items-center justify-between cursor-pointer text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-blue-800 mr-2">{acc.code}</span>
                      <span className="font-semibold text-slate-900">{acc.name}</span>
                      <div className="text-slate-500 text-[11px] mt-0.5">{acc.type}</div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-800">{FinancialCalculator.formatRWF(acc.currentBalance)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Organizations */}
          {matchedOrgs.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-600" /> Organizations ({matchedOrgs.length})
              </p>
              <div className="space-y-1">
                {matchedOrgs.map((org) => (
                  <div
                    key={org.id}
                    onClick={() => {
                      onNavigate('organizations');
                      onClose();
                    }}
                    className="p-2.5 rounded-lg hover:bg-indigo-50/60 border border-transparent hover:border-indigo-200 transition-colors flex items-center justify-between cursor-pointer text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900">{org.name}</span>
                      <span className="ml-2 font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{org.code}</span>
                      <div className="text-slate-500 text-[11px] mt-0.5">{org.contactPerson} • {org.email}</div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Press ESC or click outside to close</span>
          <span>Tip: Use global search to jump directly to any transaction or account.</span>
        </div>
      </div>
    </div>
  );
};
