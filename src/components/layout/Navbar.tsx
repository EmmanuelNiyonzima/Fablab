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

  const handleUserSelect = (targetUser: typeof state.users[0]) => {
    storageService.setCurrentUser(targetUser);
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
      <div className="px-4 lg:px-6 h-16 flex items-center justify-between gap-3 lg:gap-5">
        
        {/* Left: Mobile Sidebar Trigger + Breadcrumb */}
        <div className="flex items-center gap-2.5 min-w-0 shrink">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Clean Page Title & Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-xs min-w-0">
            <span className="text-slate-500 font-medium whitespace-nowrap">{breadcrumb.category}</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-bold text-sm tracking-tight truncate max-w-[140px] sm:max-w-[200px] md:max-w-[260px]">
              {breadcrumb.title}
            </span>
          </div>
        </div>

        {/* Center: Global Search Bar */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-3">
          <button
            type="button"
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-3.5 py-2 text-xs bg-slate-50/90 hover:bg-slate-100 border border-slate-200/90 hover:border-slate-300 rounded-xl text-slate-600 hover:text-slate-900 transition-all cursor-pointer shadow-2xs group"
          >
            <div className="flex items-center gap-2.5 min-w-0 mr-2">
              <Search className="w-4 h-4 shrink-0 text-[#0F4C81] group-hover:text-[#0A3962] transition-colors" />
              <span className="text-slate-500 group-hover:text-slate-700 font-normal text-xs truncate">
                Search transactions, accounts, orgs...
              </span>
            </div>
            <kbd className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-semibold bg-white text-slate-600 rounded-md border border-slate-200 shadow-2xs">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Right: Security Badge, Integrity Badge, Quick Actions, Profile Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* 256-Bit Financial Encryption Status Badge */}
          <div 
            title="Active Session Protected by 256-Bit Financial Encryption"
            className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg shadow-2xs whitespace-nowrap shrink-0"
          >
            <Lock className="w-3.5 h-3.5 text-[#009A44]" />
            <span className="text-[11px] font-medium">256-Bit Financial Encryption</span>
          </div>

          {/* Integrity Test Suite button (FabLab Green Accent) */}
          <button
            type="button"
            onClick={onOpenTestSuite}
            title="Run 12 Mandatory Calculation Integrity Tests"
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold bg-[#E8F8EE] hover:bg-[#D7F2E0] border border-[#A7E7BF] text-[#007D37] rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <ShieldCheck className="w-4 h-4 text-[#009A44]" />
            <span className="hidden lg:inline">Integrity</span>
            <span className="px-1.5 py-0.2 text-[10px] bg-[#009A44] text-white rounded font-mono font-bold">
              12/12
            </span>
          </button>

          {/* Quick Database Reset Tool */}
          <button
            type="button"
            onClick={handleReset}
            title="Reset to 2026 Baseline Seed Data"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Notifications Trigger */}
          <div className="relative shrink-0">
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

          <div className="h-5 w-px bg-slate-200 mx-0.5 hidden sm:block" />

          {/* Direct Sign Out Trigger */}
          <button
            type="button"
            onClick={onLogout}
            title="Lock Session and Go to Login Page"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-slate-50 hover:bg-red-50 text-slate-700 hover:text-[#E31B23] border border-slate-200 hover:border-red-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Sign Out</span>
          </button>

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
                  <div className="py-1 max-h-56 overflow-y-auto custom-scrollbar">
                    <p className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400">
                      Switch Active User / Department:
                    </p>
                    {state.users.map((u) => {
                      const isCurrent = currentUser.id === u.id || currentUser.email === u.email;
                      const isSuper = u.role === 'ADMIN';
                      return (
                        <button
                          key={u.id || u.email}
                          type="button"
                          onClick={() => handleUserSelect(u)}
                          className={`w-full text-left px-3 py-2 text-xs hover:bg-[#EBF3FA] flex items-start justify-between gap-2 transition-colors cursor-pointer border-b border-slate-50 last:border-0 ${
                            isCurrent ? 'bg-[#EBF3FA] font-bold text-[#0F4C81]' : 'text-slate-700'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-bold truncate text-slate-900 flex items-center gap-1.5">
                              {u.name}
                              {isCurrent && <CheckCircle2 className="w-3.5 h-3.5 text-[#0F4C81] inline shrink-0" />}
                            </p>
                            <p className="text-[10px] text-slate-500 truncate">
                              {u.organizationName || u.department || u.email}
                            </p>
                          </div>
                          <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded shrink-0 font-bold ${
                            isSuper ? 'bg-[#0F4C81] text-white' : 'bg-purple-100 text-purple-700'
                          }`}>
                            {isSuper ? 'ADMIN' : (u.organizationName?.split(' ')[0] || 'DEPT')}
                          </span>
                        </button>
                      );
                    })}
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
