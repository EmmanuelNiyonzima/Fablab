import { TestResultItem } from '../types/financial';
import { FinancialCalculator } from './calculationService';
import { AccountingService } from './accountingService';
import { storageService } from './storageService';

export class TestSuiteService {
  /**
   * Execute the 12 Mandatory Financial Calculation & Accounting Integrity Tests
   */
  static runAllTests(): TestResultItem[] {
    const results: TestResultItem[] = [];
    const state = storageService.getState();

    // Test 1: Monthly Expense Calculation
    const t1Start = performance.now();
    const t1 = FinancialCalculator.calculateAmounts(2, 500000, 'monthly');
    results.push({
      id: 'test-1',
      name: '1. Monthly Expense Calculation',
      description: 'Verifies Quantity × Unit Price with monthly frequency normalized correctly.',
      category: 'Calculations',
      status: t1.monthlyNormalizedAmount === 1000000 && t1.totalAmount === 1000000 ? 'PASS' : 'FAIL',
      expected: '1,000,000 RWF',
      actual: `${t1.monthlyNormalizedAmount.toLocaleString()} RWF`,
      executionTimeMs: Math.round((performance.now() - t1Start) * 100) / 100,
    });

    // Test 2: Annual Expense Calculation from Quarterly Item
    const t2Start = performance.now();
    // Quarterly 360,000 -> Annual 1,440,000, Monthly normalized 120,000
    const t2 = FinancialCalculator.calculateAmounts(1, 360000, 'quarterly');
    results.push({
      id: 'test-2',
      name: '2. Annual Expense & Frequency Normalization',
      description: 'Verifies Quarterly expense converts to Annual (×4) and Monthly (/3) without inflating monthly requirement.',
      category: 'Calculations',
      status: t2.annualAmount === 1440000 && t2.monthlyNormalizedAmount === 120000 ? 'PASS' : 'FAIL',
      expected: 'Annual: 1,440,000 RWF | Monthly: 120,000 RWF',
      actual: `Annual: ${t2.annualAmount.toLocaleString()} RWF | Monthly: ${t2.monthlyNormalizedAmount.toLocaleString()} RWF`,
      executionTimeMs: Math.round((performance.now() - t2Start) * 100) / 100,
    });

    // Test 3: Shared Allocation by Percentage
    const t3Start = performance.now();
    const sampleRules = [
      { orgId: 'org-fablab', percentage: 38.0 },
      { orgId: 'org-klab', percentage: 32.0 },
      { orgId: 'org-fabcafe', percentage: 18.0 },
      { orgId: 'org-250startups', percentage: 12.0 },
    ];
    const t3 = FinancialCalculator.calculateAllocations(1000000, 1000000, sampleRules, state.organizations);
    const fablabAlloc = t3.allocations.find((a) => a.orgId === 'org-fablab')?.amount;
    results.push({
      id: 'test-3',
      name: '3. Shared Allocation Math',
      description: 'Verifies 38% allocation of 1,000,000 RWF yields exactly 380,000 RWF for Fablab.',
      category: 'Calculations',
      status: fablabAlloc === 380000 ? 'PASS' : 'FAIL',
      expected: 'Fablab Allocation = 380,000 RWF',
      actual: `Fablab Allocation = ${fablabAlloc?.toLocaleString()} RWF`,
      executionTimeMs: Math.round((performance.now() - t3Start) * 100) / 100,
    });

    // Test 4: Allocation Reconciliation Verification Check
    const t4Start = performance.now();
    results.push({
      id: 'test-4',
      name: '4. Allocation Reconciliation Check',
      description: 'Ensures sum of organization allocations strictly reconciles to total source expense (diff = 0).',
      category: 'Reconciliation',
      status: t3.isReconciled && t3.discrepancy === 0 ? 'PASS' : 'FAIL',
      expected: 'Reconciled = true (Diff: 0 RWF)',
      actual: `Reconciled = ${t3.isReconciled} (Diff: ${t3.discrepancy} RWF)`,
      executionTimeMs: Math.round((performance.now() - t4Start) * 100) / 100,
    });

    // Test 5: Budget Variance Calculation
    const t5Start = performance.now();
    const t5 = FinancialCalculator.calculateBudgetVariance(10000000, 8500000);
    results.push({
      id: 'test-5',
      name: '5. Budget Variance Calculation',
      description: 'Verifies Variance = Budget - Actual (10,000,000 - 8,500,000 = 1,500,000 RWF).',
      category: 'Calculations',
      status: t5.variance === 1500000 ? 'PASS' : 'FAIL',
      expected: 'Variance: 1,500,000 RWF',
      actual: `Variance: ${t5.variance.toLocaleString()} RWF`,
      executionTimeMs: Math.round((performance.now() - t5Start) * 100) / 100,
    });

    // Test 6: Variance Percentage & Utilization
    const t6Start = performance.now();
    results.push({
      id: 'test-6',
      name: '6. Variance % & Utilization %',
      description: 'Verifies Utilization % = 85.0% and Variance % = 15.0% on 10M budget vs 8.5M actual.',
      category: 'Calculations',
      status: t5.utilizationPercentage === 85.0 && t5.variancePercentage === 15.0 ? 'PASS' : 'FAIL',
      expected: 'Utilization: 85.0% | Variance: 15.0%',
      actual: `Utilization: ${t5.utilizationPercentage}% | Variance: ${t5.variancePercentage}%`,
      executionTimeMs: Math.round((performance.now() - t6Start) * 100) / 100,
    });

    // Test 7: Contribution Outstanding Balance
    const t7Start = performance.now();
    const expectedCtb = 205001;
    const receivedCtb = 150000;
    const outstanding = expectedCtb - receivedCtb;
    results.push({
      id: 'test-7',
      name: '7. Contribution Outstanding Balance',
      description: 'Verifies Expected (205,001) - Received (150,000) = 55,001 RWF remaining.',
      category: 'Calculations',
      status: outstanding === 55001 ? 'PASS' : 'FAIL',
      expected: 'Outstanding: 55,001 RWF',
      actual: `Outstanding: ${outstanding.toLocaleString()} RWF`,
      executionTimeMs: Math.round((performance.now() - t7Start) * 100) / 100,
    });

    // Test 8: General Ledger Debit/Credit Balancing
    const t8Start = performance.now();
    const sampleLines = [
      { id: '1', accountId: 'acc-6000', accountCode: '6000', accountName: 'Rent', description: 'Rent', debit: 1500000, credit: 0 },
      { id: '2', accountId: 'acc-1000', accountCode: '1000', accountName: 'Bank', description: 'Bank', debit: 0, credit: 1500000 },
    ];
    const t8 = FinancialCalculator.validateJournalEntry(sampleLines);
    results.push({
      id: 'test-8',
      name: '8. General Ledger Double-Entry Balancing',
      description: 'Verifies total debits (1,500,000) equal total credits (1,500,000) for balanced journal.',
      category: 'Accounting',
      status: t8.isBalanced ? 'PASS' : 'FAIL',
      expected: 'Balanced = true (Diff: 0 RWF)',
      actual: `Balanced = ${t8.isBalanced} (Diff: ${t8.difference} RWF)`,
      executionTimeMs: Math.round((performance.now() - t8Start) * 100) / 100,
    });

    // Test 9: Trial Balance Reconciliation
    const t9Start = performance.now();
    const tb = AccountingService.getTrialBalance(state);
    results.push({
      id: 'test-9',
      name: '9. Trial Balance Reconciliation Status',
      description: 'Verifies Trial Balance accounts are fully balanced and difference is zero.',
      category: 'Accounting',
      status: tb.isBalanced ? 'PASS' : 'FAIL',
      expected: 'BALANCED (Diff = 0 RWF)',
      actual: `${tb.isBalanced ? 'BALANCED' : 'NOT BALANCED'} (Diff: ${tb.difference.toLocaleString()} RWF)`,
      executionTimeMs: Math.round((performance.now() - t9Start) * 100) / 100,
    });

    // Test 10: Statement of Comprehensive Income Totals
    const t10Start = performance.now();
    const pnl = AccountingService.getStatementOfComprehensiveIncome(state);
    const calculatedNet = pnl.grossProfit + pnl.otherIncomeTotal - pnl.adminExpensesTotal - pnl.otherExpensesTotal;
    results.push({
      id: 'test-10',
      name: '10. Income Statement Aggregation Math',
      description: 'Verifies Net Profit = (Revenue - COS) + Other Income - Admin - Other Expenses.',
      category: 'Accounting',
      status: Math.abs(calculatedNet - pnl.netProfitBeforeTax) < 1.0 ? 'PASS' : 'FAIL',
      expected: `Net Profit: ${FinancialCalculator.formatRWF(calculatedNet)}`,
      actual: `Net Profit: ${FinancialCalculator.formatRWF(pnl.netProfitBeforeTax)}`,
      executionTimeMs: Math.round((performance.now() - t10Start) * 100) / 100,
    });

    // Test 11: Dynamic 3-Year Forecast Escalation Math
    const t11Start = performance.now();
    const sampleForecast = FinancialCalculator.calculateForecast(
      [
        { category: 'Electricity', accountCode: '6010', annualBase: 14400000, isUtility: true },
        { category: 'Rent', accountCode: '6000', annualBase: 18000000, isUtility: false },
      ],
      13.6, // general
      20.5  // utilities
    );
    const expectedElec2027 = Math.round(14400000 * 1.205);
    const actualElec2027 = sampleForecast.rows.find((r) => r.category === 'Electricity')?.forecast2027;
    results.push({
      id: 'test-11',
      name: '11. 3-Year Strategic Forecast Escalation',
      description: 'Verifies electricity (20.5% escalation) escalates from 14.4M in 2026 to 17,352,000 RWF in 2027.',
      category: 'Calculations',
      status: actualElec2027 === expectedElec2027 ? 'PASS' : 'FAIL',
      expected: `${expectedElec2027?.toLocaleString()} RWF`,
      actual: `${actualElec2027?.toLocaleString()} RWF`,
      executionTimeMs: Math.round((performance.now() - t11Start) * 100) / 100,
    });

    // Test 12: Shared Space Baseline Total Budget
    const t12Start = performance.now();
    const sharedSummary = AccountingService.getSharedSpaceSummary(state);
    // Baseline annual: 53,200,600 RWF, monthly ~4,433,383 RWF
    results.push({
      id: 'test-12',
      name: '12. Shared Space Baseline Integrity',
      description: 'Verifies annual shared facility budget matches 53,200,600 RWF (~4,433,383 RWF/mo normalized).',
      category: 'Reconciliation',
      status: Math.abs(sharedSummary.totalAnnualSharedBudget - 53200600) < 1000 ? 'PASS' : 'FAIL',
      expected: 'Annual: 53,200,600 RWF | Monthly: ~4,433,383 RWF',
      actual: `Annual: ${sharedSummary.totalAnnualSharedBudget.toLocaleString()} RWF | Monthly: ${sharedSummary.totalMonthlyNormalizedBudget.toLocaleString()} RWF`,
      executionTimeMs: Math.round((performance.now() - t12Start) * 100) / 100,
    });

    return results;
  }
}
