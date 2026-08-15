import React, { useState } from 'react';
import { 
  Building2, 
  Search, 
  ShieldCheck, 
  UserCheck, 
  Bell, 
  Menu, 
  ChevronDown, 
  LogOut,
  Sparkles,
  HelpCircle,
  RotateCcw
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { UserRole } from '../../types/financial';
import { Badge } from '../common/Badge';

interface NavbarProps {
  onToggleSidebar: () => void;
  onOpenSearch: () => void;
  onOpenTestSuite: () => void;
  onLogout: () => void;
  onNavigate: (module: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  onOpenSearch,
  onOpenTestSuite,
  onLogout,
  onNavigate,
}) => {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const state = storageService.getState();
  const currentUser = state.currentUser;

  const roles: { role: UserRole; name: string; title: string }[] = [
    { role: 'ADMIN', name: 'Emmanuel Niyonzima', title: 'System Administrator & Lead Architect' },
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
    setShowRoleMenu(false);
  };

  const handleReset = () => {
    if (window.confirm('Reset database to official FabLab Rwanda 2026 baseline dataset?')) {
      storageService.resetToFactoryDefaults();
      window.location.reload();
    }
  };

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
      <div className="px-4 lg:px-6 h-16 flex items-center justify-between gap-3">
        {/* Left: Mobile Toggle & Brand */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div 
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center shadow-xs group-hover:bg-emerald-500 transition-colors">
              <span className="font-black text-white text-lg tracking-tighter">FL</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-white tracking-tight">FabLab Rwanda</span>
                <span className="text-[10px] uppercase font-bold bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-500/30">
                  FMS
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Financial Management System
              </p>
            </div>
          </div>
        </div>

        {/* Center: Global Search shortcut */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
          <button
            type="button"
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-3.5 py-1.5 text-xs bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-slate-400 hover:text-slate-200 transition-colors cursor-pointer shadow-inner"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-emerald-400" />
              <span>Search expenses, accounts, organizations, journals...</span>
            </div>
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-slate-700 text-slate-300 rounded border border-slate-600">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Right: Actions, Role Switcher, Profile */}
        <div className="flex items-center gap-2">
          {/* Integrity Test Suite button */}
          <button
            type="button"
            onClick={onOpenTestSuite}
            title="Run 12 Mandatory Calculation Tests"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-lg transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="hidden xl:inline">Financial Integrity</span>
            <span className="px-1.5 py-0.2 text-[10px] bg-emerald-500 text-slate-900 rounded font-bold">
              12/12
            </span>
          </button>

          {/* Quick Baseline Reset */}
          <button
            type="button"
            onClick={handleReset}
            title="Reset to 2026 Baseline Seed Data"
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Role Switcher Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-lg text-xs transition-colors cursor-pointer"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <div className="text-left hidden sm:block">
                <p className="font-semibold text-white leading-tight">{currentUser.name}</p>
                <p className="text-[10px] text-emerald-400 font-mono font-medium">{currentUser.role}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 text-slate-800 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Role & Permission Switcher
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Test system workflows across different user roles.
                  </p>
                </div>
                <div className="py-1">
                  {roles.map((r) => (
                    <button
                      key={r.role}
                      type="button"
                      onClick={() => handleRoleSelect(r)}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-emerald-50 flex items-start justify-between gap-2 transition-colors ${
                        currentUser.role === r.role ? 'bg-emerald-50/80 font-bold text-emerald-900' : 'text-slate-700'
                      }`}
                    >
                      <div>
                        <p className="font-semibold">{r.name}</p>
                        <p className="text-[10px] text-slate-500">{r.title}</p>
                      </div>
                      <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        {r.role}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="px-3 pt-2 border-t border-slate-100 mt-1">
                  <button
                    type="button"
                    onClick={onLogout}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition-colors font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
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
