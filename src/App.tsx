import React, { useState, useEffect } from 'react';
import { storageService } from './services/storageService';
import { authService, AuthState } from './services/authService';

// Authentication
import { LoginPage } from './components/auth/LoginPage';

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
import { ImportRevenueDatasetView } from './components/transactions/ImportRevenueDatasetView';

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
import { SecurityScope } from './utils/securityScope';

// Protected Route Guard Component
interface ProtectedRouteProps {
  isAuthenticated: boolean;
  isLoading: boolean;
  children: React.ReactNode;
  onRedirectToLogin: () => void;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  isAuthenticated,
  isLoading,
  children,
  onRedirectToLogin,
}) => {
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      onRedirectToLogin();
    }
  }, [isAuthenticated, isLoading, onRedirectToLogin]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-200">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg animate-pulse mb-4 ring-2 ring-emerald-400/40">
          <span className="font-black text-white text-xl">FL</span>
        </div>
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2" />
        <p className="text-xs font-mono text-slate-400">Verifying secure financial session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};

export default function App() {
  const [authState, setAuthState] = useState<AuthState>(authService.getState());
  const [currentModule, setCurrentModule] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isTestSuiteOpen, setIsTestSuiteOpen] = useState<boolean>(false);
  const [, setTick] = useState<number>(0);

  // Subscribe to authentication service changes
  useEffect(() => {
    const unsubscribe = authService.subscribe((state) => {
      setAuthState(state);
    });
    return unsubscribe;
  }, []);

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

  const handleLogout = async () => {
    await authService.logout();
    setCurrentModule('dashboard');
  };

  // If not authenticated, always display the modern LoginPage
  if (!authState.isAuthenticated) {
    return (
      <LoginPage
        onLoginSuccess={() => {
          setCurrentModule('dashboard');
        }}
      />
    );
  }

  // Render the active view
  const renderView = () => {
    const currentUser = storageService.getCurrentUser();
    const canAccessAdvanced = SecurityScope.canAccessAdvancedFinancials(currentUser);
    const isAdmin = SecurityScope.isSuperAdmin(currentUser);

    switch (currentModule) {
      // Core Overview
      case 'dashboard':
        return <DashboardView onNavigate={handleNavigate} />;
      case 'control-center':
        return canAccessAdvanced ? <ControlCenterView onNavigate={handleNavigate} /> : <DashboardView onNavigate={handleNavigate} />;

      // Shared Facility Space & Department Revenue Inflows
      case 'shared-expenses':
        return <SharedExpensesView />;
      case 'organizations':
        return isAdmin ? <OrganizationsView onNavigate={handleNavigate} /> : <DashboardView onNavigate={handleNavigate} />;
      case 'allocation-policies':
        return isAdmin ? <AllocationPoliciesView onNavigate={handleNavigate} /> : <DashboardView onNavigate={handleNavigate} />;
      case 'contributions':
        return <ContributionsView />;
      case 'record-revenue':
      case 'income':
        return <IncomeView onNavigate={handleNavigate} />;
      case 'import-revenue':
        return <ImportRevenueDatasetView onNavigate={handleNavigate} />;

      // Financial Transactions (Restricted to Admin & 250Startups)
      case 'expenses':
        return canAccessAdvanced ? <ExpensesView /> : <DashboardView onNavigate={handleNavigate} />;

      // Double-Entry Accounting (Restricted to Admin & 250Startups)
      case 'chart-of-accounts':
        return canAccessAdvanced ? <ChartOfAccountsView /> : <DashboardView onNavigate={handleNavigate} />;
      case 'journal-entries':
        return canAccessAdvanced ? <JournalEntriesView /> : <DashboardView onNavigate={handleNavigate} />;
      case 'general-ledger':
        return canAccessAdvanced ? <GeneralLedgerView /> : <DashboardView onNavigate={handleNavigate} />;
      case 'trial-balance':
        return canAccessAdvanced ? <TrialBalanceView /> : <DashboardView onNavigate={handleNavigate} />;

      // Budgets & Forecasts (Restricted to Admin & 250Startups)
      case 'annual-budget':
        return canAccessAdvanced ? <AnnualBudgetView /> : <DashboardView onNavigate={handleNavigate} />;
      case 'budget-vs-actual':
        return canAccessAdvanced ? <BudgetVsActualView /> : <DashboardView onNavigate={handleNavigate} />;
      case 'forecast':
        return canAccessAdvanced ? <ForecastView /> : <DashboardView onNavigate={handleNavigate} />;

      // Financial Statements (Restricted to Admin & 250Startups)
      case 'income-statement':
        return canAccessAdvanced ? <IncomeStatementView /> : <DashboardView onNavigate={handleNavigate} />;
      case 'cash-flow':
        return canAccessAdvanced ? <CashFlowView /> : <DashboardView onNavigate={handleNavigate} />;
      case 'shared-report':
        return canAccessAdvanced ? <SharedExpenseReportView /> : <DashboardView onNavigate={handleNavigate} />;
      case 'financial-summary':
        return canAccessAdvanced ? <FinancialSummaryView /> : <DashboardView onNavigate={handleNavigate} />;

      // System Administration (Audit Trail for Admin & 250Startups, rest for Super Admin only)
      case 'audit-log':
        return SecurityScope.canAccessAuditTrail(currentUser) ? <AuditTrailView /> : <DashboardView onNavigate={handleNavigate} />;
      case 'users':
        return isAdmin ? <UsersView /> : <DashboardView onNavigate={handleNavigate} />;
      case 'roles-permissions':
        return isAdmin ? <RolesPermissionsView /> : <DashboardView onNavigate={handleNavigate} />;
      case 'excel-import':
        return isAdmin ? <ExcelImportView /> : <DashboardView onNavigate={handleNavigate} />;
      case 'settings':
        return isAdmin ? <SettingsView /> : <DashboardView onNavigate={handleNavigate} />;

      default:
        return <DashboardView onNavigate={handleNavigate} />;
    }
  };

  return (
    <ProtectedRoute
      isAuthenticated={authState.isAuthenticated}
      isLoading={authState.isLoading}
      onRedirectToLogin={() => {}}
    >
      <div className="min-h-screen bg-slate-100 text-slate-900 flex font-sans antialiased selection:bg-[#009A44] selection:text-white">
        {/* Persistent Collapsible Sidebar */}
        <Sidebar
          currentModule={currentModule}
          onNavigate={handleNavigate}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Main Content Area (Offset by Sidebar on Desktop) */}
        <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
          {/* Top Navigation Bar */}
          <Navbar
            currentModule={currentModule}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            onOpenSearch={() => setIsSearchOpen(true)}
            onOpenTestSuite={() => setIsTestSuiteOpen(true)}
            onLogout={handleLogout}
            onNavigate={handleNavigate}
          />

          {/* Content Canvas */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
            {renderView()}
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
    </ProtectedRoute>
  );
}
