import { 
  DatabaseState 
} from './storageService';
import { 
  Account, 
  JournalLine, 
  SharedExpense, 
  Contribution, 
  BudgetLine 
} from '../types/financial';
import { FinancialCalculator } from './calculationService';

export interface TrialBalanceRow {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  normalBalance: 'Debit' | 'Credit';
  totalDebit: number;
  totalCredit: number;
  netDebit: number;
  netCredit: number;
  previousYearBalance: number;
}

export interface IncomeStatementItem {
  accountCode: string;
  accountName: string;
  actualAmount: number;
  budgetAmount: number;
  varianceAmount: number;
  variancePercent: number;
  previousYearAmount: number;
}

export interface IncomeStatementSection {
  title: string;
  type: 'Revenue' | 'Cost of Sales' | 'Other Income' | 'Administration Expense' | 'Other Expense';
  items: IncomeStatementItem[];
  totalActual: number;
  totalBudget: number;
  totalVariance: number;
  totalPreviousYear: number;
}

export interface StatementOfIncomeReport {
  fiscalYear: number;
  sections: IncomeStatementSection[];
  revenueTotal: number;
  costOfSalesTotal: number;
  grossProfit: number;
  otherIncomeTotal: number;
  adminExpensesTotal: number;
  otherExpensesTotal: number;
  netProfitBeforeTax: number;
  budgetNetProfit: number;
  netProfitVariance: number;
  previousYearNetProfit: number;
}

export interface SharedExpenseOrgSummary {
  orgId: string;
  orgName: string;
  code: string;
  monthlyAmount: number;
  annualAmount: number;
  percentageOfTotal: number;
  totalPaidYTD: number;
  outstandingBalance: number;
}

export class AccountingService {
  /**
   * Compute General Ledger with Running Balances
   */
  static getGeneralLedger(
    state: DatabaseState,
    filters?: {
      accountId?: string;
      accountType?: string;
      startDate?: string;
      endDate?: string;
      searchQuery?: string;
    }
  ): {
    lines: (JournalLine & {
      journalNumber: string;
      date: string;
      reference: string;
      status: string;
      runningBalance: number;
    })[];
    totalDebit: number;
    totalCredit: number;
    netBalance: number;
  } {
    let allLines: (JournalLine & {
      journalNumber: string;
      date: string;
      reference: string;
      status: string;
      runningBalance: number;
    })[] = [];

    // Extract all lines from posted journals
    state.journalEntries
      .filter((j) => j.status === 'Posted')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .forEach((journal) => {
        journal.lines.forEach((line) => {
          allLines.push({
            ...line,
            journalNumber: journal.journalNumber,
            date: journal.date,
            reference: journal.reference,
            status: journal.status,
            runningBalance: 0,
          });
        });
      });

    // Apply filters
    if (filters) {
      if (filters.accountId) {
        allLines = allLines.filter((l) => l.accountId === filters.accountId || l.accountCode === filters.accountId);
      }
      if (filters.startDate) {
        allLines = allLines.filter((l) => l.date >= filters.startDate!);
      }
      if (filters.endDate) {
        allLines = allLines.filter((l) => l.date <= filters.endDate!);
      }
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        allLines = allLines.filter(
          (l) =>
            l.accountName.toLowerCase().includes(q) ||
            l.accountCode.toLowerCase().includes(q) ||
            l.description.toLowerCase().includes(q) ||
            l.journalNumber.toLowerCase().includes(q)
        );
      }
    }

    let totalDebit = 0;
    let totalCredit = 0;
    let running = 0;

    const resultLines = allLines.map((line) => {
      totalDebit += line.debit;
      totalCredit += line.credit;
      running += line.debit - line.credit;
      return {
        ...line,
        runningBalance: running,
      };
    });

    return {
      lines: resultLines,
      totalDebit,
      totalCredit,
      netBalance: running,
    };
  }

  /**
   * Compute Complete Trial Balance
   */
  static getTrialBalance(state: DatabaseState): {
    rows: TrialBalanceRow[];
    totalDebits: number;
    totalCredits: number;
    difference: number;
    isBalanced: boolean;
    totalPrevDebits: number;
    totalPrevCredits: number;
  } {
    // Map of accountId/code to debits/credits
    const map = new Map<string, { debit: number; credit: number }>();

    state.accounts.forEach((acc) => {
      map.set(acc.id, { debit: 0, credit: 0 });
      map.set(acc.code, { debit: 0, credit: 0 });
    });

    // Aggregate posted journal lines
    state.journalEntries
      .filter((j) => j.status === 'Posted')
      .forEach((j) => {
        j.lines.forEach((line) => {
          const entry = map.get(line.accountId) || map.get(line.accountCode) || { debit: 0, credit: 0 };
          entry.debit += line.debit;
          entry.credit += line.credit;
          map.set(line.accountId, entry);
        });
      });

    let totalDebits = 0;
    let totalCredits = 0;
    let totalPrevDebits = 0;
    let totalPrevCredits = 0;

    const rows: TrialBalanceRow[] = state.accounts.map((acc) => {
      const data = map.get(acc.id) || { debit: 0, credit: 0 };
      
      // Account initial or transaction balance
      let debitVal = data.debit;
      let creditVal = data.credit;

      // Calculate net presentation balance
      let netDebit = 0;
      let netCredit = 0;

      if (acc.normalBalance === 'Debit') {
        const net = (acc.currentBalance > 0 ? acc.currentBalance : debitVal - creditVal);
        if (net >= 0) {
          netDebit = net;
        } else {
          netCredit = Math.abs(net);
        }
      } else {
        const net = (acc.currentBalance > 0 ? acc.currentBalance : creditVal - debitVal);
        if (net >= 0) {
          netCredit = net;
        } else {
          netDebit = Math.abs(net);
        }
      }

      totalDebits += netDebit;
      totalCredits += netCredit;

      if (acc.normalBalance === 'Debit') {
        totalPrevDebits += acc.previousYearBalance || 0;
      } else {
        totalPrevCredits += acc.previousYearBalance || 0;
      }

      return {
        accountId: acc.id,
        accountCode: acc.code,
        accountName: acc.name,
        accountType: acc.type,
        normalBalance: acc.normalBalance,
        totalDebit: debitVal,
        totalCredit: creditVal,
        netDebit,
        netCredit,
        previousYearBalance: acc.previousYearBalance || 0,
      };
    });

    const diff = Math.abs(totalDebits - totalCredits);
    const isBalanced = diff < 1.0;

    return {
      rows,
      totalDebits,
      totalCredits,
      difference: Math.round(diff * 100) / 100,
      isBalanced,
      totalPrevDebits,
      totalPrevCredits,
    };
  }

  /**
   * Generate Statement of Comprehensive Income (P&L) dynamically
   */
  static getStatementOfComprehensiveIncome(state: DatabaseState, fiscalYear = 2026): StatementOfIncomeReport {
    // Group accounts into P&L categories
    const categories: {
      title: string;
      type: IncomeStatementSection['type'];
      filter: (acc: Account) => boolean;
    } = [
      {
        title: 'Revenue',
        type: 'Revenue',
        filter: (a) => a.type === 'Revenue',
      },
      {
        title: 'Cost of Sales',
        type: 'Cost of Sales',
        filter: (a) => a.type === 'Cost of Sales',
      },
      {
        title: 'Other Income',
        type: 'Other Income',
        filter: (a) => a.type === 'Other Income',
      },
      {
        title: 'Administration & Shared Expenses',
        type: 'Administration Expense',
        filter: (a) => a.type === 'Administration Expense',
      },
      {
        title: 'Other Expenses',
        type: 'Other Expense',
        filter: (a) => a.type === 'Other Expense',
      },
    ] as any;

    const sections: IncomeStatementSection[] = [
      { title: 'Revenue', type: 'Revenue', items: [], totalActual: 0, totalBudget: 0, totalVariance: 0, totalPreviousYear: 0 },
      { title: 'Cost of Sales', type: 'Cost of Sales', items: [], totalActual: 0, totalBudget: 0, totalVariance: 0, totalPreviousYear: 0 },
      { title: 'Other Income', type: 'Other Income', items: [], totalActual: 0, totalBudget: 0, totalVariance: 0, totalPreviousYear: 0 },
      { title: 'Administration & Shared Expenses', type: 'Administration Expense', items: [], totalActual: 0, totalBudget: 0, totalVariance: 0, totalPreviousYear: 0 },
      { title: 'Other Expenses', type: 'Other Expense', items: [], totalActual: 0, totalBudget: 0, totalVariance: 0, totalPreviousYear: 0 },
    ];

    state.accounts.forEach((acc) => {
      let sectionIdx = -1;
      if (acc.type === 'Revenue') sectionIdx = 0;
      else if (acc.type === 'Cost of Sales') sectionIdx = 1;
      else if (acc.type === 'Other Income') sectionIdx = 2;
      else if (acc.type === 'Administration Expense') sectionIdx = 3;
      else if (acc.type === 'Other Expense') sectionIdx = 4;

      if (sectionIdx !== -1) {
        // Find budget for this account
        const budgetItem = state.budgetLines.find((b) => b.accountId === acc.id || b.accountCode === acc.code);
        const budgetAmount = budgetItem ? budgetItem.annualBudget : 0;
        const actualAmount = acc.currentBalance || 0;
        const varianceAmount = budgetAmount - actualAmount;
        const variancePercent = budgetAmount > 0 ? (varianceAmount / budgetAmount) * 100 : 0;
        const previousYearAmount = acc.previousYearBalance || 0;

        sections[sectionIdx].items.push({
          accountCode: acc.code,
          accountName: acc.name,
          actualAmount,
          budgetAmount,
          varianceAmount,
          variancePercent,
          previousYearAmount,
        });

        sections[sectionIdx].totalActual += actualAmount;
        sections[sectionIdx].totalBudget += budgetAmount;
        sections[sectionIdx].totalVariance += varianceAmount;
        sections[sectionIdx].totalPreviousYear += previousYearAmount;
      }
    });

    const revenueTotal = sections[0].totalActual;
    const costOfSalesTotal = sections[1].totalActual;
    const grossProfit = revenueTotal - costOfSalesTotal;
    const otherIncomeTotal = sections[2].totalActual;
    const adminExpensesTotal = sections[3].totalActual;
    const otherExpensesTotal = sections[4].totalActual;

    const netProfitBeforeTax = grossProfit + otherIncomeTotal - adminExpensesTotal - otherExpensesTotal;

    const budgetRevenue = sections[0].totalBudget;
    const budgetCOS = sections[1].totalBudget;
    const budgetOtherInc = sections[2].totalBudget;
    const budgetAdmin = sections[3].totalBudget;
    const budgetOtherExp = sections[4].totalBudget;
    const budgetNetProfit = (budgetRevenue - budgetCOS) + budgetOtherInc - budgetAdmin - budgetOtherExp;
    const netProfitVariance = netProfitBeforeTax - budgetNetProfit;

    const prevRevenue = sections[0].totalPreviousYear;
    const prevCOS = sections[1].totalPreviousYear;
    const prevOtherInc = sections[2].totalPreviousYear;
    const prevAdmin = sections[3].totalPreviousYear;
    const prevOtherExp = sections[4].totalPreviousYear;
    const previousYearNetProfit = (prevRevenue - prevCOS) + prevOtherInc - prevAdmin - prevOtherExp;

    return {
      fiscalYear,
      sections,
      revenueTotal,
      costOfSalesTotal,
      grossProfit,
      otherIncomeTotal,
      adminExpensesTotal,
      otherExpensesTotal,
      netProfitBeforeTax,
      budgetNetProfit,
      netProfitVariance,
      previousYearNetProfit,
    };
  }

  /**
   * Compute Shared Space Summary & Organization Breakdown
   */
  static getSharedSpaceSummary(state: DatabaseState): {
    totalAnnualSharedBudget: number;
    totalMonthlyNormalizedBudget: number;
    orgSummaries: SharedExpenseOrgSummary[];
    categoriesCount: number;
    activePoliciesCount: number;
    unreconciledCount: number;
  } {
    let totalAnnual = 0;
    let totalMonthly = 0;
    let unreconciledCount = 0;

    const orgMap = new Map<string, { monthly: number; annual: number }>();
    state.organizations.forEach((o) => {
      orgMap.set(o.id, { monthly: 0, annual: 0 });
    });

    state.sharedExpenses.forEach((exp) => {
      totalAnnual += exp.annualAmount;
      totalMonthly += exp.monthlyNormalizedAmount;

      // Check reconciliation
      let allocSum = 0;
      exp.allocations.forEach((alloc) => {
        allocSum += alloc.amount;
        const cur = orgMap.get(alloc.orgId) || { monthly: 0, annual: 0 };
        cur.monthly += alloc.monthlyShare || 0;
        cur.annual += (alloc.monthlyShare || 0) * 12;
        orgMap.set(alloc.orgId, cur);
      });

      if (Math.abs(allocSum - exp.totalAmount) > 1.0) {
        unreconciledCount++;
      }
    });

    const orgSummaries: SharedExpenseOrgSummary[] = state.organizations.map((org) => {
      const data = orgMap.get(org.id) || { monthly: 0, annual: 0 };
      const pct = totalMonthly > 0 ? (data.monthly / totalMonthly) * 100 : 0;

      // Calculate paid and outstanding from contributions
      const orgCtbs = state.contributions.filter((c) => c.orgId === org.id);
      const totalPaidYTD = orgCtbs.reduce((sum, c) => sum + (c.receivedAmount || 0), 0);
      const outstandingBalance = orgCtbs.reduce((sum, c) => sum + (c.outstandingBalance || 0), 0);

      return {
        orgId: org.id,
        orgName: org.name,
        code: org.code,
        monthlyAmount: Math.round(data.monthly),
        annualAmount: Math.round(data.annual),
        percentageOfTotal: Math.round(pct * 10) / 10,
        totalPaidYTD,
        outstandingBalance,
      };
    });

    return {
      totalAnnualSharedBudget: Math.round(totalAnnual),
      totalMonthlyNormalizedBudget: Math.round(totalMonthly),
      orgSummaries,
      categoriesCount: state.sharedExpenses.length,
      activePoliciesCount: state.allocationPolicies.filter((p) => p.status === 'active').length,
      unreconciledCount,
    };
  }

  /**
   * Statement of Cash Flows (Direct Method)
   */
  static getCashFlowStatement(state: DatabaseState): {
    operatingInflows: { description: string; amount: number }[];
    operatingOutflows: { description: string; amount: number }[];
    netOperatingCash: number;
    investingActivities: { description: string; amount: number }[];
    netInvestingCash: number;
    financingActivities: { description: string; amount: number }[];
    netFinancingCash: number;
    beginningCash: number;
    netChangeInCash: number;
    endingCash: number;
  } {
    const bankAccount = state.accounts.find((a) => a.code === '1000' || a.code === '1020') || state.accounts[0];
    const beginningCash = state.accounts
      .filter((a) => a.type === 'Cash and Cash Equivalents')
      .reduce((sum, a) => sum + (a.previousYearBalance || 0), 0);

    const operatingInflows: { description: string; amount: number }[] = [];
    state.incomeTransactions
      .filter((t) => t.status === 'Posted')
      .forEach((t) => {
        operatingInflows.push({ description: `${t.customer} - ${t.description}`, amount: t.totalWithTax });
      });

    const operatingOutflows: { description: string; amount: number }[] = [];
    state.expenseTransactions
      .filter((t) => t.status === 'Posted')
      .forEach((t) => {
        operatingOutflows.push({ description: `${t.vendor} - ${t.description}`, amount: t.totalWithTax });
      });

    const totalInflows = operatingInflows.reduce((s, i) => s + i.amount, 0);
    const totalOutflows = operatingOutflows.reduce((s, o) => s + o.amount, 0);
    const netOperatingCash = totalInflows - totalOutflows;

    const investingActivities = [
      { description: '3D Printer & Laser Machine Upgrades', amount: -2500000 },
      { description: 'PCB Milling Station Maintenance Tooling', amount: -800000 },
    ];
    const netInvestingCash = investingActivities.reduce((s, i) => s + i.amount, 0);

    const financingActivities = [
      { description: 'Resident Facility Cost Sharing Pre-payments', amount: 3500000 },
    ];
    const netFinancingCash = financingActivities.reduce((s, f) => s + f.amount, 0);

    const netChangeInCash = netOperatingCash + netInvestingCash + netFinancingCash;
    const endingCash = beginningCash + netChangeInCash;

    return {
      operatingInflows,
      operatingOutflows,
      netOperatingCash,
      investingActivities,
      netInvestingCash,
      financingActivities,
      netFinancingCash,
      beginningCash,
      netChangeInCash,
      endingCash,
    };
  }

  /**
   * Finance Control Center & Health Check
   */
  static getQualityReconciliation(state: DatabaseState): {
    trialBalanceBalanced: boolean;
    trialBalanceDifference: number;
    unreconciledSharedExpenses: SharedExpense[];
    budgetOverruns: { category: string; budget: number; actual: number; overrun: number }[];
    unapprovedTransactions: { id: string; type: string; number: string; amount: number; description: string }[];
    overdueContributions: Contribution[];
    healthScore: number;
  } {
    const tb = this.getTrialBalance(state);
    
    // Check shared expenses allocations
    const unreconciledSharedExpenses = state.sharedExpenses.filter((exp) => {
      const allocSum = exp.allocations.reduce((sum, a) => sum + a.amount, 0);
      return Math.abs(allocSum - exp.totalAmount) > 1.0;
    });

    // Check budget overruns
    const budgetOverruns: { category: string; budget: number; actual: number; overrun: number }[] = [];
    state.budgetLines.forEach((b) => {
      if (b.actualAmount > b.annualBudget) {
        budgetOverruns.push({
          category: b.category,
          budget: b.annualBudget,
          actual: b.actualAmount,
          overrun: b.actualAmount - b.annualBudget,
        });
      }
    });

    // Unapproved items
    const unapprovedTransactions: { id: string; type: string; number: string; amount: number; description: string }[] = [];
    state.sharedExpenses.filter((e) => e.status === 'Draft' || e.status === 'Submitted').forEach((e) => {
      unapprovedTransactions.push({ id: e.id, type: 'Shared Expense', number: e.expenseNumber, amount: e.totalAmount, description: e.description });
    });
    state.expenseTransactions.filter((e) => e.status === 'Draft' || e.status === 'Submitted').forEach((e) => {
      unapprovedTransactions.push({ id: e.id, type: 'Expense', number: e.expenseNumber, amount: e.totalWithTax, description: e.description });
    });
    state.incomeTransactions.filter((i) => i.status === 'Draft' || i.status === 'Submitted').forEach((i) => {
      unapprovedTransactions.push({ id: i.id, type: 'Income', number: i.incomeNumber, amount: i.totalWithTax, description: i.description });
    });

    // Overdue contributions
    const overdueContributions = state.contributions.filter((c) => c.status === 'Overdue' || (c.outstandingBalance > 0 && c.status !== 'Paid'));

    // Compute health score (0 - 100)
    let penalty = 0;
    if (!tb.isBalanced) penalty += 40;
    if (unreconciledSharedExpenses.length > 0) penalty += unreconciledSharedExpenses.length * 15;
    if (budgetOverruns.length > 0) penalty += budgetOverruns.length * 10;
    if (unapprovedTransactions.length > 0) penalty += unapprovedTransactions.length * 5;
    if (overdueContributions.length > 0) penalty += overdueContributions.length * 5;

    const healthScore = Math.max(0, Math.min(100, 100 - penalty));

    return {
      trialBalanceBalanced: tb.isBalanced,
      trialBalanceDifference: tb.difference,
      unreconciledSharedExpenses,
      budgetOverruns,
      unapprovedTransactions,
      overdueContributions,
      healthScore,
    };
  }
}
