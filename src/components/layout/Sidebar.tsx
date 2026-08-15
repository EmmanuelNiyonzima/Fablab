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
  ShieldCheck
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { AccountingService } from '../../services/accountingService';

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
  badgeColor?: 'emerald' | 'rose' | 'amber' | 'blue';
  minRole?: string[];
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

  const unapprovedCount = quality.unapprovedTransactions.length;
  const overdueCtbCount = quality.overdueContributions.length;
  const unreconciledShared = quality.unreconciledSharedExpenses.length;

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
          badgeColor: quality.healthScore === 100 ? 'emerald' : 'rose'
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
          badge: unreconciledShared > 0 ? `${unreconciledShared} Diff` : undefined,
          badgeColor: 'rose'
        },
        { id: 'organizations', label: 'Organizations (4)', icon: Building2 },
        { id: 'allocation-policies', label: 'Allocation Policies', icon: Sliders },
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
          badgeColor: 'blue'
        },
        { id: 'income', label: 'Income Register', icon: ArrowUpRight },
      ],
    },
    {
      title: 'DOUBLE-ENTRY ACCOUNTING',
      items: [
        { id: 'chart-of-accounts', label: 'Chart of Accounts', icon: BookOpen },
        { id: 'journal-entries', label: 'Journal Entries', icon: Receipt },
        { id: 'general-ledger', label: 'General Ledger', icon: FileText },
        { 
          id: 'trial-balance', 
          label: 'Trial Balance', 
          icon: Scale, 
          badge: quality.trialBalanceBalanced ? 'Balanced' : 'Diff',
          badgeColor: quality.trialBalanceBalanced ? 'emerald' : 'rose'
        },
      ],
    },
    {
      title: 'BUDGETS & FORECASTS',
      items: [
        { id: 'annual-budget', label: 'Annual Budget', icon: PieChart },
        { id: 'budget-vs-actual', label: 'Budget vs Actual', icon: BarChart3 },
        { id: 'forecast', label: '3-Year Forecast (2026-29)', icon: TrendingUp },
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
      title: 'SYSTEM ADMINISTRATION',
      items: [
        { id: 'audit-log', label: 'Audit Trail', icon: History },
        { id: 'users', label: 'Users & Staff', icon: Users },
        { id: 'roles-permissions', label: 'Roles & Permissions', icon: Key },
        { id: 'excel-import', label: 'Excel Data Import', icon: UploadCloud },
        { id: 'settings', label: 'System Settings', icon: Settings },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Navigation Content */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 custom-scrollbar">
          {sections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              <p className="px-3 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                {section.title}
              </p>
              <div className="space-y-0.5 mt-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentModule === item.id;

                  const badgeBgMap = {
                    emerald: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
                    rose: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
                    amber: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
                    blue: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
                  };

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onNavigate(item.id);
                        if (window.innerWidth < 1024) onClose();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group cursor-pointer ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-400'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.badge && (
                        <span
                          className={`text-[9px] font-semibold font-mono px-1.5 py-0.2 rounded-full leading-tight shrink-0 ${
                            isActive ? 'bg-white/20 text-white' : badgeBgMap[item.badgeColor || 'emerald']
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

        {/* Bottom Facility Card */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-[11px]">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="font-semibold text-slate-300">FabLab Rwanda Facility</span>
              <span className="font-mono text-emerald-400 text-[10px]">2026 Fiscal</span>
            </div>
            <p className="text-slate-400 text-[10px] truncate">
              Shared Budget: 53.2M RWF
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
