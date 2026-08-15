import React from 'react';
import { 
  Scale, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  Download,
  Calendar,
  Building2
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { DiscrepancyBanner } from '../common/DiscrepancyBanner';
import { storageService } from '../../services/storageService';
import { AccountingService } from '../../services/accountingService';
import { FinancialCalculator } from '../../services/calculationService';
import { ExportService } from '../../services/exportService';

export const TrialBalanceView: React.FC = () => {
  const state = storageService.getState();
  const tb = AccountingService.getTrialBalance(state);

  const handleExportExcel = () => {
    const headers = [
      'Account Code',
      'Account Title',
      'Account Classification',
      'Debit (RWF)',
      'Credit (RWF)',
    ];

    const rows = tb.rows.map((l) => [
      l.accountCode,
      l.accountName,
      l.accountType,
      l.netDebit,
      l.netCredit,
    ]);

    ExportService.exportToExcel('Trial Balance Statement', 'FabLab_TrialBalance', headers, rows, [
      { label: 'Total General Ledger Debits', value: FinancialCalculator.formatRWF(tb.totalDebits) },
      { label: 'Total General Ledger Credits', value: FinancialCalculator.formatRWF(tb.totalCredits) },
      { label: 'Trial Balance Discrepancy', value: `${tb.difference} RWF (Balanced)` },
    ]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Trial Balance (Zero-Variance Statement)</h2>
            <Badge variant={tb.isBalanced ? 'success' : 'danger'}>
              {tb.isBalanced ? 'Mathematically Balanced' : 'Imbalance Detected'}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            As of Fiscal Period August 2026. Proves total debits strictly equal total credits across all ledger accounts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-slate-600" />
            <span>Export Trial Balance</span>
          </button>
        </div>
      </div>

      {/* Discrepancy Banner */}
      <DiscrepancyBanner
        isBalanced={tb.isBalanced}
        difference={tb.difference}
        moduleName="Trial Balance Equality"
        message={
          tb.isBalanced
            ? `Trial balance is in perfect equilibrium. Total Debits (${FinancialCalculator.formatRWF(tb.totalDebits)}) = Total Credits (${FinancialCalculator.formatRWF(tb.totalCredits)}). Zero variance.`
            : `Accounting Imbalance: Total Debits exceed Total Credits by ${FinancialCalculator.formatRWF(tb.difference)}.`
        }
      />

      {/* Trial Balance Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 w-28">Code</th>
                <th className="py-3.5 px-4">Account Title</th>
                <th className="py-3.5 px-4">Classification</th>
                <th className="py-3.5 px-4 text-right w-44">Debit Balance (RWF)</th>
                <th className="py-3.5 px-4 text-right w-44">Credit Balance (RWF)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {tb.rows.map((line) => (
                <tr key={line.accountId} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{line.accountCode}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{line.accountName}</td>
                  <td className="py-3 px-4">
                    <span className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                      {line.accountType}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                    {line.netDebit > 0 ? FinancialCalculator.formatRWF(line.netDebit) : '-'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                    {line.netCredit > 0 ? FinancialCalculator.formatRWF(line.netCredit) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-900 text-white font-mono font-bold">
              <tr>
                <td colSpan={3} className="py-4 px-4 font-sans text-xs uppercase tracking-wider">
                  Grand Total (Trial Balance Equilibrium)
                </td>
                <td className="py-4 px-4 text-right text-emerald-400 text-sm">
                  {FinancialCalculator.formatRWF(tb.totalDebits)}
                </td>
                <td className="py-4 px-4 text-right text-emerald-400 text-sm">
                  {FinancialCalculator.formatRWF(tb.totalCredits)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
