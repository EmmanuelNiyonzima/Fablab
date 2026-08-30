import React, { useState } from 'react';
import { 
  Layers, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Building2, 
  HelpCircle,
  Eye,
  Sliders,
  DollarSign,
  FileSpreadsheet,
  Download,
  Clock,
  Check,
  X,
  MessageSquare,
  Send,
  ShieldCheck,
  FileCheck,
  CornerDownRight,
  UserCheck,
  Ban,
  RotateCcw,
  Paperclip,
  Info
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
  const state = storageService.getState();
  const currentUser = state.currentUser;
  const isAdmin = currentUser.role === 'ADMIN';
  const sharedExpenses = state.sharedExpenses;

  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'my_submissions'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [frequencyFilter, setFrequencyFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(isAddModalOpen);
  const [viewExpense, setViewExpense] = useState<SharedExpense | null>(null);

  // Approval / Revision / Rejection modal state
  const [actionExpense, setActionExpense] = useState<SharedExpense | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'revision' | 'reject' | null>(null);
  const [adminRemarks, setAdminRemarks] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  // Form State for Submitting Shared Expense
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('Electricity');
  const [formAccountCode, setFormAccountCode] = useState('6010');
  const [formQuantity, setFormQuantity] = useState(1);
  const [formUnitPrice, setFormUnitPrice] = useState(1200000);
  const [formFrequency, setFormFrequency] = useState<BillingFrequency>('monthly');
  const [formPolicyId, setFormPolicyId] = useState('pol-elec');
  const [formNotes, setFormNotes] = useState('');
  const [formSubmitterComments, setFormSubmitterComments] = useState('');
  const [formSelectedOrgId, setFormSelectedOrgId] = useState(currentUser.organizationId || 'org-fablab');
  const [formDocName, setFormDocName] = useState('');

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

  // Counts for tabs
  const pendingSubmissions = sharedExpenses.filter((exp) => exp.status === 'Submitted');
  const approvedExpenses = sharedExpenses.filter((exp) => exp.status === 'Posted' || exp.status === 'Approved');
  const rejectedExpenses = sharedExpenses.filter((exp) => exp.status === 'Rejected');

  // Filtered List
  const filteredExpenses = sharedExpenses.filter((exp) => {
    // Tab Filter
    if (activeTab === 'pending' && exp.status !== 'Submitted') return false;
    if (activeTab === 'approved' && exp.status !== 'Posted' && exp.status !== 'Approved') return false;
    if (activeTab === 'rejected' && exp.status !== 'Rejected') return false;
    if (activeTab === 'my_submissions') {
      const isMyOrg = currentUser.organizationId && exp.submittedByOrgId === currentUser.organizationId;
      const isMyEmail = exp.submittedByEmail === currentUser.email || exp.createdBy === currentUser.name;
      if (!isMyOrg && !isMyEmail) return false;
    }

    const matchesSearch =
      exp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.expenseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exp.submittedByOrgName && exp.submittedByOrgName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (exp.submitterComments && exp.submitterComments.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (exp.rejectionReason && exp.rejectionReason.toLowerCase().includes(searchQuery.toLowerCase()));

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

    if (!formSubmitterComments.trim()) {
      alert('Please provide a comment or operational justification for this department expense.');
      return;
    }

    if (!calculatedAllocations.isReconciled) {
      alert(calculatedAllocations.errorMessage || 'Allocation percentages must equal 100% and balance to total expense.');
      return;
    }

    const selectedOrg = state.organizations.find((o) => o.id === formSelectedOrgId);

    // If Admin is submitting on behalf of a dept, it still creates a structured submission (or directly posts if chosen)
    const finalStatus: TransactionStatus = 'Submitted';

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
      submitterComments: formSubmitterComments || `Submitted by ${selectedOrg?.name || currentUser.name} for shared space facility cost sharing.`,
      submittedByOrgId: selectedOrg?.id,
      submittedByOrgName: selectedOrg?.name,
      submittedByEmail: currentUser.email,
      status: finalStatus,
    });

    setShowAddModal(false);
    if (onCloseAddModal) onCloseAddModal();

    // Reset Form
    setFormDescription('');
    setFormUnitPrice(1000000);
    setFormNotes('');
    setFormSubmitterComments('');
    setFormDocName('');
  };

  const handleAdminApprovalConfirm = () => {
    if (!actionExpense) return;

    if (actionType === 'approve') {
      storageService.approveSharedExpense(
        actionExpense.id, 
        adminRemarks || 'Approved and confirmed by Emmanuel Niyonzima (Super Administrator).'
      );
    } else if (actionType === 'reject') {
      const reasonToSave = rejectionReason.trim() || adminRemarks.trim();
      if (!reasonToSave) {
        alert('Please provide a specific reason for rejecting this shared expense submission.');
        return;
      }
      storageService.rejectSharedExpense(actionExpense.id, reasonToSave);
    } else if (actionType === 'revision') {
      if (!adminRemarks.trim()) {
        alert('Please specify the revision requirements for the department.');
        return;
      }
      storageService.requestRevisionSharedExpense(actionExpense.id, adminRemarks);
    }

    setActionExpense(null);
    setActionType(null);
    setAdminRemarks('');
    setRejectionReason('');
  };

  const handleDownloadFullPDF = () => {
    ExportService.exportFullSharedExpensesPDF(state);
  };

  const handleDownloadFullExcel = () => {
    ExportService.exportFullSharedExpensesExcel(state);
  };

  const rejectionPresetReasons = [
    'Official EBM tax invoice / receipt is missing or illegible.',
    'Incorrect cost allocation category selected.',
    'Duplicate submission for current billing cycle.',
    'Exceeds approved quarterly budget ceiling without prior authorization.',
    'Discrepancy in unit price or quantity vs attached vendor bill.',
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner with Financial Overview & Role-Specific Primary Actions */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-5">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Shared Expenses Management</h2>
            <Badge variant="emerald">Multi-Department</Badge>
            {pendingSubmissions.length > 0 && (
              <Badge variant="amber">
                <Clock className="w-3 h-3 mr-1" />
                {pendingSubmissions.length} Awaiting Emmanuel Approval
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Cost sharing management across <strong>Fablab Rwanda (38%)</strong>, <strong>Klab (32%)</strong>, <strong>Fab Cafe (18%)</strong>, and <strong>250Startups (12%)</strong> at Telecom House 6th Floor.
          </p>
          <div className="mt-2.5 flex items-center gap-2 text-[11px] text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/70 inline-flex">
            <Info className="w-3.5 h-3.5 text-[#0F4C81] shrink-0" />
            <span>
              <strong>Workflow Protocol:</strong> Shared expenses are initiated by resident departments with receipts and submitted to <strong>Emmanuel Niyonzima</strong> for administrative approval before posting.
            </span>
          </div>
        </div>

        {/* Top Metric Cards + Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3.5 bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-xl">
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold text-slate-400">Total Annual Pool</p>
              <p className="text-base font-bold text-slate-900 font-mono">{FinancialCalculator.formatRWF(totalAnnual)}</p>
            </div>
            <div className="h-7 w-px bg-slate-200" />
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold text-slate-400">Monthly Normalized</p>
              <p className="text-base font-bold text-emerald-700 font-mono">~{FinancialCalculator.formatRWF(totalMonthlyNormalized)}</p>
            </div>
          </div>

          {/* Role-Adaptive Primary Buttons */}
          <div className="flex items-center gap-2">
            {/* Download Full PDF Document */}
            <button
              type="button"
              onClick={handleDownloadFullPDF}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
              title="Download Full Formatted PDF Report with Logos & Approval Sign-off"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Full PDF Document</span>
            </button>

            {/* Download Full Excel Workbook */}
            <button
              type="button"
              onClick={handleDownloadFullExcel}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-[#0F4C81] hover:bg-[#0A3962] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
              title="Download Comprehensive Excel Workbook with formulas and department summaries"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
              <span>Excel Workbook (.xlsx)</span>
            </button>

            {/* Department Submit Expense Button */}
            {!isAdmin ? (
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-[#009A44] hover:bg-[#007D37] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Submit Department Expense</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 border border-slate-200"
                title="Submit on behalf of a department (Simulation / Admin Entry)"
              >
                <Plus className="w-3.5 h-3.5 text-slate-500" />
                <span>Submit for Dept</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* PENDING APPROVALS QUEUE (Highlight for Emmanuel Niyonzima / Administrator) */}
      {pendingSubmissions.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/80 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-xs">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Department Submissions Awaiting Emmanuel's Review</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold">
                    {pendingSubmissions.length} Pending Approval
                  </span>
                </h3>
                <p className="text-xs text-slate-600">
                  Resident organizations have submitted shared expenses with justifications. Review and Approve or Reject with reason before posting to General Ledger.
                </p>
              </div>
            </div>

            {isAdmin && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 self-start sm:self-auto">
                <ShieldCheck className="w-4 h-4 text-[#009A44]" />
                <span className="font-semibold">Reviewing as Emmanuel Niyonzima (Super Administrator)</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
            {pendingSubmissions.map((exp) => (
              <div
                key={exp.id}
                className="bg-white border border-amber-200/90 rounded-xl p-4 shadow-xs space-y-3 hover:border-amber-400 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-mono text-[10px] font-bold">
                        {exp.expenseNumber}
                      </span>
                      <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-md text-[10px] font-bold flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-amber-700" />
                        {exp.submittedByOrgName || exp.createdBy}
                      </span>
                      <span className="text-[10px] text-slate-400">{exp.date}</span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-xs mt-1.5">{exp.description}</h4>
                    <span className="text-[10px] font-semibold text-emerald-700">{exp.category}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Amount</span>
                    <span className="font-mono font-bold text-slate-900 text-xs">
                      {FinancialCalculator.formatRWF(exp.totalAmount)}
                    </span>
                    <span className="text-[10px] text-emerald-700 block font-mono">
                      ~{FinancialCalculator.formatRWF(exp.monthlyNormalizedAmount)}/mo
                    </span>
                  </div>
                </div>

                {/* Submitter Department Justification Box */}
                {exp.submitterComments && (
                  <div className="p-2.5 bg-amber-50/70 border border-amber-200/70 rounded-lg text-xs text-slate-700 flex items-start gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-[11px] text-amber-900 block font-semibold">
                        Department Justification for Emmanuel:
                      </strong>
                      <p className="text-[11px] text-slate-700 mt-0.5 italic">"{exp.submitterComments}"</p>
                    </div>
                  </div>
                )}

                {/* Invoice Attachment indicator */}
                {exp.supportingDocName && (
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                    <Paperclip className="w-3 h-3 text-slate-400" />
                    <span className="font-mono truncate">{exp.supportingDocName}</span>
                  </div>
                )}

                {/* Allocation Snapshot */}
                <div className="grid grid-cols-4 gap-1 text-[10px] bg-slate-50/80 p-2 rounded-lg border border-slate-100">
                  {exp.allocations.map((a) => (
                    <div key={a.orgId} className="text-center">
                      <span className="text-slate-500 truncate block text-[9px]">{a.orgName.split(' ')[0]} ({a.percentage}%)</span>
                      <span className="font-mono font-bold text-slate-800 text-[10px]">
                        {FinancialCalculator.formatRWF(a.monthlyShare, false)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Action Buttons: Emmanuel Review Actions */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setViewExpense(exp)}
                    className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Matrix</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    {isAdmin ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setActionExpense(exp);
                            setActionType('reject');
                            setRejectionReason('');
                            setAdminRemarks('');
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Reject submission and provide a reason to the department"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActionExpense(exp);
                            setActionType('revision');
                            setAdminRemarks('');
                          }}
                          className="px-2 py-1 text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors cursor-pointer"
                          title="Ask department to revise numbers or attach receipt"
                        >
                          Revision
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActionExpense(exp);
                            setActionType('approve');
                            setAdminRemarks('Approved and confirmed by Emmanuel Niyonzima (Administrator) for shared facility cost allocation.');
                          }}
                          className="px-3 py-1 text-[11px] font-bold text-white bg-[#009A44] hover:bg-[#007D37] rounded-lg shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve & Post</span>
                        </button>
                      </>
                    ) : (
                      <span className="text-[11px] text-amber-700 font-semibold bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>Awaiting Emmanuel's Approval</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs Switcher */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-200 pb-2 gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Shared Expenses ({sharedExpenses.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'pending'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Review ({pendingSubmissions.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('approved')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'approved'
                ? 'bg-[#009A44] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Approved & Posted ({approvedExpenses.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rejected')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'rejected'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Ban className="w-3.5 h-3.5" />
            <span>Rejected ({rejectedExpenses.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('my_submissions')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'my_submissions'
                ? 'bg-[#0F4C81] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>{currentUser.organizationName || 'My Department'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadFullExcel}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            title="Export full register to Excel"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Excel</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadFullPDF}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            title="Export full register to PDF"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search description, category, department, comments, rejection reason..."
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
        onExportExcel={handleDownloadFullExcel}
        onExportPDF={handleDownloadFullPDF}
        onAddClick={() => setShowAddModal(true)}
        addLabel={isAdmin ? "Submit for Dept" : "Submit Department Expense"}
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
                <th className="py-3.5 px-4">Submitted By Dept</th>
                <th className="py-3.5 px-4 text-center">Frequency</th>
                <th className="py-3.5 px-4 text-right">Total Amount</th>
                <th className="py-3.5 px-4 text-right">Monthly Normalized</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
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
                      {exp.submitterComments && (
                        <div className="text-[10px] text-slate-500 italic mt-1 truncate max-w-xs flex items-center gap-1">
                          <MessageSquare className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                          <span>"{exp.submitterComments}"</span>
                        </div>
                      )}
                      {exp.status === 'Rejected' && exp.rejectionReason && (
                        <div className="mt-1 p-1.5 bg-rose-50 border border-rose-200 rounded text-[10px] text-rose-800">
                          <strong>Rejection Reason:</strong> {exp.rejectionReason}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-800 text-[11px] block truncate">
                        {exp.submittedByOrgName || exp.createdBy}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate block">
                        {exp.submittedByEmail || 'Department'}
                      </span>
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
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {FinancialCalculator.formatRWF(exp.totalAmount)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                      {FinancialCalculator.formatRWF(exp.monthlyNormalizedAmount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge status={exp.status} />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewExpense(exp)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                          title="View Allocation Matrix"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span className="hidden sm:inline">Details</span>
                        </button>
                        
                        {/* Direct Approve / Reject for Emmanuel on Submitted items */}
                        {isAdmin && exp.status === 'Submitted' && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setActionExpense(exp);
                                setActionType('approve');
                                setAdminRemarks('Approved and confirmed by Emmanuel Niyonzima (Administrator).');
                              }}
                              className="p-1.5 text-white bg-[#009A44] hover:bg-[#007D37] rounded-lg shadow-xs cursor-pointer"
                              title="Approve & Post to General Ledger"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setActionExpense(exp);
                                setActionType('reject');
                                setRejectionReason('');
                                setAdminRemarks('');
                              }}
                              className="p-1.5 text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg cursor-pointer"
                              title="Reject submission with reason"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SUBMIT DEPARTMENT SHARED EXPENSE MODAL */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            if (onCloseAddModal) onCloseAddModal();
          }}
          title="Submit Department Shared Facility Expense"
          subtitle="Resident departments submit incurred shared facility expenses with justification and invoice for Super Administrator Emmanuel Niyonzima's review and approval."
          maxWidth="3xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="text-xs">
                <span className="text-slate-500">Allocation Status: </span>
                <strong className={calculatedAllocations.isReconciled ? 'text-emerald-700' : 'text-rose-700'}>
                  {calculatedAllocations.isReconciled ? '100% Balanced Across 4 Organizations' : 'Unreconciled'}
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
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-[#009A44] hover:bg-[#007D37] rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit to Emmanuel for Approval</span>
                </button>
              </div>
            </div>
          }
        >
          <form onSubmit={handleSaveExpense} className="space-y-4">
            {/* Submitting Department Info */}
            <div className="p-3 bg-[#E8F8EE] border border-[#A7E7BF] rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#009A44]" />
                <span className="font-bold text-[#007D37]">Submitting Department / Organization:</span>
              </div>
              <select
                value={formSelectedOrgId}
                onChange={(e) => setFormSelectedOrgId(e.target.value)}
                className="bg-white border border-[#A7E7BF] rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none"
              >
                {state.organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name} ({org.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Expense Incurred Date *</label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Expense Category *</label>
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
                  <option value="Electricity">Electricity (REG/EUCL & Generators)</option>
                  <option value="Rent">Rent (Telecom House 6th Floor)</option>
                  <option value="Internet">Internet (Liquid 100Mbps Dedicated)</option>
                  <option value="Security">Security (G4S)</option>
                  <option value="Cleaning Fee">Cleaning Fee (Kigali Clean)</option>
                  <option value="WASAC">WASAC Water Utility</option>
                  <option value="Drinking Water">Drinking Water (Inyange Refills)</option>
                  <option value="Hygiene Supplies">Hygiene & Sanitizer Supplies</option>
                  <option value="Garbage Collection">Garbage Collection (COPED)</option>
                  <option value="Umutekano/Irondo">Umutekano / Irondo Security</option>
                  <option value="Emptying Septic Tank">Emptying Septic Tank</option>
                  <option value="Office Stationery">Office Stationery (Quarterly)</option>
                  <option value="Repair & Maintenance">Repair & Maintenance (Quarterly)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Expense Title / Description *</label>
              <input
                type="text"
                required
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="e.g. Liquid Telecom Dedicated Fiber Internet Bandwidth Upgrade"
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            {/* Department Comments / Justification */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                <span>Department Operational Justification (Sent directly to Emmanuel) *</span>
              </label>
              <textarea
                rows={2}
                required
                value={formSubmitterComments}
                onChange={(e) => setFormSubmitterComments(e.target.value)}
                placeholder="Explain why this shared cost was incurred and how it benefits the 4 entities on 6th floor..."
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
                  <span>Cost Allocation Split across 4 Organizations</span>
                </label>
                <span className="text-[11px] font-semibold text-slate-500">
                  Total: <strong className="text-emerald-700">{calculatedAllocations.totalPercentage}%</strong>
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
                <label className="text-xs font-semibold text-slate-700">Supporting Document / Invoice Attachment</label>
                <input
                  type="text"
                  value={formDocName}
                  onChange={(e) => setFormDocName(e.target.value)}
                  placeholder="e.g. Liquid_Invoice_Aug2026.pdf"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">General Operational Notes</label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Additional reference numbers or operational context..."
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* ADMIN APPROVAL / REJECTION / REVISION MODAL */}
      {actionExpense && actionType && (
        <Modal
          isOpen={!!actionExpense}
          onClose={() => {
            setActionExpense(null);
            setActionType(null);
          }}
          title={
            actionType === 'approve'
              ? `Confirm & Post Shared Expense: ${actionExpense.expenseNumber}`
              : actionType === 'reject'
              ? `Reject Submission: ${actionExpense.expenseNumber}`
              : `Request Revision: ${actionExpense.expenseNumber}`
          }
          subtitle={`Submitted by ${actionExpense.submittedByOrgName || actionExpense.createdBy} (${actionExpense.submittedByEmail || ''})`}
          maxWidth="lg"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <button
                type="button"
                onClick={() => {
                  setActionExpense(null);
                  setActionType(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAdminApprovalConfirm}
                className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                  actionType === 'approve'
                    ? 'bg-[#009A44] hover:bg-[#007D37]'
                    : actionType === 'reject'
                    ? 'bg-rose-700 hover:bg-rose-800'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {actionType === 'approve' && <CheckCircle2 className="w-4 h-4" />}
                {actionType === 'reject' && <Ban className="w-4 h-4" />}
                {actionType === 'revision' && <RotateCcw className="w-4 h-4" />}
                <span>
                  {actionType === 'approve'
                    ? 'Confirm & Post to Ledger'
                    : actionType === 'reject'
                    ? 'Confirm Rejection'
                    : 'Send Revision Request'}
                </span>
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-900">{actionExpense.description}</span>
                <span className="font-mono font-bold text-slate-900">
                  {FinancialCalculator.formatRWF(actionExpense.totalAmount)}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-2">
                <span>Category: <strong className="text-emerald-700">{actionExpense.category}</strong></span>
                <span>•</span>
                <span>Frequency: <strong>{actionExpense.billingFrequency}</strong></span>
              </div>

              {actionExpense.submitterComments && (
                <div className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 mt-2">
                  <strong className="text-slate-800 block text-[11px] font-semibold">
                    Department Submitter Justification:
                  </strong>
                  <p className="mt-0.5 italic">"{actionExpense.submitterComments}"</p>
                </div>
              )}
            </div>

            {/* REJECTION REASON SECTION */}
            {actionType === 'reject' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-rose-900 block">
                  Rejection Reason (Required - will be sent to {actionExpense.submittedByOrgName || 'the department'}) *
                </label>
                
                {/* Quick Preset Reason Chips */}
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-500 font-semibold uppercase">Quick Reason Presets:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {rejectionPresetReasons.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setRejectionReason(preset)}
                        className="text-[10px] px-2.5 py-1 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-800 rounded-lg border border-slate-200 hover:border-rose-200 transition-colors text-left"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  rows={3}
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this shared expense is rejected (e.g., missing official receipt, incorrect tariff, duplicate bill)..."
                  className="w-full p-2.5 text-xs bg-rose-50/50 border border-rose-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500/20 text-rose-950"
                />
              </div>
            )}

            {/* APPROVAL / REVISION REMARKS SECTION */}
            {actionType !== 'reject' && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800">
                  {actionType === 'approve' ? 'Administrator Approval Remarks (Optional)' : 'Remarks / Feedback for Department *'}
                </label>
                <textarea
                  rows={3}
                  value={adminRemarks}
                  onChange={(e) => setAdminRemarks(e.target.value)}
                  placeholder={
                    actionType === 'approve'
                      ? 'Approved and confirmed by Emmanuel Niyonzima for shared facility cost recovery schedule.'
                      : 'Explain what needs to be changed or corrected by the department...'
                  }
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* VIEW ALLOCATIONS BREAKDOWN MODAL */}
      {viewExpense && (
        <Modal
          isOpen={!!viewExpense}
          onClose={() => setViewExpense(null)}
          title={`Shared Expense Details: ${viewExpense.expenseNumber}`}
          subtitle={`${viewExpense.description} (${FinancialCalculator.formatRWF(viewExpense.totalAmount)})`}
          maxWidth="2xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-1.5">
                <StatusBadge status={viewExpense.status} />
                {viewExpense.approvedBy && (
                  <span className="text-[11px] text-emerald-800 font-semibold">
                    • Confirmed by: {viewExpense.approvedBy}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setViewExpense(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Department Submission & Approval Info Card */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-semibold">Submitted By Department</span>
                  <p className="font-bold text-slate-900 mt-0.5">
                    {viewExpense.submittedByOrgName || viewExpense.createdBy} ({viewExpense.submittedByEmail || 'department'})
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-semibold">Submission Date</span>
                  <p className="font-bold text-slate-900 mt-0.5">{viewExpense.date}</p>
                </div>
              </div>

              {viewExpense.submitterComments && (
                <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-slate-700">
                  <strong className="text-slate-900 block font-semibold text-[11px]">Department Comments:</strong>
                  <p className="mt-0.5 italic">"{viewExpense.submitterComments}"</p>
                </div>
              )}

              {viewExpense.rejectionReason && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-900">
                  <strong className="text-rose-900 block font-semibold text-[11px] flex items-center gap-1">
                    <Ban className="w-3.5 h-3.5 text-rose-600" />
                    <span>Administrator Rejection Reason (Emmanuel Niyonzima):</span>
                  </strong>
                  <p className="mt-0.5">{viewExpense.rejectionReason}</p>
                </div>
              )}

              {viewExpense.adminRemarks && !viewExpense.rejectionReason && (
                <div className="p-2.5 bg-[#E8F8EE] border border-[#A7E7BF] rounded-lg text-slate-800">
                  <strong className="text-[#007D37] block font-semibold text-[11px]">Administrator Remarks (Emmanuel):</strong>
                  <p className="mt-0.5">{viewExpense.adminRemarks}</p>
                </div>
              )}
            </div>

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

            {viewExpense.supportingDocName && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-slate-800">Attached Invoice Document:</span>
                  <span className="font-mono text-emerald-700">{viewExpense.supportingDocName}</span>
                </div>
                <Badge variant="emerald">Verified Receipt</Badge>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
