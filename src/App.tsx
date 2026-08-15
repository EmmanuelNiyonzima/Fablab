import React, { useState, useEffect } from 'react';
import { storageService } from './services/storageService';

// Layout Components
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { GlobalSearchModal } from './components/layout/GlobalSearchModal';
import { TestSuiteModal } from './components/common/TestSuiteModal';

// Views
import { DashboardView } from './components/dashboard/DashboardView';
import { ControlCenterView } from './components/dashboard/ControlCenterView';

// Shared Facility Space
import { SharedExpensesView } from './components/sharedSpace/SharedExpensesView';
import { OrganizationsView } from './components/sharedSpace/OrganizationsView';
import { AllocationPoliciesView } from './components/sharedSpace/AllocationPoliciesView';
import { ContributionsView } from './components/sharedSpace/ContributionsView';

// Transactions
import { ExpensesView } from './components/transactions/ExpensesView';
import { IncomeView } from './components/transactions/IncomeView';

// Accounting
import { ChartOfAccountsView } from './components/accounting/ChartOfAccountsView';
import { JournalEntriesView } from './components/accounting/JournalEntriesView';
import { GeneralLedgerView } from './components/accounting/GeneralLedgerView';
import { TrialBalanceView } from './components/accounting/TrialBalanceView';

// Budgets & Forecasts
import { AnnualBudgetView } from './components/budgets/AnnualBudgetView';
import { BudgetVsActualView } from './components/budgets/BudgetVsActualView';
import { ForecastView } from './components/budgets/ForecastView';

// Financial Statements & Reports
import { IncomeStatementView } from './components/reports/IncomeStatementView';
import { CashFlowView } from './components/reports/CashFlowView';
import { SharedExpenseReportView } from './components/reports/SharedExpenseReportView';
import { FinancialSummaryView } from './components/reports/FinancialSummaryView';

// System Administration
import { AuditTrailView } from './components/admin/AuditTrailView';
import { UsersView } from './components/admin/UsersView';
import { RolesPermissionsView } from './components/admin/RolesPermissionsView';
import { ExcelImportView } from './components/admin/ExcelImportView';
import { SettingsView } from './components/admin/SettingsView';

export default function App() {
  const [currentModule, setCurrentModule] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isTestSuiteOpen, setIsTestSuiteOpen] = useState<boolean>(false);
  const [, setTick] = useState<number>(0);

  // Subscribe to storage changes for reactive re-renders
  useEffect(() => {
    const unsubscribe = storageService.subscribe(() => {
      setTick((t) => t + 1);
    });
    return unsubscribe;
  }, []);

  // Keyboard shortcut for Global Search (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNavigate = (module: string) => {
    setCurrentModule(module);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Render the active view
  const renderView = () => {
    switch (currentModule) {
      // Core Overview
      case 'dashboard':
        return <DashboardView onNavigate={handleNavigate} />;
      case 'control-center':
        return <ControlCenterView onNavigate={handleNavigate} />;

      // Shared Facility Space
      case 'shared-expenses':
        return <SharedExpensesView />;
      case 'organizations':
        return <OrganizationsView />;
      case 'allocation-policies':
        return <AllocationPoliciesView />;
      case 'contributions':
        return <ContributionsView />;

      // Financial Transactions
      case 'expenses':
        return <ExpensesView />;
      case 'income':
        return <IncomeView />;

      // Double-Entry Accounting
      case 'chart-of-accounts':
        return <ChartOfAccountsView />;
      case 'journal-entries':
        return <JournalEntriesView />;
      case 'general-ledger':
        return <GeneralLedgerView />;
      case 'trial-balance':
        return <TrialBalanceView />;

      // Budgets & Forecasts
      case 'annual-budget':
        return <AnnualBudgetView />;
      case 'budget-vs-actual':
        return <BudgetVsActualView />;
      case 'forecast':
        return <ForecastView />;

      // Financial Statements
      case 'income-statement':
        return <IncomeStatementView />;
      case 'cash-flow':
        return <CashFlowView />;
      case 'shared-report':
        return <SharedExpenseReportView />;
      case 'financial-summary':
        return <FinancialSummaryView />;

      // System Administration
      case 'audit-log':
        return <AuditTrailView />;
      case 'users':
        return <UsersView />;
      case 'roles-permissions':
        return <RolesPermissionsView />;
      case 'excel-import':
        return <ExcelImportView />;
      case 'settings':
        return <SettingsView />;

      default:
        return <DashboardView onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans antialiased selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation Bar */}
      <Navbar
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenTestSuite={() => setIsTestSuiteOpen(true)}
        onLogout={() => {
          if (confirm('Sign out and switch user role?')) {
            setCurrentModule('dashboard');
          }
        }}
        onNavigate={handleNavigate}
      />

      {/* Main Layout Body */}
      <div className="flex-1 flex pt-0">
        {/* Persistent Collapsible Sidebar */}
        <Sidebar
          currentModule={currentModule}
          onNavigate={handleNavigate}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Content Canvas */}
        <main className="flex-1 lg:pl-64 min-w-0 transition-all duration-200">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
            {renderView()}
          </div>
        </main>
      </div>

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={handleNavigate}
      />

      {/* Financial Integrity Test Suite Modal */}
      <TestSuiteModal
        isOpen={isTestSuiteOpen}
        onClose={() => setIsTestSuiteOpen(false)}
      />
    </div>
  );
}
