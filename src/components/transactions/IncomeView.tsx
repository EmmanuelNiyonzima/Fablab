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
  Download,
  UploadCloud,
  Eye,
  TrendingUp,
  Filter,
  CreditCard,
  Layers
} from 'lucide-react';
import { SearchFilterBar } from '../common/SearchFilterBar';
import { Badge, StatusBadge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { storageService } from '../../services/storageService';
import { FinancialCalculator } from '../../services/calculationService';
import { ExportService } from '../../services/exportService';
import { SecurityScope } from '../../utils/securityScope';
import { IncomeTransaction, PaymentMethod } from '../../types/financial';

interface IncomeViewProps {
  onNavigate?: (module: string) => void;
}

export const IncomeView: React.FC<IncomeViewProps> = ({ onNavigate }) => {
  const state = storageService.getState();
  const currentUser = state.currentUser;
  const isAdmin = SecurityScope.isSuperAdmin(currentUser);
  const userOrg = SecurityScope.getUserOrg(currentUser, state.organizations);

  const accounts = state.accounts.filter(
    (a) => a.type === 'Revenue' || a.type === 'Other Income'
  );
  const organizations = state.organizations;

  const accessibleIncome = SecurityScope.filterIncomeTransactions(state.incomeTransactions, currentUser);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [orgFilter, setOrgFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<IncomeTransaction | null>(null);

  // Form State
  const [customer, setCustomer] = useState('');
  const [description, setDescription] = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [selectedOrgId, setSelectedOrgId] = useState(userOrg?.id || 'org-fablab');
  const [amount, setAmount] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Bank Transfer');
  const [project, setProject] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [attachmentName, setAttachmentName] = useState('');

  const taxAmount = Math.round((amount * taxRate) / 100);
  const totalWithTax = amount + taxAmount;

  const filteredIncome = accessibleIncome.filter((i) => {
    const matchesSearch =
      i.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.incomeNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (i.project && i.project.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = categoryFilter === 'all' || i.accountName === categoryFilter;
    const matchesOrg = orgFilter === 'all' || i.organizationId === orgFilter;

    return matchesSearch && matchesCategory && matchesOrg;
  });

  const totalIncomeAmount = filteredIncome.reduce((sum, i) => sum + i.totalWithTax, 0);

  const handleCreateIncome = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      alert('Please enter a valid revenue amount.');
      return;
    }

    const selectedAcc = accounts.find((a) => a.id === accountId);
    const assignedOrg = organizations.find((o) => o.id === selectedOrgId);

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
      organizationId: assignedOrg?.id,
      project: project || (assignedOrg ? `${assignedOrg.name} Revenue Stream` : undefined),
      supportingDocName: attachmentName || undefined,
      notes,
      status: 'Posted',
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

    ExportService.exportToExcel('Revenue & Income Register', 'SEMS_Revenue_Register', headers, rows, [
      { label: 'Total Filtered Revenue', value: FinancialCalculator.formatRWF(totalIncomeAmount) },
    ]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200/60 font-bold">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Record Revenue & Inflows</h2>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-block mt-0.5">
                {userOrg ? `${userOrg.name} Revenue Stream` : 'Consolidated Facility Inflows'}
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2 max-w-3xl">
            Record client receipts, prototyping invoices, training fees, grant revenues, and cafe sales. Every receipt is automatically posted to the double-entry general ledger.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('import-revenue')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              <UploadCloud className="w-4 h-4 text-emerald-600" />
              <span>Import Dataset (Excel)</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record Revenue Receipt</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <p className="text-xs text-slate-500 font-semibold">Total Revenue Recorded</p>
          <p className="text-xl font-bold text-emerald-700 font-mono mt-1">
            {FinancialCalculator.formatRWF(totalIncomeAmount)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">{filteredIncome.length} recorded receipts in ledger</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <p className="text-xs text-slate-500 font-semibold">Commercial Fabrication & 3D Prototyping</p>
          <p className="text-xl font-bold text-slate-900 font-mono mt-1">
            {FinancialCalculator.formatRWF(
              filteredIncome
                .filter((i) => i.accountCode === '4000')
                .reduce((sum, i) => sum + i.totalWithTax, 0)
            )}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Rapid manufacturing contracts</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <p className="text-xs text-slate-500 font-semibold">Training, Grants & Incubation</p>
          <p className="text-xl font-bold text-slate-900 font-mono mt-1">
            {FinancialCalculator.formatRWF(
              filteredIncome
                .filter((i) => ['4010', '4030', '4050'].includes(i.accountCode))
                .reduce((sum, i) => sum + i.totalWithTax, 0)
            )}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Workshops, cohort fees & donor funds</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search client, project code, receipt number, description..."
        filters={[
          {
            label: 'Revenue Account',
            value: categoryFilter,
            onChange: setCategoryFilter,
            options: [
              { label: 'All Revenue Streams', value: 'all' },
              ...accounts.map((a) => ({ label: a.name, value: a.name })),
            ],
          },
          ...(isAdmin ? [{
            label: 'Organization',
            value: orgFilter,
            onChange: setOrgFilter,
            options: [
              { label: 'All Organizations', value: 'all' },
              ...organizations.map((o) => ({ label: o.name, value: o.id })),
            ],
          }] : []),
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
                <th className="py-3.5 px-4">Payment Method</th>
                <th className="py-3.5 px-4 text-right">Total (RWF)</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredIncome.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <TrendingUp className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-semibold text-slate-600">No revenue records found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Click "+ Record Revenue Receipt" or import an Excel spreadsheet.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredIncome.map((i) => (
                  <tr key={i.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{i.incomeNumber}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{i.date}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{i.customer}</td>
                    <td className="py-3 px-4 text-slate-700 max-w-xs truncate">{i.description}</td>
                    <td className="py-3 px-4">
                      <span className="text-[11px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                        {i.accountName}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-[11px]">
                      {i.paymentMethod}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                      {FinancialCalculator.formatRWF(i.totalWithTax)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge status={i.status} />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedReceipt(i)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
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
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateIncome}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs cursor-pointer"
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
                <label className="text-xs font-semibold text-slate-700">Crediting Department</label>
                <select
                  value={selectedOrgId}
                  onChange={(e) => setSelectedOrgId(e.target.value)}
                  disabled={!isAdmin}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white disabled:opacity-75"
                >
                  {organizations.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.code})
                    </option>
                  ))}
                </select>
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
                  className="w-full p-2 text-xs bg-white border border-slate-300 rounded-lg font-mono font-bold text-emerald-800"
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
                  <option value="Credit Card">Credit Card</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Project Code / Reference (Optional)</label>
              <input
                type="text"
                value={project}
                onChange={(e) => setProject(e.target.value)}
                placeholder="e.g. PRJ-MED-2026 / INV-2026-089"
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-mono"
              />
            </div>
          </form>
        </Modal>
      )}

      {/* Receipt Detail Modal */}
      {selectedReceipt && (
        <Modal
          isOpen={!!selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
          title={`Revenue Receipt: ${selectedReceipt.incomeNumber}`}
          subtitle={`Recorded on ${selectedReceipt.date} by ${selectedReceipt.createdBy}`}
          maxWidth="md"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-800 block">Total Inflow Amount</span>
                <span className="text-xl font-bold font-mono text-emerald-950">
                  {FinancialCalculator.formatRWF(selectedReceipt.totalWithTax)}
                </span>
              </div>
              <StatusBadge status={selectedReceipt.status} />
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 text-[10px] block">Client / Customer</span>
                <span className="font-bold text-slate-900">{selectedReceipt.customer}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Payment Method</span>
                <span className="font-bold text-slate-900">{selectedReceipt.paymentMethod}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Revenue Stream</span>
                <span className="font-bold text-slate-900">{selectedReceipt.accountName}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Project / Reference</span>
                <span className="font-bold font-mono text-slate-900">{selectedReceipt.project || 'General'}</span>
              </div>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl">
              <span className="text-slate-400 text-[10px] block mb-1">Narration / Description</span>
              <p className="text-slate-800">{selectedReceipt.description}</p>
            </div>

            {selectedReceipt.supportingDocName && (
              <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-600">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span className="text-[11px] font-mono truncate">{selectedReceipt.supportingDocName}</span>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

