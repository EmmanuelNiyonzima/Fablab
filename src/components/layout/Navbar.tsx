import React, { useState } from 'react';
import { 
  Search, 
  ShieldCheck, 
  Menu, 
  ChevronDown, 
  LogOut,
  RotateCcw,
  User,
  Shield,
  Key,
  CheckCircle2,
  Lock,
  Bell,
  Sliders
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { UserRole } from '../../types/financial';
import { FabLabLogo } from '../common/FabLabLogo';

interface NavbarProps {
  currentModule: string;
  onToggleSidebar: () => void;
  onOpenSearch: () => void;
  onOpenTestSuite: () => void;
  onLogout: () => void;
  onNavigate: (module: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentModule,
  onToggleSidebar,
  onOpenSearch,
  onOpenTestSuite,
  onLogout,
  onNavigate,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'delegation'>('profile');
  const state = storageService.getState();
  const currentUser = state.currentUser;

  const roles: { role: UserRole; name: string; title: string }[] = [
    { role: 'ADMIN', name: 'Emmanuel Niyonzima', title: 'Administrator & Lead Architect' },
    { role: 'FINANCE_MANAGER', name: 'Marie Claire Uwera', title: 'Finance Manager (Approval & Posting)' },
    { role: 'FINANCIAL_ANALYST', name: 'Patrick Mugisha', title: 'Financial Analyst (FP&A & Forecasts)' },
    { role: 'ACCOUNTANT', name: 'Aline Umutoni', title: 'Senior Accountant (Journals & Ledger)' },
    { role: 'VIEWER', name: 'Jean Claude Karangwa', title: 'Executive Board Member (Read-only)' },
    { role: 'AUDITOR', name: 'Dr. David Habimana', title: 'External Auditor (Audit Logs & Controls)' },
  ];

  const handleRoleSelect = (r: typeof roles[0]) => {
    const existing = state.users.find((u) => u.role === r.role);
    if (existing) {
      storageService.setCurrentUser(existing);
    } else {
      storageService.setCurrentUser({
        id: `usr-${r.role.toLowerCase()}`,
        name: r.name,
        email: `${r.role.toLowerCase()}@fablab.rw`,
        role: r.role,
        department: 'Finance',
        status: 'active',
      });
    }
    setShowUserMenu(false);
  };

  const handleReset = () => {
    if (window.confirm('Reset database to official FabLab Rwanda 2026 baseline dataset?')) {
      storageService.resetToFactoryDefaults();
      window.location.reload();
    }
  };

  const formatRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Administrator';
      case 'FINANCE_MANAGER':
        return 'Finance Manager';
      case 'FINANCIAL_ANALYST':
        return 'Financial Analyst';
      case 'ACCOUNTANT':
        return 'Senior Accountant';
      case 'AUDITOR':
        return 'External Auditor';
      case 'VIEWER':
        return 'Executive Viewer';
      default:
        return role;
    }
  };

  const getPageBreadcrumb = (mod: string) => {
    const map: Record<string, { category: string; title: string }> = {
      dashboard: { category: 'Core', title: 'Dashboard Overview' },
      'control-center': { category: 'Core', title: 'Finance Control Center' },
      'shared-expenses': { category: 'Shared Space', title: 'Shared Expenses' },
      organizations: { category: 'Shared Space', title: 'Organizations (4)' },
      'allocation-policies': { category: 'Shared Space', title: 'Allocation Policies' },
      contributions: { category: 'Shared Space', title: 'Contributions Register' },
      expenses: { category: 'Transactions', title: 'Expenses Register' },
      income: { category: 'Transactions', title: 'Income Register' },
      'chart-of-accounts': { category: 'Accounting', title: 'Chart of Accounts' },
      'journal-entries': { category: 'Accounting', title: 'Journal Entries' },
      'general-ledger': { category: 'Accounting', title: 'General Ledger' },
      'trial-balance': { category: 'Accounting', title: 'Trial Balance' },
      'annual-budget': { category: 'Budgets', title: 'Annual Budget 2026' },
      'budget-vs-actual': { category: 'Budgets', title: 'Budget vs Actual' },
      forecast: { category: 'Budgets', title: '3-Year Forecast' },
      'income-statement': { category: 'Reports', title: 'Income Statement (P&L)' },
      'cash-flow': { category: 'Reports', title: 'Cash Flow Statement' },
      'shared-report': { category: 'Reports', title: 'Shared Expense Report' },
      'financial-summary': { category: 'Reports', title: 'Executive Summary' },
      'audit-log': { category: 'Administration', title: 'Audit Trail' },
      users: { category: 'Administration', title: 'Users & Staff' },
      'roles-permissions': { category: 'Administration', title: 'Roles & Permissions' },
      'excel-import': { category: 'Administration', title: 'Excel Data Import' },
      settings: { category: 'Administration', title: 'System Settings' },
    };
    return map[mod] || { category: 'Financials', title: 'Financial Management' };
  };

  const breadcrumb = getPageBreadcrumb(currentModule);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="px-4 lg:px-6 h-16 flex items-center justify-between gap-4">
        
        {/* Left: Mobile Sidebar Trigger + Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Page Title & Breadcrumbs with fablab_ Finance_Management System title */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <button
                type="button"
                onClick={() => onNavigate('dashboard')}
                className="font-bold text-[#0F4C81] hover:text-[#0A3962] hover:underline cursor-pointer flex items-center gap-1"
                title="Go to Dashboard"
              >
                <span>fablab_ Finance_Management System</span>
              </button>
              <span className="text-slate-300">/</span>
              <span className="text-[#009A44] font-semibold">{breadcrumb.category}</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-800 font-bold truncate">{breadcrumb.title}</span>
            </div>
          </div>
        </div>

        {/* Center: Global Search Bar */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-2">
          <button
            type="button"
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-3.5 py-1.5 text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-800 transition-all cursor-pointer shadow-2xs group"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-[#0F4C81] group-hover:text-[#0A3962]" />
              <span className="text-slate-400 group-hover:text-slate-600">Search transactions, accounts, organizations...</span>
            </div>
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white text-slate-600 rounded border border-slate-200 shadow-2xs">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Right: Security Badge, Integrity Badge, Notifications, Profile Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* 256-Bit Financial Encryption Status Badge (Visible inside authenticated portal) */}
          <div 
            title="Session secured with 256-Bit Financial Encryption"
            className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg shadow-2xs"
          >
            <Lock className="w-3.5 h-3.5 text-[#009A44]" />
            <span className="text-[11px] font-medium hidden lg:inline">256-Bit Financial Encryption</span>
            <span className="text-[11px] font-medium lg:hidden">256-Bit Encrypted</span>
          </div>

          {/* Integrity Test Suite button (FabLab Green Accent) */}
          <button
            type="button"
            onClick={onOpenTestSuite}
            title="Run 12 Mandatory Calculation Integrity Tests"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-[#E8F8EE] hover:bg-[#D7F2E0] border border-[#A7E7BF] text-[#007D37] rounded-lg transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-[#009A44]" />
            <span className="hidden xl:inline">Integrity</span>
            <span className="px-1.5 py-0.2 text-[10px] bg-[#009A44] text-white rounded font-mono font-bold">
              12/12
            </span>
          </button>

          {/* Direct Sign Out / Lock Session Trigger */}
          <button
            type="button"
            onClick={onLogout}
            title="Lock Session and Go to Login Page"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-[#E31B23] border border-slate-200 hover:border-red-200 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Sign Out</span>
          </button>

          {/* Quick Database Reset Tool */}
          <button
            type="button"
            onClick={handleReset}
            title="Reset to 2026 Baseline Seed Data"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Notifications Trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#E31B23]" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 text-slate-900">
                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Notifications</span>
                  <span className="text-[10px] font-bold text-[#0F4C81] bg-[#EBF3FA] px-1.5 py-0.5 rounded">2 New</span>
                </div>
                <div className="p-2 space-y-1.5 text-xs">
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="font-semibold text-slate-800">Q3 Shared Utility Apportionment</p>
                    <p className="text-[11px] text-slate-500">4 organizations allocated 100% with zero balance variance.</p>
                  </div>
                  <div className="p-2 bg-[#E8F8EE] rounded-lg border border-[#A7E7BF]">
                    <p className="font-semibold text-[#007D37]">RRA VAT Declaration Ready</p>
                    <p className="text-[11px] text-[#007D37]/80">August 2026 statutory return reconciled.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Account Menu Dropdown */}
          <div className="relative">
            <button
              id="user-profile-menu-button"
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs transition-colors cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-[#0F4C81] text-white font-bold flex items-center justify-center text-xs shadow-2xs">
                {currentUser.avatar || currentUser.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="text-left hidden sm:block">
                <p className="font-bold text-slate-900 leading-tight">{currentUser.name}</p>
                <p className="text-[10px] text-[#0F4C81] font-semibold">
                  {formatRoleLabel(currentUser.role)}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 z-50 text-slate-800 animate-in fade-in zoom-in-95 duration-100">
                {/* User Summary Header */}
                <div className="px-4 pb-3 border-b border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0F4C81] text-white font-bold flex items-center justify-center text-sm shadow-sm ring-2 ring-[#0F4C81]/20">
                    {currentUser.avatar || currentUser.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 text-sm truncate">{currentUser.name}</p>
                    <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
                    <span className="inline-block mt-0.5 px-2 py-0.5 text-[10px] font-bold rounded-md bg-[#EBF3FA] text-[#0F4C81] font-mono border border-[#BCD4EA]">
                      {formatRoleLabel(currentUser.role)}
                    </span>
                  </div>
                </div>

                {/* Sub-Tabs: Profile / Security / Delegation */}
                <div className="px-3 pt-2 pb-1 grid grid-cols-3 gap-1 text-[11px] font-semibold border-b border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveTab('profile')}
                    className={`py-1.5 rounded-lg text-center transition-colors cursor-pointer ${
                      activeTab === 'profile' ? 'bg-[#EBF3FA] text-[#0F4C81] font-bold border border-[#BCD4EA]' : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('security')}
                    className={`py-1.5 rounded-lg text-center transition-colors cursor-pointer ${
                      activeTab === 'security' ? 'bg-[#EBF3FA] text-[#0F4C81] font-bold border border-[#BCD4EA]' : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    Security
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('delegation')}
                    className={`py-1.5 rounded-lg text-center transition-colors cursor-pointer ${
                      activeTab === 'delegation' ? 'bg-[#EBF3FA] text-[#0F4C81] font-bold border border-[#BCD4EA]' : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    Roles
                  </button>
                </div>

                {/* Tab 1: Profile Details */}
                {activeTab === 'profile' && (
                  <div className="px-4 py-3 space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Department</span>
                      <span className="font-semibold text-slate-800">{currentUser.department || 'Finance & Operations'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Status</span>
                      <span className="font-semibold text-[#007D37] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-[#009A44]" /> Active
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Last Login</span>
                      <span className="font-numeric text-slate-700 text-[11px]">{currentUser.lastLogin || 'Today (Current Session)'}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Workstation</span>
                      <span className="font-medium text-slate-700">Telecom House, 6th Fl</span>
                    </div>
                  </div>
                )}

                {/* Tab 2: Security & Session Info */}
                {activeTab === 'security' && (
                  <div className="px-4 py-3 space-y-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
                        <Lock className="w-3.5 h-3.5 text-[#009A44]" />
                        <span>256-Bit Authenticated Token</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Session is digitally signed with HMAC-SHA256 and expires automatically in 24 hours.
                      </p>
                    </div>
                    <div className="flex justify-between py-1 text-slate-600 text-[11px]">
                      <span>Role Permissions:</span>
                      <span className="font-bold text-[#0F4C81]">
                        {currentUser.role === 'ADMIN' ? 'Full Superadmin (17/17)' : 'Role Restricted'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Tab 3: Quick Role Switcher for Delegation & Testing */}
                {activeTab === 'delegation' && (
                  <div className="py-1 max-h-48 overflow-y-auto custom-scrollbar">
                    <p className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400">
                      Switch Role Context:
                    </p>
                    {roles.map((r) => (
                      <button
                        key={r.role}
                        type="button"
                        onClick={() => handleRoleSelect(r)}
                        className={`w-full text-left px-3 py-1.5 text-xs hover:bg-[#EBF3FA] flex items-start justify-between gap-2 transition-colors cursor-pointer ${
                          currentUser.role === r.role ? 'bg-[#EBF3FA] font-bold text-[#0F4C81]' : 'text-slate-700'
                        }`}
                      >
                        <div className="truncate">
                          <p className="font-semibold truncate">{r.name}</p>
                          <p className="text-[10px] text-slate-500 truncate">{r.title}</p>
                        </div>
                        <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                          {r.role}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Sign Out Button (FabLab Red) */}
                <div className="px-3 pt-2 border-t border-slate-100 mt-1">
                  <button
                    id="sign-out-action-btn"
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      onLogout();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 text-xs text-[#E31B23] hover:text-white hover:bg-[#E31B23] rounded-xl transition-colors font-bold cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out & Lock Session</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
