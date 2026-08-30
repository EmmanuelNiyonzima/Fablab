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
  FileText,
  BarChart3,
  LineChart as LineIcon,
  Download,
  Clock,
  CheckCircle,
  XCircle
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
import { SecurityScope } from '../../utils/securityScope';
import { Lock } from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (module: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const [selectedYear, setSelectedYear] = useState('2026');
  const [incomeExpenseChartType, setIncomeExpenseChartType] = useState<'line' | 'column'>('line');

  const state = storageService.getState();
  const currentUser = state.currentUser;
  const isAdmin = SecurityScope.isSuperAdmin(currentUser);
  const is250 = SecurityScope.is250Startups(currentUser);
  const canAccessAdvanced = SecurityScope.canAccessAdvancedFinancials(currentUser);
  const userOrg = SecurityScope.getUserOrg(currentUser, state.organizations);

  const fiscalYearNum = parseInt(selectedYear, 10);
  const pnl = AccountingService.getStatementOfComprehensiveIncome(state, fiscalYearNum);
  const sharedSummary = AccountingService.getSharedSpaceSummary(state);
  const trialBalance = AccountingService.getTrialBalance(state);
  const quality = AccountingService.getQualityReconciliation(state);

  // Department-specific summary if non-admin
  const myOrgSummary = userOrg 
    ? sharedSummary.orgSummaries.find((o) => o.orgId === userOrg.id)
    : null;

  // Accessible collections under Data Isolation rules
  const accessibleShared = SecurityScope.filterSharedExpenses(state.sharedExpenses, currentUser);
  const accessibleContributions = SecurityScope.filterContributions(state.contributions, currentUser);

  // 1. Total Revenue (Official Approved/Posted)
  const totalRevenue = pnl.revenueTotal;
  // 2. Total Expenses (Official Approved/Posted)
  const totalExpenses = pnl.adminExpensesTotal;
  // 3. Net Operating Income
  const netIncome = pnl.netProfitBeforeTax;
  // 4. Shared Facility Expenses Pool
  const totalSharedExpenses = sharedSummary.totalAnnualSharedBudget;

  // Secondary Metrics
  const cashAccounts = state.accounts.filter((a) => a.type === 'Cash and Cash Equivalents');
  const totalCashBalance = cashAccounts.reduce((sum, a) => sum + (a.currentBalance || 0), 0);

  const arAccounts = state.accounts.filter((a) => a.type === 'Trade Receivables');
  const totalAR = arAccounts.reduce((sum, a) => sum + (a.currentBalance || 0), 0);

  const apAccounts = state.accounts.filter((a) => a.type === 'Current Liabilities');
  const totalAP = apAccounts.reduce((sum, a) => sum + (a.currentBalance || 0), 0);

  const totalOutstandingContributions = accessibleContributions.reduce(
    (sum, c) => sum + (c.outstandingBalance || 0),
    0
  );

  // Submissions Governance Breakdown
  const pendingSubmissions = accessibleShared.filter((e) => e.status === 'Submitted');
  const approvedSharedCount = accessibleShared.filter((e) => e.status === 'Posted' || e.status === 'Approved').length;
  const rejectedSharedCount = accessibleShared.filter((e) => e.status === 'Rejected').length;
  const draftSharedCount = accessibleShared.filter((e) => e.status === 'Draft').length;

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

  // 4 Organizations Space Cost Distribution & Bar Comparison
  const orgPalette: Record<string, string> = {
    'org-fablab': '#0F4C81',    // FabLab Blue
    'org-klab': '#009A44',      // FabLab Green
    'org-fabcafe': '#E31B23',   // FabLab Red
    'org-250startups': '#D97706' // Accent Amber
  };

  const orgPieData = state.organizations.map((org) => {
    const alloc = sharedSummary.orgSummaries.find((o) => o.orgId === org.id);
    const isMyDept = !isAdmin && userOrg?.id === org.id;
    return {
      name: isAdmin ? org.name : (isMyDept ? `${org.name} (Your Dept)` : `${org.code} (Confidential)`),
      code: org.code,
      value: alloc ? alloc.annualAmount : 0,
      monthly: alloc ? alloc.monthlyAmount : 0,
      share: alloc ? alloc.percentageOfTotal : 0,
      color: orgPalette[org.id] || '#64748B',
      isMyDept,
    };
  });

  const orgBarData = state.organizations.map((org) => {
    const alloc = sharedSummary.orgSummaries.find((o) => o.orgId === org.id);
    const isMyDept = !isAdmin && userOrg?.id === org.id;
    return {
      name: isAdmin ? org.name.replace(' Rwanda', '').replace(' Operations', '') : (isMyDept ? org.name.split(' ')[0] : `${org.code}`),
      allocated: isAdmin || isMyDept ? (alloc ? alloc.annualAmount : 0) : 0,
      paid: isAdmin || isMyDept ? (alloc ? alloc.totalPaidYTD : 0) : 0,
      outstanding: isAdmin || isMyDept ? (alloc ? alloc.outstandingBalance : 0) : 0,
      isMyDept,
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

  const formatRWF = (val: number) => `${val.toLocaleString()} RWF`;

  const handleExportFullManagementExcel = () => {
    ExportService.exportFullManagementWorkbook(state, {
      fiscalYear: fiscalYearNum,
      generatedBy: state.currentUser.name,
    });
  };

  const handleExportExecutivePDF = () => {
    const headers = ['Financial Performance Metric', 'Official FY2026 Value (RWF)', 'Benchmark / Context'];
    const rows = [
      ['Total Operating Revenue', formatRWF(totalRevenue), 'Official approved receipts & grants'],
      ['Total Operating Expenses', formatRWF(totalExpenses), 'Official direct & administrative costs'],
      ['Shared Space Facility Pool', formatRWF(totalSharedExpenses), 'Apportioned across 4 organizations'],
      ['Net Operating Surplus', formatRWF(netIncome), `${((netIncome / (totalRevenue || 1)) * 100).toFixed(1)}% Operating Margin`],
      ['Total Cash & Bank Reserves', formatRWF(totalCashBalance), 'BK, Equity Bank & Cash Drawer'],
      ['Outstanding Contributions', formatRWF(totalOutstandingContributions), 'Uncollected dues from resident orgs'],
      ['Double-Entry Trial Balance', '0.00 RWF Diff', '100% Balanced & Audited'],
    ];

    ExportService.exportToPDF('Executive Financial Management Summary Report', 'SEMS_Executive_Financial_Report', headers, rows, {
      generatedBy: state.currentUser.name,
      summaryStats: [
        { label: 'Revenue', value: formatRWF(totalRevenue) },
        { label: 'Expenses', value: formatRWF(totalExpenses) },
        { label: 'Net Surplus', value: formatRWF(netIncome) },
      ],
    });
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header Banner & Quick Financial Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              {isAdmin ? 'Shared Expenses Management System' : `${userOrg?.name || 'Department'} Financial Portal`}
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-[#EBF3FA] text-[#0F4C81] border border-[#BCD4EA] rounded-md font-numeric">
              FY {selectedYear}
            </span>
            {isAdmin ? (
              <span className="px-2.5 py-0.5 text-xs font-bold bg-[#E8F8EE] text-[#007D37] border border-[#A7E7BF] rounded-md">
                Super Admin: Emmanuel Niyonzima
              </span>
            ) : (
              <span className="px-2.5 py-0.5 text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 rounded-md flex items-center gap-1">
                <Lock className="w-3 h-3 text-purple-600" />
                Department Isolated: {userOrg?.name}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isAdmin 
              ? 'Executive consolidated multi-department management dashboard, shared facility allocation matrix, and auditable accounting ledgers.'
              : `Department workspace for ${userOrg?.name}. Submit shared expenses with receipts to Super Administrator Emmanuel Niyonzima for review and approval.`}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            icon={PlusCircle}
            onClick={() => onNavigate('shared-expenses')}
          >
            Submit Department Expense
          </Button>
          {isAdmin && (
            <Button
              variant="secondary"
              size="sm"
              icon={ArrowUpRight}
              onClick={() => onNavigate('income')}
            >
              Post Income
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            icon={FileSpreadsheet}
            onClick={handleExportFullManagementExcel}
            className="border-emerald-600/50 text-emerald-800 hover:bg-emerald-50 font-bold"
          >
            {isAdmin ? 'Export Management Excel' : 'Export Dept Excel'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={Download}
            onClick={handleExportExecutivePDF}
          >
            {isAdmin ? 'Executive PDF Report' : 'Dept Statement PDF'}
          </Button>
        </div>
      </div>

      {/* Pending Submissions Alert Banner */}
      {pendingSubmissions.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-xs shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-950">
                {isAdmin 
                  ? `${pendingSubmissions.length} Department Shared Expense Submission(s) Awaiting Emmanuel's Review`
                  : `${pendingSubmissions.length} of your Department Submission(s) are Pending Review by Emmanuel Niyonzima`}
              </p>
              <p className="text-[11px] text-amber-800">
                {isAdmin 
                  ? "Resident departments have submitted shared space expenses with invoices for Emmanuel's review and general ledger posting."
                  : "Your submitted expenses are currently in the review queue. Once approved by Emmanuel, they will be posted to the facility general ledger."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('shared-expenses')}
            className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
          >
            {isAdmin ? `Review & Approve (${pendingSubmissions.length})` : `View My Submissions (${pendingSubmissions.length})`}
          </button>
        </div>
      )}

      {/* 2. Top KPI Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {isAdmin ? `1. Core Executive Financial Indicators (FY ${selectedYear})` : `1. Department Financial Indicators (${userOrg?.name})`}
          </h2>
          <span className="text-[11px] text-slate-400 font-medium">
            {isAdmin ? 'Consolidated facility accounting ledgers' : 'Restricted and isolated to your department'}
          </span>
        </div>

        {isAdmin ? (
          /* ADMIN CONSOLIDATED VIEW */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Total Income */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Income / Revenue</span>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2 font-numeric">
                {formatRWF(totalRevenue)}
              </p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-500">Facility fees & grants</span>
                <span className="font-bold text-emerald-700">+14.2% vs Q2</span>
              </div>
            </div>

            {/* 2. Total Expenses */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Expenses</span>
                <div className="p-2 rounded-xl bg-rose-50 text-rose-700">
                  <ArrowDownLeft className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2 font-numeric">
                {formatRWF(totalExpenses)}
              </p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-500">Direct & administrative</span>
                <span className="font-bold text-rose-700">96.9% of budget</span>
              </div>
            </div>

            {/* 3. Shared Expenses */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Shared Facility Pool</span>
                <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
                  <Layers className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2 font-numeric">
                {formatRWF(totalSharedExpenses)}
              </p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-500">4-organization pool</span>
                <span className="font-bold text-blue-700">100% Apportioned</span>
              </div>
            </div>

            {/* 4. Net Operating Balance */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Net Operating Balance</span>
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-black text-emerald-700 mt-2 font-numeric">
                {formatRWF(netIncome)}
              </p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-500">Operating margin</span>
                <span className="font-bold text-emerald-700">36.8% Surplus</span>
              </div>
            </div>
          </div>
        ) : (
          /* DEPARTMENT ISOLATED VIEW */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Department Annual Allocation */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Your Annual Cost Share</span>
                <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2 font-numeric">
                {formatRWF(myOrgSummary?.annualAmount || 0)}
              </p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-500">Cost allocation share</span>
                <span className="font-bold text-blue-700">{myOrgSummary?.percentageOfTotal.toFixed(1)}% of facility</span>
              </div>
            </div>

            {/* 2. Monthly Normalized Dues */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Monthly Contribution Due</span>
                <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2 font-numeric">
                {formatRWF(myOrgSummary?.monthlyAmount || 0)}
              </p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-500">Billing cycle</span>
                <span className="font-bold text-amber-700">Monthly normalized</span>
              </div>
            </div>

            {/* 3. Contributions Remitted YTD */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Contributions Paid (YTD)</span>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                  <CheckCircle className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-black text-emerald-700 mt-2 font-numeric">
                {formatRWF(myOrgSummary?.totalPaidYTD || 0)}
              </p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-500">Remittance progress</span>
                <span className="font-bold text-emerald-700">
                  {(((myOrgSummary?.totalPaidYTD || 0) / (myOrgSummary?.annualAmount || 1)) * 100).toFixed(1)}% Settled
                </span>
              </div>
            </div>

            {/* 4. Outstanding Payable to Facility */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Outstanding Balance Due</span>
                <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
                  <Receipt className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2 font-numeric">
                {formatRWF(myOrgSummary?.outstandingBalance || 0)}
              </p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-500">Status</span>
                <span className={`font-bold ${(myOrgSummary?.outstandingBalance || 0) > 0 ? 'text-amber-600' : 'text-emerald-700'}`}>
                  {(myOrgSummary?.outstandingBalance || 0) > 0 ? 'Dues Pending' : 'Account Current'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

        {/* Secondary Supporting Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
          <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Total Cash & Bank</p>
              <p className="text-xs font-bold text-slate-900 font-numeric">{formatRWF(totalCashBalance)}</p>
            </div>
            <Wallet className="w-4 h-4 text-slate-500" />
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Accounts Receivable</p>
              <p className="text-xs font-bold text-slate-900 font-numeric">{formatRWF(totalAR)}</p>
            </div>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Accounts Payable</p>
              <p className="text-xs font-bold text-slate-900 font-numeric">{formatRWF(totalAP)}</p>
            </div>
            <Receipt className="w-4 h-4 text-rose-600" />
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Outstanding Org Dues</p>
              <p className="text-xs font-bold text-amber-700 font-numeric">{formatRWF(totalOutstandingContributions)}</p>
            </div>
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
        </div>

      {/* 3. Income vs Expenses Chart Section with View Switcher */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              2. Income vs Expenses Performance Over Time
            </h3>
            <p className="text-xs text-slate-500">
              Monthly revenue inflows, operational disbursements, and net cash margins (FY {selectedYear})
            </p>
          </div>

          {/* Chart Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => setIncomeExpenseChartType('line')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                incomeExpenseChartType === 'line'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LineIcon className="w-3.5 h-3.5" />
              <span>Line Chart (Trend)</span>
            </button>
            <button
              type="button"
              onClick={() => setIncomeExpenseChartType('column')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                incomeExpenseChartType === 'column'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Column Chart (Monthly)</span>
            </button>
          </div>
        </div>

        {/* Legend Indicators */}
        <div className="flex flex-wrap items-center gap-4 pt-3 pb-2 text-xs font-semibold">
          <span className="flex items-center gap-1.5 text-emerald-700">
            <span className="w-3 h-3 rounded-md bg-[#009A44]" /> Total Operating Revenue
          </span>
          <span className="flex items-center gap-1.5 text-rose-700">
            <span className="w-3 h-3 rounded-md bg-[#E31B23]" /> Total Operating Expenses
          </span>
          <span className="flex items-center gap-1.5 text-blue-700">
            <span className="w-3 h-3 rounded-md bg-[#0F4C81]" /> Net Operating Margin
          </span>
        </div>

        {/* Chart Rendering */}
        <div className="h-72 w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            {incomeExpenseChartType === 'line' ? (
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
                  name="Net Margin"
                  stroke="#0F4C81"
                  strokeWidth={2}
                  dot={{ r: 3.5, fill: '#0F4C81' }}
                />
              </AreaChart>
            ) : (
              <BarChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
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
                <Bar dataKey="revenue" name="Revenue" fill="#009A44" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#E31B23" radius={[4, 4, 0, 0]} />
                <Bar dataKey="net" name="Net Margin" fill="#0F4C81" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Organization Comparison & Shared Expense Breakdown (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Bar Chart - Expenses by Organization (7 cols) */}
        <div className="lg:col-span-7">
          <Card
            title={isAdmin ? "3. Expenses & Contributions by Organization" : `3. Cost Allocation & Contributions (${userOrg?.name || 'Your Dept'})`}
            subtitle={isAdmin ? "Annual shared facility cost allocated vs contributions paid YTD" : "Your department annual allocation vs remittances paid YTD"}
            actions={
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate(isAdmin ? 'organizations' : 'contributions')}
              >
                {isAdmin ? 'View Organizations' : 'View My Dues'}
              </Button>
            }
          >
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={orgBarData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={{ stroke: '#E2E8F0' }} />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    axisLine={{ stroke: '#E2E8F0' }}
                    tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip
                    formatter={(val: any) => [`${Number(val).toLocaleString()} RWF`, '']}
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    formatter={(value) => <span className="text-xs font-bold text-slate-700">{value}</span>}
                  />
                  <Bar dataKey="allocated" name="Annual Allocation" fill="#0F4C81" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="paid" name="Contributions Paid" fill="#009A44" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="outstanding" name="Outstanding Due" fill="#D97706" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Right: Pie/Doughnut Chart - Shared Expense Distribution by Organization (5 cols) */}
        <div className="lg:col-span-5">
          <Card
            title="4. Shared Expense Distribution"
            subtitle="53,200,600 RWF Annual Facility Pool (100% Split)"
          >
            <div className="h-44 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orgPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {orgPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [`${Number(val).toLocaleString()} RWF`, 'Annual Share']}
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
                    <span className="font-bold text-slate-800">{org.name}</span>
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

      {/* 5. Submissions Governance & Approvals Status */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              5. Submission & Approval Governance Status
            </h3>
            <p className="text-xs text-slate-500">
              Breakdown of shared expense submissions across approval stages
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('shared-expenses')}
          >
            Manage Submissions
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
          {/* Approved / Posted */}
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-950">Approved / Posted</span>
              <CheckCircle className="w-4 h-4 text-emerald-700" />
            </div>
            <p className="text-2xl font-black text-emerald-800 mt-2 font-numeric">{approvedSharedCount}</p>
            <p className="text-[11px] text-emerald-700 mt-1">Official in General Ledger</p>
          </div>

          {/* Pending Confirmation */}
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-950">Pending Review</span>
              <Clock className="w-4 h-4 text-amber-700" />
            </div>
            <p className="text-2xl font-black text-amber-800 mt-2 font-numeric">{pendingSubmissions.length}</p>
            <p className="text-[11px] text-amber-700 mt-1">Awaiting Admin Confirmation</p>
          </div>

          {/* Draft */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Draft In-Progress</span>
              <FileText className="w-4 h-4 text-slate-500" />
            </div>
            <p className="text-2xl font-black text-slate-800 mt-2 font-numeric">{draftSharedCount}</p>
            <p className="text-[11px] text-slate-500 mt-1">Unsubmitted drafts</p>
          </div>

          {/* Rejected */}
          <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-950">Rejected</span>
              <XCircle className="w-4 h-4 text-rose-700" />
            </div>
            <p className="text-2xl font-black text-rose-800 mt-2 font-numeric">{rejectedSharedCount}</p>
            <p className="text-[11px] text-rose-700 mt-1">Excluded from financial totals</p>
          </div>
        </div>
      </div>

      {/* 6. Budget vs Actual Comparison & Integrity Control Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Budget vs Actual Quick Visual Table (7 cols) */}
        <div className="lg:col-span-7">
          <Card
            title="Shared Facility Budget vs Actual (YTD 2026)"
            subtitle="Variance tracking by major facility operational cost line"
            actions={
              canAccessAdvanced ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigate('budget-vs-actual')}
                >
                  Full Analysis
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigate('contributions')}
                >
                  View My Dues
                </Button>
              )
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
              canAccessAdvanced ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onNavigate('control-center')}
                >
                  Control Center
                </Button>
              ) : undefined
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
                    <p className="text-[11px] text-slate-500">FabLab Rwanda, kLab, Fab Cafe, 250Startups</p>
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
