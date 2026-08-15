import { 
  Organization, 
  Account, 
  AllocationPolicy, 
  SharedExpense, 
  ExpenseTransaction, 
  IncomeTransaction, 
  JournalEntry, 
  JournalLine,
  Contribution, 
  BudgetLine, 
  ForecastAssumption, 
  User, 
  AuditLog, 
  SystemSettings 
} from '../types/financial';
import { 
  INITIAL_SETTINGS, 
  INITIAL_USERS, 
  INITIAL_ORGANIZATIONS, 
  INITIAL_ACCOUNTS, 
  INITIAL_ALLOCATION_POLICIES, 
  INITIAL_SHARED_EXPENSES, 
  INITIAL_EXPENSE_TRANSACTIONS, 
  INITIAL_INCOME_TRANSACTIONS, 
  INITIAL_JOURNAL_ENTRIES, 
  INITIAL_CONTRIBUTIONS, 
  INITIAL_BUDGET_LINES, 
  INITIAL_FORECAST_ASSUMPTIONS, 
  INITIAL_AUDIT_LOGS 
} from '../data/initialData';
import { FinancialCalculator } from './calculationService';

const STORAGE_KEY = 'fablab_finance_db_v2';

export interface DatabaseState {
  settings: SystemSettings;
  users: User[];
  currentUser: User;
  organizations: Organization[];
  accounts: Account[];
  allocationPolicies: AllocationPolicy[];
  sharedExpenses: SharedExpense[];
  expenseTransactions: ExpenseTransaction[];
  incomeTransactions: IncomeTransaction[];
  journalEntries: JournalEntry[];
  contributions: Contribution[];
  budgetLines: BudgetLine[];
  forecastAssumptions: ForecastAssumption;
  auditLogs: AuditLog[];
}

class StorageService {
  private state: DatabaseState;
  private listeners: (() => void)[] = [];

  constructor() {
    this.state = this.loadInitialState();
  }

  private loadInitialState(): DatabaseState {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure all arrays exist
        return {
          settings: parsed.settings || INITIAL_SETTINGS,
          users: parsed.users || INITIAL_USERS,
          currentUser: parsed.currentUser || INITIAL_USERS[0],
          organizations: parsed.organizations || INITIAL_ORGANIZATIONS,
          accounts: parsed.accounts || INITIAL_ACCOUNTS,
          allocationPolicies: parsed.allocationPolicies || INITIAL_ALLOCATION_POLICIES,
          sharedExpenses: parsed.sharedExpenses || INITIAL_SHARED_EXPENSES,
          expenseTransactions: parsed.expenseTransactions || INITIAL_EXPENSE_TRANSACTIONS,
          incomeTransactions: parsed.incomeTransactions || INITIAL_INCOME_TRANSACTIONS,
          journalEntries: parsed.journalEntries || INITIAL_JOURNAL_ENTRIES,
          contributions: parsed.contributions || INITIAL_CONTRIBUTIONS,
          budgetLines: parsed.budgetLines || INITIAL_BUDGET_LINES,
          forecastAssumptions: parsed.forecastAssumptions || INITIAL_FORECAST_ASSUMPTIONS,
          auditLogs: parsed.auditLogs || INITIAL_AUDIT_LOGS,
        };
      }
    } catch (e) {
      console.error('Failed to load state from localStorage:', e);
    }

    return {
      settings: INITIAL_SETTINGS,
      users: INITIAL_USERS,
      currentUser: INITIAL_USERS[0],
      organizations: INITIAL_ORGANIZATIONS,
      accounts: INITIAL_ACCOUNTS,
      allocationPolicies: INITIAL_ALLOCATION_POLICIES,
      sharedExpenses: INITIAL_SHARED_EXPENSES,
      expenseTransactions: INITIAL_EXPENSE_TRANSACTIONS,
      incomeTransactions: INITIAL_INCOME_TRANSACTIONS,
      journalEntries: INITIAL_JOURNAL_ENTRIES,
      contributions: INITIAL_CONTRIBUTIONS,
      budgetLines: INITIAL_BUDGET_LINES,
      forecastAssumptions: INITIAL_FORECAST_ASSUMPTIONS,
      auditLogs: INITIAL_AUDIT_LOGS,
    };
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('LocalStorage persist warning:', e);
    }
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('Listener notification error:', err);
      }
    });
  }

  public getState(): DatabaseState {
    return this.state;
  }

  public setCurrentUser(user: User) {
    this.state.currentUser = user;
    this.logAudit('USER_LOGIN_SWITCH', 'Auth', user.id, undefined, `Switched active session to ${user.name} (${user.role})`);
    this.persist();
  }

  public logAudit(action: string, module: string, recordId: string, oldValue?: string, newValue?: string, details?: string) {
    const user = this.state.currentUser;
    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const newLog: AuditLog = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action,
      module,
      recordId,
      oldValue,
      newValue,
      ip: '197.243.22.45',
      details,
    };

    this.state.auditLogs.unshift(newLog);
    // Keep max 500 logs
    if (this.state.auditLogs.length > 500) {
      this.state.auditLogs = this.state.auditLogs.slice(0, 500);
    }
  }

  // --- ORGANIZATIONS ---
  public addOrganization(org: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>): Organization {
    const newOrg: Organization = {
      ...org,
      id: `org-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    this.state.organizations.push(newOrg);
    this.logAudit('CREATE_ORGANIZATION', 'Organizations', newOrg.id, undefined, `Created organization ${newOrg.name} (${newOrg.code})`);
    this.persist();
    return newOrg;
  }

  public updateOrganization(id: string, updates: Partial<Organization>) {
    const index = this.state.organizations.findIndex((o) => o.id === id);
    if (index !== -1) {
      const old = this.state.organizations[index];
      this.state.organizations[index] = {
        ...old,
        ...updates,
        updatedAt: new Date().toISOString().split('T')[0],
      };
      this.logAudit('UPDATE_ORGANIZATION', 'Organizations', id, JSON.stringify(old), JSON.stringify(updates));
      this.persist();
    }
  }

  // --- ACCOUNTS ---
  public addAccount(account: Omit<Account, 'id' | 'currentBalance' | 'previousYearBalance'>): Account {
    const newAccount: Account = {
      ...account,
      id: `acc-${account.code}`,
      currentBalance: 0,
      previousYearBalance: 0,
    };
    this.state.accounts.push(newAccount);
    this.logAudit('CREATE_ACCOUNT', 'Chart of Accounts', newAccount.id, undefined, `Created account ${newAccount.code} - ${newAccount.name}`);
    this.persist();
    return newAccount;
  }

  public updateAccount(id: string, updates: Partial<Account>) {
    const index = this.state.accounts.findIndex((a) => a.id === id);
    if (index !== -1) {
      const old = this.state.accounts[index];
      this.state.accounts[index] = { ...old, ...updates };
      this.logAudit('UPDATE_ACCOUNT', 'Chart of Accounts', id, old.name, updates.name || old.name);
      this.persist();
    }
  }

  // --- ALLOCATION POLICIES ---
  public addAllocationPolicy(policy: Omit<AllocationPolicy, 'id' | 'updatedAt'>): AllocationPolicy {
    const newPolicy: AllocationPolicy = {
      ...policy,
      id: `pol-${Date.now()}`,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    this.state.allocationPolicies.push(newPolicy);
    this.logAudit('CREATE_ALLOCATION_POLICY', 'Allocation Policies', newPolicy.id, undefined, `Created policy ${newPolicy.name} for ${newPolicy.categoryName}`);
    this.persist();
    return newPolicy;
  }

  public updateAllocationPolicy(id: string, updates: Partial<AllocationPolicy>) {
    const index = this.state.allocationPolicies.findIndex((p) => p.id === id);
    if (index !== -1) {
      const old = this.state.allocationPolicies[index];
      this.state.allocationPolicies[index] = {
        ...old,
        ...updates,
        updatedAt: new Date().toISOString().split('T')[0],
      };
      this.logAudit('UPDATE_ALLOCATION_POLICY', 'Allocation Policies', id, JSON.stringify(old.rules), JSON.stringify(updates.rules || old.rules));
      this.persist();
    }
  }

  // --- SHARED EXPENSES ---
  public addSharedExpense(expenseData: Omit<SharedExpense, 'id' | 'expenseNumber' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'monthlyNormalizedAmount' | 'quarterlyAmount' | 'annualAmount' | 'allocations'> & {
    policyRules?: { orgId: string; percentage: number }[];
  }): SharedExpense {
    const amounts = FinancialCalculator.calculateAmounts(expenseData.quantity, expenseData.unitPrice, expenseData.billingFrequency);
    
    // Find policy
    const policy = this.state.allocationPolicies.find((p) => p.id === expenseData.allocationPolicyId);
    const rules = expenseData.policyRules || (policy ? policy.rules : []);
    
    const allocationResult = FinancialCalculator.calculateAllocations(
      amounts.totalAmount,
      amounts.monthlyNormalizedAmount,
      rules,
      this.state.organizations
    );

    const expenseNumber = `SE-2026-${String(this.state.sharedExpenses.length + 1).padStart(3, '0')}`;
    const user = this.state.currentUser;
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);

    const newSharedExpense: SharedExpense = {
      ...expenseData,
      id: `se-${Date.now()}`,
      expenseNumber,
      totalAmount: amounts.totalAmount,
      monthlyNormalizedAmount: amounts.monthlyNormalizedAmount,
      quarterlyAmount: amounts.quarterlyAmount,
      annualAmount: amounts.annualAmount,
      allocations: allocationResult.allocations,
      createdBy: user.name,
      createdAt: nowStr,
      updatedBy: user.name,
      updatedAt: nowStr,
    };

    this.state.sharedExpenses.unshift(newSharedExpense);

    // If posted, automatically create accounting journal entry & expense transaction
    if (newSharedExpense.status === 'Posted') {
      this.syncSharedExpenseToLedger(newSharedExpense);
    }

    this.logAudit(
      'CREATE_SHARED_EXPENSE',
      'Shared Expenses',
      newSharedExpense.expenseNumber,
      undefined,
      `${newSharedExpense.description} (${FinancialCalculator.formatRWF(newSharedExpense.totalAmount)}) - Status: ${newSharedExpense.status}`
    );

    this.persist();
    return newSharedExpense;
  }

  public updateSharedExpenseStatus(id: string, newStatus: SharedExpense['status']) {
    const exp = this.state.sharedExpenses.find((e) => e.id === id);
    if (exp) {
      const oldStatus = exp.status;
      exp.status = newStatus;
      exp.updatedBy = this.state.currentUser.name;
      exp.updatedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
      if (newStatus === 'Approved' || newStatus === 'Posted') {
        exp.approvedBy = this.state.currentUser.name;
        exp.approvedAt = exp.updatedAt;
      }
      if (newStatus === 'Posted' && oldStatus !== 'Posted') {
        this.syncSharedExpenseToLedger(exp);
      }
      this.logAudit('UPDATE_EXPENSE_STATUS', 'Shared Expenses', exp.expenseNumber, oldStatus, newStatus);
      this.persist();
    }
  }

  public deleteSharedExpense(id: string) {
    const idx = this.state.sharedExpenses.findIndex((e) => e.id === id);
    if (idx !== -1) {
      const exp = this.state.sharedExpenses[idx];
      this.state.sharedExpenses.splice(idx, 1);
      this.logAudit('DELETE_SHARED_EXPENSE', 'Shared Expenses', exp.expenseNumber, undefined, `Deleted shared expense ${exp.description}`);
      this.persist();
    }
  }

  private syncSharedExpenseToLedger(exp: SharedExpense) {
    // Check if expense transaction already exists
    let expTx = this.state.expenseTransactions.find((t) => t.sharedExpenseId === exp.id);
    if (!expTx) {
      const account = this.state.accounts.find((a) => a.id === exp.accountId) || this.state.accounts.find((a) => a.code === exp.accountCode);
      const txNum = `EXP-2026-${String(this.state.expenseTransactions.length + 1).padStart(4, '0')}`;
      expTx = {
        id: `exp-${Date.now()}`,
        expenseNumber: txNum,
        date: exp.date,
        vendor: exp.category === 'Rent' ? 'Telecom House Lease Management' : exp.category === 'Electricity' ? 'Rwanda Energy Group (EUCL)' : exp.category === 'Internet' ? 'Liquid Intelligent Technologies' : `${exp.category} Service Provider`,
        description: exp.description,
        category: exp.category,
        accountId: exp.accountId,
        accountCode: exp.accountCode,
        accountName: account ? account.name : exp.category,
        amount: exp.totalAmount,
        tax: 0,
        totalWithTax: exp.totalAmount,
        paymentMethod: 'Bank Transfer',
        isShared: true,
        sharedExpenseId: exp.id,
        allocationPolicyId: exp.allocationPolicyId,
        supportingDocName: exp.supportingDocName,
        notes: exp.notes,
        status: 'Posted',
        createdBy: exp.createdBy,
        createdAt: exp.createdAt,
        updatedAt: exp.updatedAt,
        approvedBy: exp.approvedBy || this.state.currentUser.name,
      };
      this.state.expenseTransactions.unshift(expTx);
    }

    // Generate Double Entry Journal
    const journalNumber = `JNL-2026-${String(this.state.journalEntries.length + 1).padStart(3, '0')}`;
    const account = this.state.accounts.find((a) => a.id === exp.accountId) || this.state.accounts.find((a) => a.code === exp.accountCode);
    const bankAccount = this.state.accounts.find((a) => a.code === '1000') || this.state.accounts[0];

    const lines: JournalLine[] = [
      {
        id: `jl-${Date.now()}-1`,
        accountId: exp.accountId,
        accountCode: exp.accountCode,
        accountName: account ? account.name : exp.category,
        description: exp.description,
        debit: exp.totalAmount,
        credit: 0,
        branch: 'Kigali Main',
        department: 'Operations',
      },
      {
        id: `jl-${Date.now()}-2`,
        accountId: bankAccount.id,
        accountCode: bankAccount.code,
        accountName: bankAccount.name,
        description: `Payment for ${exp.description}`,
        debit: 0,
        credit: exp.totalAmount,
        branch: 'Kigali Main',
        department: 'Treasury',
      },
    ];

    const newJournal: JournalEntry = {
      id: `jnl-${Date.now()}`,
      journalNumber,
      date: exp.date,
      description: `Auto-generated shared expense posting: ${exp.description}`,
      reference: exp.expenseNumber,
      status: 'Posted',
      lines,
      totalDebit: exp.totalAmount,
      totalCredit: exp.totalAmount,
      isBalanced: true,
      createdBy: this.state.currentUser.name,
      createdAt: exp.createdAt,
      postedAt: exp.updatedAt,
    };

    this.state.journalEntries.unshift(newJournal);

    // Update account balances
    if (account) {
      account.currentBalance += exp.totalAmount;
    }
    if (bankAccount) {
      bankAccount.currentBalance -= exp.totalAmount;
    }
  }

  // --- EXPENSE TRANSACTIONS ---
  public addExpenseTransaction(expenseData: Omit<ExpenseTransaction, 'id' | 'expenseNumber' | 'createdAt' | 'updatedAt' | 'createdBy' | 'totalWithTax'>): ExpenseTransaction {
    const expenseNumber = `EXP-2026-${String(this.state.expenseTransactions.length + 1).padStart(4, '0')}`;
    const totalWithTax = (expenseData.amount || 0) + (expenseData.tax || 0);
    const user = this.state.currentUser;
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);

    const newExp: ExpenseTransaction = {
      ...expenseData,
      id: `exp-${Date.now()}`,
      expenseNumber,
      totalWithTax,
      createdBy: user.name,
      createdAt: nowStr,
      updatedAt: nowStr,
    };

    this.state.expenseTransactions.unshift(newExp);

    if (newExp.status === 'Posted') {
      this.syncExpenseToJournal(newExp);
    }

    this.logAudit('CREATE_EXPENSE', 'Transactions', newExp.expenseNumber, undefined, `${newExp.description} (${FinancialCalculator.formatRWF(newExp.totalWithTax)})`);
    this.persist();
    return newExp;
  }

  public updateExpenseTransactionStatus(id: string, newStatus: ExpenseTransaction['status']) {
    const exp = this.state.expenseTransactions.find((e) => e.id === id);
    if (exp) {
      const oldStatus = exp.status;
      exp.status = newStatus;
      exp.updatedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
      if (newStatus === 'Approved' || newStatus === 'Posted') {
        exp.approvedBy = this.state.currentUser.name;
      }
      if (newStatus === 'Posted' && oldStatus !== 'Posted') {
        this.syncExpenseToJournal(exp);
      }
      this.logAudit('UPDATE_EXPENSE_STATUS', 'Transactions', exp.expenseNumber, oldStatus, newStatus);
      this.persist();
    }
  }

  public approveExpense(id: string) {
    this.updateExpenseTransactionStatus(id, 'Approved');
  }

  public deleteExpenseTransaction(id: string) {
    const idx = this.state.expenseTransactions.findIndex((e) => e.id === id);
    if (idx !== -1) {
      const exp = this.state.expenseTransactions[idx];
      this.state.expenseTransactions.splice(idx, 1);
      this.logAudit('DELETE_EXPENSE', 'Transactions', exp.expenseNumber, undefined, `Deleted expense ${exp.description}`);
      this.persist();
    }
  }

  public deleteIncomeTransaction(id: string) {
    const idx = this.state.incomeTransactions.findIndex((e) => e.id === id);
    if (idx !== -1) {
      const inc = this.state.incomeTransactions[idx];
      this.state.incomeTransactions.splice(idx, 1);
      this.logAudit('DELETE_INCOME', 'Transactions', inc.incomeNumber, undefined, `Deleted income ${inc.description}`);
      this.persist();
    }
  }

  private syncExpenseToJournal(exp: ExpenseTransaction) {
    const journalNumber = `JNL-2026-${String(this.state.journalEntries.length + 1).padStart(3, '0')}`;
    const account = this.state.accounts.find((a) => a.id === exp.accountId) || this.state.accounts.find((a) => a.code === exp.accountCode);
    const bankAccount = this.state.accounts.find((a) => a.code === (exp.paymentMethod.includes('Momo') ? '1020' : '1000')) || this.state.accounts[0];

    const lines: JournalLine[] = [
      {
        id: `jl-${Date.now()}-1`,
        accountId: exp.accountId,
        accountCode: exp.accountCode,
        accountName: exp.accountName,
        description: exp.description,
        debit: exp.amount,
        credit: 0,
        branch: 'Kigali Main',
        department: 'Operations',
      },
    ];

    if (exp.tax > 0) {
      const taxAcc = this.state.accounts.find((a) => a.code === '2200') || this.state.accounts[0];
      lines.push({
        id: `jl-${Date.now()}-tax`,
        accountId: taxAcc.id,
        accountCode: taxAcc.code,
        accountName: taxAcc.name,
        description: 'Input Tax / Withholding',
        debit: exp.tax,
        credit: 0,
        branch: 'Kigali Main',
        department: 'Tax',
      });
    }

    lines.push({
      id: `jl-${Date.now()}-2`,
      accountId: bankAccount.id,
      accountCode: bankAccount.code,
      accountName: bankAccount.name,
      description: `Payment to ${exp.vendor}`,
      debit: 0,
      credit: exp.totalWithTax,
      branch: 'Kigali Main',
      department: 'Treasury',
    });

    const newJournal: JournalEntry = {
      id: `jnl-${Date.now()}`,
      journalNumber,
      date: exp.date,
      description: `Expense settlement: ${exp.description}`,
      reference: exp.expenseNumber,
      status: 'Posted',
      lines,
      totalDebit: exp.totalWithTax,
      totalCredit: exp.totalWithTax,
      isBalanced: true,
      createdBy: this.state.currentUser.name,
      createdAt: exp.createdAt,
      postedAt: exp.updatedAt,
    };

    this.state.journalEntries.unshift(newJournal);

    if (account) {
      account.currentBalance += exp.amount;
    }
    if (bankAccount) {
      bankAccount.currentBalance -= exp.totalWithTax;
    }
  }

  // --- INCOME TRANSACTIONS ---
  public addIncomeTransaction(incomeData: Omit<IncomeTransaction, 'id' | 'incomeNumber' | 'createdAt' | 'updatedAt' | 'createdBy' | 'totalWithTax'>): IncomeTransaction {
    const incomeNumber = `INC-2026-${String(this.state.incomeTransactions.length + 1).padStart(4, '0')}`;
    const totalWithTax = (incomeData.amount || 0) + (incomeData.tax || 0);
    const user = this.state.currentUser;
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);

    const newInc: IncomeTransaction = {
      ...incomeData,
      id: `inc-${Date.now()}`,
      incomeNumber,
      totalWithTax,
      createdBy: user.name,
      createdAt: nowStr,
      updatedAt: nowStr,
    };

    this.state.incomeTransactions.unshift(newInc);

    if (newInc.status === 'Posted') {
      this.syncIncomeToJournal(newInc);
    }

    this.logAudit('CREATE_INCOME', 'Transactions', newInc.incomeNumber, undefined, `${newInc.description} (${FinancialCalculator.formatRWF(newInc.totalWithTax)})`);
    this.persist();
    return newInc;
  }

  private syncIncomeToJournal(inc: IncomeTransaction) {
    const journalNumber = `JNL-2026-${String(this.state.journalEntries.length + 1).padStart(3, '0')}`;
    const account = this.state.accounts.find((a) => a.id === inc.accountId) || this.state.accounts.find((a) => a.code === inc.accountCode);
    const bankAccount = this.state.accounts.find((a) => a.code === (inc.paymentMethod.includes('Momo') ? '1020' : '1000')) || this.state.accounts[0];

    const lines: JournalLine[] = [
      {
        id: `jl-${Date.now()}-1`,
        accountId: bankAccount.id,
        accountCode: bankAccount.code,
        accountName: bankAccount.name,
        description: `Receipt from ${inc.customer}`,
        debit: inc.totalWithTax,
        credit: 0,
        branch: 'Kigali Main',
        department: 'Treasury',
      },
      {
        id: `jl-${Date.now()}-2`,
        accountId: inc.accountId,
        accountCode: inc.accountCode,
        accountName: inc.accountName,
        description: inc.description,
        debit: 0,
        credit: inc.amount,
        branch: 'Kigali Main',
        department: 'Revenue',
      },
    ];

    if (inc.tax > 0) {
      const taxAcc = this.state.accounts.find((a) => a.code === '2200') || this.state.accounts[0];
      lines.push({
        id: `jl-${Date.now()}-tax`,
        accountId: taxAcc.id,
        accountCode: taxAcc.code,
        accountName: taxAcc.name,
        description: 'Output VAT / WHT collected',
        debit: 0,
        credit: inc.tax,
        branch: 'Kigali Main',
        department: 'Tax',
      });
    }

    const newJournal: JournalEntry = {
      id: `jnl-${Date.now()}`,
      journalNumber,
      date: inc.date,
      description: `Income receipt: ${inc.description}`,
      reference: inc.incomeNumber,
      status: 'Posted',
      lines,
      totalDebit: inc.totalWithTax,
      totalCredit: inc.totalWithTax,
      isBalanced: true,
      createdBy: this.state.currentUser.name,
      createdAt: inc.createdAt,
      postedAt: inc.updatedAt,
    };

    this.state.journalEntries.unshift(newJournal);

    if (account) {
      account.currentBalance += inc.amount;
    }
    if (bankAccount) {
      bankAccount.currentBalance += inc.totalWithTax;
    }
  }

  // --- MANUAL JOURNAL ENTRIES ---
  public addJournalEntry(entry: Omit<JournalEntry, 'id' | 'journalNumber' | 'createdAt' | 'createdBy' | 'totalDebit' | 'totalCredit' | 'isBalanced'>): JournalEntry {
    const val = FinancialCalculator.validateJournalEntry(entry.lines);
    if (!val.isBalanced) {
      throw new Error(val.errorMessage || 'Journal entry is not balanced.');
    }

    const journalNumber = `JNL-2026-${String(this.state.journalEntries.length + 1).padStart(3, '0')}`;
    const user = this.state.currentUser;
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);

    const newJournal: JournalEntry = {
      ...entry,
      id: `jnl-${Date.now()}`,
      journalNumber,
      totalDebit: val.totalDebit,
      totalCredit: val.totalCredit,
      isBalanced: true,
      createdBy: user.name,
      createdAt: nowStr,
    };

    this.state.journalEntries.unshift(newJournal);

    // Apply line balances to accounts
    if (newJournal.status === 'Posted') {
      entry.lines.forEach((line) => {
        const acc = this.state.accounts.find((a) => a.id === line.accountId || a.code === line.accountCode);
        if (acc) {
          if (acc.normalBalance === 'Debit') {
            acc.currentBalance += (line.debit - line.credit);
          } else {
            acc.currentBalance += (line.credit - line.debit);
          }
        }
      });
    }

    this.logAudit('CREATE_JOURNAL_ENTRY', 'General Ledger', newJournal.journalNumber, undefined, `${newJournal.description} (${FinancialCalculator.formatRWF(val.totalDebit)})`);
    this.persist();
    return newJournal;
  }

  // --- CONTRIBUTIONS ---
  public recordContributionPayment(id: string, payment: {
    receivedAmount: number;
    paymentDate: string;
    paymentMethod: Contribution['paymentMethod'];
    reference: string;
    notes?: string;
  }) {
    const contribution = this.state.contributions.find((c) => c.id === id);
    if (contribution) {
      const oldVal = `Received: ${contribution.receivedAmount}, Balance: ${contribution.outstandingBalance}`;
      const newReceived = (contribution.receivedAmount || 0) + payment.receivedAmount;
      const newOutstanding = Math.max(0, contribution.expectedAmount - newReceived);

      contribution.receivedAmount = newReceived;
      contribution.outstandingBalance = newOutstanding;
      contribution.paymentDate = payment.paymentDate;
      contribution.paymentMethod = payment.paymentMethod;
      contribution.reference = payment.reference;
      contribution.notes = payment.notes || contribution.notes;
      contribution.status = newOutstanding === 0 ? 'Paid' : newReceived > 0 ? 'Partially Paid' : 'Pending';
      contribution.updatedAt = new Date().toISOString().split('T')[0];

      // Auto-record Income transaction for this contribution
      this.addIncomeTransaction({
        date: payment.paymentDate,
        customer: contribution.orgName,
        description: `${contribution.billingPeriod} Shared Space Contribution`,
        accountId: 'acc-4000',
        accountCode: '4000',
        accountName: 'Shared Space Facility Contributions',
        amount: payment.receivedAmount,
        tax: 0,
        paymentMethod: payment.paymentMethod || 'Bank Transfer',
        organizationId: contribution.orgId,
        project: 'Facility Cost Sharing',
        notes: `Recorded via Contribution payment: Ref ${payment.reference}`,
        status: 'Posted',
      });

      this.logAudit(
        'RECORD_CONTRIBUTION_PAYMENT',
        'Contributions',
        contribution.id,
        oldVal,
        `Payment of ${FinancialCalculator.formatRWF(payment.receivedAmount)} recorded for ${contribution.orgName}. New Status: ${contribution.status}`
      );

      this.persist();
    }
  }

  public addContribution(ctb: Omit<Contribution, 'id' | 'outstandingBalance' | 'updatedAt'>): Contribution {
    const outstandingBalance = Math.max(0, ctb.expectedAmount - (ctb.receivedAmount || 0));
    const newCtb: Contribution = {
      ...ctb,
      id: `ctb-${Date.now()}`,
      outstandingBalance,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    this.state.contributions.push(newCtb);
    this.logAudit('CREATE_CONTRIBUTION_SCHEDULE', 'Contributions', newCtb.id, undefined, `${newCtb.orgName} - ${newCtb.billingPeriod} (${FinancialCalculator.formatRWF(newCtb.expectedAmount)})`);
    this.persist();
    return newCtb;
  }

  // --- USERS ---
  public addUser(user: User): User {
    this.state.users.push(user);
    this.logAudit('CREATE_USER', 'Users', user.id, undefined, `Created user ${user.name} (${user.role})`);
    this.persist();
    return user;
  }

  public updateUser(id: string, updates: Partial<User>) {
    const idx = this.state.users.findIndex((u) => u.id === id);
    if (idx !== -1) {
      const old = this.state.users[idx];
      this.state.users[idx] = { ...old, ...updates };
      this.logAudit('UPDATE_USER', 'Users', id, JSON.stringify(old), JSON.stringify(updates));
      this.persist();
    }
  }

  public deleteUser(id: string) {
    const idx = this.state.users.findIndex((u) => u.id === id);
    if (idx !== -1) {
      const u = this.state.users[idx];
      this.state.users.splice(idx, 1);
      this.logAudit('DELETE_USER', 'Users', id, undefined, `Deleted user ${u.name}`);
      this.persist();
    }
  }

  // --- BUDGETS ---
  public addBudgetLine(budget: Omit<BudgetLine, 'id' | 'actualAmount'>): BudgetLine {
    const newBudget: BudgetLine = {
      ...budget,
      id: `bdg-${Date.now()}`,
      actualAmount: 0,
    };
    this.state.budgetLines.push(newBudget);
    this.logAudit('CREATE_BUDGET', 'Budgets', newBudget.id, undefined, `${newBudget.category} - ${FinancialCalculator.formatRWF(newBudget.annualBudget)}`);
    this.persist();
    return newBudget;
  }

  public updateBudgetLine(id: string, updates: Partial<BudgetLine>) {
    const index = this.state.budgetLines.findIndex((b) => b.id === id);
    if (index !== -1) {
      const old = this.state.budgetLines[index];
      this.state.budgetLines[index] = { ...old, ...updates };
      this.logAudit('UPDATE_BUDGET', 'Budgets', id, JSON.stringify(old), JSON.stringify(updates));
      this.persist();
    }
  }

  // --- FORECAST ASSUMPTIONS ---
  public updateForecastAssumptions(updates: Partial<ForecastAssumption>) {
    this.state.forecastAssumptions = {
      ...this.state.forecastAssumptions,
      ...updates,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    this.logAudit(
      'UPDATE_FORECAST_ASSUMPTIONS',
      'Forecasts',
      this.state.forecastAssumptions.id,
      undefined,
      `General: ${this.state.forecastAssumptions.generalInflationRate}%, Utilities: ${this.state.forecastAssumptions.utilitiesEscalationRate}%`
    );
    this.persist();
  }

  // --- SETTINGS ---
  public updateSettings(updates: Partial<SystemSettings>) {
    this.state.settings = {
      ...this.state.settings,
      ...updates,
    };
    this.logAudit('UPDATE_SETTINGS', 'Settings', 'SYSTEM', undefined, JSON.stringify(updates));
    this.persist();
  }

  // --- RESET TO FACTORY BASELINE ---
  public resetToFactoryDefaults() {
    this.state = {
      settings: INITIAL_SETTINGS,
      users: INITIAL_USERS,
      currentUser: INITIAL_USERS[0],
      organizations: INITIAL_ORGANIZATIONS,
      accounts: INITIAL_ACCOUNTS,
      allocationPolicies: INITIAL_ALLOCATION_POLICIES,
      sharedExpenses: INITIAL_SHARED_EXPENSES,
      expenseTransactions: INITIAL_EXPENSE_TRANSACTIONS,
      incomeTransactions: INITIAL_INCOME_TRANSACTIONS,
      journalEntries: INITIAL_JOURNAL_ENTRIES,
      contributions: INITIAL_CONTRIBUTIONS,
      budgetLines: INITIAL_BUDGET_LINES,
      forecastAssumptions: INITIAL_FORECAST_ASSUMPTIONS,
      auditLogs: INITIAL_AUDIT_LOGS,
    };
    this.persist();
  }

  // --- BULK IMPORT ---
  public importBulkData(data: Partial<DatabaseState>) {
    if (data.organizations) this.state.organizations = data.organizations;
    if (data.accounts) this.state.accounts = data.accounts;
    if (data.sharedExpenses) this.state.sharedExpenses = data.sharedExpenses;
    if (data.allocationPolicies) this.state.allocationPolicies = data.allocationPolicies;
    if (data.contributions) this.state.contributions = data.contributions;
    if (data.budgetLines) this.state.budgetLines = data.budgetLines;

    this.logAudit('BULK_IMPORT_DATA', 'Data Import', 'BULK', undefined, 'Imported dataset records successfully.');
    this.persist();
  }
}

export const storageService = new StorageService();
