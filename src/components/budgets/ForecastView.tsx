import React, { useState } from 'react';
import { 
  TrendingUp, 
  Sliders, 
  FileSpreadsheet, 
  Building2, 
  Zap, 
  HelpCircle,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { Badge } from '../common/Badge';
import { storageService } from '../../services/storageService';
import { FinancialCalculator } from '../../services/calculationService';
import { ExportService } from '../../services/exportService';

export const ForecastView: React.FC = () => {
  const state = storageService.getState();
  const assumptions = state.forecastAssumptions;

  const [generalInflation, setGeneralInflation] = useState<number>(assumptions.generalInflationRate);
  const [utilitiesEscalation, setUtilitiesEscalation] = useState<number>(assumptions.utilitiesEscalationRate);

  // Generate 3-year multi-category forecast
  const sharedItems = state.sharedExpenses.map((e) => ({
    category: e.category,
    accountCode: e.accountCode,
    annualBase: e.annualAmount,
    isUtility: ['Electricity', 'WASAC', 'Drinking Water'].includes(e.category),
  }));

  const forecastResult = FinancialCalculator.calculateForecast(
    sharedItems,
    generalInflation,
    utilitiesEscalation
  );
  const forecastRows = forecastResult.rows;

  const total2026 = forecastResult.totals.base2026;
  const total2027 = forecastResult.totals.forecast2027;
  const total2028 = forecastResult.totals.forecast2028;
  const total2029 = forecastResult.totals.forecast2029;

  const chartData = [
    { year: '2026 (Base)', Utilities: 0, Overheads: 0, Total: total2026 },
    { year: '2027 (+1Yr)', Utilities: 0, Overheads: 0, Total: total2027 },
    { year: '2028 (+2Yr)', Utilities: 0, Overheads: 0, Total: total2028 },
    { year: '2029 (+3Yr)', Utilities: 0, Overheads: 0, Total: total2029 },
  ];

  // Calculate stack breakdown
  const util2026 = forecastRows.filter((r) => r.isUtility).reduce((s, r) => s + r.base2026, 0);
  const gen2026 = total2026 - util2026;
  const util2027 = forecastRows.filter((r) => r.isUtility).reduce((s, r) => s + r.forecast2027, 0);
  const gen2027 = total2027 - util2027;
  const util2028 = forecastRows.filter((r) => r.isUtility).reduce((s, r) => s + r.forecast2028, 0);
  const gen2028 = total2028 - util2028;
  const util2029 = forecastRows.filter((r) => r.isUtility).reduce((s, r) => s + r.forecast2029, 0);
  const gen2029 = total2029 - util2029;

  chartData[0].Utilities = Math.round(util2026 / 1000000);
  chartData[0].Overheads = Math.round(gen2026 / 1000000);
  chartData[1].Utilities = Math.round(util2027 / 1000000);
  chartData[1].Overheads = Math.round(gen2027 / 1000000);
  chartData[2].Utilities = Math.round(util2028 / 1000000);
  chartData[2].Overheads = Math.round(gen2028 / 1000000);
  chartData[3].Utilities = Math.round(util2029 / 1000000);
  chartData[3].Overheads = Math.round(gen2029 / 1000000);

  const handleUpdateAssumptions = () => {
    storageService.updateForecastAssumptions({
      generalInflationRate: generalInflation,
      utilitiesEscalationRate: utilitiesEscalation,
    });
    alert('Forecast escalation assumptions saved and updated.');
  };

  const handleExportExcel = () => {
    const headers = [
      'Account Code',
      'Expense Category',
      'Escalation Type',
      'Growth Rate',
      '2026 Base (RWF)',
      '2027 Forecast (RWF)',
      '2028 Forecast (RWF)',
      '2029 Forecast (RWF)',
    ];

    const rows = forecastRows.map((r) => [
      r.accountCode,
      r.category,
      r.isUtility ? 'Utilities Escalation' : 'General Inflation',
      `${r.growthRate}%`,
      r.base2026,
      r.forecast2027,
      r.forecast2028,
      r.forecast2029,
    ]);

    ExportService.exportToExcel('3-Year Financial Forecast (2026-2029)', 'FabLab_3YearForecast', headers, rows, [
      { label: 'General Inflation Assumption', value: `${generalInflation}%` },
      { label: 'Utilities Escalation Assumption', value: `${utilitiesEscalation}%` },
      { label: '2026 Base Shared Total', value: FinancialCalculator.formatRWF(total2026) },
      { label: '2029 Projected Shared Total', value: FinancialCalculator.formatRWF(total2029) },
    ]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">3-Year Long-Term Financial Forecast (2026–2029)</h2>
            <Badge variant="purple">CAGR Modeling</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Macroeconomic escalation projection applying differential inflation: 13.6% for general operating overheads and 20.5% for utilities (power & water).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-slate-600" />
            <span>Export Forecast</span>
          </button>
        </div>
      </div>

      {/* Assumptions Control Panel */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Macroeconomic Escalation Model Parameters
            </h3>
          </div>
          <button
            type="button"
            onClick={handleUpdateAssumptions}
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
          >
            Save Assumptions
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-900">General Overheads Escalation Rate</span>
              <span className="font-mono font-bold text-emerald-700 text-sm">{generalInflation}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              step="0.1"
              value={generalInflation}
              onChange={(e) => setGeneralInflation(parseFloat(e.target.value) || 0)}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <p className="text-[11px] text-slate-400">
              Applies to cleaning, security, broadband, maintenance, and supplies.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-900">Utilities Escalation Rate (Power & Water)</span>
              <span className="font-mono font-bold text-amber-700 text-sm">{utilitiesEscalation}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="35"
              step="0.1"
              value={utilitiesEscalation}
              onChange={(e) => setUtilitiesEscalation(parseFloat(e.target.value) || 0)}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
            />
            <p className="text-[11px] text-slate-400">
              Accounts for energy tariff indexation and WASAC infrastructure fee adjustments.
            </p>
          </div>
        </div>
      </div>

      {/* Year by Year Growth Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <p className="text-xs text-slate-500 font-semibold">2026 Fiscal (Base)</p>
          <p className="text-xl font-bold text-slate-900 font-mono mt-1">
            {FinancialCalculator.formatRWF(total2026)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Current approved run-rate</p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <p className="text-xs text-slate-500 font-semibold">2027 Forecast (+1 Yr)</p>
          <p className="text-xl font-bold text-emerald-700 font-mono mt-1">
            {FinancialCalculator.formatRWF(total2027)}
          </p>
          <p className="text-[11px] text-emerald-600 mt-0.5 font-bold">
            +{Math.round(((total2027 - total2026) / total2026) * 100)}% vs 2026
          </p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <p className="text-xs text-slate-500 font-semibold">2028 Forecast (+2 Yr)</p>
          <p className="text-xl font-bold text-blue-700 font-mono mt-1">
            {FinancialCalculator.formatRWF(total2028)}
          </p>
          <p className="text-[11px] text-blue-600 mt-0.5 font-bold">
            +{Math.round(((total2028 - total2026) / total2026) * 100)}% vs 2026
          </p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <p className="text-xs text-slate-500 font-semibold">2029 Forecast (+3 Yr)</p>
          <p className="text-xl font-bold text-purple-700 font-mono mt-1">
            {FinancialCalculator.formatRWF(total2029)}
          </p>
          <p className="text-[11px] text-purple-600 mt-0.5 font-bold">
            +{Math.round(((total2029 - total2026) / total2026) * 100)}% vs 2026
          </p>
        </div>
      </div>

      {/* Forecast Area Chart */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Multi-Year Trajectory: Utilities vs General Facility Overheads (Millions RWF)
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value: number) => [`${value}M RWF`, '']} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Area type="monotone" dataKey="Utilities" stackId="1" stroke="#d97706" fill="#fef3c7" />
              <Area type="monotone" dataKey="Overheads" stackId="1" stroke="#059669" fill="#d1fae5" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Forecast Line Items Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 w-24">Code</th>
                <th className="py-3.5 px-4">Expense Category</th>
                <th className="py-3.5 px-4 text-center">Escalation Model</th>
                <th className="py-3.5 px-4 text-center">Rate</th>
                <th className="py-3.5 px-4 text-right">2026 Base (RWF)</th>
                <th className="py-3.5 px-4 text-right">2027 (+1 Yr)</th>
                <th className="py-3.5 px-4 text-right">2028 (+2 Yr)</th>
                <th className="py-3.5 px-4 text-right">2029 (+3 Yr)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {forecastRows.map((r, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{r.accountCode}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{r.category}</td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        r.isUtility
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {r.isUtility ? 'Utilities Model' : 'General CPI'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-700">{r.growthRate}%</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                    {FinancialCalculator.formatRWF(r.base2026)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-700">
                    {FinancialCalculator.formatRWF(r.forecast2027)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-700">
                    {FinancialCalculator.formatRWF(r.forecast2028)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-purple-700">
                    {FinancialCalculator.formatRWF(r.forecast2029)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-900 text-white font-mono font-bold">
              <tr>
                <td colSpan={4} className="py-3.5 px-4 font-sans text-xs uppercase">
                  Total Forecasted Expenditure:
                </td>
                <td className="py-3.5 px-4 text-right">{FinancialCalculator.formatRWF(total2026)}</td>
                <td className="py-3.5 px-4 text-right text-emerald-400">
                  {FinancialCalculator.formatRWF(total2027)}
                </td>
                <td className="py-3.5 px-4 text-right text-blue-400">
                  {FinancialCalculator.formatRWF(total2028)}
                </td>
                <td className="py-3.5 px-4 text-right text-purple-400">
                  {FinancialCalculator.formatRWF(total2029)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
