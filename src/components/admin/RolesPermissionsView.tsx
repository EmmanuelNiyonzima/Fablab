import React from 'react';
import { 
  Key, 
  ShieldCheck, 
  Check, 
  X, 
  Lock, 
  FileText, 
  HelpCircle 
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { UserRole } from '../../types/financial';

export const RolesPermissionsView: React.FC = () => {
  const roles: { role: UserRole; title: string; description: string }[] = [
    { role: 'ADMIN', title: 'System Administrator', description: 'Unrestricted control over system configuration, user accounts, and database resets.' },
    { role: 'FINANCE_MANAGER', title: 'Finance & Admin Manager', description: 'Full authority to approve expenses, post journal entries, adjust policies, and sign reports.' },
    { role: 'FINANCIAL_ANALYST', title: 'FP&A Analyst', description: 'Access to budget forecasting, escalation modeling, P&L reporting, and variance dashboards.' },
    { role: 'ACCOUNTANT', title: 'Senior Accountant', description: 'Data entry for operational expenses, revenues, partner contributions, and double-entry journals.' },
    { role: 'VIEWER', title: 'Board / Executive Viewer', description: 'Read-only access to executive dashboards, financial statements, and cost-share schedules.' },
    { role: 'AUDITOR', title: 'External / Internal Auditor', description: 'Access to system audit logs, trial balance reconciliations, and test suite verifications.' },
  ];

  interface PermissionMatrixRow {
    module: string;
    action: string;
    permissions: Record<UserRole, boolean>;
  }

  const matrix: PermissionMatrixRow[] = [
    {
      module: 'Shared Expenses',
      action: 'Create & Modify Shared Expenses',
      permissions: { ADMIN: true, FINANCE_MANAGER: true, FINANCIAL_ANALYST: true, ACCOUNTANT: true, VIEWER: false, AUDITOR: false },
    },
    {
      module: 'Shared Expenses',
      action: 'Approve & Lock Allocations',
      permissions: { ADMIN: true, FINANCE_MANAGER: true, FINANCIAL_ANALYST: false, ACCOUNTANT: false, VIEWER: false, AUDITOR: false },
    },
    {
      module: 'Allocation Policies',
      action: 'Adjust Org Proportions & Formulas',
      permissions: { ADMIN: true, FINANCE_MANAGER: true, FINANCIAL_ANALYST: true, ACCOUNTANT: false, VIEWER: false, AUDITOR: false },
    },
    {
      module: 'Transactions',
      action: 'Record Operational Expenses & Income',
      permissions: { ADMIN: true, FINANCE_MANAGER: true, FINANCIAL_ANALYST: false, ACCOUNTANT: true, VIEWER: false, AUDITOR: false },
    },
    {
      module: 'Transactions',
      action: 'Approve Disbursement Vouchers',
      permissions: { ADMIN: true, FINANCE_MANAGER: true, FINANCIAL_ANALYST: false, ACCOUNTANT: false, VIEWER: false, AUDITOR: false },
    },
    {
      module: 'Double-Entry Accounting',
      action: 'Post General Journal Entries',
      permissions: { ADMIN: true, FINANCE_MANAGER: true, FINANCIAL_ANALYST: false, ACCOUNTANT: true, VIEWER: false, AUDITOR: false },
    },
    {
      module: 'Double-Entry Accounting',
      action: 'Modify Chart of Accounts (COA)',
      permissions: { ADMIN: true, FINANCE_MANAGER: true, FINANCIAL_ANALYST: false, ACCOUNTANT: false, VIEWER: false, AUDITOR: false },
    },
    {
      module: 'Budgets & Forecasts',
      action: 'Edit Annual Budgets & Escalation Assumptions',
      permissions: { ADMIN: true, FINANCE_MANAGER: true, FINANCIAL_ANALYST: true, ACCOUNTANT: false, VIEWER: false, AUDITOR: false },
    },
    {
      module: 'Financial Statements',
      action: 'View P&L, Cash Flow & Board Summaries',
      permissions: { ADMIN: true, FINANCE_MANAGER: true, FINANCIAL_ANALYST: true, ACCOUNTANT: true, VIEWER: true, AUDITOR: true },
    },
    {
      module: 'Administration',
      action: 'View Immutable Audit Trail',
      permissions: { ADMIN: true, FINANCE_MANAGER: true, FINANCIAL_ANALYST: false, ACCOUNTANT: false, VIEWER: false, AUDITOR: true },
    },
    {
      module: 'Administration',
      action: 'Manage User Accounts & Settings',
      permissions: { ADMIN: true, FINANCE_MANAGER: false, FINANCIAL_ANALYST: false, ACCOUNTANT: false, VIEWER: false, AUDITOR: false },
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Roles & Access Control Matrix</h2>
            <Badge variant="purple">Role-Based Access (RBAC)</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Standard segregation of duties (SoD) enforcing approval workflows and data governance.
          </p>
        </div>
      </div>

      {/* Roles Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((r) => (
          <div key={r.role} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900">{r.title}</span>
              <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                {r.role}
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">{r.description}</p>
          </div>
        ))}
      </div>

      {/* Permission Matrix Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Fine-Grained Capability & Authorization Matrix
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Functional Module</th>
                <th className="py-3.5 px-4">Permission / Workflow Capability</th>
                <th className="py-3.5 px-3 text-center">ADMIN</th>
                <th className="py-3.5 px-3 text-center">FIN_MGR</th>
                <th className="py-3.5 px-3 text-center">ANALYST</th>
                <th className="py-3.5 px-3 text-center">ACCOUNTANT</th>
                <th className="py-3.5 px-3 text-center">VIEWER</th>
                <th className="py-3.5 px-3 text-center">AUDITOR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {matrix.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">{row.module}</td>
                  <td className="py-3 px-4 text-slate-700">{row.action}</td>
                  {(['ADMIN', 'FINANCE_MANAGER', 'FINANCIAL_ANALYST', 'ACCOUNTANT', 'VIEWER', 'AUDITOR'] as UserRole[]).map((r) => {
                    const allowed = row.permissions[r];
                    return (
                      <td key={r} className="py-3 px-3 text-center">
                        {allowed ? (
                          <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                            <X className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
