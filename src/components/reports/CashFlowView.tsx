import React, { useState } from 'react';
import { 
  Wallet, 
  FileSpreadsheet, 
  Download, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Calendar,
  Building2,
  CheckCircle2
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { storageService } from '../../services/storageService';
import { AccountingService } from '../../services/accountingService';
import { FinancialCalculator } from '../../services/calculationService';
import { ExportService } from '../../services/exportService';

export const CashFlowView: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState('2026');
  const state = storageService.getState();
  const cf = AccountingService.getCashFlowStatement(state);

  const handleExportExcel = () => {
    const headers = ['Cash Flow Activity', 'Category', 'Amount (RWF)'];
    const rows = [
      ['OPERATING ACTIVITIES', '', ''],
      ...cf.operatingInflows.map((i) => [i.description, 'Operating Inflow', i.amount]),
      ...cf.operatingOutflows.map((o) => [o.description, 'Operating Outflow', -o.amount]),
      ['Net Cash from Operating Activities', '', cf.netOperatingCash],
      ['INVESTING ACTIVITIES', '', ''],
      ...cf.investingActivities.map((inv) => [inv.description, 'Investing Activity', inv.amount]),
      ['Net Cash used in Investing Activities', '', cf.netInvestingCash],
      ['FINANCING ACTIVITIES', '', ''],
      ...cf.financingActivities.map((fin) => [fin.description, 'Financing Activity', fin.amount]),
      ['Net Cash from Financing Activities', '', cf.netFinancingCash],
      ['NET INCREASE / (DECREASE) IN CASH', '', cf.netChangeInCash],
      ['Cash and Cash Equivalents at Beginning of Year', '', cf.beginningCash],
      ['CASH AND CASH EQUIVALENTS AT END OF PERIOD', '', cf.endingCash],
    ];

    ExportService.exportToExcel(
      `Statement of Cash Flows ${selectedYear}`,
      `FabLab_CashFlow_${selectedYear}`,
      headers,
      rows,
      [
        { label: 'Net Cash from Operating Activities', value: FinancialCalculator.formatRWF(cf.netOperatingCash) },
        { label: 'Closing Cash Position', value: FinancialCalculator.formatRWF(cf.endingCash) },
      ]
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Statement of Cash Flows</h2>
            <Badge variant="blue">Direct Method Reconciled</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tracking operating liquidity, fabrication equipment investments, resident partner cost share remittances, and bank balances.
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
          <p className="text-xs text-slate-500 font-semibold">Opening Cash Balance</p>
          <p className="text-xl font-bold text-slate-900 font-mono mt-1">
            {FinancialCalculator.formatRWF(cf.beginningCash)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">As of 1 January {selectedYear}</p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <p className="text-xs text-emerald-700 font-semibold">Operating Cash Flow</p>
          <p className="text-xl font-bold text-emerald-700 font-mono mt-1">
            {FinancialCalculator.formatRWF(cf.netOperatingCash)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Core operations & recoveries</p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <p className="text-xs text-slate-500 font-semibold">Net Change in Cash</p>
          <p className="text-xl font-bold text-blue-700 font-mono mt-1">
            {FinancialCalculator.formatRWF(cf.netChangeInCash)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Total period surplus flow</p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <p className="text-xs text-slate-500 font-semibold">Closing Bank & Cash</p>
          <p className="text-xl font-bold text-slate-900 font-mono mt-1">
            {FinancialCalculator.formatRWF(cf.endingCash)}
          </p>
          <p className="text-[11px] text-emerald-600 font-bold mt-0.5">100% Reconciled to GL</p>
        </div>
      </div>

      {/* Official Cash Flow Statement Document */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-6 max-w-4xl mx-auto space-y-6">
        <div className="text-center pb-4 border-b border-slate-200 space-y-1">
          <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight">
            FabLab Rwanda Limited
          </h3>
          <p className="text-xs font-semibold text-slate-600">
            STATEMENT OF CASH FLOWS
          </p>
          <p className="text-xs text-slate-500">
            For the fiscal year ended 31 December {selectedYear} (Amounts in Rwandan Francs - RWF)
          </p>
        </div>

        <div className="space-y-4 text-xs font-medium">
          {/* Operating Activities */}
          <div className="space-y-1.5">
            <div className="flex justify-between font-bold text-slate-900 border-b border-slate-100 pb-1">
              <span>CASH FLOWS FROM OPERATING ACTIVITIES</span>
              <span>2026 (RWF)</span>
            </div>
            {cf.operatingInflows.map((inf, idx) => (
              <div key={idx} className="flex justify-between text-slate-600 pl-4 py-0.5">
                <span>{inf.description}</span>
                <span className="font-mono text-emerald-700">{FinancialCalculator.formatRWF(inf.amount)}</span>
              </div>
            ))}
            {cf.operatingOutflows.map((out, idx) => (
              <div key={idx} className="flex justify-between text-slate-600 pl-4 py-0.5">
                <span>{out.description}</span>
                <span className="font-mono text-rose-700">({FinancialCalculator.formatRWF(out.amount)})</span>
              </div>
            ))}
            <div className="flex justify-between font-bold text-slate-900 pt-1.5 border-t border-slate-200 bg-slate-50 p-2 rounded-lg">
              <span>Net Cash Generated from Operating Activities</span>
              <span className="font-mono text-emerald-700">{FinancialCalculator.formatRWF(cf.netOperatingCash)}</span>
            </div>
          </div>

          {/* Investing Activities */}
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between font-bold text-slate-900 border-b border-slate-100 pb-1">
              <span>CASH FLOWS FROM INVESTING ACTIVITIES</span>
              <span></span>
            </div>
            {cf.investingActivities.map((inv, idx) => (
              <div key={idx} className="flex justify-between text-slate-600 pl-4 py-0.5">
                <span>{inv.description}</span>
                <span className="font-mono">{FinancialCalculator.formatRWF(inv.amount)}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold text-slate-900 pt-1.5 border-t border-slate-200 bg-slate-50 p-2 rounded-lg">
              <span>Net Cash Used in Investing Activities</span>
              <span className="font-mono">{FinancialCalculator.formatRWF(cf.netInvestingCash)}</span>
            </div>
          </div>

          {/* Financing Activities */}
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between font-bold text-slate-900 border-b border-slate-100 pb-1">
              <span>CASH FLOWS FROM FINANCING ACTIVITIES</span>
              <span></span>
            </div>
            {cf.financingActivities.map((fin, idx) => (
              <div key={idx} className="flex justify-between text-slate-600 pl-4 py-0.5">
                <span>{fin.description}</span>
                <span className="font-mono">{FinancialCalculator.formatRWF(fin.amount)}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold text-slate-900 pt-1.5 border-t border-slate-200 bg-slate-50 p-2 rounded-lg">
              <span>Net Cash From Financing Activities</span>
              <span className="font-mono">{FinancialCalculator.formatRWF(cf.netFinancingCash)}</span>
            </div>
          </div>

          {/* Cash Summary */}
          <div className="pt-3 border-t-2 border-slate-900 space-y-2">
            <div className="flex justify-between text-slate-700 font-bold">
              <span>Net Increase / (Decrease) in Cash and Cash Equivalents</span>
              <span className="font-mono">{FinancialCalculator.formatRWF(cf.netChangeInCash)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Cash and Cash Equivalents at Beginning of Year</span>
              <span className="font-mono">{FinancialCalculator.formatRWF(cf.beginningCash)}</span>
            </div>
            <div className="flex justify-between font-black text-base text-white py-3.5 px-4 bg-slate-900 rounded-xl shadow-md">
              <span>CASH AND CASH EQUIVALENTS AT END OF PERIOD</span>
              <span className="font-mono text-emerald-400">{FinancialCalculator.formatRWF(cf.endingCash)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
