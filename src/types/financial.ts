export type UserRole = 
  | 'ADMIN' 
  | 'FINANCE_MANAGER' 
  | 'FINANCIAL_ANALYST' 
  | 'ACCOUNTANT' 
  | 'VIEWER' 
  | 'AUDITOR';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  organizationId?: string; // e.g. org-fablab, org-klab, org-fabcafe, org-250startups
  organizationName?: string;
  avatar?: string;
  lastLogin?: string;
  status: 'active' | 'inactive';
}

export interface Organization {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  floorAreaSqM: number;
  headcount: number;
  status: 'active' | 'inactive';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type BillingFrequency = 'monthly' | 'quarterly' | 'annual' | 'one_off';

export type AllocationBasis = 
  | 'floor_area' 
  | 'electricity_usage' 
  | 'water_usage' 
  | 'headcount' 
  | 'equal_split' 
  | 'direct_assignment' 
  | 'custom_percentage';

export interface AllocationRule {
  orgId: string;
  percentage: number; // e.g. 30 for 30%
}

export interface AllocationPolicy {
  id: string;
  name: string;
  categoryName: string;
  basis: AllocationBasis;
  rules: AllocationRule[];
  effectiveDate: string;
  expiryDate?: string;
  status: 'active' | 'archived';
  approvedBy: string;
  approvalDate: string;
  notes?: string;
  updatedAt: string;
}

export type TransactionStatus = 'Draft' | 'Submitted' | 'Approved' | 'Rejected' | 'Posted' | 'Cancelled';

export type PaymentMethod = 'Bank Transfer' | 'Momo / MoMoPay' | 'Cheque' | 'Cash' | 'Credit Card';

export interface OrgAllocationResult {
  orgId: string;
  orgName: string;
  percentage: number;
  amount: number;
  monthlyShare: number;
}

export interface SharedExpense {
  id: string;
  expenseNumber: string;
  date: string;
  description: string;
  category: string;
  accountId: string;
  accountCode: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  billingFrequency: BillingFrequency;
  monthlyNormalizedAmount: number;
  quarterlyAmount: number;
  annualAmount: number;
  isShared: boolean;
  allocationPolicyId: string;
  allocations: OrgAllocationResult[];
  supportingDocName?: string;
  supportingDocSize?: string;
  notes?: string;
  submitterComments?: string;
  submittedByOrgId?: string;
  submittedByOrgName?: string;
  submittedByEmail?: string;
  adminRemarks?: string;
  rejectionReason?: string;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  status: TransactionStatus;
  approvedBy?: string;
  approvedAt?: string;
}

export interface ExpenseTransaction {
  id: string;
  expenseNumber: string;
  date: string;
  vendor: string;
  description: string;
  category: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  amount: number;
  tax: number;
  totalWithTax: number;
  paymentMethod: PaymentMethod;
  organizationId?: string; // If direct org expense
  isShared: boolean;
  sharedExpenseId?: string;
  allocationPolicyId?: string;
  supportingDocName?: string;
  notes?: string;
  status: TransactionStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  approvedBy?: string;
}

export interface IncomeTransaction {
  id: string;
  incomeNumber: string;
  date: string;
  customer: string;
  description: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  amount: number;
  tax: number;
  totalWithTax: number;
  paymentMethod: PaymentMethod;
  organizationId?: string;
  project?: string;
  supportingDocName?: string;
  notes?: string;
  status: TransactionStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  approvedBy?: string;
}

export type AccountType = 
  | 'Revenue' 
  | 'Cost of Sales' 
  | 'Other Income' 
  | 'Administration Expense' 
  | 'Other Expense' 
  | 'Cash and Cash Equivalents' 
  | 'Trade Receivables' 
  | 'Other Current Assets' 
  | 'Property, Plant and Equipment' 
  | 'Current Liabilities' 
  | 'Non-current Liabilities' 
  | 'Equity' 
  | 'Retained Earnings';

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  parentAccountId?: string;
  isActive: boolean;
  description: string;
  normalBalance: 'Debit' | 'Credit';
  currentBalance: number;
  previousYearBalance: number;
}

export interface JournalLine {
  id: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  description: string;
  debit: number;
  credit: number;
  branch?: string;
  department?: string;
}

export interface JournalEntry {
  id: string;
  journalNumber: string;
  date: string;
  description: string;
  reference: string;
  status: TransactionStatus;
  lines: JournalLine[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  createdBy: string;
  createdAt: string;
  postedAt?: string;
}

export type ContributionStatus = 'Pending' | 'Partially Paid' | 'Paid' | 'Overdue' | 'Cancelled';

export interface Contribution {
  id: string;
  orgId: string;
  orgName: string;
  billingPeriod: string; // e.g. "2026-08" or "August 2026"
  year: number;
  month: number;
  expectedAmount: number;
  invoicedAmount: number;
  receivedAmount: number;
  outstandingBalance: number;
  paymentDate?: string;
  paymentMethod?: PaymentMethod;
  reference?: string;
  status: ContributionStatus;
  notes?: string;
  updatedAt: string;
}

export interface BudgetLine {
  id: string;
  year: number;
  accountId: string;
  accountCode: string;
  accountName: string;
  category: string;
  orgId?: string;
  annualBudget: number;
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  actualAmount: number;
  notes?: string;
}

export interface ForecastAssumption {
  id: string;
  name: string;
  baseYear: number;
  generalInflationRate: number; // e.g. 13.6%
  utilitiesEscalationRate: number; // e.g. 20.5%
  staffEscalationRate: number;
  notes?: string;
  updatedAt: string;
}

export interface ForecastRow {
  category: string;
  accountCode: string;
  isUtility: boolean;
  base2026: number;
  forecast2027: number;
  forecast2028: number;
  forecast2029: number;
  growthRate: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  module: string;
  recordId: string;
  oldValue?: string;
  newValue?: string;
  ip?: string;
  details?: string;
}

export interface SystemSettings {
  organizationName: string;
  tagline: string;
  currency: string;
  fiscalYear: number;
  defaultGeneralEscalation: number;
  defaultUtilitiesEscalation: number;
  requireApprovalForSharedExpense: boolean;
  approvalThresholdRWF: number;
  contactEmail: string;
  address: string;
}

export interface FinancialFilter {
  fiscalYear: number;
  month?: number;
  quarter?: number;
  orgId?: string;
  categoryId?: string;
  accountId?: string;
  searchQuery?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

export interface TestResultItem {
  id: string;
  name: string;
  description: string;
  category: 'Calculations' | 'Reconciliation' | 'Accounting' | 'Export';
  status: 'PASS' | 'FAIL' | 'RUNNING';
  expected: string;
  actual: string;
  executionTimeMs: number;
  details?: string;
}
