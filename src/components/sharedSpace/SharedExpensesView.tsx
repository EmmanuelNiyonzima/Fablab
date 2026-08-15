import React, { useState } from 'react';
import { 
  Layers, 
  Plus, 
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  Building2, 
  HelpCircle,
  Eye,
  Sliders,
  DollarSign,
  FileSpreadsheet
} from 'lucide-react';
import { SearchFilterBar } from '../common/SearchFilterBar';
import { StatusBadge, Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { storageService } from '../../services/storageService';
import { FinancialCalculator } from '../../services/calculationService';
import { ExportService } from '../../services/exportService';
import { SharedExpense, BillingFrequency, TransactionStatus } from '../../types/financial';

interface SharedExpensesViewProps {
  isAddModalOpen?: boolean;
  onCloseAddModal?: () => void;
}

export const SharedExpensesView: React.FC<SharedExpensesViewProps> = ({
  isAddModalOpen = false,
  onCloseAddModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [frequencyFilter, setFrequencyFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(isAddModalOpen);
  const [viewExpense, setViewExpense] = useState<SharedExpense | null>(null);

  // Form State
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('Electricity');
  const [formAccountCode, setFormAccountCode] = useState('6010');
  const [formQuantity, setFormQuantity] = useState(1);
  const [formUnitPrice, setFormUnitPrice] = useState(1200000);
  const [formFrequency, setFormFrequency] = useState<BillingFrequency>('monthly');
  const [formPolicyId, setFormPolicyId] = useState('pol-elec');
  const [formNotes, setFormNotes] = useState('');
  const [formStatus, setFormStatus] = useState<TransactionStatus>('Posted');
  const [formDocName, setFormDocName] = useState('');

  const state = storageService.getState();
  const sharedExpenses = state.sharedExpenses;

  // Live calculation for Add Modal
  const calculatedAmounts = FinancialCalculator.calculateAmounts(
    formQuantity,
    formUnitPrice,
    formFrequency
  );

  const selectedPolicy = state.allocationPolicies.find((p) => p.id === formPolicyId);
  const calculatedAllocations = FinancialCalculator.calculateAllocations(
    calculatedAmounts.totalAmount,
    calculatedAmounts.monthlyNormalizedAmount,
    selectedPolicy ? selectedPolicy.rules : [],
    state.organizations
  );

  // Filtered List
  const filteredExpenses = sharedExpenses.filter((exp) => {
    const matchesSearch =
      exp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.expenseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCat = categoryFilter === 'all' || exp.category === categoryFilter;
    const matchesFreq = frequencyFilter === 'all' || exp.billingFrequency === frequencyFilter;

    return matchesSearch && matchesCat && matchesFreq;
  });

  const categories = Array.from(new Set(sharedExpenses.map((e) => e.category)));

  // Total summary calculations
  const totalAnnual = sharedExpenses.reduce((sum, e) => sum + e.annualAmount, 0);
  const totalMonthlyNormalized = sharedExpenses.reduce((sum, e) => sum + e.monthlyNormalizedAmount, 0);

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formDescription.trim()) {
      alert('Please enter a valid expense description.');
      return;
    }

    if (!calculatedAllocations.isReconciled) {
      alert(calculatedAllocations.errorMessage || 'Allocation percentages must equal 100% and balance to total expense.');
      return;
    }

    storageService.addSharedExpense({
      date: formDate,
      description: formDescription,
      category: formCategory,
      accountId: `acc-${formAccountCode}`,
      accountCode: formAccountCode,
      quantity: formQuantity,
      unitPrice: formUnitPrice,
      totalAmount: calculatedAmounts.totalAmount,
      billingFrequency: formFrequency,
      isShared: true,
      allocationPolicyId: formPolicyId,
      supportingDocName: formDocName || `${formCategory}_Invoice_${formDate}.pdf`,
      notes: formNotes,
      status: formStatus,
    });

    setShowAddModal(false);
    if (onCloseAddModal) onCloseAddModal();

    // Reset Form
    setFormDescription('');
    setFormUnitPrice(1000000);
    setFormNotes('');
  };

  const handleExportExcel = () => {
    const headers = [
      'Expense No',
      'Date',
      'Description',
      'Category',
      'Billing Freq',
      'Unit Price',
      'Quantity',
      'Total Amount (RWF)',
      'Monthly Normalized (RWF)',
      'Annual Amount (RWF)',
      'Fablab Share (RWF)',
      'Klab Share (RWF)',
      'Fab Cafe Share (RWF)',
      '250Startups Share (RWF)',
      'Status',
    ];

    const rows = filteredExpenses.map((exp) => {
      const fablab = exp.allocations.find((a) => a.orgId === 'org-fablab')?.monthlyShare || 0;
      const klab = exp.allocations.find((a) => a.orgId === 'org-klab')?.monthlyShare || 0;
      const fabcafe = exp.allocations.find((a) => a.orgId === 'org-fabcafe')?.monthlyShare || 0;
      const s250 = exp.allocations.find((a) => a.orgId === 'org-250startups')?.monthlyShare || 0;

      return [
        exp.expenseNumber,
        exp.date,
        exp.description,
        exp.category,
        exp.billingFrequency,
        exp.unitPrice,
        exp.quantity,
        exp.totalAmount,
        exp.monthlyNormalizedAmount,
        exp.annualAmount,
        fablab,
        klab,
        fabcafe,
        s250,
        exp.status,
      ];
    });

    ExportService.exportToExcel('Shared Space Expenses Register', 'FabLab_Shared_Expenses', headers, rows, [
      { label: 'Total Annual Shared Budget', value: FinancialCalculator.formatRWF(totalAnnual) },
      { label: 'Total Monthly Normalized Requirement', value: FinancialCalculator.formatRWF(totalMonthlyNormalized) },
    ]);
  };

  const handleExportPDF = () => {
    const headers = ['Expense #', 'Category', 'Description', 'Freq', 'Total (RWF)', 'Monthly Accrual', 'Status'];
    const rows = filteredExpenses.map((e) => [
      e.expenseNumber,
      e.category,
      e.description,
      e.billingFrequency,
      FinancialCalculator.formatRWF(e.totalAmount, false),
      FinancialCalculator.formatRWF(e.monthlyNormalizedAmount, false),
      e.status,
    ]);

    ExportService.exportToPDF('Shared Space Facility Expenses Register', 'FabLab_Shared_Expenses', headers, rows, {
      orientation: 'landscape',
      summaryStats: [
        { label: 'Total Annual Budget', value: FinancialCalculator.formatRWF(totalAnnual) },
        { label: 'Monthly Normalized Cost', value: FinancialCalculator.formatRWF(totalMonthlyNormalized) },
      ],
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner with Baseline Explanations */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Shared Space Facility Expenses</h2>
            <Badge variant="emerald">Multi-Tenant</Badge>
            <Badge variant="purple">Auto-Reconciled</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Normalized monthly cost sharing model across Fablab (38%), Klab (32%), Fab Cafe (18%), and 250Startups (12%).
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-xl">
          <div className="text-right">
            <p className="text-[10px] uppercase font-bold text-slate-400">Total Annual Budget</p>
            <p className="text-base font-bold text-slate-900 font-mono">{FinancialCalculator.formatRWF(totalAnnual)}</p>
          </div>
          <div className="h-7 w-px bg-slate-200" />
          <div className="text-right">
            <p className="text-[10px] uppercase font-bold text-slate-400">Monthly Normalized</p>
            <p className="text-base font-bold text-emerald-700 font-mono">~{FinancialCalculator.formatRWF(totalMonthlyNormalized)}</p>
          </div>
        </div>
      </div>

      {/* Discrepancy Prevention & Billing Frequency Discrepancy Notice */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-3">
        <HelpCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-blue-950">Billing Frequency Normalization Protocol (Section 7 Compliance)</p>
          <p className="text-blue-800 text-[11px] leading-relaxed">
            Quarterly and annual expenses (such as Office Stationery and Repair & Maintenance) are accurately converted into normalized monthly accruals for partner contributions, ensuring monthly cash requirements are never artificially inflated.
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search description, category, expense #..."
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
            label: 'Frequency',
            value: frequencyFilter,
            onChange: setFrequencyFilter,
            options: [
              { label: 'All Frequencies', value: 'all' },
              { label: 'Monthly', value: 'monthly' },
              { label: 'Quarterly', value: 'quarterly' },
              { label: 'Annual', value: 'annual' },
              { label: 'One-Off', value: 'one_off' },
            ],
          },
        ]}
        onExportExcel={handleExportExcel}
        onExportPDF={handleExportPDF}
        onAddClick={() => setShowAddModal(true)}
        addLabel="Add Shared Expense"
      />

      {/* Shared Expenses Data Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Expense ID</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Category & Description</th>
                <th className="py-3.5 px-4 text-center">Frequency</th>
                <th className="py-3.5 px-4 text-right">Unit Price</th>
                <th className="py-3.5 px-4 text-right">Total Amount</th>
                <th className="py-3.5 px-4 text-right">Monthly Normalized</th>
                <th className="py-3.5 px-4 text-right">Annual Budget</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No shared expenses found matching filters.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{exp.expenseNumber}</td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{exp.date}</td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-bold text-slate-900 truncate">{exp.description}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span className="font-semibold text-emerald-700">{exp.category}</span>
                        <span>•</span>
                        <span className="font-mono text-slate-400">Acc {exp.accountCode}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge
                        variant={
                          exp.billingFrequency === 'monthly'
                            ? 'info'
                            : exp.billingFrequency === 'quarterly'
                            ? 'purple'
                            : 'neutral'
                        }
                        size="sm"
                      >
                        {exp.billingFrequency}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right font-mono">{FinancialCalculator.formatRWF(exp.unitPrice)}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {FinancialCalculator.formatRWF(exp.totalAmount)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                      {FinancialCalculator.formatRWF(exp.monthlyNormalizedAmount)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">
                      {FinancialCalculator.formatRWF(exp.annualAmount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge status={exp.status} />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => setViewExpense(exp)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>Allocations</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Shared Expense Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            if (onCloseAddModal) onCloseAddModal();
          }}
          title="Record Shared Facility Expense"
          subtitle="Enter information once: all normalized totals, resident allocations, GL journals, and reports update automatically."
          maxWidth="3xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="text-xs">
                <span className="text-slate-500">Reconciliation: </span>
                <strong className={calculatedAllocations.isReconciled ? 'text-emerald-700' : 'text-rose-700'}>
                  {calculatedAllocations.isReconciled ? '100% Balanced' : 'Unreconciled (Adjust Policy)'}
                </strong>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    if (onCloseAddModal) onCloseAddModal();
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveExpense}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-colors"
                >
                  Save & Post Expense
                </button>
              </div>
            </div>
          }
        >
          <form onSubmit={handleSaveExpense} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Expense Date *</label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Category *</label>
                <select
                  value={formCategory}
                  onChange={(e) => {
                    setFormCategory(e.target.value);
                    if (e.target.value === 'Rent') {
                      setFormAccountCode('6000');
                      setFormPolicyId('pol-rent');
                    } else if (e.target.value === 'Electricity') {
                      setFormAccountCode('6010');
                      setFormPolicyId('pol-elec');
                    } else if (e.target.value === 'Internet') {
                      setFormAccountCode('6020');
                      setFormPolicyId('pol-internet');
                    } else if (e.target.value === 'WASAC' || e.target.value === 'Drinking Water') {
                      setFormAccountCode('6050');
                      setFormPolicyId('pol-water');
                    } else if (e.target.value === 'Office Stationery') {
                      setFormAccountCode('6110');
                      setFormPolicyId('pol-stationery');
                      setFormFrequency('quarterly');
                    } else if (e.target.value === 'Repair & Maintenance') {
                      setFormAccountCode('6120');
                      setFormPolicyId('pol-rent');
                      setFormFrequency('quarterly');
                    }
                  }}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="Electricity">Electricity (EUCL)</option>
                  <option value="Rent">Rent (Telecom House)</option>
                  <option value="Internet">Internet (Liquid 100Mbps)</option>
                  <option value="Security">Security (G4S)</option>
                  <option value="Cleaning Fee">Cleaning Fee (Kigali Clean)</option>
                  <option value="WASAC">WASAC Water</option>
                  <option value="Drinking Water">Drinking Water (Inyange)</option>
                  <option value="Hygiene Supplies">Hygiene Supplies</option>
                  <option value="Garbage Collection">Garbage Collection (COPED)</option>
                  <option value="Umutekano/Irondo">Umutekano / Irondo</option>
                  <option value="Emptying Septic Tank">Emptying Septic Tank</option>
                  <option value="Office Stationery">Office Stationery (Quarterly)</option>
                  <option value="Repair & Maintenance">Repair & Maintenance (Quarterly)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Expense Description *</label>
              <input
                type="text"
                required
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="e.g. August 2026 Telecom House Facility Rent"
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={formQuantity}
                  onChange={(e) => setFormQuantity(parseFloat(e.target.value) || 1)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Unit Price (RWF) *</label>
                <input
                  type="number"
                  min="0"
                  value={formUnitPrice}
                  onChange={(e) => setFormUnitPrice(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Billing Frequency *</label>
                <select
                  value={formFrequency}
                  onChange={(e) => setFormFrequency(e.target.value as BillingFrequency)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-semibold"
                >
                  <option value="monthly">Monthly Recurring</option>
                  <option value="quarterly">Quarterly Cost</option>
                  <option value="annual">Annual Cost</option>
                  <option value="one_off">One-Off Incident</option>
                </select>
              </div>
            </div>

            {/* Derived Amounts Box */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-3 gap-3 text-center">
              <div>
                <span className="text-[10px] text-slate-500 font-semibold uppercase">Total Expense Amount</span>
                <p className="text-sm font-bold text-slate-900 font-mono mt-0.5">
                  {FinancialCalculator.formatRWF(calculatedAmounts.totalAmount)}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-emerald-700 font-bold uppercase">Monthly Normalized</span>
                <p className="text-sm font-bold text-emerald-700 font-mono mt-0.5">
                  {FinancialCalculator.formatRWF(calculatedAmounts.monthlyNormalizedAmount)}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-semibold uppercase">Annual Cost</span>
                <p className="text-sm font-bold text-slate-900 font-mono mt-0.5">
                  {FinancialCalculator.formatRWF(calculatedAmounts.annualAmount)}
                </p>
              </div>
            </div>

            {/* Allocation Policy & Breakdown */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                  Resident Space Allocation Model
                </label>
                <span className="text-[11px] font-semibold text-slate-500">
                  Total Percentage: <strong className="text-emerald-700">{calculatedAllocations.totalPercentage}%</strong>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {calculatedAllocations.allocations.map((alloc) => (
                  <div key={alloc.orgId} className="p-2.5 bg-white border border-slate-200 rounded-xl space-y-0.5">
                    <p className="font-bold text-slate-900 truncate">{alloc.orgName}</p>
                    <p className="text-[10px] text-slate-500">Share: {alloc.percentage}%</p>
                    <p className="font-mono font-bold text-emerald-700 text-[11px]">
                      {FinancialCalculator.formatRWF(alloc.monthlyShare)}/mo
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Supporting Document Name</label>
                <input
                  type="text"
                  value={formDocName}
                  onChange={(e) => setFormDocName(e.target.value)}
                  placeholder="e.g. EUCL_August_Receipt.pdf"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Status Workflow</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as TransactionStatus)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-semibold"
                >
                  <option value="Posted">Posted (Updates GL, Ledgers & Dashboard immediately)</option>
                  <option value="Approved">Approved (Ready for posting)</option>
                  <option value="Submitted">Submitted (Pending Manager Approval)</option>
                  <option value="Draft">Draft (Preliminary Scratchpad)</option>
                </select>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* View Allocations Breakdown Modal */}
      {viewExpense && (
        <Modal
          isOpen={!!viewExpense}
          onClose={() => setViewExpense(null)}
          title={`Shared Allocation Breakdown: ${viewExpense.expenseNumber}`}
          subtitle={`${viewExpense.description} (${FinancialCalculator.formatRWF(viewExpense.totalAmount)})`}
          maxWidth="2xl"
          footer={
            <button
              type="button"
              onClick={() => setViewExpense(null)}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              Close
            </button>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Total Amount</p>
                <p className="text-sm font-bold text-slate-900 font-mono mt-0.5">
                  {FinancialCalculator.formatRWF(viewExpense.totalAmount)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Monthly Normalized</p>
                <p className="text-sm font-bold text-emerald-700 font-mono mt-0.5">
                  {FinancialCalculator.formatRWF(viewExpense.monthlyNormalizedAmount)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Annual Cost</p>
                <p className="text-sm font-bold text-slate-900 font-mono mt-0.5">
                  {FinancialCalculator.formatRWF(viewExpense.annualAmount)}
                </p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
                  <tr>
                    <th className="py-2.5 px-4">Resident Organization</th>
                    <th className="py-2.5 px-4 text-center">Allocation %</th>
                    <th className="py-2.5 px-4 text-right">Expense Share</th>
                    <th className="py-2.5 px-4 text-right">Monthly Normalized Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {viewExpense.allocations.map((alloc) => (
                    <tr key={alloc.orgId} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-bold text-slate-900">{alloc.orgName}</td>
                      <td className="py-2.5 px-4 text-center font-mono font-semibold text-slate-700">{alloc.percentage}%</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-800">
                        {FinancialCalculator.formatRWF(alloc.amount)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-700">
                        {FinancialCalculator.formatRWF(alloc.monthlyShare)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {viewExpense.notes && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                <p className="font-bold text-slate-800">Notes & Supporting Details:</p>
                <p className="mt-0.5">{viewExpense.notes}</p>
                {viewExpense.supportingDocName && (
                  <p className="mt-1 text-emerald-700 font-mono flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Attached: {viewExpense.supportingDocName}
                  </p>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
