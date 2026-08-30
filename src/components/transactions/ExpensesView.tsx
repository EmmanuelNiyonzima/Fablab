import React, { useState } from 'react';
import { 
  ArrowDownLeft, 
  Plus, 
  Search, 
  Filter, 
  FileSpreadsheet, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Paperclip, 
  Building2, 
  Layers, 
  Download,
  Calendar,
  DollarSign,
  Tag,
  ShieldCheck
} from 'lucide-react';
import { SearchFilterBar } from '../common/SearchFilterBar';
import { Badge, StatusBadge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { storageService } from '../../services/storageService';
import { FinancialCalculator } from '../../services/calculationService';
import { ExportService } from '../../services/exportService';
import { ExpenseTransaction, TransactionStatus, PaymentMethod } from '../../types/financial';

export const ExpensesView: React.FC = () => {
  const state = storageService.getState();
  const expenses = state.expenseTransactions;
  const accounts = state.accounts.filter(
    (a) => a.type === 'Administration Expense' || a.type === 'Cost of Sales' || a.type === 'Other Expense'
  );
  const organizations = state.organizations;

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseTransaction | null>(null);

  // Form State
  const [vendor, setVendor] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Cleaning Services');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [amount, setAmount] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(18);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Bank Transfer');
  const [isShared, setIsShared] = useState(false);
  const [organizationId, setOrganizationId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [attachmentName, setAttachmentName] = useState('');

  const taxAmount = Math.round((amount * taxRate) / 100);
  const totalWithTax = amount + taxAmount;

  const filteredExpenses = expenses.filter((e) => {
    const matchesSearch =
      e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.expenseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.accountCode.includes(searchQuery);

    const matchesCategory = categoryFilter === 'all' || e.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.totalWithTax, 0);
  const approvedExpenseAmount = expenses
    .filter((e) => e.status === 'Approved' || e.status === 'Posted')
    .reduce((sum, e) => sum + e.totalWithTax, 0);

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      alert('Please enter a valid expense amount.');
      return;
    }

    const selectedAcc = accounts.find((a) => a.id === accountId);

    const newExpense: Omit<ExpenseTransaction, 'id' | 'expenseNumber' | 'createdAt' | 'updatedAt' | 'totalWithTax'> = {
      date,
      vendor,
      description,
      category,
      accountId,
      accountCode: selectedAcc?.code || '6000',
      accountName: selectedAcc?.name || category,
      amount,
      tax: taxAmount,
      paymentMethod,
      isShared,
      organizationId: isShared ? undefined : organizationId || undefined,
      supportingDocName: attachmentName || undefined,
      notes,
      status: 'Approved',
      createdBy: state.currentUser.name,
      approvedBy: state.currentUser.name,
    };

    storageService.addExpenseTransaction(newExpense);
    setShowAddModal(false);
    resetForm();
  };

  const resetForm = () => {
    setVendor('');
    setDescription('');
    setCategory('Cleaning Services');
    setAmount(0);
    setTaxRate(18);
    setNotes('');
    setAttachmentName('');
    setIsShared(false);
  };

  const handleApprove = (id: string) => {
    storageService.approveExpense(id);
  };

  const handleExportExcel = () => {
    const headers = [
      'Expense #',
      'Date',
      'Vendor / Payee',
      'Description',
      'Category',
      'Account Code',
      'Subtotal (RWF)',
      'Tax (RWF)',
      'Total with Tax (RWF)',
      'Payment Method',
      'Shared?',
      'Status',
    ];

    const rows = filteredExpenses.map((e) => [
      e.expenseNumber,
      e.date,
      e.vendor,
      e.description,
      e.category,
      e.accountCode,
      e.amount,
      e.tax,
      e.totalWithTax,
      e.paymentMethod,
      e.isShared ? 'Yes' : 'No',
      e.status,
    ]);

    ExportService.exportToExcel('Expenses Register', 'SEMS_Expenses_Register', headers, rows, [
      { label: 'Total Filtered Expenses', value: FinancialCalculator.formatRWF(totalExpenseAmount) },
      { label: 'Total Approved / Posted', value: FinancialCalculator.formatRWF(approvedExpenseAmount) },
    ]);
  };

  const categories = Array.from(new Set(expenses.map((e) => e.category)));

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Expenses Register & Disbursements</h2>
            <Badge variant="blue">General Ledger Integrated</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Official operational disbursements, vendor payments, shared facility operational costs, and VAT records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record New Expense</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <p className="text-xs text-slate-500 font-semibold">Total Expenses (YTD)</p>
          <p className="text-xl font-bold text-slate-900 font-mono mt-1">
            {FinancialCalculator.formatRWF(totalExpenseAmount)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">{expenses.length} total entries</p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <p className="text-xs text-emerald-700 font-semibold">Approved & Posted</p>
          <p className="text-xl font-bold text-emerald-700 font-mono mt-1">
            {FinancialCalculator.formatRWF(approvedExpenseAmount)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Reflected in General Ledger</p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <p className="text-xs text-slate-500 font-semibold">Average Expense Ticket</p>
          <p className="text-xl font-bold text-slate-900 font-mono mt-1">
            {FinancialCalculator.formatRWF(expenses.length ? totalExpenseAmount / expenses.length : 0)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Per disbursement voucher</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search vendor, description, voucher number, account code..."
        filters={[
          {
            label: 'Category',
            value: categoryFilter,
            onChange: setCategoryFilter,
            options: [
              { label: 'All Categories', value: 'all' },
              ...categories.map((c) => ({ label: c, value: c })),
            ],
          },
          {
            label: 'Status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: 'All Statuses', value: 'all' },
              { label: 'Approved', value: 'Approved' },
              { label: 'Submitted', value: 'Submitted' },
              { label: 'Draft', value: 'Draft' },
            ],
          },
        ]}
        onExportExcel={handleExportExcel}
      />

      {/* Expenses Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Voucher / Code</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Vendor / Payee</th>
                <th className="py-3.5 px-4">Description</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4 text-right">Subtotal</th>
                <th className="py-3.5 px-4 text-right">Tax (VAT)</th>
                <th className="py-3.5 px-4 text-right">Total (RWF)</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredExpenses.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{e.expenseNumber}</td>
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{e.date}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{e.vendor}</td>
                  <td className="py-3 px-4 text-slate-700 max-w-xs truncate">{e.description}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                      {e.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-600">
                    {FinancialCalculator.formatRWF(e.amount)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-500">
                    {FinancialCalculator.formatRWF(e.tax)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                    {FinancialCalculator.formatRWF(e.totalWithTax)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <StatusBadge status={e.status} />
                  </td>
                  <td className="py-3 px-4 text-center">
                    {e.status === 'Submitted' ? (
                      <button
                        type="button"
                        onClick={() => handleApprove(e.id)}
                        className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                      >
                        Approve
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-mono">Posted</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Expense Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Record Operational Expense / Disbursement"
          subtitle="Captures vendor payable, VAT breakdown, GL account assignment, and journal creation."
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
                onClick={handleCreateExpense}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md"
              >
                Save & Post Voucher
              </button>
            </div>
          }
        >
          <form onSubmit={handleCreateExpense} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Vendor / Payee *</label>
                <input
                  type="text"
                  required
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  placeholder="e.g. EUCL / REG Rwanda"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Disbursement Date *</label>
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
                placeholder="e.g. Monthly electricity power token consumption"
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Expense Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                >
                  <option value="Electricity">Electricity (EUCL)</option>
                  <option value="WASAC">Water Utility (WASAC)</option>
                  <option value="Cleaning Services">Cleaning & Janitorial</option>
                  <option value="Security Services">Security & Surveillance</option>
                  <option value="Internet / Fiber">Internet & Broadband</option>
                  <option value="Drinking Water">Drinking Mineral Water</option>
                  <option value="Consumables & PPE">Consumables & PPE</option>
                  <option value="Equipment Maintenance">Equipment Maintenance</option>
                  <option value="Stationery">Stationery & Office Supplies</option>
                  <option value="Facility Rent">Facility Rent</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">GL Account *</label>
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
            </div>

            <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Subtotal Amount (RWF) *</label>
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
                <label className="text-xs font-semibold text-slate-700">VAT Rate (%)</label>
                <select
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 text-xs bg-white border border-slate-300 rounded-lg"
                >
                  <option value="18">18% (Standard VAT)</option>
                  <option value="0">0% (Exempt / Withheld)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Total Payable</label>
                <p className="p-2 text-xs font-bold text-emerald-700 font-mono bg-white border border-emerald-300 rounded-lg">
                  {FinancialCalculator.formatRWF(totalWithTax)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Payment Method *</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                >
                  <option value="Bank Transfer">Bank Transfer (Bank of Kigali)</option>
                  <option value="Momo / MoMoPay">MTN MoMo Corporate</option>
                  <option value="Cash">Petty Cash</option>
                  <option value="Cheque">Official Bank Cheque</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Attachment / Receipt Ref</label>
                <input
                  type="text"
                  value={attachmentName}
                  onChange={(e) => setAttachmentName(e.target.value)}
                  placeholder="e.g. EUCL-Invoice-2026-08.pdf"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-mono"
                />
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
