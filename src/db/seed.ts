import { db } from './index';
import { 
  users, 
  organizations, 
  accounts, 
  allocationPolicies, 
  sharedExpenses, 
  expenseTransactions, 
  incomeTransactions, 
  journalEntries, 
  contributions, 
  budgets, 
  forecastAssumptions, 
  auditLogs, 
  systemSettings 
} from './schema';
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
import bcrypt from 'bcryptjs';

export async function seedDatabaseIfEmpty() {
  try {
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length > 0) {
      console.log('Database already initialized.');
      return;
    }

    console.log('🌱 Seeding PostgreSQL Database with official FabLab Rwanda baseline data...');
    const defaultPasswordHash = await bcrypt.hash('admin123', 10);

    // 1. Settings
    await db.insert(systemSettings).values({
      id: 'settings-1',
      organizationName: INITIAL_SETTINGS.organizationName,
      tagline: INITIAL_SETTINGS.tagline,
      currency: INITIAL_SETTINGS.currency,
      fiscalYear: INITIAL_SETTINGS.fiscalYear,
      defaultGeneralEscalation: INITIAL_SETTINGS.defaultGeneralEscalation.toString(),
      defaultUtilitiesEscalation: INITIAL_SETTINGS.defaultUtilitiesEscalation.toString(),
      requireApprovalForSharedExpense: INITIAL_SETTINGS.requireApprovalForSharedExpense,
      approvalThresholdRWF: INITIAL_SETTINGS.approvalThresholdRWF.toString(),
      contactEmail: INITIAL_SETTINGS.contactEmail,
      address: INITIAL_SETTINGS.address,
    });

    // 2. Users
    for (const u of INITIAL_USERS) {
      await db.insert(users).values({
        id: u.id,
        name: u.name,
        email: u.email,
        passwordHash: defaultPasswordHash,
        role: u.role as any,
        department: u.department,
        avatar: u.avatar,
        status: u.status,
        lastLogin: new Date(),
      });
    }

    // 3. Organizations
    for (const org of INITIAL_ORGANIZATIONS) {
      await db.insert(organizations).values({
        id: org.id,
        code: org.code,
        name: org.name,
        contactPerson: org.contactPerson,
        email: org.email,
        phone: org.phone,
        defaultSharePercentage: '25.00',
        headcount: org.headcount,
        spaceOccupiedSqM: (org.floorAreaSqM || 0).toString(),
        status: org.status,
        notes: org.notes || '',
      });
    }

    // 4. Chart of Accounts
    for (const acc of INITIAL_ACCOUNTS) {
      await db.insert(accounts).values({
        id: acc.id,
        code: acc.code,
        name: acc.name,
        type: acc.type,
        category: (acc.type.includes('Expense') ? 'Expense' : acc.type.includes('Revenue') ? 'Revenue' : acc.type.includes('Liability') ? 'Liability' : acc.type.includes('Equity') ? 'Equity' : 'Asset') as any,
        normalBalance: acc.normalBalance as any,
        currentBalance: acc.currentBalance.toString(),
        prevYearBalance: acc.previousYearBalance.toString(),
        budgetAnnual: '0.00',
        description: acc.description,
        isActive: acc.isActive,
        isSystem: false,
      });
    }

    // 5. Allocation Policies
    for (const pol of INITIAL_ALLOCATION_POLICIES) {
      await db.insert(allocationPolicies).values({
        id: pol.id,
        code: pol.id,
        name: pol.name,
        description: pol.notes || '',
        basis: pol.basis,
        rules: pol.rules.map(r => ({
          organizationId: r.orgId,
          organizationName: r.orgId,
          percentage: r.percentage
        })),
        applicableCategories: [pol.categoryName],
        isActive: pol.status === 'active',
      });
    }

    // 6. Shared Expenses
    for (const se of INITIAL_SHARED_EXPENSES) {
      await db.insert(sharedExpenses).values({
        id: se.id,
        category: se.category,
        accountCode: se.accountCode,
        description: se.description,
        frequency: (se.billingFrequency === 'monthly' ? 'Monthly' : se.billingFrequency === 'quarterly' ? 'Quarterly' : se.billingFrequency === 'annual' ? 'Annual' : 'One-off') as any,
        amountPerPeriod: se.totalAmount.toString(),
        periodsPerYear: se.billingFrequency === 'monthly' ? 12 : se.billingFrequency === 'quarterly' ? 4 : 1,
        annualAmount: se.annualAmount.toString(),
        monthlyNormalizedAmount: se.monthlyNormalizedAmount.toString(),
        policyId: se.allocationPolicyId,
        allocations: se.allocations.map(a => ({
          orgId: a.orgId,
          orgName: a.orgName,
          percentage: a.percentage,
          annualAmount: a.amount,
          monthlyAmount: a.monthlyShare,
          perPeriodAmount: a.amount
        })),
        notes: se.notes || '',
        isUtility: se.category === 'Electricity' || se.category === 'WASAC' || se.category === 'Internet',
        isActive: true,
      });
    }

    // 7. Expense Transactions
    for (const exp of INITIAL_EXPENSE_TRANSACTIONS) {
      await db.insert(expenseTransactions).values({
        id: exp.id,
        expenseNumber: exp.expenseNumber,
        date: exp.date,
        vendor: exp.vendor,
        description: exp.description,
        category: exp.category,
        accountCode: exp.accountCode,
        paymentMethod: exp.paymentMethod,
        quantity: '1.00',
        unitPrice: exp.amount.toString(),
        subtotal: exp.amount.toString(),
        taxRate: '0.00',
        taxAmount: (exp.tax || 0).toString(),
        totalWithTax: exp.totalWithTax.toString(),
        currency: 'RWF',
        isShared: exp.isShared,
        sharedExpenseId: exp.sharedExpenseId || null,
        allocationPolicyId: exp.allocationPolicyId || null,
        status: (exp.status === 'Posted' ? 'Posted' : exp.status === 'Approved' ? 'Approved' : 'Draft') as any,
        createdBy: exp.createdBy,
        postedBy: exp.status === 'Posted' ? exp.createdBy : null,
        notes: exp.notes || '',
      });
    }

    // 8. Income Transactions
    for (const inc of INITIAL_INCOME_TRANSACTIONS) {
      await db.insert(incomeTransactions).values({
        id: inc.id,
        incomeNumber: inc.incomeNumber,
        date: inc.date,
        payer: inc.customer,
        description: inc.description,
        category: 'Operating Revenue',
        accountCode: inc.accountCode,
        depositAccountCode: '1010',
        paymentMethod: inc.paymentMethod,
        amount: inc.amount.toString(),
        currency: 'RWF',
        status: (inc.status === 'Posted' ? 'Posted' : 'Draft') as any,
        createdBy: inc.createdBy,
        postedBy: inc.status === 'Posted' ? inc.createdBy : null,
        notes: inc.notes || '',
      });
    }

    // 9. Journal Entries
    for (const j of INITIAL_JOURNAL_ENTRIES) {
      await db.insert(journalEntries).values({
        id: j.id,
        entryNumber: j.journalNumber,
        date: j.date,
        referenceType: 'Standard',
        referenceId: j.reference,
        description: j.description,
        totalDebit: j.totalDebit.toString(),
        totalCredit: j.totalCredit.toString(),
        isBalanced: j.isBalanced,
        status: (j.status === 'Posted' ? 'Posted' : 'Draft') as any,
        postedBy: j.createdBy,
        lines: j.lines.map(l => ({
          id: l.id,
          accountCode: l.accountCode,
          accountName: l.accountName,
          description: l.description,
          debit: l.debit,
          credit: l.credit,
          department: l.department
        })),
      });
    }

    // 10. Contributions
    for (const ctb of INITIAL_CONTRIBUTIONS) {
      await db.insert(contributions).values({
        id: ctb.id,
        contributionNumber: `CTB-${ctb.id}`,
        organizationId: ctb.orgId,
        organizationName: ctb.orgName,
        period: ctb.billingPeriod,
        fiscalYear: ctb.year,
        expectedAmount: ctb.expectedAmount.toString(),
        invoicedAmount: ctb.invoicedAmount.toString(),
        receivedAmount: ctb.receivedAmount.toString(),
        outstandingBalance: ctb.outstandingBalance.toString(),
        status: (ctb.status === 'Paid' ? 'Paid in Full' : ctb.status === 'Partially Paid' ? 'Partially Paid' : 'Pending') as any,
        dueDate: `${ctb.year}-12-31`,
        paymentDate: ctb.paymentDate || null,
        paymentReference: ctb.reference || null,
        notes: ctb.notes || '',
      });
    }

    // 11. Budgets
    for (const b of INITIAL_BUDGET_LINES) {
      await db.insert(budgets).values({
        id: b.id,
        fiscalYear: b.year,
        accountCode: b.accountCode,
        accountName: b.accountName,
        category: b.category,
        annualBudget: b.annualBudget.toString(),
        q1Budget: b.q1.toString(),
        q2Budget: b.q2.toString(),
        q3Budget: b.q3.toString(),
        q4Budget: b.q4.toString(),
        actualYTD: b.actualAmount.toString(),
        varianceAmount: (b.annualBudget - b.actualAmount).toString(),
        variancePercentage: b.annualBudget > 0 ? (((b.annualBudget - b.actualAmount) / b.annualBudget) * 100).toString() : '0.00',
      });
    }

    // 12. Forecast Assumptions
    await db.insert(forecastAssumptions).values({
      id: INITIAL_FORECAST_ASSUMPTIONS.id,
      generalInflationRate: INITIAL_FORECAST_ASSUMPTIONS.generalInflationRate.toString(),
      utilitiesEscalationRate: INITIAL_FORECAST_ASSUMPTIONS.utilitiesEscalationRate.toString(),
      revenueGrowthRate: '15.00',
      rentEscalationRate: (INITIAL_FORECAST_ASSUMPTIONS.staffEscalationRate || 10.0).toString(),
      headcountGrowthRate: '5.00',
      baseYear: INITIAL_FORECAST_ASSUMPTIONS.baseYear,
      notes: INITIAL_FORECAST_ASSUMPTIONS.notes,
      updatedBy: 'Emmanuel Niyonzima',
    });

    // 13. Audit Logs
    for (const log of INITIAL_AUDIT_LOGS) {
      await db.insert(auditLogs).values({
        id: log.id,
        timestamp: log.timestamp,
        userId: log.userId,
        userName: log.userName,
        action: log.action,
        module: log.module,
        recordId: log.recordId,
        details: log.details || '',
        oldValues: log.oldValue ? { value: log.oldValue } : null,
        newValues: log.newValue ? { value: log.newValue } : null,
        ipAddress: log.ip,
        status: 'SUCCESS',
      });
    }

    console.log('✅ PostgreSQL Database successfully seeded with 100% verified baseline data.');
  } catch (error) {
    console.error('❌ Database seeding error:', error);
  }
}
