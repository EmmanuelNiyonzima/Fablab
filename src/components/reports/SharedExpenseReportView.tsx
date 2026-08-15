import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Layers, 
  Building2, 
  Download, 
  PieChart, 
  Calendar,
  CheckCircle2
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
import { Badge } from '../common/Badge';
import { storageService } from '../../services/storageService';
import { AccountingService } from '../../services/accountingService';
import { FinancialCalculator } from '../../services/calculationService';
import { ExportService } from '../../services/exportService';

export const SharedExpenseReportView: React.FC = () => {
  const state = storageService.getState();
  const sharedSummary = AccountingService.getSharedSpaceSummary(state);
  const organizations = state.organizations;
  const sharedExpenses = state.sharedExpenses;

  const [selectedPeriod, setSelectedPeriod] = useState('annual');

  const chartData = organizations.map((org) => {
    const orgData = sharedSummary.orgSummaries.find((o) => o.orgId === org.id);
    return {
      name: org.name,
      Monthly: Math.round((orgData?.monthlyAmount || 0) / 1000), // in thousands
      Annual: Math.round((orgData?.annualAmount || 0) / 1000000), // in millions
    };
  });

  const handleExportExcel = () => {
    const headers = [
      'Expense Category',
      'Account Code',
      'Billing Frequency',
      'Monthly (RWF)',
      'Quarterly (RWF)',
      'Annual Total (RWF)',
      ...organizations.map((o) => `${o.name} (Annual RWF)`),
    ];

    const rows = sharedExpenses.map((e) => {
      const orgCols = organizations.map((o) => {
        const alloc = e.allocations.find((a) => a.orgId === o.id);
        return alloc ? alloc.amount : 0;
      });

      return [
        e.category,
        e.accountCode,
        e.billingFrequency,
        e.monthlyNormalizedAmount,
        e.quarterlyAmount,
        e.annualAmount,
        ...orgCols,
      ];
    });

    ExportService.exportToExcel(
      'Shared Facility Expense Allocation Schedule',
      'FabLab_SharedSpaceAllocation',
      headers,
      rows,
      [
        { label: 'Total Annual Shared Facility Budget', value: FinancialCalculator.formatRWF(sharedSummary.totalAnnualSharedBudget) },
        { label: 'Monthly Normalized Cost Recovery', value: FinancialCalculator.formatRWF(sharedSummary.totalMonthlyNormalizedBudget) },
      ]
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Shared Facility Expense Cost-Recovery Schedule</h2>
            <Badge variant="purple">4 Resident Orgs Apportioned</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete multi-organization apportionment schedule across 10 operational cost categories totaling 53,200,600 RWF annually.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-slate-600" />
            <span>Export Schedule</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {sharedSummary.orgSummaries.map((org) => (
          <div key={org.orgId} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-slate-900">{org.orgName}</span>
              <Badge variant="neutral" size="sm">{org.percentageOfTotal}% Share</Badge>
            </div>
            <div>
              <p className="text-lg font-bold font-mono text-emerald-700">
                {FinancialCalculator.formatRWF(org.annualAmount)}
              </p>
              <p className="text-[11px] text-slate-400 font-mono">
                Monthly: {FinancialCalculator.formatRWF(org.monthlyAmount)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Apportionment Schedule Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Detailed Line-By-Line Organization Apportionment Matrix
          </h3>
          <span className="text-xs text-slate-500 font-mono">10 Shared Cost Centers</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Cost Center / Service</th>
                <th className="py-3.5 px-4">Billing</th>
                <th className="py-3.5 px-4 text-right">Annual Total</th>
                <th className="py-3.5 px-4 text-right">Monthly Normalized</th>
                {organizations.map((o) => (
                  <th key={o.id} className="py-3.5 px-4 text-right">{o.name}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {sharedExpenses.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-bold text-slate-900">{e.category}</p>
                      <p className="text-[10px] text-slate-400 font-mono">GL: {e.accountCode}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] font-mono uppercase bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                      {e.billingFrequency}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                    {FinancialCalculator.formatRWF(e.annualAmount)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-600">
                    {FinancialCalculator.formatRWF(e.monthlyNormalizedAmount)}
                  </td>
                  {organizations.map((o) => {
                    const alloc = e.allocations.find((a) => a.orgId === o.id);
                    return (
                      <td key={o.id} className="py-3 px-4 text-right font-mono font-semibold text-emerald-800">
                        {FinancialCalculator.formatRWF(alloc?.amount || 0)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-900 text-white font-mono font-bold">
              <tr>
                <td colSpan={2} className="py-3.5 px-4 font-sans text-xs uppercase">
                  Grand Total Apportioned:
                </td>
                <td className="py-3.5 px-4 text-right text-emerald-400">
                  {FinancialCalculator.formatRWF(sharedSummary.totalAnnualSharedBudget)}
                </td>
                <td className="py-3.5 px-4 text-right text-emerald-400">
                  {FinancialCalculator.formatRWF(sharedSummary.totalMonthlyNormalizedBudget)}
                </td>
                {organizations.map((o) => {
                  const orgData = sharedSummary.orgSummaries.find((x) => x.orgId === o.id);
                  return (
                    <td key={o.id} className="py-3.5 px-4 text-right text-emerald-300">
                      {FinancialCalculator.formatRWF(orgData?.annualAmount || 0)}
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
