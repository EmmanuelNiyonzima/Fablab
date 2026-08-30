import React, { useState } from 'react';
import { 
  Wallet, 
  Plus, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  ArrowDownLeft, 
  Receipt, 
  Building2, 
  FileSpreadsheet,
  FileText,
  DollarSign,
  Lock,
  ShieldCheck
} from 'lucide-react';
import { SearchFilterBar } from '../common/SearchFilterBar';
import { Badge, StatusBadge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { storageService } from '../../services/storageService';
import { FinancialCalculator } from '../../services/calculationService';
import { ExportService } from '../../services/exportService';
import { SecurityScope } from '../../utils/securityScope';
import { Contribution, ContributionStatus, PaymentMethod } from '../../types/financial';

export const ContributionsView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [orgFilter, setOrgFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedContribution, setSelectedContribution] = useState<Contribution | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Payment Form State
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Bank Transfer');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  const state = storageService.getState();
  const currentUser = state.currentUser;
  const isAdmin = SecurityScope.isSuperAdmin(currentUser);
  const userOrg = SecurityScope.getUserOrg(currentUser, state.organizations);

  // Apply Department Data Isolation
  const accessibleContributions = SecurityScope.filterContributions(state.contributions, currentUser);
  const organizations = state.organizations;

  const filteredContributions = accessibleContributions.filter((c) => {
    const matchesSearch =
      c.orgName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.billingPeriod.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.reference && c.reference.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesOrg = !isAdmin || orgFilter === 'all' || c.orgId === orgFilter;
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;

    return matchesSearch && matchesOrg && matchesStatus;
  });

  const totalExpected = accessibleContributions.reduce((sum, c) => sum + c.expectedAmount, 0);
  const totalReceived = accessibleContributions.reduce((sum, c) => sum + c.receivedAmount, 0);
  const totalOutstanding = accessibleContributions.reduce((sum, c) => sum + c.outstandingBalance, 0);

  const handleOpenPayment = (c: Contribution) => {
    setSelectedContribution(c);
    setPaymentAmount(c.outstandingBalance > 0 ? c.outstandingBalance : c.expectedAmount);
    setReferenceNumber(`BK-TXN-${Math.floor(100000 + Math.random() * 900000)}`);
    setShowPaymentModal(true);
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedContribution) return;

    if (paymentAmount <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }

    storageService.recordContributionPayment(
      selectedContribution.id,
      {
        receivedAmount: paymentAmount,
        paymentDate,
        paymentMethod,
        reference: referenceNumber,
        notes: paymentNotes,
      }
    );

    setShowPaymentModal(false);
    setSelectedContribution(null);
  };

  const handleExportExcel = () => {
    const headers = [
      'Organization',
      'Billing Period',
      'Expected (RWF)',
      'Invoiced (RWF)',
      'Received (RWF)',
      'Outstanding (RWF)',
      'Status',
      'Reference / Invoice #',
    ];

    const rows = filteredContributions.map((c) => [
      c.orgName,
      c.billingPeriod,
      c.expectedAmount,
      c.invoicedAmount,
      c.receivedAmount,
      c.outstandingBalance,
      c.status,
      c.reference || '-',
    ]);

    ExportService.exportToExcel('Resident Contributions Tracker', 'FabLab_Contributions', headers, rows, [
      { label: 'Total Expected Contributions', value: FinancialCalculator.formatRWF(totalExpected) },
      { label: 'Total Received Collections', value: FinancialCalculator.formatRWF(totalReceived) },
      { label: 'Total Outstanding Receivables', value: FinancialCalculator.formatRWF(totalOutstanding) },
    ]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {isAdmin ? 'Resident Contributions & Cost Recovery' : `${userOrg?.name || 'Department'} Contributions & Dues`}
            </h2>
            {isAdmin ? (
              <Badge variant="purple">Super Admin View</Badge>
            ) : (
              <span className="px-2.5 py-0.5 text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 rounded-md flex items-center gap-1">
                <Lock className="w-3 h-3 text-purple-600" />
                Department Isolated
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isAdmin 
              ? 'Consolidated partner cost share billing, bank remittances, receipts, and accounts receivable aging across all 4 departments.'
              : `Tracking your department's cost share billing, bank payment records, and remittance status.`}
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-xl">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">
              {isAdmin ? 'Total Invoiced' : 'Your Invoiced Dues'}
            </p>
            <p className="text-sm font-bold text-slate-900 font-mono">{FinancialCalculator.formatRWF(totalExpected)}</p>
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <div>
            <p className="text-[10px] uppercase font-bold text-emerald-700">Paid (YTD)</p>
            <p className="text-sm font-bold text-emerald-700 font-mono">{FinancialCalculator.formatRWF(totalReceived)}</p>
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <div>
            <p className="text-[10px] uppercase font-bold text-rose-700">Outstanding</p>
            <p className="text-sm font-bold text-rose-700 font-mono">{FinancialCalculator.formatRWF(totalOutstanding)}</p>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={isAdmin ? "Search partner, month (e.g. 'August 2026'), invoice..." : "Search month, reference, invoice..."}
        filters={[
          ...(isAdmin ? [{
            label: 'Organization',
            value: orgFilter,
            onChange: setOrgFilter,
            options: [
              { label: 'All Organizations', value: 'all' },
              ...organizations.map((o) => ({ label: o.name, value: o.id })),
            ],
          }] : []),
          {
            label: 'Status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: 'All Statuses', value: 'all' },
              { label: 'Paid', value: 'Paid' },
              { label: 'Partially Paid', value: 'Partially Paid' },
              { label: 'Pending', value: 'Pending' },
              { label: 'Overdue', value: 'Overdue' },
            ],
          },
        ]}
        onExportExcel={handleExportExcel}
      />

      {/* Contributions Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Resident Entity</th>
                <th className="py-3.5 px-4">Billing Month</th>
                <th className="py-3.5 px-4">Reference #</th>
                <th className="py-3.5 px-4 text-right">Expected Share</th>
                <th className="py-3.5 px-4 text-right">Received Amount</th>
                <th className="py-3.5 px-4 text-right">Outstanding Due</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredContributions.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">{c.orgName}</td>
                  <td className="py-3 px-4 text-slate-600 font-semibold">{c.billingPeriod}</td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{c.reference || 'INV-DRAFT'}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                    {FinancialCalculator.formatRWF(c.expectedAmount)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                    {FinancialCalculator.formatRWF(c.receivedAmount)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-rose-700">
                    {FinancialCalculator.formatRWF(c.outstandingBalance)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="py-3 px-4 text-center">
                    {c.outstandingBalance > 0 ? (
                      <button
                        type="button"
                        onClick={() => handleOpenPayment(c)}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
                      >
                        <Wallet className="w-3.5 h-3.5" />
                        <span>Record Payment</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                        <CheckCircle className="w-3.5 h-3.5" /> Settled
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {showPaymentModal && selectedContribution && (
        <Modal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          title={`Record Payment: ${selectedContribution.orgName}`}
          subtitle={`Billing Period: ${selectedContribution.billingPeriod} | Outstanding: ${FinancialCalculator.formatRWF(selectedContribution.outstandingBalance)}`}
          maxWidth="lg"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePayment}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md"
              >
                Confirm Payment & Sync Ledger
              </button>
            </div>
          }
        >
          <form onSubmit={handleSavePayment} className="space-y-4">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1">
              <p className="font-bold">Automated Multi-Ledger Posting Active:</p>
              <p className="text-[11px] text-emerald-800">
                Submitting this payment will debit Cash/Bank (1000/1020), credit Accounts Receivable (1200), and record an official income transaction.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Payment Amount (RWF) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-mono font-bold text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Receipt / Transaction Date *</label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Payment Channel *</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-semibold"
                >
                  <option value="Bank Transfer">Bank Transfer (Bank of Kigali)</option>
                  <option value="Mobile Money">MTN MoMo Corporate</option>
                  <option value="Cash">Petty Cash</option>
                  <option value="Cheque">Official Bank Cheque</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Bank Reference / Txn ID</label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="e.g. BK-TXN-849201"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Audit Notes / Receipt Memo</label>
              <textarea
                rows={2}
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="e.g. Remittance received via BK online banking for August facility cost sharing."
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
