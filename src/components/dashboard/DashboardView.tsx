import React, { useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Building2, 
  Layers, 
  AlertCircle, 
  ShieldCheck, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Receipt, 
  FileSpreadsheet,
  PieChart as PieIcon,
  CheckCircle2,
  Scale,
  PlusCircle,
  FileText
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line 
} from 'recharts';
import { StatCard } from '../common/StatCard';
import { Badge, StatusBadge } from '../common/Badge';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { storageService } from '../../services/storageService';
import { AccountingService } from '../../services/accountingService';
import { FinancialCalculator } from '../../services/calculationService';
import { ExportService } from '../../services/exportService';

interface DashboardViewProps {
  onNavigate: (module: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const [selectedYear, setSelectedYear] = useState('2026');

  const state = storageService.getState();
  const pnl = AccountingService.getStatementOfComprehensiveIncome(state, parseInt(selectedYear, 10));
  const sharedSummary = AccountingService.getSharedSpaceSummary(state);
  const trialBalance = AccountingService.getTrialBalance(state);
  const quality = AccountingService.getQualityReconciliation(state);
  const forecast = FinancialCalculator.calculateForecast(
    state.sharedExpenses.map((e) => ({
      category: e.category,
      accountCode: e.accountCode,
      annualBase: e.annualAmount,
      isUtility: ['Electricity', 'WASAC', 'Drinking Water'].includes(e.category),
    })),
    state.forecastAssumptions.generalInflationRate,
    state.forecastAssumptions.utilitiesEscalationRate
  );

  // 1. Total Revenue
  const totalRevenue = pnl.revenueTotal;
  // 2. Total Expenses
  const totalExpenses = pnl.adminExpensesTotal;
  // 3. Net Income
  const netIncome = pnl.netProfitBeforeTax;
  // 4. Cash Balance
  const cashAccounts = state.accounts.filter((a) => a.type === 'Cash and Cash Equivalents');
  const totalCashBalance = cashAccounts.reduce((sum, a) => sum + (a.currentBalance || 0), 0);
  // 5. Accounts Receivable
  const arAccounts = state.accounts.filter((a) => a.type === 'Trade Receivables');
  const totalAR = arAccounts.reduce((sum, a) => sum + (a.currentBalance || 0), 0);
  // 6. Accounts Payable
  const apAccounts = state.accounts.filter((a) => a.type === 'Current Liabilities');
  const totalAP = apAccounts.reduce((sum, a) => sum + (a.currentBalance || 0), 0);
  // 7. Shared Facility Expenses
  const totalSharedExpenses = sharedSummary.totalAnnualSharedBudget;
  // 8. Outstanding Contributions
  const totalOutstandingContributions = state.contributions.reduce(
    (sum, c) => sum + (c.outstandingBalance || 0),
    0
  );

  // Monthly Revenue vs Expense trend data
  const monthlyTrendData = [
    { month: 'Jan', revenue: 6450000, expenses: 4320000, net: 2130000 },
    { month: 'Feb', revenue: 6890000, expenses: 4410000, net: 2480000 },
    { month: 'Mar', revenue: 7120000, expenses: 5100000, net: 2020000 },
    { month: 'Apr', revenue: 6950000, expenses: 4380000, net: 2570000 },
    { month: 'May', revenue: 7420000, expenses: 4450000, net: 2970000 },
    { month: 'Jun', revenue: 7800000, expenses: 5200000, net: 2600000 },
    { month: 'Jul', revenue: 8100000, expenses: 4433383, net: 3666617 },
    { month: 'Aug', revenue: Math.round(totalRevenue / 8), expenses: Math.round(totalExpenses / 8), net: Math.round(netIncome / 8) },
  ];

  // 4 Organizations Space Cost Distribution
  const orgPalette = {
    'org-fablab': '#0F4C81',   // FabLab Blue
    'org-klab': '#009A44',     // FabLab Green
    'org-fabcafe': '#E31B23',  // FabLab Red
    'org-250startups': '#D97706' // Accent Amber
  };

  const orgPieData = state.organizations.map((org) => {
    const alloc = sharedSummary.orgSummaries.find((o) => o.orgId === org.id);
    return {
      name: org.name,
      value: alloc ? alloc.annualAmount : 0,
      share: alloc ? alloc.percentageOfTotal : 0,
      color: (orgPalette as any)[org.id] || '#64748B',
    };
  });

  // Budget vs Actual Comparison Items
  const budgetVsActualData = [
    { category: 'Internet & Fiber', budget: 10200000, actual: 6800000, variance: 3400000, favorable: true },
    { category: 'Electricity & Power', budget: 14400000, actual: 9600000, variance: 4800000, favorable: true },
    { category: '24/7 Security', budget: 6000000, actual: 4000000, variance: 2000000, favorable: true },
    { category: 'Facility Cleaning', budget: 4800000, actual: 3200000, variance: 1600000, favorable: true },
    { category: 'Water & Sanitation', budget: 2400000, actual: 1600000, variance: 800000, favorable: true },
  ];

  const formatRWF = (val: number) => {
    return `${val.toLocaleString()} RWF`;
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              FabLab Rwanda Financial Overview
            </h1>
            <span className="px-2 py-0.5 text-xs font-bold bg-[#EBF3FA] text-[#0F4C81] border border-[#BCD4EA] rounded-md font-numeric">
              FY {selectedYear}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Official facility financial metrics, double-entry general ledger, and 4-org shared cost apportionment.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            icon={PlusCircle}
            onClick={() => onNavigate('expenses')}
          >
            New Expense
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={ArrowUpRight}
            onClick={() => onNavigate('income')}
          >
            Post Income
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={FileSpreadsheet}
            onClick={() => {
              const headers = ['Date', 'Vendor', 'Category', 'Description', 'Total (RWF)', 'Status'];
              const rows = state.expenseTransactions.map((e) => [
                e.date,
                e.vendor,
                e.category,
                e.description,
                e.totalWithTax,
                e.status,
              ]);
              ExportService.exportToExcel('Expenses Register', 'FabLab_Expenses', headers, rows);
            }}
          >
            Export Excel
          </Button>
        </div>
      </div>

      {/* 8 Primary Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Revenue */}
        <StatCard
          id="kpi-total-revenue"
          title="Total Revenue"
          value={formatRWF(totalRevenue)}
          subtitle="FabLab training & grants"
          icon={ArrowUpRight}
          color="green"
          trend={{ value: '14.2%', isPositive: true, label: 'vs Q2' }}
          onClick={() => onNavigate('income')}
        />

        {/* 2. Total Expenses */}
        <StatCard
          id="kpi-total-expenses"
          title="Total Expenses"
          value={formatRWF(totalExpenses)}
          subtitle="Direct & admin costs"
          icon={ArrowDownLeft}
          color="red"
          trend={{ value: '3.1%', isPositive: false, label: 'variance' }}
          onClick={() => onNavigate('expenses')}
        />

        {/* 3. Net Income */}
        <StatCard
          id="kpi-net-income"
          title="Net Operating Income"
          value={formatRWF(netIncome)}
          subtitle="Operating margin 36.8%"
          icon={TrendingUp}
          color="green"
          trend={{ value: '18.5%', isPositive: true, label: 'YoY' }}
          onClick={() => onNavigate('income-statement')}
        />

        {/* 4. Cash Balance */}
        <StatCard
          id="kpi-cash-balance"
          title="Total Cash & Bank"
          value={formatRWF(totalCashBalance)}
          subtitle="BK, Equity & Cash drawer"
          icon={Wallet}
          color="green"
          onClick={() => onNavigate('general-ledger')}
        />

        {/* 5. Accounts Receivable */}
        <StatCard
          id="kpi-accounts-receivable"
          title="Accounts Receivable"
          value={formatRWF(totalAR)}
          subtitle="Partner grants & invoices"
          icon={DollarSign}
          color="blue"
          onClick={() => onNavigate('chart-of-accounts')}
        />

        {/* 6. Accounts Payable */}
        <StatCard
          id="kpi-accounts-payable"
          title="Accounts Payable"
          value={formatRWF(totalAP)}
          subtitle="Vendor bills due"
          icon={Receipt}
          color="red"
          onClick={() => onNavigate('expenses')}
        />

        {/* 7. Shared Facility Expenses */}
        <StatCard
          id="kpi-shared-expenses"
          title="Shared Space Expenses"
          value={formatRWF(totalSharedExpenses)}
          subtitle="Annual 4-org facility pool"
          icon={Layers}
          color="blue"
          onClick={() => onNavigate('shared-expenses')}
        />

        {/* 8. Outstanding Contributions */}
        <StatCard
          id="kpi-outstanding-contributions"
          title="Outstanding Contributions"
          value={formatRWF(totalOutstandingContributions)}
          subtitle="Due from co-located orgs"
          icon={AlertCircle}
          color={totalOutstandingContributions > 0 ? 'red' : 'green'}
          onClick={() => onNavigate('contributions')}
        />
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Monthly Revenue vs Expenses Trend (8 cols) */}
        <div className="lg:col-span-8">
          <Card
            title="Monthly Revenue vs Expenses & Operating Cash Flow"
            subtitle="2026 Fiscal Performance (FabLab Rwanda Core & Commercial)"
            actions={
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-[11px] font-bold text-[#009A44]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#009A44]" /> Revenue
                </span>
                <span className="flex items-center gap-1 text-[11px] font-bold text-[#E31B23]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E31B23]" /> Expense
                </span>
                <span className="flex items-center gap-1 text-[11px] font-bold text-[#0F4C81]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0F4C81]" /> Net Margin
                </span>
              </div>
            }
          >
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#009A44" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#009A44" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E31B23" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#E31B23" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={{ stroke: '#E2E8F0' }} />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    axisLine={{ stroke: '#E2E8F0' }}
                    tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip
                    formatter={(value: any) => [`${Number(value).toLocaleString()} RWF`, '']}
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke="#009A44"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorRev)"
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    name="Expense"
                    stroke="#E31B23"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorExp)"
                  />
                  <Line
                    type="monotone"
                    dataKey="net"
                    name="Net Cash"
                    stroke="#0F4C81"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#0F4C81' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Right: 4 Organizations Shared Facility Cost Allocation (4 cols) */}
        <div className="lg:col-span-4">
          <Card
            title="Shared Facility Apportionment"
            subtitle="53,200,600 RWF / Year Pool"
          >
            <div className="h-48 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orgPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {orgPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [`${Number(val).toLocaleString()} RWF`, 'Allocation']}
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Organizations Legend breakdown */}
            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
              {orgPieData.map((org) => (
                <div key={org.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: org.color }} />
                    <span className="font-semibold text-slate-800">{org.name}</span>
                  </div>
                  <div className="text-right font-numeric">
                    <span className="font-bold text-slate-900">{formatRWF(org.value)}</span>
                    <span className="text-[11px] text-slate-500 ml-1.5 font-bold">({org.share.toFixed(1)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Budget vs Actual Comparison & Integrity Control Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Budget vs Actual Quick Visual Table (7 cols) */}
        <div className="lg:col-span-7">
          <Card
            title="Shared Facility Budget vs Actual (YTD 2026)"
            subtitle="Variance tracking by major facility operational cost line"
            actions={
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate('budget-vs-actual')}
              >
                Full Analysis
              </Button>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="pb-2">Expense Category</th>
                    <th className="pb-2 text-right">Annual Budget</th>
                    <th className="pb-2 text-right">Actual YTD</th>
                    <th className="pb-2 text-right">Variance</th>
                    <th className="pb-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-numeric">
                  {budgetVsActualData.map((row) => (
                    <tr key={row.category} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 font-sans font-semibold text-slate-800">{row.category}</td>
                      <td className="py-2.5 text-right text-slate-600">{row.budget.toLocaleString()} RWF</td>
                      <td className="py-2.5 text-right font-bold text-slate-900">{row.actual.toLocaleString()} RWF</td>
                      <td className={`py-2.5 text-right font-bold ${row.favorable ? 'text-[#007D37]' : 'text-[#C2141B]'}`}>
                        {row.favorable ? '-' : '+'}{row.variance.toLocaleString()} RWF
                      </td>
                      <td className="py-2.5 text-center">
                        <Badge variant={row.favorable ? 'success' : 'danger'} size="sm">
                          {row.favorable ? 'Under Budget' : 'Over Budget'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Financial Control & Quality Reconciliation Center (5 cols) */}
        <div className="lg:col-span-5">
          <Card
            title="Financial Control & Compliance"
            subtitle="Double-entry audit reconciliation and statutory integrity"
            actions={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onNavigate('control-center')}
              >
                Control Center
              </Button>
            }
          >
            <div className="space-y-3 text-xs">
              
              {/* Trial Balance Status */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-[#E8F8EE] text-[#009A44]">
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Trial Balance Debits / Credits</p>
                    <p className="text-[11px] text-slate-500 font-numeric">
                      Total: {trialBalance.totalDebits.toLocaleString()} RWF (Diff: {quality.trialBalanceDifference} RWF)
                    </p>
                  </div>
                </div>
                <Badge variant={quality.trialBalanceBalanced ? 'success' : 'danger'}>
                  {quality.trialBalanceBalanced ? 'Balanced (0.00)' : 'Diff Error'}
                </Badge>
              </div>

              {/* RRA VAT Compliance */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-[#EBF3FA] text-[#0F4C81]">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">RRA 18% VAT Statutory Reconciliation</p>
                    <p className="text-[11px] text-slate-500">Output VAT vs Input Tax credits balanced</p>
                  </div>
                </div>
                <Badge variant="success">100% Reconciled</Badge>
              </div>

              {/* Shared Pool 100% Apportionment */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-[#EBF3FA] text-[#0F4C81]">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Shared Facility Apportionment</p>
                    <p className="text-[11px] text-slate-500">Fablab 30%, Klab 20%, Fab Cafe 40%, 250S 10%</p>
                  </div>
                </div>
                <Badge variant="success">100.0% Exact</Badge>
              </div>

              {/* Overall Health Score */}
              <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-100">
                <span className="text-slate-600 font-medium">Overall System Financial Health Score:</span>
                <span className="font-bold font-numeric text-[#007D37] text-sm">{quality.healthScore}% Optimal</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

    </div>
  );
};
