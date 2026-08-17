import { db } from '../db';
import { 
  accounts, 
  expenseTransactions, 
  incomeTransactions, 
  journalEntries, 
  sharedExpenses, 
  allocationPolicies, 
  contributions, 
  budgets, 
  forecastAssumptions, 
  auditLogs,
  organizations
} from '../db/schema';
import { eq, desc, sql } from 'drizzle-orm';

export interface CalculationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class ServerAccountingEngine {
  /**
   * Server-side exact expense calculation with tax and line precision
   */
  static calculateExpense(quantity: number, unitPrice: number, taxRate: number = 0) {
    const qty = Math.max(0, Number(quantity) || 0);
    const price = Math.max(0, Number(unitPrice) || 0);
    const rate = Math.max(0, Number(taxRate) || 0);

    const subtotal = Math.round(qty * price * 100) / 100;
    const taxAmount = Math.round(subtotal * (rate / 100) * 100) / 100;
    const totalWithTax = Math.round((subtotal + taxAmount) * 100) / 100;

    return {
      quantity: qty,
      unitPrice: price,
      subtotal,
      taxRate: rate,
      taxAmount,
      totalWithTax,
    };
  }

  /**
   * Server-side Shared Facility Apportionment Calculation
   * Validates 100% rule and exact amount reconciliation
   */
  static calculateAllocation(
    totalAmount: number,
    rules: Array<{ organizationId: string; organizationName: string; percentage: number }>
  ) {
    const total = Math.round(Number(totalAmount) || 0);
    const totalPercentage = rules.reduce((sum, r) => sum + Number(r.percentage || 0), 0);

    // Rule: Total percentage must equal 100% (+- 0.01 for rounding precision)
    if (Math.abs(totalPercentage - 100) > 0.01) {
      throw new Error(`Allocation percentages must equal 100%. Current sum is ${totalPercentage}%.`);
    }

    let allocatedSum = 0;
    const allocations = rules.map((r, index) => {
      let amount = 0;
      if (index === rules.length - 1) {
        // Last organization receives remainder to ensure exact rounding equality to the franc
        amount = total - allocatedSum;
      } else {
        amount = Math.round((total * Number(r.percentage)) / 100);
        allocatedSum += amount;
      }

      return {
        orgId: r.organizationId,
        orgName: r.organizationName,
        percentage: Number(r.percentage),
        amount,
      };
    });

    const sumAllocated = allocations.reduce((s, a) => s + a.amount, 0);
    if (sumAllocated !== total) {
      throw new Error(`Allocated amount (${sumAllocated} RWF) does not reconcile with original expense (${total} RWF).`);
    }

    return allocations;
  }

  /**
   * Generates balanced double-entry journal lines for Expense or Income
   */
  static generateExpenseJournalLines(params: {
    expenseNumber: string;
    expenseAccountCode: string;
    expenseAccountName: string;
    paymentMethod: string;
    totalAmount: number;
    description: string;
    isShared?: boolean;
    organizationAllocations?: Array<{ orgId: string; orgName: string; amount: number }>;
  }) {
    const { totalAmount, expenseAccountCode, expenseAccountName, paymentMethod, description, isShared, organizationAllocations } = params;

    // Credit side: Bank or Cash depending on payment method
    let creditAccountCode = '1010'; // Bank Account
    let creditAccountName = 'Bank of Kigali (Operating)';
    if (paymentMethod === 'Cash' || paymentMethod === 'Petty Cash') {
      creditAccountCode = '1000';
      creditAccountName = 'Petty Cash';
    } else if (paymentMethod === 'Mobile Money' || paymentMethod === 'MoMo') {
      creditAccountCode = '1020';
      creditAccountName = 'Mobile Money (MoMo Pay)';
    }

    const lines: Array<{
      id: string;
      accountCode: string;
      accountName: string;
      description: string;
      debit: number;
      credit: number;
      organizationId?: string;
    }> = [];

    if (isShared && organizationAllocations && organizationAllocations.length > 0) {
      // Create allocated debit lines per tenant
      organizationAllocations.forEach((alloc, idx) => {
        lines.push({
          id: `line-${idx + 1}`,
          accountCode: expenseAccountCode,
          accountName: `${expenseAccountName} (${alloc.orgName})`,
          description: `${description} - ${alloc.orgName} Share`,
          debit: alloc.amount,
          credit: 0,
          organizationId: alloc.orgId,
        });
      });
    } else {
      // Single debit line
      lines.push({
        id: 'line-1',
        accountCode: expenseAccountCode,
        accountName: expenseAccountName,
        description,
        debit: totalAmount,
        credit: 0,
      });
    }

    // Single credit line for full amount
    lines.push({
      id: `line-${lines.length + 1}`,
      accountCode: creditAccountCode,
      accountName: creditAccountName,
      description: `Payment via ${paymentMethod} for ${params.expenseNumber}`,
      debit: 0,
      credit: totalAmount,
    });

    const totalDebit = lines.reduce((s, l) => s + l.debit, 0);
    const totalCredit = lines.reduce((s, l) => s + l.credit, 0);

    if (totalDebit !== totalCredit) {
      throw new Error(`Unbalanced journal: Total Debits (${totalDebit}) != Total Credits (${totalCredit})`);
    }

    return {
      lines,
      totalDebit,
      totalCredit,
      isBalanced: totalDebit === totalCredit,
    };
  }

  /**
   * Generates balanced double-entry journal lines for Income receipt
   */
  static generateIncomeJournalLines(params: {
    incomeNumber: string;
    incomeAccountCode: string;
    incomeAccountName: string;
    depositAccountCode: string;
    depositAccountName: string;
    amount: number;
    description: string;
    organizationId?: string;
  }) {
    const { amount, incomeAccountCode, incomeAccountName, depositAccountCode, depositAccountName, description, organizationId } = params;

    const lines = [
      {
        id: 'line-1',
        accountCode: depositAccountCode,
        accountName: depositAccountName,
        description: `Deposit: ${description}`,
        debit: amount,
        credit: 0,
        organizationId,
      },
      {
        id: 'line-2',
        accountCode: incomeAccountCode,
        accountName: incomeAccountName,
        description: `Revenue: ${description}`,
        debit: 0,
        credit: amount,
        organizationId,
      },
    ];

    return {
      lines,
      totalDebit: amount,
      totalCredit: amount,
      isBalanced: true,
    };
  }

  /**
   * Compute General Ledger from all posted journal entries
   */
  static async computeGeneralLedger(filterAccountCode?: string) {
    const postedEntries = await db
      .select()
      .from(journalEntries)
      .where(eq(journalEntries.status, 'Posted' as any))
      .orderBy(journalEntries.date);

    const allAccounts = await db.select().from(accounts);
    const accountMap = new Map(allAccounts.map((a) => [a.code, a]));

    const ledgerRows: any[] = [];
    const balances: Record<string, number> = {};

    // Initialize with opening/previous balances
    allAccounts.forEach((acc) => {
      balances[acc.code] = Number(acc.prevYearBalance) || 0;
    });

    for (const entry of postedEntries) {
      const lines = entry.lines as any[];
      for (const line of lines) {
        if (filterAccountCode && line.accountCode !== filterAccountCode) {
          continue;
        }

        const acc = accountMap.get(line.accountCode);
        const normalBalance = acc?.normalBalance || 'Debit';

        const debit = Number(line.debit) || 0;
        const credit = Number(line.credit) || 0;

        if (normalBalance === 'Debit') {
          balances[line.accountCode] = (balances[line.accountCode] || 0) + debit - credit;
        } else {
          balances[line.accountCode] = (balances[line.accountCode] || 0) + credit - debit;
        }

        ledgerRows.push({
          id: `${entry.id}-${line.id}`,
          date: entry.date,
          journalNumber: entry.entryNumber,
          accountCode: line.accountCode,
          accountName: line.accountName || acc?.name || 'Unknown Account',
          description: line.description || entry.description,
          referenceType: entry.referenceType,
          referenceId: entry.referenceId,
          debit,
          credit,
          runningBalance: balances[line.accountCode],
          organizationId: line.organizationId,
        });
      }
    }

    return ledgerRows;
  }

  /**
   * Compute Trial Balance from posted entries and chart of accounts
   */
  static async computeTrialBalance() {
    const allAccounts = await db.select().from(accounts).orderBy(accounts.code);
    const postedEntries = await db
      .select()
      .from(journalEntries)
      .where(eq(journalEntries.status, 'Posted' as any));

    const debitSums: Record<string, number> = {};
    const creditSums: Record<string, number> = {};

    postedEntries.forEach((entry) => {
      const lines = entry.lines as any[];
      lines.forEach((line) => {
        debitSums[line.accountCode] = (debitSums[line.accountCode] || 0) + (Number(line.debit) || 0);
        creditSums[line.accountCode] = (creditSums[line.accountCode] || 0) + (Number(line.credit) || 0);
      });
    });

    let totalDebits = 0;
    let totalCredits = 0;

    const rows = allAccounts.map((acc) => {
      const lineDebit = debitSums[acc.code] || 0;
      const lineCredit = creditSums[acc.code] || 0;

      let netDebit = 0;
      let netCredit = 0;

      if (acc.normalBalance === 'Debit') {
        const net = (Number(acc.prevYearBalance) || 0) + lineDebit - lineCredit;
        if (net >= 0) {
          netDebit = net;
        } else {
          netCredit = Math.abs(net);
        }
      } else {
        const net = (Number(acc.prevYearBalance) || 0) + lineCredit - lineDebit;
        if (net >= 0) {
          netCredit = net;
        } else {
          netDebit = Math.abs(net);
        }
      }

      totalDebits += netDebit;
      totalCredits += netCredit;

      return {
        id: acc.id,
        code: acc.code,
        name: acc.name,
        type: acc.type,
        category: acc.category,
        normalBalance: acc.normalBalance,
        debit: netDebit,
        credit: netCredit,
        prevYearDebit: acc.normalBalance === 'Debit' ? Number(acc.prevYearBalance) || 0 : 0,
        prevYearCredit: acc.normalBalance === 'Credit' ? Number(acc.prevYearBalance) || 0 : 0,
      };
    });

    const difference = Math.abs(totalDebits - totalCredits);

    return {
      rows,
      totalDebits,
      totalCredits,
      difference,
      isBalanced: difference === 0,
      status: difference === 0 ? 'BALANCED' : 'NOT BALANCED',
    };
  }

  /**
   * Compute IFRS Statement of Comprehensive Income
   */
  static async computeIncomeStatement() {
    const allAccounts = await db.select().from(accounts);
    const postedEntries = await db
      .select()
      .from(journalEntries)
      .where(eq(journalEntries.status, 'Posted' as any));

    const debitSums: Record<string, number> = {};
    const creditSums: Record<string, number> = {};

    postedEntries.forEach((entry) => {
      const lines = entry.lines as any[];
      lines.forEach((line) => {
        debitSums[line.accountCode] = (debitSums[line.accountCode] || 0) + (Number(line.debit) || 0);
        creditSums[line.accountCode] = (creditSums[line.accountCode] || 0) + (Number(line.credit) || 0);
      });
    });

    let totalRevenue = 0;
    let totalCostOfSales = 0;
    let totalOtherIncome = 0;
    let totalAdminExpenses = 0;
    let totalOtherExpenses = 0;

    const sections: Record<string, any[]> = {
      revenue: [],
      costOfSales: [],
      otherIncome: [],
      adminExpenses: [],
      otherExpenses: [],
    };

    allAccounts.forEach((acc) => {
      const debits = debitSums[acc.code] || 0;
      const credits = creditSums[acc.code] || 0;

      let netAmount = 0;
      if (acc.category === 'Revenue') {
        netAmount = credits - debits; // Normal credit balance
      } else if (acc.category === 'Expense') {
        netAmount = debits - credits; // Normal debit balance
      }

      if (netAmount === 0 && Number(acc.budgetAnnual) === 0) {
        return;
      }

      const row = {
        code: acc.code,
        name: acc.name,
        actual: netAmount,
        budget: Number(acc.budgetAnnual) || 0,
        variance: (Number(acc.budgetAnnual) || 0) - netAmount,
        variancePercent:
          Number(acc.budgetAnnual) > 0
            ? Math.round((((Number(acc.budgetAnnual) || 0) - netAmount) / Number(acc.budgetAnnual)) * 1000) / 10
            : 0,
        prevYear: Number(acc.prevYearBalance) || 0,
      };

      if (acc.type === 'Revenue' || acc.type === 'Operating Revenue') {
        sections.revenue.push(row);
        totalRevenue += netAmount;
      } else if (acc.type === 'Cost of Sales') {
        sections.costOfSales.push(row);
        totalCostOfSales += netAmount;
      } else if (acc.type === 'Other Income') {
        sections.otherIncome.push(row);
        totalOtherIncome += netAmount;
      } else if (acc.type === 'Administration Expense') {
        sections.adminExpenses.push(row);
        totalAdminExpenses += netAmount;
      } else if (acc.type === 'Other Expense') {
        sections.otherExpenses.push(row);
        totalOtherExpenses += netAmount;
      }
    });

    const grossProfit = totalRevenue - totalCostOfSales;
    const totalExpenses = totalAdminExpenses + totalOtherExpenses;
    const netOperatingProfit = grossProfit + totalOtherIncome - totalExpenses;

    return {
      sections,
      totalRevenue,
      totalCostOfSales,
      grossProfit,
      totalOtherIncome,
      totalAdminExpenses,
      totalOtherExpenses,
      totalExpenses,
      netOperatingProfit,
      profitBeforeTax: netOperatingProfit,
    };
  }

  /**
   * Compute Real-time Dashboard KPIs and Visual Datasets
   */
  static async computeDashboardSummary() {
    const is = await this.computeIncomeStatement();
    const tb = await this.computeTrialBalance();
    
    // Compute cash & bank balances (Accounts 1000, 1010, 1020)
    const cashAccounts = tb.rows.filter((r) => ['1000', '1010', '1020'].includes(r.code));
    const cashBalance = cashAccounts.reduce((sum, r) => sum + r.debit - r.credit, 0);

    // Compute Accounts Receivable (1200) and Accounts Payable (2000)
    const arRow = tb.rows.find((r) => r.code === '1200');
    const apRow = tb.rows.find((r) => r.code === '2000');
    const accountsReceivable = arRow ? arRow.debit - arRow.credit : 0;
    const accountsPayable = apRow ? apRow.credit - apRow.debit : 0;

    // Contributions metrics
    const allContributions = await db.select().from(contributions);
    const expectedContributions = allContributions.reduce((s, c) => s + Number(c.expectedAmount || 0), 0);
    const receivedContributions = allContributions.reduce((s, c) => s + Number(c.receivedAmount || 0), 0);
    const outstandingContributions = allContributions.reduce((s, c) => s + Number(c.outstandingBalance || 0), 0);

    // Shared facility master schedule sum
    const allShared = await db.select().from(sharedExpenses).where(eq(sharedExpenses.isActive, true));
    const sharedAnnualTotal = allShared.reduce((s, se) => s + Number(se.annualAmount || 0), 0);
    const sharedMonthlyTotal = allShared.reduce((s, se) => s + Number(se.monthlyNormalizedAmount || 0), 0);

    // Budget vs Actual summary
    const allBudgets = await db.select().from(budgets);
    const totalAnnualBudget = allBudgets.reduce((s, b) => s + Number(b.annualBudget || 0), 0);
    const budgetUtilization = totalAnnualBudget > 0 ? Math.round((is.totalExpenses / totalAnnualBudget) * 1000) / 10 : 0;

    return {
      kpis: {
        totalRevenue: is.totalRevenue,
        totalExpenses: is.totalExpenses,
        netIncome: is.netOperatingProfit,
        cashBalance,
        accountsReceivable,
        accountsPayable,
        sharedAnnualTotal,
        sharedMonthlyTotal,
        expectedContributions,
        receivedContributions,
        outstandingContributions,
        totalAnnualBudget,
        budgetUtilization,
        isTrialBalanceBalanced: tb.isBalanced,
        trialBalanceDifference: tb.difference,
      },
      qualityScore: {
        totalDebit: tb.totalDebits,
        totalCredit: tb.totalCredits,
        difference: tb.difference,
        status: tb.status,
      },
    };
  }
}
