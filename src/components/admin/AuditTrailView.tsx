import React, { useState } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  FileSpreadsheet, 
  ShieldCheck, 
  Clock, 
  User,
  CheckCircle2
} from 'lucide-react';
import { SearchFilterBar } from '../common/SearchFilterBar';
import { Badge } from '../common/Badge';
import { storageService } from '../../services/storageService';
import { ExportService } from '../../services/exportService';
import { AuditLog } from '../../types/financial';

export const AuditTrailView: React.FC = () => {
  const state = storageService.getState();
  const logs = state.auditLogs;

  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');

  const filteredLogs = logs.filter((l) => {
    const matchesSearch =
      l.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.module.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.details && l.details.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesModule = moduleFilter === 'all' || l.module === moduleFilter;

    return matchesSearch && matchesModule;
  });

  const handleExportExcel = () => {
    const headers = [
      'Timestamp',
      'User Name',
      'Role',
      'Action',
      'System Module',
      'Record Reference',
      'Audit Narrative',
    ];

    const rows = filteredLogs.map((l) => [
      l.timestamp,
      l.userName,
      l.userRole,
      l.action,
      l.module,
      l.recordId,
      l.details || '-',
    ]);

    ExportService.exportToExcel('System Audit Trail', 'FabLab_AuditTrail', headers, rows);
  };

  const modules = Array.from(new Set(logs.map((l) => l.module)));

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">System Audit Trail & Compliance Log</h2>
            <Badge variant="neutral">Immutable Chronological Record</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tamper-evident activity logs capturing user actions, financial approvals, policy adjustments, and data modifications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-slate-600" />
            <span>Export Audit Log</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search user, action, module, record ID..."
        filters={[
          {
            label: 'Module',
            value: moduleFilter,
            onChange: setModuleFilter,
            options: [
              { label: 'All Modules', value: 'all' },
              ...modules.map((m) => ({ label: m, value: m })),
            ],
          },
        ]}
        onExportExcel={handleExportExcel}
      />

      {/* Audit Logs Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 w-44">Timestamp</th>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Module</th>
                <th className="py-3.5 px-4">Reference</th>
                <th className="py-3.5 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredLogs.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                    {l.timestamp}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">{l.userName}</td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-bold">
                      {l.userRole}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-900">{l.action}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                      {l.module}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{l.recordId}</td>
                  <td className="py-3 px-4 text-slate-600 max-w-sm truncate">{l.details || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
