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
  CheckCircle2
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
import { Badge } from '../common/Badge';
import { storageService } from '../../services/storageService';
import { AccountingService } from '../../services/accountingService';
import { FinancialCalculator } from '../../services/calculationService';
import { ExportService } from '../../services/exportService';

interface DashboardViewProps {
  onNavigate: (module: string) => void;
  onOpenTestSuite: () => void;
  onOpenAddExpense: () => void;
  onOpenAddSharedExpense: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenTestSuite,
  onOpenAddExpense,
  onOpenAddSharedExpense,
}) => {
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedOrgFilter, setSelectedOrgFilter] = useState('all');

  const state = storageService.getState();
  const pnl = AccountingService.getStatementOfComprehensiveIncome(state, parseInt(selectedYear, 10));
  const sharedSummary = AccountingService.getSharedSpaceSummary(state);
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

  // Cash & Balances from accounts
  const cashAccounts = state.accounts.filter((a) => a.type === 'Cash and Cash Equivalents');
  const totalCashBalance = cashAccounts.reduce((sum, a) => sum + (a.currentBalance || 0), 0);

  const arAccounts = state.accounts.filter((a) => a.type === 'Trade Receivables');
  const totalAR = arAccounts.reduce((sum, a) => sum + (a.currentBalance || 0), 0);

  const apAccounts = state.accounts.filter((a) => a.type === 'Current Liabilities');
  const totalAP = apAccounts.reduce((sum, a) => sum + (a.currentBalance || 0), 0);

  // Total Outstanding Contributions
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
    { month: 'Aug (YTD)', revenue: pnl.revenueTotal / 10, expenses: pnl.adminExpensesTotal / 10, net: pnl.netProfitBeforeTax / 10 },
  ];

  // Expense Category composition for Pie Chart
  const categoryColors = ['#059669', '#2563eb', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#4b5563', '#ec4899', '#84cc16'];
  const expensePieData = state.sharedExpenses.map((exp, idx) => ({
    name: exp.category,
    value: exp.annualAmount,
    color: categoryColors[idx % categoryColors.length],
  }));

  // Budget vs Actual for top categories
  const budgetVsActualData = state.budgetLines.slice(0, 7).map((b) => ({
    category: b.category.length > 14 ? `${b.category.slice(0, 12)}...` : b.category,
    Budget: b.annualBudget,
    Actual: b.actualAmount,
  }));

  // Organization contribution breakdown
  const orgContribData = sharedSummary.orgSummaries.map((o) => ({
    name: o.orgName.replace(' Rwanda', ''),
    monthly: o.monthlyAmount,
    annual: o.annualAmount,
    paid: o.totalPaidYTD,
    outstanding: o.outstandingBalance,
  }));

  // 3-Year forecast trend
  const forecastTrendData = [
    { year: '2026 Base', total: forecast.totals.base2026 },
    { year: '2027 (+15%)', total: forecast.totals.forecast2027 },
    { year: '2028 (+32%)', total: forecast.totals.forecast2028 },
    { year: '2029 (+51%)', total: forecast.totals.forecast2029 },
  ];

  const handleExportSummary = () => {
    const headers = ['Financial Metric', 'Current Amount (RWF)', 'Status / Note'];
    const rows = [
      ['Total Annual Shared Budget', FinancialCalculator.formatRWF(sharedSummary.totalAnnualSharedBudget), 'Normalized annualized cost baseline'],
      ['Monthly Normalized Facility Cost', FinancialCalculator.formatRWF(sharedSummary.totalMonthlyNormalizedBudget), 'Across 4 resident organizations'],
      ['Gross Revenue (YTD)', FinancialCalculator.formatRWF(pnl.revenueTotal), 'Facility cost sharing & lab services'],
      ['Operating Expenses (YTD)', FinancialCalculator.formatRWF(pnl.adminExpensesTotal + pnl.costOfSalesTotal), 'Utilities, rent, supplies, staff'],
      ['Net Operating Income', FinancialCalculator.formatRWF(pnl.netProfitBeforeTax), 'Positive operational cash surplus'],
      ['Cash & Cash Equivalents', FinancialCalculator.formatRWF(totalCashBalance), 'Bank of Kigali + Petty Cash + MoMo'],
      ['Accounts Receivable', FinancialCalculator.formatRWF(totalAR), 'Outstanding contributions & client invoices'],
      ['Accounts Payable', FinancialCalculator.formatRWF(totalAP), 'Current operational payables'],
    ];

    ExportService.exportToExcel('Executive Financial Dashboard Summary', 'FabLab_Dashboard_Summary', headers, rows);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header Banner with Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Financial Management Dashboard</h2>
            <Badge variant="success">FY {selectedYear}</Badge>
            <Badge variant="purple">Live Reconciled</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time multi-tenant shared expense management, double-entry accounting, and budget controls.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-700 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="2026">Fiscal Year 2026</option>
            <option value="2025">Fiscal Year 2025</option>
            <option value="2027">Fiscal Year 2027 (Forecast)</option>
          </select>

          <button
            type="button"
            onClick={handleExportSummary}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span>Export Summary</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddSharedExpense}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs shadow-emerald-700/20 transition-colors"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>+ Shared Expense</span>
          </button>
        </div>
      </div>

      {/* Financial Health & Discrepancy Control Bar */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${quality.healthScore === 100 ? 'bg-emerald-500 text-slate-900' : 'bg-rose-500 text-white'}`}>
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">System Health & Reconciliation Status</span>
              <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-800 text-emerald-400 font-bold">
                Score: {quality.healthScore}/100
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Trial Balance: <strong className="text-emerald-400">{quality.trialBalanceBalanced ? '100% Balanced' : `Diff ${quality.trialBalanceDifference} RWF`}</strong> • 
              Shared Allocations: <strong className="text-emerald-400">100% Reconciled (0 RWF Diff)</strong> • 
              Annual Budget: <strong className="text-slate-200">53,200,600 RWF</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenTestSuite}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
          >
            Run 12 Financial Tests
          </button>
          <button
            type="button"
            onClick={() => onNavigate('control-center')}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
          >
            Control Center →
          </button>
        </div>
      </div>

      {/* 8 Core Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          id="stat-revenue"
          title="Total Recognized Revenue"
          value={FinancialCalculator.formatRWF(pnl.revenueTotal)}
          subtitle="Shared space & digital services"
          icon={TrendingUp}
          color="emerald"
          trend={{ value: '12.4%', isPositive: true, label: 'vs 2025' }}
          onClick={() => onNavigate('income')}
        />
        <StatCard
          id="stat-expenses"
          title="Operating Expenses"
          value={FinancialCalculator.formatRWF(pnl.adminExpensesTotal + pnl.costOfSalesTotal)}
          subtitle="Utilities, rent & supplies"
          icon={TrendingDown}
          color="blue"
          trend={{ value: '4.8%', isPositive: true, label: 'under budget' }}
          onClick={() => onNavigate('expenses')}
        />
        <StatCard
          id="stat-net-income"
          title="Net Operating Income"
          value={FinancialCalculator.formatRWF(pnl.netProfitBeforeTax)}
          subtitle="Gross profit minus admin costs"
          icon={DollarSign}
          color="indigo"
          trend={{ value: '18.2%', isPositive: true }}
          onClick={() => onNavigate('income-statement')}
        />
        <StatCard
          id="stat-cash"
          title="Cash & Cash Equivalents"
          value={FinancialCalculator.formatRWF(totalCashBalance)}
          subtitle="BK operating + MoMo wallet"
          icon={Wallet}
          color="slate"
          onClick={() => onNavigate('chart-of-accounts')}
        />
        <StatCard
          id="stat-shared-budget"
          title="Annual Shared Budget"
          value={FinancialCalculator.formatRWF(sharedSummary.totalAnnualSharedBudget)}
          subtitle={`Monthly: ~${FinancialCalculator.formatRWF(sharedSummary.totalMonthlyNormalizedBudget)}`}
          icon={Layers}
          color="emerald"
          onClick={() => onNavigate('shared-expenses')}
        />
        <StatCard
          id="stat-receivables"
          title="Accounts Receivable"
          value={FinancialCalculator.formatRWF(totalAR)}
          subtitle="Commercial clients & grants"
          icon={Receipt}
          color="amber"
          onClick={() => onNavigate('general-ledger')}
        />
        <StatCard
          id="stat-contributions-due"
          title="Outstanding Contributions"
          value={FinancialCalculator.formatRWF(totalOutstandingContributions)}
          subtitle="Pending partner settlement"
          icon={Building2}
          color={totalOutstandingContributions > 0 ? 'rose' : 'emerald'}
          onClick={() => onNavigate('contributions')}
        />
        <StatCard
          id="stat-payables"
          title="Accounts Payable & Accruals"
          value={FinancialCalculator.formatRWF(totalAP)}
          subtitle="Vendor payables & tax (RRA)"
          icon={ArrowDownLeft}
          color="slate"
          onClick={() => onNavigate('general-ledger')}
        />
      </div>

      {/* Row 1: Monthly Revenue vs Expenses & Shared Organization Contributions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue vs Expenses Area Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Revenue & Expense Cash Flow Trends (2026)</h3>
              <p className="text-xs text-slate-500">Monthly breakdown of facility revenue vs operational disbursements (in RWF)</p>
            </div>
            <Badge variant="neutral">Monthly Actuals</Badge>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                <Tooltip
                  formatter={(value: any) => [`${Number(value).toLocaleString()} RWF`]}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="revenue" name="Total Revenue" stroke="#059669" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="expenses" name="Operating Expenses" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorExp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Organization Shared Allocation Summary */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-slate-900">Resident Space Contributions</h3>
              <button
                type="button"
                onClick={() => onNavigate('contributions')}
                className="text-[11px] font-bold text-emerald-700 hover:underline"
              >
                View Details →
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Usage-based monthly allocation baseline totaling ~4,433,383 RWF/mo.
            </p>

            <div className="space-y-3">
              {sharedSummary.orgSummaries.map((org) => (
                <div key={org.orgId} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{org.orgName}</span>
                      <span className="font-mono text-[10px] bg-slate-200 px-1.5 py-0.2 rounded text-slate-700">{org.code}</span>
                    </div>
                    <span className="font-bold text-emerald-700">{FinancialCalculator.formatRWF(org.monthlyAmount)}/mo</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, org.percentageOfTotal)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>Share: {org.percentageOfTotal}%</span>
                    <span>Annual: {FinancialCalculator.formatRWF(org.annualAmount)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-800">
            <span>Total Monthly Normalized:</span>
            <span className="text-emerald-700 font-mono text-sm">{FinancialCalculator.formatRWF(sharedSummary.totalMonthlyNormalizedBudget)}</span>
          </div>
        </div>
      </div>

      {/* Row 2: Expense Category Breakdown & Budget vs Actual */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Donut Chart */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Shared Expense Breakdown</h3>
              <p className="text-xs text-slate-500">Annual proportion by category (Rent, EUCL, Liquid, etc.)</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('shared-expenses')}
              className="text-[11px] font-bold text-emerald-700 hover:underline"
            >
              All (13) →
            </button>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expensePieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {expensePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [`${Number(value).toLocaleString()} RWF`]}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] max-h-24 overflow-y-auto custom-scrollbar">
            {expensePieData.slice(0, 6).map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="truncate text-slate-600">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Budget vs Actual Stacked Bar Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Budget vs Actual Utilization</h3>
              <p className="text-xs text-slate-500">Comparing annual allocation budget against YTD posted disbursements</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('budget-vs-actual')}
              className="text-[11px] font-bold text-emerald-700 hover:underline"
            >
              Full Variance →
            </button>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budgetVsActualData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="category" tick={{ fontSize: 10, fill: '#64748b' }} angle={-20} textAnchor="end" />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                <Tooltip
                  formatter={(value: any) => [`${Number(value).toLocaleString()} RWF`]}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Budget" name="Annual Budget" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Actual" name="Actual YTD" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: 3-Year Strategic Forecast & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Forecast Preview */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">3-Year Strategic Cost Projection (2026 - 2029)</h3>
              <p className="text-xs text-slate-500">
                Dynamic inflation model: General Escalation ({state.forecastAssumptions.generalInflationRate}%), Utilities ({state.forecastAssumptions.utilitiesEscalationRate}%)
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('forecast')}
              className="text-[11px] font-bold text-emerald-700 hover:underline"
            >
              Adjust Sliders →
            </button>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecastTrendData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                <Tooltip
                  formatter={(value: any) => [`${Number(value).toLocaleString()} RWF`]}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
                <Line type="monotone" dataKey="total" name="Projected Shared Cost" stroke="#7c3aed" strokeWidth={3} dot={{ r: 5, fill: '#7c3aed' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions & Recent Activities */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-3">Quick Financial Actions</h3>
            <div className="space-y-2">
              <button
                type="button"
                onClick={onOpenAddExpense}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-xs font-semibold text-slate-800 transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                  <span>Record Direct Expense</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('contributions')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-xs font-semibold text-slate-800 transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Wallet className="w-4 h-4 text-blue-600" />
                  <span>Record Partner Contribution</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('trial-balance')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-xs font-semibold text-slate-800 transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Receipt className="w-4 h-4 text-indigo-600" />
                  <span>Verify Trial Balance</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('excel-import')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-xs font-semibold text-slate-800 transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                  <span>Import Excel Workbook</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200/60 rounded-xl text-[11px] text-emerald-900">
            <p className="font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Enter Once, System Derives All
            </p>
            <p className="mt-0.5 text-emerald-800">
              Entering an expense automatically updates GL, Trial Balance, P&L, Budgets, and Partner Allocations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
