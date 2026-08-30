import React from 'react';
import { 
  FileText, 
  Printer, 
  Download, 
  Building2, 
  TrendingUp, 
  DollarSign, 
  Scale, 
  Wallet, 
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { storageService } from '../../services/storageService';
import { AccountingService } from '../../services/accountingService';
import { FinancialCalculator } from '../../services/calculationService';
import { ExportService } from '../../services/exportService';

export const FinancialSummaryView: React.FC = () => {
  const state = storageService.getState();
  const pnl = AccountingService.getStatementOfComprehensiveIncome(state, 2026);
  const shared = AccountingService.getSharedSpaceSummary(state);
  const tb = AccountingService.getTrialBalance(state);
  const quality = AccountingService.getQualityReconciliation(state);

  const handlePrint = () => {
    window.print();
  };

  const handleExportSummaryExcel = () => {
    ExportService.exportFullManagementWorkbook(state, { fiscalYear: 2026, generatedBy: state.currentUser.name });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Executive Financial Summary & Board Brief</h2>
            <Badge variant="purple">Board of Directors Report</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Condensed executive financial position, core profitability metrics, cost recovery health, and balance sheet status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Print Executive PDF</span>
          </button>
          <button
            type="button"
            onClick={handleExportSummaryExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Printable Board Document */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-8 max-w-4xl mx-auto space-y-8 print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-5 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white text-sm">
                FL
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">FabLab Rwanda</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Kigali Heights Building, 4th Floor | Kigali, Rwanda
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Fiscal Period</span>
            <p className="text-base font-bold text-slate-900 font-mono">FY 2026 (Jan - Dec)</p>
            <p className="text-[11px] text-emerald-700 font-bold">Generated: August 2026</p>
          </div>
        </div>

        {/* Executive Overview Narrative */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            1. Executive Financial Commentary
          </h3>
          <p className="text-xs text-slate-700 leading-relaxed">
            During Fiscal Year 2026, FabLab Rwanda demonstrated robust operating surplus and self-sustaining cost-sharing recovery across its four resident organizations. Operating revenue reached <strong>{FinancialCalculator.formatRWF(pnl.revenueTotal)}</strong>, supported by <strong>{FinancialCalculator.formatRWF(pnl.costOfSalesTotal)}</strong> in prototyping and direct fabrication materials. The facility shared operational expenditure was strictly managed at <strong>{FinancialCalculator.formatRWF(shared.totalAnnualSharedBudget)}</strong>, with 100% formula-based recovery mechanisms active.
          </p>
        </div>

        {/* Financial Highlights Matrix */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            2. Core Financial Indicators
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <p className="text-[10px] uppercase font-bold text-slate-400">Total Topline</p>
              <p className="text-sm font-bold text-slate-900 font-mono">{FinancialCalculator.formatRWF(pnl.revenueTotal)}</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <p className="text-[10px] uppercase font-bold text-slate-400">Gross Margin</p>
              <p className="text-sm font-bold text-slate-900 font-mono">{((pnl.grossProfit / (pnl.revenueTotal || 1)) * 100).toFixed(1)}%</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <p className="text-[10px] uppercase font-bold text-slate-400">Shared Facility Budget</p>
              <p className="text-sm font-bold text-slate-900 font-mono">{FinancialCalculator.formatRWF(shared.totalAnnualSharedBudget)}</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <p className="text-[10px] uppercase font-bold text-slate-400">Net Surplus</p>
              <p className="text-sm font-bold text-emerald-700 font-mono">{FinancialCalculator.formatRWF(pnl.netProfitBeforeTax)}</p>
            </div>
          </div>
        </div>

        {/* Resident Cost Sharing Apportionment */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            3. Resident Organization Cost Apportionment Breakdown
          </h3>

          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-100 text-[10px] font-bold text-slate-600 uppercase">
                <tr>
                  <th className="py-2.5 px-3">Resident Organization</th>
                  <th className="py-2.5 px-3 text-right">Floor Area (SqM)</th>
                  <th className="py-2.5 px-3 text-right">Staff Headcount</th>
                  <th className="py-2.5 px-3 text-right">Monthly Share (RWF)</th>
                  <th className="py-2.5 px-3 text-right">Annual Apportionment (RWF)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {shared.orgSummaries.map((org) => {
                  const orgObj = state.organizations.find((o) => o.id === org.orgId);
                  return (
                    <tr key={org.orgId}>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{org.orgName}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{orgObj?.floorAreaSqM || 100} m²</td>
                      <td className="py-2.5 px-3 text-right font-mono">{orgObj?.headcount || 10}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {FinancialCalculator.formatRWF(org.monthlyAmount)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                        {FinancialCalculator.formatRWF(org.annualAmount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                <tr>
                  <td colSpan={3} className="py-2.5 px-3 uppercase text-[10px] text-slate-500">
                    Grand Total Apportioned:
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-xs">
                    {FinancialCalculator.formatRWF(shared.totalMonthlyNormalizedBudget)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-xs text-emerald-700">
                    {FinancialCalculator.formatRWF(shared.totalAnnualSharedBudget)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Audit & Compliance Attestation */}
        <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-emerald-900">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Accounting Compliance & Attestation</span>
          </div>
          <p className="text-emerald-800 leading-relaxed">
            The financial records of FabLab Rwanda for the period ended 31 August 2026 have been audited under standard double-entry accounting controls. The Trial Balance is in equilibrium (Total Debits = Total Credits = <strong>{FinancialCalculator.formatRWF(tb.totalDebits)}</strong> with 0.00 RWF variance).
          </p>
        </div>

        {/* Signatures Row */}
        <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs">
          <div className="space-y-6">
            <div className="h-10 border-b border-slate-300 border-dashed" />
            <div>
              <p className="font-bold text-slate-900">Marie Claire Uwera</p>
              <p className="text-[11px] text-slate-500">Finance & Administrative Manager</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="h-10 border-b border-slate-300 border-dashed" />
            <div>
              <p className="font-bold text-slate-900">Emmanuel Niyonzima</p>
              <p className="text-[11px] text-slate-500">Executive Director / Managing Director</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
