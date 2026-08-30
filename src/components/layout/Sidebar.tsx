import React from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Building2, 
  Layers, 
  Sliders, 
  Wallet, 
  BookOpen, 
  FileText, 
  Scale, 
  PieChart, 
  TrendingUp, 
  BarChart3, 
  DollarSign, 
  FileSpreadsheet, 
  ShieldAlert, 
  Users, 
  Key, 
  History, 
  Settings, 
  UploadCloud,
  ChevronRight,
  Lock
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { AccountingService } from '../../services/accountingService';
import { UserRole } from '../../types/financial';
import { FabLabLogo } from '../common/FabLabLogo';

interface SidebarProps {
  currentModule: string;
  onNavigate: (module: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: any;
  badge?: string | number;
  badgeColor?: 'green' | 'red' | 'amber' | 'blue';
  allowedRoles?: UserRole[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentModule,
  onNavigate,
  isOpen,
  onClose,
}) => {
  const state = storageService.getState();
  const quality = AccountingService.getQualityReconciliation(state);
  const currentUserRole = state.currentUser?.role || 'VIEWER';

  const unapprovedCount = quality.unapprovedTransactions.length;
  const overdueCtbCount = quality.overdueContributions.length;
  const unreconciledShared = quality.unreconciledSharedExpenses.length;
  const pendingSubmissionsCount = state.sharedExpenses.filter((e) => e.status === 'Submitted').length;

  const sections: NavSection[] = [
    {
      title: 'CORE OVERVIEW',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { 
          id: 'control-center', 
          label: 'Finance Control Center', 
          icon: ShieldAlert, 
          badge: quality.healthScore < 100 ? `${quality.healthScore}%` : '100%',
          badgeColor: quality.healthScore === 100 ? 'green' : 'red',
          allowedRoles: ['ADMIN', 'FINANCE_MANAGER', 'AUDITOR'],
        },
      ],
    },
    {
      title: 'SHARED FACILITY SPACE',
      items: [
        { 
          id: 'shared-expenses', 
          label: 'Shared Expenses', 
          icon: Layers, 
          badge: pendingSubmissionsCount > 0 
            ? `${pendingSubmissionsCount} Pending` 
            : (unreconciledShared > 0 ? `${unreconciledShared} Diff` : undefined),
          badgeColor: pendingSubmissionsCount > 0 ? 'amber' : 'red'
        },
        { id: 'organizations', label: 'Organizations (4)', icon: Building2 },
        { 
          id: 'allocation-policies', 
          label: 'Allocation Policies', 
          icon: Sliders,
          allowedRoles: ['ADMIN', 'FINANCE_MANAGER', 'FINANCIAL_ANALYST'],
        },
        { 
          id: 'contributions', 
          label: 'Contributions', 
          icon: Wallet,
          badge: overdueCtbCount > 0 ? `${overdueCtbCount} Due` : undefined,
          badgeColor: 'amber'
        },
      ],
    },
    {
      title: 'FINANCIAL TRANSACTIONS',
      items: [
        { 
          id: 'expenses', 
          label: 'Expenses Register', 
          icon: ArrowDownLeft,
          badge: unapprovedCount > 0 ? `${unapprovedCount} Pending` : undefined,
          badgeColor: 'blue',
          allowedRoles: ['ADMIN', 'FINANCE_MANAGER', 'ACCOUNTANT', 'FINANCIAL_ANALYST', 'AUDITOR'],
        },
        { 
          id: 'income', 
          label: 'Income Register', 
          icon: ArrowUpRight,
          allowedRoles: ['ADMIN', 'FINANCE_MANAGER', 'ACCOUNTANT', 'FINANCIAL_ANALYST', 'AUDITOR'],
        },
      ],
    },
    {
      title: 'DOUBLE-ENTRY ACCOUNTING',
      items: [
        { id: 'chart-of-accounts', label: 'Chart of Accounts', icon: BookOpen },
        { 
          id: 'journal-entries', 
          label: 'Journal Entries', 
          icon: Receipt,
          allowedRoles: ['ADMIN', 'FINANCE_MANAGER', 'ACCOUNTANT', 'AUDITOR'],
        },
        { id: 'general-ledger', label: 'General Ledger', icon: FileText },
        { 
          id: 'trial-balance', 
          label: 'Trial Balance', 
          icon: Scale, 
          badge: quality.trialBalanceBalanced ? 'Balanced' : 'Diff',
          badgeColor: quality.trialBalanceBalanced ? 'green' : 'red'
        },
      ],
    },
    {
      title: 'BUDGETS & FORECASTS',
      items: [
        { id: 'annual-budget', label: 'Annual Budget', icon: PieChart },
        { id: 'budget-vs-actual', label: 'Budget vs Actual', icon: BarChart3 },
        { id: 'forecast', label: '3-Year Forecast', icon: TrendingUp },
      ],
    },
    {
      title: 'FINANCIAL STATEMENTS',
      items: [
        { id: 'income-statement', label: 'Statement of Income (P&L)', icon: DollarSign },
        { id: 'cash-flow', label: 'Cash Flow Statement', icon: Wallet },
        { id: 'shared-report', label: 'Shared Expense Report', icon: FileSpreadsheet },
        { id: 'financial-summary', label: 'Executive Summary', icon: FileText },
      ],
    },
    {
      title: 'ADMINISTRATION',
      items: [
        { 
          id: 'audit-log', 
          label: 'Audit Trail', 
          icon: History,
          allowedRoles: ['ADMIN', 'FINANCE_MANAGER', 'AUDITOR'],
        },
        { 
          id: 'users', 
          label: 'Users & Staff', 
          icon: Users,
          allowedRoles: ['ADMIN'],
        },
        { 
          id: 'roles-permissions', 
          label: 'Roles & Permissions', 
          icon: Key,
          allowedRoles: ['ADMIN'],
        },
        { 
          id: 'excel-import', 
          label: 'Excel Data Import', 
          icon: UploadCloud,
          allowedRoles: ['ADMIN', 'FINANCE_MANAGER'],
        },
        { 
          id: 'settings', 
          label: 'System Settings', 
          icon: Settings,
          allowedRoles: ['ADMIN'],
        },
      ],
    },
  ];

  // Filter items according to role permissions
  const filteredSections = sections
    .map((sec) => ({
      ...sec,
      items: sec.items.filter(
        (item) => !item.allowedRoles || item.allowedRoles.includes(currentUserRole)
      ),
    }))
    .filter((sec) => sec.items.length > 0);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#0B192C]/70 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Main Structural Sidebar in FabLab Brand Blue/Navy Theme */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0F4C81] border-r border-[#0B3B66] text-white flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header with Authentic FabLab Logo */}
        <div 
          onClick={() => {
            onNavigate('dashboard');
            if (window.innerWidth < 1024) onClose();
          }}
          className="h-16 px-4 flex items-center border-b border-[#0B3B66] bg-[#0B3B66]/60 cursor-pointer group"
        >
          <FabLabLogo size="md" theme="dark" subtitle="Shared Expenses Management System" />
        </div>

        {/* Navigation Content */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 custom-scrollbar">
          {filteredSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              <p className="px-3 text-[10px] font-bold tracking-wider text-sky-200/60 uppercase">
                {section.title}
              </p>
              <div className="space-y-0.5 mt-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentModule === item.id;

                  const badgeBgMap = {
                    green: 'bg-[#009A44] text-white',
                    red: 'bg-[#E31B23] text-white',
                    amber: 'bg-amber-400 text-slate-950 font-bold',
                    blue: 'bg-white/20 text-white',
                  };

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onNavigate(item.id);
                        if (window.innerWidth < 1024) onClose();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all group cursor-pointer ${
                        isActive
                          ? 'bg-[#009A44] text-white shadow-xs'
                          : 'text-sky-100/85 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive ? 'text-white' : 'text-sky-200 group-hover:text-white'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.badge && (
                        <span
                          className={`text-[9px] font-bold font-numeric px-1.5 py-0.5 rounded-md leading-tight shrink-0 ${
                            isActive ? 'bg-white text-[#009A44]' : badgeBgMap[item.badgeColor || 'blue']
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Facility Space Summary & Security Status */}
        <div className="p-3 border-t border-[#0B3B66] bg-[#0B3B66]/40 space-y-2">
          <div className="p-2.5 rounded-lg bg-black/20 border border-white/10 text-[11px]">
            <div className="flex items-center justify-between text-sky-200 mb-1">
              <span className="font-bold text-white">Facility Space</span>
              <span className="font-numeric text-[#A7E7BF] font-bold text-[10px]">FY 2026</span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-sky-100/80 font-numeric">
              <span>Budget: 53.2M RWF</span>
              <span className="text-[#009A44] font-bold">4 Orgs</span>
            </div>
          </div>

          <div className="flex items-center justify-between px-2 py-1 rounded-md bg-[#009A44]/15 border border-[#009A44]/30 text-[10px] text-emerald-300 font-mono">
            <div className="flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-[#009A44]" />
              <span>256-Bit Financial Encryption</span>
            </div>
            <span className="w-1.5 h-1.5 rounded-full bg-[#009A44] animate-pulse" />
          </div>
        </div>
      </aside>
    </>
  );
};
