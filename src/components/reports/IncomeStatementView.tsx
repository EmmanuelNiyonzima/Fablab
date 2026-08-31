import React, { useState } from 'react';
import { 
  DollarSign, 
  FileSpreadsheet, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Building2,
  CheckCircle2
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { storageService } from '../../services/storageService';
import { AccountingService } from '../../services/accountingService';
import { FinancialCalculator } from '../../services/calculationService';
import { ExportService } from '../../services/exportService';

export const IncomeStatementView: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState('2026');
  const state = storageService.getState();
  const pnl = AccountingService.getStatementOfComprehensiveIncome(state, parseInt(selectedYear, 10));

  const handleExportExcel = () => {
    const revSection = pnl.sections[0] || { items: [] };
    const cosSection = pnl.sections[1] || { items: [] };
    const adminSection = pnl.sections[3] || { items: [] };

    const headers = ['Financial Line Item', 'Account Code', 'Notes', 'Amount (RWF)'];
    const rows = [
      ['REVENUE', '', '', ''],
      ...revSection.items.map((r) => [r.accountName, r.accountCode, 'Revenue', r.actualAmount]),
      ['Total Revenue', '', '', pnl.revenueTotal],
      ['COST OF SALES', '', '', ''],
      ...cosSection.items.map((c) => [c.accountName, c.accountCode, 'Cost of Sales', c.actualAmount]),
      ['Total Cost of Sales', '', '', pnl.costOfSalesTotal],
      ['GROSS PROFIT', '', 'Revenue minus Cost of Sales', pnl.grossProfit],
      ['OPERATING EXPENSES (ADMINISTRATIVE)', '', '', ''],
      ...adminSection.items.map((e) => [e.accountName, e.accountCode, 'Overhead', e.actualAmount]),
      ['Total Administrative Expenses', '', '', pnl.adminExpensesTotal],
      ['OPERATING PROFIT / (LOSS)', '', 'Operating Surplus', pnl.grossProfit - pnl.adminExpensesTotal],
      ['OTHER INCOME & EXPENSES', '', '', ''],
      ['Other Inflows', '', '', pnl.otherIncomeTotal],
      ['Other Charges & Taxes', '', '', pnl.otherExpensesTotal],
      ['NET PROFIT / (SURPLUS) BEFORE TAX', '', 'Comprehensive Net Surplus', pnl.netProfitBeforeTax],
    ];

    ExportService.exportToExcel(
      `Statement of Comprehensive Income ${selectedYear}`,
      `FabLab_IncomeStatement_${selectedYear}`,
      headers,
      rows,
      [
        { label: 'TOTAL TOPLINE REVENUE', value: `${FinancialCalculator.formatRWF(pnl.revenueTotal, false)} RWF` },
        { label: 'NET OPERATING SURPLUS', value: `${FinancialCalculator.formatRWF(pnl.netProfitBeforeTax, false)} RWF` },
      ],
      {
        sectionTitle: 'STATEMENT OF PROFIT & LOSS DETAIL',
        generatedBy: 'Emmanuel Niyonzima (niyonzimaemmanuel85@gmail.com)',
      }
    );
  };

  const revSection = pnl.sections[0] || { items: [] };
  const cosSection = pnl.sections[1] || { items: [] };
  const adminSection = pnl.sections[3] || { items: [] };
  const operatingProfit = pnl.grossProfit - pnl.adminExpensesTotal;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Statement of Comprehensive Income (P&L)
            </h2>
            <Badge variant="emerald">GAAP / IFRS Compliant</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            For the fiscal year ended 31 December {selectedYear}. Double-entry calculated from general ledger accounts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="p-2 text-xs font-bold text-slate-700 bg-slate-100 border border-slate-300 rounded-xl focus:bg-white"
          >
            <option value="2026">Fiscal Year 2026</option>
            <option value="2025">Fiscal Year 2025</option>
          </select>

          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-slate-600" />
            <span>Export Statement</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <p className="text-xs text-slate-500 font-semibold">Total Revenue</p>
          <p className="text-xl font-bold text-slate-900 font-mono mt-1">
            {FinancialCalculator.formatRWF(pnl.revenueTotal)}
          </p>
          <p className="text-[11px] text-emerald-600 mt-0.5 font-bold">100% Topline</p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <p className="text-xs text-slate-500 font-semibold">Gross Profit</p>
          <p className="text-xl font-bold text-slate-900 font-mono mt-1">
            {FinancialCalculator.formatRWF(pnl.grossProfit)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {((pnl.grossProfit / (pnl.revenueTotal || 1)) * 100).toFixed(1)}% Gross Margin
          </p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <p className="text-xs text-slate-500 font-semibold">Total Operating Expenses</p>
          <p className="text-xl font-bold text-rose-700 font-mono mt-1">
            {FinancialCalculator.formatRWF(pnl.adminExpensesTotal)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Facility & Admin Overheads</p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <p className="text-xs text-slate-500 font-semibold">Net Profit / (Surplus)</p>
          <p className="text-xl font-bold text-emerald-700 font-mono mt-1">
            {FinancialCalculator.formatRWF(pnl.netProfitBeforeTax)}
          </p>
          <p className="text-[11px] text-emerald-600 mt-0.5 font-bold">
            {((pnl.netProfitBeforeTax / (pnl.revenueTotal || 1)) * 100).toFixed(1)}% Net Margin
          </p>
        </div>
      </div>

      {/* Official Income Statement Document */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-6 max-w-4xl mx-auto space-y-6">
        {/* Document Header */}
        <div className="text-center pb-4 border-b border-slate-200 space-y-1">
          <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight">
            FabLab Rwanda Limited
          </h3>
          <p className="text-xs font-semibold text-slate-600">
            STATEMENT OF COMPREHENSIVE INCOME
          </p>
          <p className="text-xs text-slate-500">
            For the fiscal year ended 31 December {selectedYear} (Amounts in Rwandan Francs - RWF)
          </p>
        </div>

        {/* Statement Line Items */}
        <div className="space-y-4 text-xs font-medium">
          {/* Revenue Section */}
          <div className="space-y-1.5">
            <div className="flex justify-between font-bold text-slate-900 border-b border-slate-100 pb-1">
              <span>REVENUE FROM OPERATIONS</span>
              <span>2026 (RWF)</span>
            </div>
            {revSection.items.map((r) => (
              <div key={r.accountCode} className="flex justify-between text-slate-600 pl-4 py-0.5">
                <span>{r.accountName} <span className="font-mono text-[10px] text-slate-400">({r.accountCode})</span></span>
                <span className="font-mono">{FinancialCalculator.formatRWF(r.actualAmount)}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
              <span>Total Revenue</span>
              <span className="font-mono">{FinancialCalculator.formatRWF(pnl.revenueTotal)}</span>
            </div>
          </div>

          {/* Cost of Sales Section */}
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between font-bold text-slate-900 border-b border-slate-100 pb-1">
              <span>COST OF SALES (DIRECT MATERIALS & LAB)</span>
              <span></span>
            </div>
            {cosSection.items.map((c) => (
              <div key={c.accountCode} className="flex justify-between text-slate-600 pl-4 py-0.5">
                <span>{c.accountName} <span className="font-mono text-[10px] text-slate-400">({c.accountCode})</span></span>
                <span className="font-mono">({FinancialCalculator.formatRWF(c.actualAmount)})</span>
              </div>
            ))}
            <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
              <span>Total Cost of Sales</span>
              <span className="font-mono">({FinancialCalculator.formatRWF(pnl.costOfSalesTotal)})</span>
            </div>
          </div>

          {/* Gross Profit */}
          <div className="flex justify-between font-bold text-sm text-slate-900 py-2.5 px-3 bg-slate-50 rounded-xl border border-slate-200">
            <span>GROSS PROFIT</span>
            <span className="font-mono text-emerald-700">{FinancialCalculator.formatRWF(pnl.grossProfit)}</span>
          </div>

          {/* Administrative Expenses */}
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between font-bold text-slate-900 border-b border-slate-100 pb-1">
              <span>ADMINISTRATIVE & FACILITY OPERATING EXPENSES</span>
              <span></span>
            </div>
            {adminSection.items.map((e) => (
              <div key={e.accountCode} className="flex justify-between text-slate-600 pl-4 py-0.5">
                <span>{e.accountName} <span className="font-mono text-[10px] text-slate-400">({e.accountCode})</span></span>
                <span className="font-mono">({FinancialCalculator.formatRWF(e.actualAmount)})</span>
              </div>
            ))}
            <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
              <span>Total Administrative Expenses</span>
              <span className="font-mono">({FinancialCalculator.formatRWF(pnl.adminExpensesTotal)})</span>
            </div>
          </div>

          {/* Operating Profit */}
          <div className="flex justify-between font-bold text-sm text-slate-900 py-2.5 px-3 bg-slate-50 rounded-xl border border-slate-200">
            <span>OPERATING PROFIT / (LOSS)</span>
            <span className="font-mono text-slate-900">{FinancialCalculator.formatRWF(operatingProfit)}</span>
          </div>

          {/* Other Items */}
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between font-bold text-slate-900 border-b border-slate-100 pb-1">
              <span>OTHER INCOME & PROVISIONS</span>
              <span></span>
            </div>
            <div className="flex justify-between text-slate-600 pl-4 py-0.5">
              <span>Other Miscellaneous Income</span>
              <span className="font-mono">{FinancialCalculator.formatRWF(pnl.otherIncomeTotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600 pl-4 py-0.5">
              <span>Finance Charges & Provisions</span>
              <span className="font-mono">({FinancialCalculator.formatRWF(pnl.otherExpensesTotal)})</span>
            </div>
          </div>

          {/* Net Profit */}
          <div className="flex justify-between font-black text-base text-white py-3.5 px-4 bg-slate-900 rounded-xl border border-slate-800 shadow-md">
            <span>NET PROFIT / (SURPLUS) FOR THE PERIOD</span>
            <span className="font-mono text-emerald-400">{FinancialCalculator.formatRWF(pnl.netProfitBeforeTax)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
