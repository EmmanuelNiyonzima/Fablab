import React, { useState } from 'react';
import { 
  PieChart, 
  Plus, 
  Search, 
  FileSpreadsheet, 
  DollarSign, 
  Layers, 
  Calendar,
  Building2,
  TrendingUp
} from 'lucide-react';
import { SearchFilterBar } from '../common/SearchFilterBar';
import { Badge } from '../common/Badge';
import { storageService } from '../../services/storageService';
import { FinancialCalculator } from '../../services/calculationService';
import { ExportService } from '../../services/exportService';
import { BudgetLine } from '../../types/financial';

export const AnnualBudgetView: React.FC = () => {
  const state = storageService.getState();
  const budgetLines = state.budgetLines;
  const [selectedYear, setSelectedYear] = useState('2026');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLines = budgetLines.filter((b) => {
    return (
      b.accountName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.accountCode.includes(searchQuery) ||
      b.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const totalAnnualBudget = filteredLines.reduce((sum, b) => sum + b.annualBudget, 0);
  const totalQ1 = filteredLines.reduce((sum, b) => sum + b.q1, 0);
  const totalQ2 = filteredLines.reduce((sum, b) => sum + b.q2, 0);
  const totalQ3 = filteredLines.reduce((sum, b) => sum + b.q3, 0);
  const totalQ4 = filteredLines.reduce((sum, b) => sum + b.q4, 0);
  const totalActual = filteredLines.reduce((sum, b) => sum + b.actualAmount, 0);

  const handleExportExcel = () => {
    const headers = [
      'Account Code',
      'Budget Line Item',
      'Category',
      'Annual Budget (RWF)',
      'Q1 (RWF)',
      'Q2 (RWF)',
      'Q3 (RWF)',
      'Q4 (RWF)',
      'Actual YTD (RWF)',
    ];

    const rows = filteredLines.map((b) => [
      b.accountCode,
      b.accountName,
      b.category,
      b.annualBudget,
      b.q1,
      b.q2,
      b.q3,
      b.q4,
      b.actualAmount,
    ]);

    ExportService.exportToExcel('Annual Operating Budget 2026', 'FabLab_AnnualBudget', headers, rows, [
      { label: 'Total Annual Approved Budget', value: FinancialCalculator.formatRWF(totalAnnualBudget) },
      { label: 'Actual YTD Utilized', value: FinancialCalculator.formatRWF(totalActual) },
    ]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Annual Operating Budget (2026 Fiscal)</h2>
            <Badge variant="purple">Approved by Board</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Official operational allocation across four quarters (Q1–Q4) with quarterly breakdown and department appropriations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-slate-600" />
            <span>Export Budget</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <p className="text-xs text-slate-500 font-semibold">Total Approved Budget</p>
          <p className="text-lg font-bold text-slate-900 font-mono mt-1">
            {FinancialCalculator.formatRWF(totalAnnualBudget)}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Full 2026 Fiscal Year</p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <p className="text-xs text-slate-500 font-semibold">Q1 Appropriation</p>
          <p className="text-lg font-bold text-slate-900 font-mono mt-1">
            {FinancialCalculator.formatRWF(totalQ1)}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Jan - Mar</p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <p className="text-xs text-slate-500 font-semibold">Q2 Appropriation</p>
          <p className="text-lg font-bold text-slate-900 font-mono mt-1">
            {FinancialCalculator.formatRWF(totalQ2)}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Apr - Jun</p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <p className="text-xs text-slate-500 font-semibold">Q3 Appropriation</p>
          <p className="text-lg font-bold text-slate-900 font-mono mt-1">
            {FinancialCalculator.formatRWF(totalQ3)}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Jul - Sep</p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <p className="text-xs text-slate-500 font-semibold">Q4 Appropriation</p>
          <p className="text-lg font-bold text-slate-900 font-mono mt-1">
            {FinancialCalculator.formatRWF(totalQ4)}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Oct - Dec</p>
        </div>
      </div>

      {/* Search Bar */}
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search budget item, account code, category..."
      />

      {/* Budget Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 w-24">Code</th>
                <th className="py-3.5 px-4">Line Item Description</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4 text-right">Annual (RWF)</th>
                <th className="py-3.5 px-4 text-right">Q1</th>
                <th className="py-3.5 px-4 text-right">Q2</th>
                <th className="py-3.5 px-4 text-right">Q3</th>
                <th className="py-3.5 px-4 text-right">Q4</th>
                <th className="py-3.5 px-4 text-right">Actual YTD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredLines.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{b.accountCode}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{b.accountName}</td>
                  <td className="py-3 px-4 text-slate-500">{b.category}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                    {FinancialCalculator.formatRWF(b.annualBudget)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-600">
                    {FinancialCalculator.formatRWF(b.q1)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-600">
                    {FinancialCalculator.formatRWF(b.q2)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-600">
                    {FinancialCalculator.formatRWF(b.q3)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-600">
                    {FinancialCalculator.formatRWF(b.q4)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                    {FinancialCalculator.formatRWF(b.actualAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-900 text-white font-mono font-bold">
              <tr>
                <td colSpan={3} className="py-3.5 px-4 font-sans text-xs uppercase">
                  Grand Total Budget:
                </td>
                <td className="py-3.5 px-4 text-right text-emerald-400">
                  {FinancialCalculator.formatRWF(totalAnnualBudget)}
                </td>
                <td className="py-3.5 px-4 text-right">{FinancialCalculator.formatRWF(totalQ1)}</td>
                <td className="py-3.5 px-4 text-right">{FinancialCalculator.formatRWF(totalQ2)}</td>
                <td className="py-3.5 px-4 text-right">{FinancialCalculator.formatRWF(totalQ3)}</td>
                <td className="py-3.5 px-4 text-right">{FinancialCalculator.formatRWF(totalQ4)}</td>
                <td className="py-3.5 px-4 text-right text-emerald-400">
                  {FinancialCalculator.formatRWF(totalActual)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
