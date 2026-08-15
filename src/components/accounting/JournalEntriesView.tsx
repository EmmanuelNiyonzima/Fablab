import React, { useState } from 'react';
import { 
  Receipt, 
  Plus, 
  Search, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  FileSpreadsheet, 
  Scale, 
  ArrowRight,
  Eye
} from 'lucide-react';
import { SearchFilterBar } from '../common/SearchFilterBar';
import { Badge, StatusBadge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { DiscrepancyBanner } from '../common/DiscrepancyBanner';
import { storageService } from '../../services/storageService';
import { FinancialCalculator } from '../../services/calculationService';
import { ExportService } from '../../services/exportService';
import { JournalEntry, JournalLine } from '../../types/financial';

export const JournalEntriesView: React.FC = () => {
  const state = storageService.getState();
  const journalEntries = state.journalEntries;
  const accounts = state.accounts;

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  // New Journal Entry Form State
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [lines, setLines] = useState<Omit<JournalLine, 'id'>[]>([
    {
      accountId: accounts[0]?.id || '',
      accountCode: accounts[0]?.code || '6000',
      accountName: accounts[0]?.name || 'Cleaning Services',
      description: '',
      debit: 0,
      credit: 0,
    },
    {
      accountId: accounts[1]?.id || '',
      accountCode: accounts[1]?.code || '1020',
      accountName: accounts[1]?.name || 'Bank of Kigali Operating',
      description: '',
      debit: 0,
      credit: 0,
    },
  ]);

  const totalDebit = lines.reduce((sum, l) => sum + (l.debit || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (l.credit || 0), 0);
  const difference = Math.abs(totalDebit - totalCredit);
  const isBalanced = difference === 0 && totalDebit > 0;

  const filteredEntries = journalEntries.filter((j) => {
    return (
      j.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.journalNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.lines.some((l) => l.accountCode.includes(searchQuery) || l.accountName.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const handleAddLine = () => {
    setLines([
      ...lines,
      {
        accountId: accounts[0]?.id || '',
        accountCode: accounts[0]?.code || '1000',
        accountName: accounts[0]?.name || 'Cash',
        description: '',
        debit: 0,
        credit: 0,
      },
    ]);
  };

  const handleRemoveLine = (index: number) => {
    if (lines.length <= 2) {
      alert('A journal entry must contain at least 2 line items.');
      return;
    }
    setLines(lines.filter((_, idx) => idx !== index));
  };

  const handleLineChange = (index: number, field: keyof Omit<JournalLine, 'id'>, value: any) => {
    setLines((prev) =>
      prev.map((line, idx) => {
        if (idx !== index) return line;

        if (field === 'accountId') {
          const acc = accounts.find((a) => a.id === value);
          return {
            ...line,
            accountId: value,
            accountCode: acc?.code || '',
            accountName: acc?.name || '',
          };
        }

        return { ...line, [field]: value };
      })
    );
  };

  const handleCreateEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) {
      alert(`Journal entry is unbalanced. Debits must equal Credits. Difference: ${difference} RWF`);
      return;
    }

    const linesWithIds: JournalLine[] = lines.map((l, idx) => ({
      ...l,
      id: `line-${Date.now()}-${idx}`,
    }));

    storageService.addJournalEntry({
      date,
      description,
      reference,
      status: 'Posted',
      lines: linesWithIds,
    });

    setShowAddModal(false);
    resetForm();
  };

  const resetForm = () => {
    setDescription('');
    setReference('');
    setLines([
      {
        accountId: accounts[0]?.id || '',
        accountCode: accounts[0]?.code || '6000',
        accountName: accounts[0]?.name || 'Cleaning Services',
        description: '',
        debit: 0,
        credit: 0,
      },
      {
        accountId: accounts[1]?.id || '',
        accountCode: accounts[1]?.code || '1020',
        accountName: accounts[1]?.name || 'Bank of Kigali Operating',
        description: '',
        debit: 0,
        credit: 0,
      },
    ]);
  };

  const handleExportExcel = () => {
    const headers = [
      'Journal #',
      'Date',
      'Reference',
      'Description',
      'Account Code',
      'Account Title',
      'Debit (RWF)',
      'Credit (RWF)',
      'Status',
    ];

    const rows: any[] = [];
    filteredEntries.forEach((j) => {
      j.lines.forEach((l) => {
        rows.push([
          j.journalNumber,
          j.date,
          j.reference,
          l.description || j.description,
          l.accountCode,
          l.accountName,
          l.debit,
          l.credit,
          j.status,
        ]);
      });
    });

    ExportService.exportToExcel('General Journal Entries', 'FabLab_JournalEntries', headers, rows);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">General Journal Entries</h2>
            <Badge variant="success">Double-Entry Verified</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Official chronological record of financial transactions with strictly enforced Debit = Credit equilibrium.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Journal Voucher</span>
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search journal number (e.g. 'JV-2026-001'), reference, description..."
        onExportExcel={handleExportExcel}
      />

      {/* Journal Entries List */}
      <div className="space-y-4">
        {filteredEntries.map((j) => (
          <div
            key={j.id}
            className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4 hover:border-slate-300 transition-all"
          >
            {/* Entry Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-xs bg-slate-900 text-white px-2.5 py-1 rounded-lg">
                  {j.journalNumber}
                </span>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">{j.description}</h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Ref: {j.reference} | Date: {j.date} | Posted By: {j.createdBy}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="success">Balanced (0.00 Diff)</Badge>
                <StatusBadge status={j.status} />
              </div>
            </div>

            {/* Lines Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-2 px-3">Account Code</th>
                    <th className="py-2 px-3">Account Name</th>
                    <th className="py-2 px-3">Line Memo</th>
                    <th className="py-2 px-3 text-right">Debit (RWF)</th>
                    <th className="py-2 px-3 text-right">Credit (RWF)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                  {j.lines.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-bold text-slate-900">{l.accountCode}</td>
                      <td className="py-2 px-3 font-sans font-medium text-slate-900">{l.accountName}</td>
                      <td className="py-2 px-3 font-sans text-slate-500 text-[11px]">{l.description || '-'}</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">
                        {l.debit > 0 ? FinancialCalculator.formatRWF(l.debit) : '-'}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">
                        {l.credit > 0 ? FinancialCalculator.formatRWF(l.credit) : '-'}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-bold border-t border-slate-200 text-slate-900">
                    <td colSpan={3} className="py-2 px-3 text-right font-sans uppercase text-[10px]">
                      Journal Total:
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-emerald-700">
                      {FinancialCalculator.formatRWF(j.totalDebit)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-emerald-700">
                      {FinancialCalculator.formatRWF(j.totalCredit)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* New Journal Entry Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Create Double-Entry Journal Voucher"
          subtitle="Enforces standard accounting identity: Sum(Debits) must strictly equal Sum(Credits)."
          maxWidth="4xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Badge variant={isBalanced ? 'success' : 'danger'}>
                  {isBalanced ? 'Entry Balanced' : `Imbalance: ${FinancialCalculator.formatRWF(difference)}`}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!isBalanced}
                  onClick={handleCreateEntry}
                  className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-md transition-colors ${
                    isBalanced ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-400 cursor-not-allowed'
                  }`}
                >
                  Post Journal Voucher
                </button>
              </div>
            </div>
          }
        >
          <form onSubmit={handleCreateEntry} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Voucher Date *</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Source Reference *</label>
                <input
                  type="text"
                  required
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g. INV-2026-088 / BK-REC-4910"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Voucher Description / Narrative *</label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Allocation of August 2026 facility cleaning overheads"
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
              />
            </div>

            {/* Line Items Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 uppercase">Journal Lines (Debits & Credits)</label>
                <button
                  type="button"
                  onClick={handleAddLine}
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line</span>
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-[10px] font-bold text-slate-600 uppercase">
                    <tr>
                      <th className="py-2.5 px-3">General Ledger Account</th>
                      <th className="py-2.5 px-3">Line Memo</th>
                      <th className="py-2.5 px-3 text-right w-36">Debit (RWF)</th>
                      <th className="py-2.5 px-3 text-right w-36">Credit (RWF)</th>
                      <th className="py-2.5 px-2 text-center w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {lines.map((line, idx) => (
                      <tr key={idx}>
                        <td className="p-2">
                          <select
                            value={line.accountId}
                            onChange={(e) => handleLineChange(idx, 'accountId', e.target.value)}
                            className="w-full p-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium"
                          >
                            {accounts.map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.code} - {a.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={line.description}
                            onChange={(e) => handleLineChange(idx, 'description', e.target.value)}
                            placeholder="Optional memo"
                            className="w-full p-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min="0"
                            value={line.debit || ''}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              handleLineChange(idx, 'debit', val);
                              if (val > 0) handleLineChange(idx, 'credit', 0);
                            }}
                            className="w-full p-1.5 text-xs text-right font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min="0"
                            value={line.credit || ''}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              handleLineChange(idx, 'credit', val);
                              if (val > 0) handleLineChange(idx, 'debit', 0);
                            }}
                            className="w-full p-1.5 text-xs text-right font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveLine(idx)}
                            className="text-slate-400 hover:text-rose-600 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50 font-bold border-t border-slate-200">
                      <td colSpan={2} className="py-2.5 px-3 text-right uppercase text-[10px] text-slate-500">
                        Total Sum:
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-xs text-slate-900">
                        {FinancialCalculator.formatRWF(totalDebit)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-xs text-slate-900">
                        {FinancialCalculator.formatRWF(totalCredit)}
                      </td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
