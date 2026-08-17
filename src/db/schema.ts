import { 
  pgTable, 
  text, 
  varchar, 
  numeric, 
  integer, 
  boolean, 
  timestamp, 
  jsonb, 
  pgEnum 
} from 'drizzle-orm/pg-core';

// PostgreSQL Enums for rigorous type safety
export const userRoleEnum = pgEnum('user_role', [
  'ADMIN',
  'FINANCE_MANAGER',
  'FINANCIAL_ANALYST',
  'ACCOUNTANT',
  'VIEWER',
  'AUDITOR'
]);

export const accountCategoryEnum = pgEnum('account_category', [
  'Asset',
  'Liability',
  'Equity',
  'Revenue',
  'Expense'
]);

export const normalBalanceEnum = pgEnum('normal_balance', [
  'Debit',
  'Credit'
]);

export const transactionStatusEnum = pgEnum('transaction_status', [
  'Draft',
  'Pending Approval',
  'Approved',
  'Posted',
  'Reversed'
]);

export const frequencyEnum = pgEnum('billing_frequency', [
  'Monthly',
  'Quarterly',
  'Annual',
  'One-off'
]);

export const contributionStatusEnum = pgEnum('contribution_status', [
  'Pending',
  'Partially Paid',
  'Paid in Full',
  'Overdue'
]);

// 1. Users Table
export const users = pgTable('users', {
  id: varchar('id', { length: 64 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash'),
  role: userRoleEnum('role').notNull().default('VIEWER'),
  department: varchar('department', { length: 255 }),
  avatar: varchar('avatar', { length: 16 }),
  status: varchar('status', { length: 32 }).notNull().default('active'),
  lastLogin: timestamp('last_login', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// 2. Roles & Permissions Table
export const rolePermissions = pgTable('role_permissions', {
  id: varchar('id', { length: 64 }).primaryKey(),
  role: userRoleEnum('role').notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  permissions: jsonb('permissions').notNull().$type<string[]>(),
  userCount: integer('user_count').default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// 3. Organizations (Co-located Facility Tenants)
export const organizations = pgTable('organizations', {
  id: varchar('id', { length: 64 }).primaryKey(),
  code: varchar('code', { length: 32 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  contactPerson: varchar('contact_person', { length: 255 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 64 }),
  defaultSharePercentage: numeric('default_share_percentage', { precision: 5, scale: 2 }).notNull(),
  headcount: integer('headcount').default(0),
  spaceOccupiedSqM: numeric('space_occupied_sq_m', { precision: 8, scale: 2 }).default('0'),
  status: varchar('status', { length: 32 }).notNull().default('active'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// 4. Chart of Accounts (IFRS Compliant General Ledger Structure)
export const accounts = pgTable('accounts', {
  id: varchar('id', { length: 64 }).primaryKey(),
  code: varchar('code', { length: 32 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 128 }).notNull(),
  category: accountCategoryEnum('category').notNull(),
  normalBalance: normalBalanceEnum('normal_balance').notNull(),
  currentBalance: numeric('current_balance', { precision: 15, scale: 2 }).notNull().default('0.00'),
  prevYearBalance: numeric('prev_year_balance', { precision: 15, scale: 2 }).notNull().default('0.00'),
  budgetAnnual: numeric('budget_annual', { precision: 15, scale: 2 }).notNull().default('0.00'),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  isSystem: boolean('is_system').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// 5. Allocation Policies & Rules for Shared Facility Apportionment
export const allocationPolicies = pgTable('allocation_policies', {
  id: varchar('id', { length: 64 }).primaryKey(),
  code: varchar('code', { length: 32 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  basis: varchar('basis', { length: 64 }).notNull(), // 'fixed_percentage' | 'headcount' | 'area_sqm' | 'usage_metered'
  rules: jsonb('rules').notNull().$type<Array<{
    organizationId: string;
    organizationName: string;
    percentage: number;
    fixedAmount?: number;
  }>>(),
  applicableCategories: jsonb('applicable_categories').notNull().$type<string[]>(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// 6. Shared Expenses Registry (53,200,600 RWF Facility Master Schedule)
export const sharedExpenses = pgTable('shared_expenses', {
  id: varchar('id', { length: 64 }).primaryKey(),
  category: varchar('category', { length: 128 }).notNull(),
  accountCode: varchar('account_code', { length: 32 }).notNull(),
  description: text('description').notNull(),
  frequency: frequencyEnum('frequency').notNull(),
  amountPerPeriod: numeric('amount_per_period', { precision: 15, scale: 2 }).notNull(),
  periodsPerYear: integer('periods_per_year').notNull(),
  annualAmount: numeric('annual_amount', { precision: 15, scale: 2 }).notNull(),
  monthlyNormalizedAmount: numeric('monthly_normalized_amount', { precision: 15, scale: 2 }).notNull(),
  policyId: varchar('policy_id', { length: 64 }).notNull(),
  allocations: jsonb('allocations').notNull().$type<Array<{
    orgId: string;
    orgName: string;
    percentage: number;
    annualAmount: number;
    monthlyAmount: number;
    perPeriodAmount: number;
  }>>(),
  notes: text('notes'),
  isUtility: boolean('is_utility').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// 7. Expense Transactions
export const expenseTransactions = pgTable('expense_transactions', {
  id: varchar('id', { length: 64 }).primaryKey(),
  expenseNumber: varchar('expense_number', { length: 64 }).notNull().unique(),
  date: varchar('date', { length: 32 }).notNull(),
  vendor: varchar('vendor', { length: 255 }).notNull(),
  description: text('description').notNull(),
  category: varchar('category', { length: 128 }).notNull(),
  accountCode: varchar('account_code', { length: 32 }).notNull(),
  paymentMethod: varchar('payment_method', { length: 64 }).notNull(),
  quantity: numeric('quantity', { precision: 10, scale: 2 }).notNull().default('1.00'),
  unitPrice: numeric('unit_price', { precision: 15, scale: 2 }).notNull(),
  subtotal: numeric('subtotal', { precision: 15, scale: 2 }).notNull(),
  taxRate: numeric('tax_rate', { precision: 5, scale: 2 }).notNull().default('0.00'),
  taxAmount: numeric('tax_amount', { precision: 15, scale: 2 }).notNull().default('0.00'),
  totalWithTax: numeric('total_with_tax', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 16 }).notNull().default('RWF'),
  isShared: boolean('is_shared').notNull().default(false),
  sharedExpenseId: varchar('shared_expense_id', { length: 64 }),
  allocationPolicyId: varchar('allocation_policy_id', { length: 64 }),
  organizationAllocations: jsonb('organization_allocations').$type<Array<{
    orgId: string;
    orgName: string;
    percentage: number;
    amount: number;
  }>>(),
  status: transactionStatusEnum('status').notNull().default('Draft'),
  createdBy: varchar('created_by', { length: 255 }).notNull(),
  approvedBy: varchar('approved_by', { length: 255 }),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  postedBy: varchar('posted_by', { length: 255 }),
  postedAt: timestamp('posted_at', { withTimezone: true }),
  journalEntryId: varchar('journal_entry_id', { length: 64 }),
  attachmentName: varchar('attachment_name', { length: 255 }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// 8. Income Transactions
export const incomeTransactions = pgTable('income_transactions', {
  id: varchar('id', { length: 64 }).primaryKey(),
  incomeNumber: varchar('income_number', { length: 64 }).notNull().unique(),
  date: varchar('date', { length: 32 }).notNull(),
  payer: varchar('payer', { length: 255 }).notNull(),
  description: text('description').notNull(),
  category: varchar('category', { length: 128 }).notNull(),
  accountCode: varchar('account_code', { length: 32 }).notNull(),
  depositAccountCode: varchar('deposit_account_code', { length: 32 }).notNull(),
  paymentMethod: varchar('payment_method', { length: 64 }).notNull(),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 16 }).notNull().default('RWF'),
  status: transactionStatusEnum('status').notNull().default('Draft'),
  organizationId: varchar('organization_id', { length: 64 }),
  isContribution: boolean('is_contribution').notNull().default(false),
  contributionId: varchar('contribution_id', { length: 64 }),
  createdBy: varchar('created_by', { length: 255 }).notNull(),
  approvedBy: varchar('approved_by', { length: 255 }),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  postedBy: varchar('posted_by', { length: 255 }),
  postedAt: timestamp('posted_at', { withTimezone: true }),
  journalEntryId: varchar('journal_entry_id', { length: 64 }),
  attachmentName: varchar('attachment_name', { length: 255 }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// 9. Double-Entry Journal Entries
export const journalEntries = pgTable('journal_entries', {
  id: varchar('id', { length: 64 }).primaryKey(),
  entryNumber: varchar('entry_number', { length: 64 }).notNull().unique(),
  date: varchar('date', { length: 32 }).notNull(),
  referenceType: varchar('reference_type', { length: 64 }).notNull(), // 'Expense' | 'Income' | 'Contribution' | 'Manual'
  referenceId: varchar('reference_id', { length: 64 }),
  description: text('description').notNull(),
  totalDebit: numeric('total_debit', { precision: 15, scale: 2 }).notNull(),
  totalCredit: numeric('total_credit', { precision: 15, scale: 2 }).notNull(),
  isBalanced: boolean('is_balanced').notNull().default(true),
  status: transactionStatusEnum('status').notNull().default('Posted'),
  postedBy: varchar('posted_by', { length: 255 }).notNull(),
  postedAt: timestamp('posted_at', { withTimezone: true }).defaultNow(),
  lines: jsonb('lines').notNull().$type<Array<{
    id: string;
    accountCode: string;
    accountName: string;
    description: string;
    debit: number;
    credit: number;
    organizationId?: string;
    department?: string;
  }>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// 10. Partner Contributions Register
export const contributions = pgTable('contributions', {
  id: varchar('id', { length: 64 }).primaryKey(),
  contributionNumber: varchar('contribution_number', { length: 64 }).notNull().unique(),
  organizationId: varchar('organization_id', { length: 64 }).notNull(),
  organizationName: varchar('organization_name', { length: 255 }).notNull(),
  period: varchar('period', { length: 64 }).notNull(),
  fiscalYear: integer('fiscal_year').notNull(),
  expectedAmount: numeric('expected_amount', { precision: 15, scale: 2 }).notNull(),
  invoicedAmount: numeric('invoiced_amount', { precision: 15, scale: 2 }).notNull(),
  receivedAmount: numeric('received_amount', { precision: 15, scale: 2 }).notNull().default('0.00'),
  outstandingBalance: numeric('outstanding_balance', { precision: 15, scale: 2 }).notNull(),
  status: contributionStatusEnum('status').notNull().default('Pending'),
  dueDate: varchar('due_date', { length: 32 }).notNull(),
  paymentDate: varchar('payment_date', { length: 32 }),
  paymentReference: varchar('payment_reference', { length: 128 }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// 11. Budgets & Budget Lines
export const budgets = pgTable('budgets', {
  id: varchar('id', { length: 64 }).primaryKey(),
  fiscalYear: integer('fiscal_year').notNull(),
  accountCode: varchar('account_code', { length: 32 }).notNull(),
  accountName: varchar('account_name', { length: 255 }).notNull(),
  category: varchar('category', { length: 128 }).notNull(),
  annualBudget: numeric('annual_budget', { precision: 15, scale: 2 }).notNull(),
  q1Budget: numeric('q1_budget', { precision: 15, scale: 2 }).notNull(),
  q2Budget: numeric('q2_budget', { precision: 15, scale: 2 }).notNull(),
  q3Budget: numeric('q3_budget', { precision: 15, scale: 2 }).notNull(),
  q4Budget: numeric('q4_budget', { precision: 15, scale: 2 }).notNull(),
  actualYTD: numeric('actual_ytd', { precision: 15, scale: 2 }).notNull().default('0.00'),
  varianceAmount: numeric('variance_amount', { precision: 15, scale: 2 }).notNull().default('0.00'),
  variancePercentage: numeric('variance_percentage', { precision: 8, scale: 2 }).notNull().default('0.00'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// 12. Forecast Assumptions
export const forecastAssumptions = pgTable('forecast_assumptions', {
  id: varchar('id', { length: 64 }).primaryKey(),
  generalInflationRate: numeric('general_inflation_rate', { precision: 5, scale: 2 }).notNull().default('13.60'),
  utilitiesEscalationRate: numeric('utilities_escalation_rate', { precision: 5, scale: 2 }).notNull().default('20.50'),
  revenueGrowthRate: numeric('revenue_growth_rate', { precision: 5, scale: 2 }).notNull().default('15.00'),
  rentEscalationRate: numeric('rent_escalation_rate', { precision: 5, scale: 2 }).notNull().default('10.00'),
  headcountGrowthRate: numeric('headcount_growth_rate', { precision: 5, scale: 2 }).notNull().default('5.00'),
  baseYear: integer('base_year').notNull().default(2026),
  notes: text('notes'),
  updatedBy: varchar('updated_by', { length: 255 }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// 13. Audit Trail & Financial Controls
export const auditLogs = pgTable('audit_logs', {
  id: varchar('id', { length: 64 }).primaryKey(),
  timestamp: varchar('timestamp', { length: 64 }).notNull(),
  userId: varchar('user_id', { length: 64 }).notNull(),
  userName: varchar('user_name', { length: 255 }).notNull(),
  action: varchar('action', { length: 128 }).notNull(),
  module: varchar('module', { length: 128 }).notNull(),
  recordId: varchar('record_id', { length: 64 }).notNull(),
  details: text('details').notNull(),
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  ipAddress: varchar('ip_address', { length: 64 }),
  status: varchar('status', { length: 32 }).notNull().default('SUCCESS'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// 14. System Settings
export const systemSettings = pgTable('system_settings', {
  id: varchar('id', { length: 64 }).primaryKey(),
  organizationName: varchar('organization_name', { length: 255 }).notNull().default('FabLab Rwanda'),
  tagline: varchar('tagline', { length: 255 }),
  currency: varchar('currency', { length: 16 }).notNull().default('RWF'),
  fiscalYear: integer('fiscal_year').notNull().default(2026),
  defaultGeneralEscalation: numeric('default_general_escalation', { precision: 5, scale: 2 }).notNull().default('13.60'),
  defaultUtilitiesEscalation: numeric('default_utilities_escalation', { precision: 5, scale: 2 }).notNull().default('20.50'),
  requireApprovalForSharedExpense: boolean('require_approval_for_shared_expense').notNull().default(true),
  approvalThresholdRWF: numeric('approval_threshold_rwf', { precision: 15, scale: 2 }).notNull().default('500000.00'),
  contactEmail: varchar('contact_email', { length: 255 }),
  address: text('address'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// 15. Attachments
export const attachments = pgTable('attachments', {
  id: varchar('id', { length: 64 }).primaryKey(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileType: varchar('file_type', { length: 128 }).notNull(),
  fileSize: integer('file_size').notNull(),
  fileData: text('file_data').notNull(), // Base64 storage
  relatedEntity: varchar('related_entity', { length: 64 }).notNull(), // 'expense' | 'income' | 'journal' | 'contract'
  relatedId: varchar('related_id', { length: 64 }).notNull(),
  uploadedBy: varchar('uploaded_by', { length: 255 }).notNull(),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).defaultNow(),
});
