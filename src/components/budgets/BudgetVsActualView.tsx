import React, { useState } from 'react';
import { 
  BarChart3, 
  Search, 
  FileSpreadsheet, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown,
  ArrowUpRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { SearchFilterBar } from '../common/SearchFilterBar';
import { Badge } from '../common/Badge';
import { storageService } from '../../services/storageService';
import { FinancialCalculator } from '../../services/calculationService';
import { ExportService } from '../../services/exportService';

export const BudgetVsActualView: React.FC = () => {
  const state = storageService.getState();
  const budgetLines = state.budgetLines;
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLines = budgetLines.filter((b) => {
    return (
      b.accountName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.accountCode.includes(searchQuery) ||
      b.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const totalBudget = filteredLines.reduce((sum, b) => sum + b.annualBudget, 0);
  const totalActual = filteredLines.reduce((sum, b) => sum + b.actualAmount, 0);
  const totalVariance = totalBudget - totalActual;
  const overallUtilizedPct = totalBudget > 0 ? Math.round((totalActual / totalBudget) * 1000) / 10 : 0;

  const chartData = filteredLines.slice(0, 8).map((b) => ({
    name: b.accountName.length > 18 ? b.accountName.substring(0, 18) + '...' : b.accountName,
    Budget: Math.round(b.annualBudget / 1000), // in thousands
    Actual: Math.round(b.actualAmount / 1000),
  }));

  const handleExportExcel = () => {
    const headers = [
      'Account Code',
      'Expense Line Item',
      'Category',
      'Annual Budget (RWF)',
      'Actual YTD (RWF)',
      'Variance (RWF)',
      '% Utilized',
      'Status',
    ];

    const rows = filteredLines.map((b) => {
      const variance = b.annualBudget - b.actualAmount;
      const pct = b.annualBudget > 0 ? ((b.actualAmount / b.annualBudget) * 100).toFixed(1) + '%' : '0%';
      const status = b.actualAmount > b.annualBudget ? 'Over Budget' : 'On Track';

      return [
        b.accountCode,
        b.accountName,
        b.category,
        b.annualBudget,
        b.actualAmount,
        variance,
        pct,
        status,
      ];
    });

    ExportService.exportToExcel('Budget vs Actuals Analysis', 'FabLab_BudgetVsActual', headers, rows, [
      { label: 'Total Annual Budget', value: FinancialCalculator.formatRWF(totalBudget) },
      { label: 'Total Actual YTD', value: FinancialCalculator.formatRWF(totalActual) },
      { label: 'Net Remaining Budget', value: FinancialCalculator.formatRWF(totalVariance) },
      { label: 'Average Execution Rate', value: `${overallUtilizedPct}%` },
    ]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Budget vs Actuals Performance</h2>
            <Badge variant="blue">YTD Execution: {overallUtilizedPct}%</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time variance tracking, burn rates, over-budget threshold alerts, and department utilization analysis.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-slate-600" />
            <span>Export Comparison</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <p className="text-xs text-slate-500 font-semibold">Total Approved Budget</p>
          <p className="text-xl font-bold text-slate-900 font-mono mt-1">
            {FinancialCalculator.formatRWF(totalBudget)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">2026 Fiscal allocation</p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <p className="text-xs text-slate-500 font-semibold">Actual YTD Disbursements</p>
          <p className="text-xl font-bold text-emerald-700 font-mono mt-1">
            {FinancialCalculator.formatRWF(totalActual)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Jan - Aug 2026</p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <p className="text-xs text-slate-500 font-semibold">Remaining Balance</p>
          <p className="text-xl font-bold text-blue-700 font-mono mt-1">
            {FinancialCalculator.formatRWF(totalVariance)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Available headroom</p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <p className="text-xs text-slate-500 font-semibold">Budget Utilization Rate</p>
          <p className="text-xl font-bold text-purple-700 font-mono mt-1">{overallUtilizedPct}%</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Target: 66.7% for Month 8</p>
        </div>
      </div>

      {/* Visual Chart */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Top Operational Cost Centers: Budget vs Actual (Thousands RWF)
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(value: number) => [`${value.toLocaleString()}k RWF`, '']} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="Budget" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Actual" fill="#059669" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Search */}
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search line item, category, code..."
      />

      {/* Detailed Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 w-24">Code</th>
                <th className="py-3.5 px-4">Line Item Description</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4 text-right">Annual Budget</th>
                <th className="py-3.5 px-4 text-right">Actual YTD</th>
                <th className="py-3.5 px-4 text-right">Remaining Variance</th>
                <th className="py-3.5 px-4 text-center">% Burn</th>
                <th className="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredLines.map((b) => {
                const variance = b.annualBudget - b.actualAmount;
                const pct = b.annualBudget > 0 ? Math.round((b.actualAmount / b.annualBudget) * 100) : 0;
                const isOver = b.actualAmount > b.annualBudget;

                return (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{b.accountCode}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{b.accountName}</td>
                    <td className="py-3 px-4 text-slate-500">{b.category}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {FinancialCalculator.formatRWF(b.annualBudget)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                      {FinancialCalculator.formatRWF(b.actualAmount)}
                    </td>
                    <td className={`py-3 px-4 text-right font-mono font-bold ${isOver ? 'text-rose-700' : 'text-slate-700'}`}>
                      {FinancialCalculator.formatRWF(variance)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              pct > 100 ? 'bg-rose-500' : pct > 75 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] font-bold">{pct}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {isOver ? (
                        <Badge variant="danger" size="sm">Over Budget</Badge>
                      ) : (
                        <Badge variant="success" size="sm">On Track</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
