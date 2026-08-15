import { 
  BillingFrequency, 
  AllocationRule, 
  OrgAllocationResult, 
  Organization, 
  JournalLine, 
  ForecastRow 
} from '../types/financial';

export class FinancialCalculator {
  /**
   * Calculate derived normalized monthly, quarterly, and annual amounts from billing frequency
   */
  static calculateAmounts(
    quantity: number,
    unitPrice: number,
    frequency: BillingFrequency
  ): {
    totalAmount: number;
    monthlyNormalizedAmount: number;
    quarterlyAmount: number;
    annualAmount: number;
  } {
    const rawTotal = (quantity || 0) * (unitPrice || 0);

    let monthlyNormalized = 0;
    let quarterly = 0;
    let annual = 0;

    switch (frequency) {
      case 'monthly':
        monthlyNormalized = rawTotal;
        quarterly = rawTotal * 3;
        annual = rawTotal * 12;
        break;
      case 'quarterly':
        monthlyNormalized = rawTotal / 3;
        quarterly = rawTotal;
        annual = rawTotal * 4;
        break;
      case 'annual':
        monthlyNormalized = rawTotal / 12;
        quarterly = rawTotal / 4;
        annual = rawTotal;
        break;
      case 'one_off':
        monthlyNormalized = rawTotal / 12;
        quarterly = rawTotal / 4;
        annual = rawTotal;
        break;
    }

    return {
      totalAmount: Math.round(rawTotal * 100) / 100,
      monthlyNormalizedAmount: Math.round(monthlyNormalized * 100) / 100,
      quarterlyAmount: Math.round(quarterly * 100) / 100,
      annualAmount: Math.round(annual * 100) / 100,
    };
  }

  /**
   * Distribute shared expense across organizations with mathematical precision
   */
  static calculateAllocations(
    totalAmount: number,
    monthlyNormalizedAmount: number,
    rules: AllocationRule[],
    organizations: Organization[]
  ): {
    allocations: OrgAllocationResult[];
    totalPercentage: number;
    totalAllocatedAmount: number;
    totalMonthlyAllocated: number;
    isReconciled: boolean;
    discrepancy: number;
    errorMessage?: string;
  } {
    let totalPercentage = 0;
    let totalAllocatedAmount = 0;
    let totalMonthlyAllocated = 0;

    const allocations: OrgAllocationResult[] = rules.map((rule) => {
      const org = organizations.find((o) => o.id === rule.orgId);
      const orgName = org ? org.name : `Org (${rule.orgId})`;
      const pct = rule.percentage || 0;
      totalPercentage += pct;

      const orgAmount = Math.round((totalAmount * (pct / 100)) * 100) / 100;
      const orgMonthly = Math.round((monthlyNormalizedAmount * (pct / 100)) * 100) / 100;

      totalAllocatedAmount += orgAmount;
      totalMonthlyAllocated += orgMonthly;

      return {
        orgId: rule.orgId,
        orgName,
        percentage: pct,
        amount: orgAmount,
        monthlyShare: orgMonthly,
      };
    });

    const isPct100 = Math.abs(totalPercentage - 100) < 0.05;
    const diff = Math.abs(totalAllocatedAmount - totalAmount);
    const isReconciled = isPct100 && diff < 1.0;

    let errorMessage: string | undefined;
    if (!isPct100) {
      errorMessage = `Allocation percentages total ${totalPercentage.toFixed(1)}% instead of 100%. Please adjust policy percentages.`;
    } else if (!isReconciled) {
      errorMessage = `Allocation amount (${totalAllocatedAmount.toLocaleString()} RWF) does not match total expense (${totalAmount.toLocaleString()} RWF). Discrepancy: ${diff.toLocaleString()} RWF.`;
    }

    return {
      allocations,
      totalPercentage: Math.round(totalPercentage * 100) / 100,
      totalAllocatedAmount: Math.round(totalAllocatedAmount * 100) / 100,
      totalMonthlyAllocated: Math.round(totalMonthlyAllocated * 100) / 100,
      isReconciled,
      discrepancy: Math.round(diff * 100) / 100,
      errorMessage,
    };
  }

  /**
   * Budget variance calculation with zero-safe handling
   */
  static calculateBudgetVariance(budget: number, actual: number): {
    variance: number;
    variancePercentage: number;
    utilizationPercentage: number;
    remainingBudget: number;
    isOverBudget: boolean;
  } {
    const variance = budget - actual;
    const remainingBudget = Math.max(0, variance);
    const isOverBudget = actual > budget;

    let variancePercentage = 0;
    let utilizationPercentage = 0;

    if (budget > 0) {
      variancePercentage = (variance / budget) * 100;
      utilizationPercentage = (actual / budget) * 100;
    } else if (actual > 0) {
      variancePercentage = -100;
      utilizationPercentage = 100;
    }

    return {
      variance: Math.round(variance * 100) / 100,
      variancePercentage: Math.round(variancePercentage * 10) / 10,
      utilizationPercentage: Math.round(utilizationPercentage * 10) / 10,
      remainingBudget: Math.round(remainingBudget * 100) / 100,
      isOverBudget,
    };
  }

  /**
   * Check double-entry journal balance
   */
  static validateJournalEntry(lines: JournalLine[]): {
    totalDebit: number;
    totalCredit: number;
    difference: number;
    isBalanced: boolean;
    errorMessage?: string;
  } {
    let totalDebit = 0;
    let totalCredit = 0;

    for (const line of lines) {
      totalDebit += line.debit || 0;
      totalCredit += line.credit || 0;
    }

    const difference = Math.abs(totalDebit - totalCredit);
    const isBalanced = difference < 0.01 && totalDebit > 0;

    let errorMessage: string | undefined;
    if (totalDebit === 0 && totalCredit === 0) {
      errorMessage = 'Journal entry cannot have zero debits and credits.';
    } else if (!isBalanced) {
      errorMessage = `Journal is out of balance: Total Debits (${totalDebit.toLocaleString()} RWF) do not equal Total Credits (${totalCredit.toLocaleString()} RWF). Difference: ${difference.toLocaleString()} RWF.`;
    }

    return {
      totalDebit: Math.round(totalDebit * 100) / 100,
      totalCredit: Math.round(totalCredit * 100) / 100,
      difference: Math.round(difference * 100) / 100,
      isBalanced,
      errorMessage,
    };
  }

  /**
   * Dynamic 3-Year Strategic Forecasting Engine
   */
  static calculateForecast(
    categories: { category: string; accountCode: string; annualBase: number; isUtility: boolean }[],
    generalInflationRate: number,
    utilitiesEscalationRate: number
  ): {
    rows: ForecastRow[];
    totals: {
      base2026: number;
      forecast2027: number;
      forecast2028: number;
      forecast2029: number;
      totalEscalationAmount: number;
      overallGrowthRate: number;
    };
  } {
    const genRate = generalInflationRate / 100;
    const utilRate = utilitiesEscalationRate / 100;

    let totalBase = 0;
    let total2027 = 0;
    let total2028 = 0;
    let total2029 = 0;

    const rows: ForecastRow[] = categories.map((item) => {
      const rate = item.isUtility ? utilRate : genRate;
      const b26 = item.annualBase;
      const f27 = b26 * (1 + rate);
      const f28 = f27 * (1 + rate);
      const f29 = f28 * (1 + rate);

      totalBase += b26;
      total2027 += f27;
      total2028 += f28;
      total2029 += f29;

      return {
        category: item.category,
        accountCode: item.accountCode,
        isUtility: item.isUtility,
        base2026: Math.round(b26),
        forecast2027: Math.round(f27),
        forecast2028: Math.round(f28),
        forecast2029: Math.round(f29),
        growthRate: item.isUtility ? utilitiesEscalationRate : generalInflationRate,
      };
    });

    const totalEscalationAmount = total2029 - totalBase;
    const overallGrowthRate = totalBase > 0 ? ((total2029 - totalBase) / totalBase) * 100 : 0;

    return {
      rows,
      totals: {
        base2026: Math.round(totalBase),
        forecast2027: Math.round(total2027),
        forecast2028: Math.round(total2028),
        forecast2029: Math.round(total2029),
        totalEscalationAmount: Math.round(totalEscalationAmount),
        overallGrowthRate: Math.round(overallGrowthRate * 10) / 10,
      },
    };
  }

  /**
   * Calculate Rwanda standard 18% VAT and Withholding Tax
   */
  static calculateVAT(baseAmount: number, vatRate = 18): {
    baseAmount: number;
    vatAmount: number;
    totalAmount: number;
  } {
    const vatAmount = Math.round((baseAmount * (vatRate / 100)) * 100) / 100;
    return {
      baseAmount: Math.round(baseAmount * 100) / 100,
      vatAmount,
      totalAmount: Math.round((baseAmount + vatAmount) * 100) / 100,
    };
  }

  /**
   * Currency formatting helper for RWF
   */
  static formatRWF(amount: number | null | undefined, showSymbol = true): string {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return showSymbol ? '0 RWF' : '0';
    }
    const isNegative = amount < 0;
    const absVal = Math.abs(Math.round(amount));
    const formatted = absVal.toLocaleString('en-US');
    if (isNegative) {
      return showSymbol ? `-${formatted} RWF` : `-${formatted}`;
    }
    return showSymbol ? `${formatted} RWF` : formatted;
  }

  /**
   * Format percentage
   */
  static formatPercent(value: number | null | undefined): string {
    if (value === null || value === undefined || isNaN(value)) {
      return '0.0%';
    }
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  }
}
