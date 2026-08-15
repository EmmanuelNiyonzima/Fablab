import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  FileSpreadsheet, 
  BookOpen, 
  ArrowRight,
  TrendingUp,
  Scale
} from 'lucide-react';
import { SearchFilterBar } from '../common/SearchFilterBar';
import { Badge } from '../common/Badge';
import { storageService } from '../../services/storageService';
import { FinancialCalculator } from '../../services/calculationService';
import { ExportService } from '../../services/exportService';
import { Account, JournalLine } from '../../types/financial';

export const GeneralLedgerView: React.FC = () => {
  const state = storageService.getState();
  const accounts = state.accounts;
  const journalEntries = state.journalEntries;

  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId) || accounts[0];

  // Compile transactions for the selected account
  interface LedgerRow {
    date: string;
    journalNumber: string;
    reference: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
  }

  let runningBalance = selectedAccount?.previousYearBalance || 0;
  const ledgerRows: LedgerRow[] = [];

  journalEntries.forEach((j) => {
    j.lines.forEach((l) => {
      if (l.accountId === selectedAccount.id || l.accountCode === selectedAccount.code) {
        if (selectedAccount.normalBalance === 'Debit') {
          runningBalance += (l.debit || 0) - (l.credit || 0);
        } else {
          runningBalance += (l.credit || 0) - (l.debit || 0);
        }

        ledgerRows.push({
          date: j.date,
          journalNumber: j.journalNumber,
          reference: j.reference,
          description: l.description || j.description,
          debit: l.debit,
          credit: l.credit,
          balance: runningBalance,
        });
      }
    });
  });

  const totalDebits = ledgerRows.reduce((sum, r) => sum + r.debit, 0);
  const totalCredits = ledgerRows.reduce((sum, r) => sum + r.credit, 0);

  const handleExportExcel = () => {
    const headers = [
      'Date',
      'Journal Voucher #',
      'Reference',
      'Transaction Narrative',
      'Debit (RWF)',
      'Credit (RWF)',
      'Running Balance (RWF)',
    ];

    const rows = ledgerRows.map((r) => [
      r.date,
      r.journalNumber,
      r.reference,
      r.description,
      r.debit,
      r.credit,
      r.balance,
    ]);

    ExportService.exportToExcel(
      `General Ledger - ${selectedAccount.code} ${selectedAccount.name}`,
      `GL_${selectedAccount.code}`,
      headers,
      rows,
      [
        { label: 'Opening Balance', value: FinancialCalculator.formatRWF(selectedAccount.previousYearBalance) },
        { label: 'Total Period Debits', value: FinancialCalculator.formatRWF(totalDebits) },
        { label: 'Total Period Credits', value: FinancialCalculator.formatRWF(totalCredits) },
        { label: 'Ending Balance', value: FinancialCalculator.formatRWF(runningBalance) },
      ]
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">General Ledger (T-Accounts)</h2>
            <Badge variant="purple">Running Balance Audited</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Detailed chronological transaction ledger and audit drill-down for individual chart of accounts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-slate-600" />
            <span>Export Account GL</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Account Selector */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Select General Ledger Account
          </p>
          <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-xs space-y-1 max-h-[600px] overflow-y-auto custom-scrollbar">
            {accounts.map((a) => {
              const isSelected = a.id === selectedAccountId;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setSelectedAccountId(a.id)}
                  className={`w-full text-left p-3 rounded-xl text-xs transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-300 ring-2 ring-emerald-500/20'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[11px] bg-slate-200 text-slate-800 px-1.5 py-0.2 rounded font-bold">
                        {a.code}
                      </span>
                      <span className="truncate">{a.name}</span>
                    </div>
                    <p className="text-[10px] text-slate-400">{a.type}</p>
                  </div>
                  <span className="font-mono text-xs font-bold">
                    {FinancialCalculator.formatRWF(a.currentBalance)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Ledger Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
            {/* Account Profile Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs bg-slate-900 text-white px-2 py-0.5 rounded-lg font-bold">
                    {selectedAccount.code}
                  </span>
                  <h3 className="text-base font-bold text-slate-900">{selectedAccount.name}</h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Type: <strong className="text-slate-700">{selectedAccount.type}</strong> | Normal Balance:{' '}
                  <strong className="text-slate-700">{selectedAccount.normalBalance}</strong>
                </p>
              </div>

              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-slate-400">Current Balance</p>
                <p className="text-lg font-mono font-bold text-emerald-700">
                  {FinancialCalculator.formatRWF(runningBalance)}
                </p>
              </div>
            </div>

            {/* Ledger Transactions Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Journal #</th>
                    <th className="py-2.5 px-3">Reference</th>
                    <th className="py-2.5 px-3">Narrative</th>
                    <th className="py-2.5 px-3 text-right">Debit (RWF)</th>
                    <th className="py-2.5 px-3 text-right">Credit (RWF)</th>
                    <th className="py-2.5 px-3 text-right">Running Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  <tr className="bg-slate-50/50 text-slate-500 italic">
                    <td className="py-2 px-3">2026-01-01</td>
                    <td className="py-2 px-3">-</td>
                    <td className="py-2 px-3">OPENING</td>
                    <td className="py-2 px-3">Fiscal Year 2026 Opening Balance</td>
                    <td className="py-2 px-3 text-right">-</td>
                    <td className="py-2 px-3 text-right">-</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                      {FinancialCalculator.formatRWF(selectedAccount.previousYearBalance)}
                    </td>
                  </tr>

                  {ledgerRows.map((r, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">{r.date}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{r.journalNumber}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">{r.reference}</td>
                      <td className="py-2.5 px-3 max-w-xs truncate">{r.description}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {r.debit > 0 ? FinancialCalculator.formatRWF(r.debit) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {r.credit > 0 ? FinancialCalculator.formatRWF(r.credit) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                        {FinancialCalculator.formatRWF(r.balance)}
                      </td>
                    </tr>
                  ))}

                  <tr className="bg-slate-50 font-bold border-t border-slate-200 text-slate-900">
                    <td colSpan={4} className="py-2.5 px-3 text-right uppercase text-[10px] text-slate-500">
                      Account Totals:
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-xs">
                      {FinancialCalculator.formatRWF(totalDebits)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-xs">
                      {FinancialCalculator.formatRWF(totalCredits)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-xs text-emerald-700">
                      {FinancialCalculator.formatRWF(runningBalance)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
