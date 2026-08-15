import React, { useState } from 'react';
import { 
  ArrowUpRight, 
  Plus, 
  Search, 
  FileSpreadsheet, 
  DollarSign, 
  Receipt, 
  Building2, 
  Briefcase,
  CheckCircle2,
  Download
} from 'lucide-react';
import { SearchFilterBar } from '../common/SearchFilterBar';
import { Badge, StatusBadge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { storageService } from '../../services/storageService';
import { FinancialCalculator } from '../../services/calculationService';
import { ExportService } from '../../services/exportService';
import { IncomeTransaction, PaymentMethod } from '../../types/financial';

export const IncomeView: React.FC = () => {
  const state = storageService.getState();
  const incomeTransactions = state.incomeTransactions;
  const accounts = state.accounts.filter(
    (a) => a.type === 'Revenue' || a.type === 'Other Income'
  );
  const organizations = state.organizations;

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [customer, setCustomer] = useState('');
  const [description, setDescription] = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [amount, setAmount] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Bank Transfer');
  const [project, setProject] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [attachmentName, setAttachmentName] = useState('');

  const taxAmount = Math.round((amount * taxRate) / 100);
  const totalWithTax = amount + taxAmount;

  const filteredIncome = incomeTransactions.filter((i) => {
    const matchesSearch =
      i.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.incomeNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (i.project && i.project.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = categoryFilter === 'all' || i.accountName === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const totalIncomeAmount = incomeTransactions.reduce((sum, i) => sum + i.totalWithTax, 0);

  const handleCreateIncome = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      alert('Please enter a valid revenue amount.');
      return;
    }

    const selectedAcc = accounts.find((a) => a.id === accountId);

    const newIncome: Omit<IncomeTransaction, 'id' | 'incomeNumber' | 'createdAt' | 'updatedAt' | 'totalWithTax'> = {
      date,
      customer,
      description,
      accountId,
      accountCode: selectedAcc?.code || '4000',
      accountName: selectedAcc?.name || 'Fabrication & 3D Prototyping Services',
      amount,
      tax: taxAmount,
      paymentMethod,
      project: project || undefined,
      supportingDocName: attachmentName || undefined,
      notes,
      status: 'Approved',
      createdBy: state.currentUser.name,
      approvedBy: state.currentUser.name,
    };

    storageService.addIncomeTransaction(newIncome);
    setShowAddModal(false);
    resetForm();
  };

  const resetForm = () => {
    setCustomer('');
    setDescription('');
    setAmount(0);
    setTaxRate(0);
    setProject('');
    setNotes('');
    setAttachmentName('');
  };

  const handleExportExcel = () => {
    const headers = [
      'Receipt #',
      'Date',
      'Customer / Client',
      'Description',
      'Revenue Stream',
      'Subtotal (RWF)',
      'Tax (RWF)',
      'Total (RWF)',
      'Payment Method',
      'Project',
      'Status',
    ];

    const rows = filteredIncome.map((i) => [
      i.incomeNumber,
      i.date,
      i.customer,
      i.description,
      i.accountName,
      i.amount,
      i.tax,
      i.totalWithTax,
      i.paymentMethod,
      i.project || '-',
      i.status,
    ]);

    ExportService.exportToExcel('Income & Revenues Register', 'FabLab_Income', headers, rows, [
      { label: 'Total Filtered Income', value: FinancialCalculator.formatRWF(totalIncomeAmount) },
    ]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Income & Revenues Register</h2>
            <Badge variant="success">Cash Inflow Synced</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Prototyping fees, fabrication runs, equipment hire, training programs, donor grants, and resident cost-sharing recoveries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record Revenue Receipt</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <p className="text-xs text-slate-500 font-semibold">Total Revenue Inflows</p>
          <p className="text-xl font-bold text-emerald-700 font-mono mt-1">
            {FinancialCalculator.formatRWF(totalIncomeAmount)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">{incomeTransactions.length} recorded receipts</p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <p className="text-xs text-slate-500 font-semibold">Cost-Sharing Recoveries</p>
          <p className="text-xl font-bold text-slate-900 font-mono mt-1">
            {FinancialCalculator.formatRWF(
              incomeTransactions
                .filter((i) => i.accountCode === '4020' || i.customer.includes('Contribution'))
                .reduce((sum, i) => sum + i.totalWithTax, 0)
            )}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Resident facility cost-share</p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <p className="text-xs text-slate-500 font-semibold">Commercial Fabrication</p>
          <p className="text-xl font-bold text-slate-900 font-mono mt-1">
            {FinancialCalculator.formatRWF(
              incomeTransactions
                .filter((i) => i.accountCode === '4000')
                .reduce((sum, i) => sum + i.totalWithTax, 0)
            )}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">3D printing & CNC contracts</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search customer, project, receipt number, revenue stream..."
        filters={[
          {
            label: 'Revenue Account',
            value: categoryFilter,
            onChange: setCategoryFilter,
            options: [
              { label: 'All Accounts', value: 'all' },
              ...accounts.map((a) => ({ label: a.name, value: a.name })),
            ],
          },
        ]}
        onExportExcel={handleExportExcel}
      />

      {/* Income Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Receipt #</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Client / Payer</th>
                <th className="py-3.5 px-4">Description</th>
                <th className="py-3.5 px-4">Revenue Stream</th>
                <th className="py-3.5 px-4">Project / Memo</th>
                <th className="py-3.5 px-4 text-right">Subtotal</th>
                <th className="py-3.5 px-4 text-right">Total (RWF)</th>
                <th className="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredIncome.map((i) => (
                <tr key={i.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{i.incomeNumber}</td>
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{i.date}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{i.customer}</td>
                  <td className="py-3 px-4 text-slate-700 max-w-xs truncate">{i.description}</td>
                  <td className="py-3 px-4">
                    <span className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                      {i.accountName}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{i.project || '-'}</td>
                  <td className="py-3 px-4 text-right font-mono text-slate-600">
                    {FinancialCalculator.formatRWF(i.amount)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                    {FinancialCalculator.formatRWF(i.totalWithTax)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <StatusBadge status={i.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Income Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Record Revenue Inflow / Receipt"
          subtitle="Directly posts debit to Cash/Bank and credit to standard revenue accounts."
          maxWidth="2xl"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateIncome}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md"
              >
                Save & Post Receipt
              </button>
            </div>
          }
        >
          <form onSubmit={handleCreateIncome} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Client / Payer *</label>
                <input
                  type="text"
                  required
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  placeholder="e.g. University of Rwanda Prototype Grant"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Receipt Date *</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Description / Memo *</label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Rapid prototyping batch run for medical drone casing"
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Revenue GL Account *</label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.code} - {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Project Code / Assignment</label>
                <input
                  type="text"
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  placeholder="e.g. PRJ-MED-2026"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Amount Received (RWF) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 text-xs bg-white border border-slate-300 rounded-lg font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Payment Channel *</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full p-2 text-xs bg-white border border-slate-300 rounded-lg"
                >
                  <option value="Bank Transfer">Bank Transfer (Bank of Kigali)</option>
                  <option value="Momo / MoMoPay">MTN MoMo Corporate</option>
                  <option value="Cash">Cash Receipt</option>
                  <option value="Cheque">Official Cheque</option>
                </select>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
