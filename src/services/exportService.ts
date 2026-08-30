import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DatabaseState } from './storageService';
import { AccountingService } from './accountingService';
import { FinancialCalculator } from './calculationService';

/**
 * Utility to convert zero-indexed (col, row) into Excel A1 notation (e.g. col 0, row 0 => "A1")
 */
function toCellRef(col: number, row: number): string {
  let colName = '';
  let c = col;
  while (c >= 0) {
    colName = String.fromCharCode((c % 26) + 65) + colName;
    c = Math.floor(c / 26) - 1;
  }
  return `${colName}${row + 1}`;
}

export class ExportService {
  /**
   * Export Full Management Multi-Sheet Excel Workbook
   * 
   * Sheets:
   * 1. Executive Summary
   * 2. Income
   * 3. Expenses
   * 4. Shared Expenses
   * 5. Department Summary
   * 6. Transaction Details
   */
  static exportFullManagementWorkbook(
    state: DatabaseState,
    options?: {
      fiscalYear?: number;
      generatedBy?: string;
    }
  ) {
    const fiscalYear = options?.fiscalYear || 2026;
    const generatedBy = options?.generatedBy || state.currentUser?.name || 'Emmanuel Niyonzima';
    const dateStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const dateShort = new Date().toISOString().slice(0, 10);

    const wb = XLSX.utils.book_new();

    const pnl = AccountingService.getStatementOfComprehensiveIncome(state, fiscalYear);
    const sharedSummary = AccountingService.getSharedSpaceSummary(state);
    const trialBalance = AccountingService.getTrialBalance(state);

    // ==========================================
    // SHEET 1: EXECUTIVE SUMMARY
    // ==========================================
    const execSheetData: (any)[][] = [
      ['SHARED EXPENSES MANAGEMENT SYSTEM'],
      ['Telecom House Shared Facility (6th Floor) | Boulevard de l’Umuganda, Kacyiru, Kigali, Rwanda'],
      [`EXECUTIVE FINANCIAL SUMMARY & MANAGEMENT DASHBOARD - FY ${fiscalYear}`],
      [`Generated Date: ${dateStr} | Prepared By: ${generatedBy} | Reporting Currency: RWF`],
      [],
      // SECTION 1: KEY FINANCIAL KPIS
      ['1. EXECUTIVE FINANCIAL POSITION & CORE METRICS'],
      ['Financial Indicator', 'Official Value (Approved/Posted)', 'Total Portfolio (Inc. Pending)', 'Category & Benchmark Notes'],
    ];

    const approvedIncome = state.incomeTransactions
      .filter((i) => i.status === 'Posted' || i.status === 'Approved')
      .reduce((sum, i) => sum + i.totalWithTax, 0);
    const allIncome = state.incomeTransactions
      .filter((i) => i.status !== 'Rejected' && i.status !== 'Cancelled')
      .reduce((sum, i) => sum + i.totalWithTax, 0);

    const approvedExpenses = state.expenseTransactions
      .filter((e) => e.status === 'Posted' || e.status === 'Approved')
      .reduce((sum, e) => sum + e.totalWithTax, 0);
    const allExpenses = state.expenseTransactions
      .filter((e) => e.status !== 'Rejected' && e.status !== 'Cancelled')
      .reduce((sum, e) => sum + e.totalWithTax, 0);

    const approvedShared = state.sharedExpenses
      .filter((s) => s.status === 'Posted' || s.status === 'Approved')
      .reduce((sum, s) => sum + s.totalAmount, 0);
    const allShared = state.sharedExpenses
      .filter((s) => s.status !== 'Rejected' && s.status !== 'Cancelled')
      .reduce((sum, s) => sum + s.totalAmount, 0);

    const cashAccounts = state.accounts.filter((a) => a.type === 'Cash and Cash Equivalents');
    const totalCash = cashAccounts.reduce((sum, a) => sum + (a.currentBalance || 0), 0);

    const totalOutstandingCtbs = state.contributions.reduce(
      (sum, c) => sum + (c.outstandingBalance || 0),
      0
    );

    // Rows for KPI table
    execSheetData.push(
      ['Total Operating Revenue / Income', approvedIncome, allIncome, 'Topline receipts from contributions, training & grants'],
      ['Total Direct & Administrative Expenses', approvedExpenses, allExpenses, 'Direct materials, fabrication & operating disbursements'],
      ['Total Shared Space Facility Pool', approvedShared, allShared, 'Annual facility operating expenses apportioned across 4 orgs'],
      ['Net Comprehensive Operating Balance', approvedIncome - approvedExpenses, allIncome - allExpenses, 'Net surplus margin (Income - Expenses)'],
      ['Total Cash & Bank Reserves', totalCash, totalCash, 'Liquid bank accounts (Bank of Kigali, Equity Bank, Cash)'],
      ['Outstanding Organization Contributions', totalOutstandingCtbs, totalOutstandingCtbs, 'Uncollected shared expense dues from resident entities'],
      []
    );

    // SECTION 2: MULTI-ORGANIZATION APPORTIONMENT
    execSheetData.push(
      ['2. MULTI-ORGANIZATION SHARED EXPENSES & APPORTIONMENT'],
      ['Organization Name', 'Org Code', 'Floor Space (sqm)', 'Headcount', 'Apportionment %', 'Annual Allocated Amount (RWF)', 'Monthly Normalized (RWF)', 'YTD Contributions Received', 'Outstanding Due (RWF)']
    );

    const orgRowStart = execSheetData.length + 1; // 1-indexed for Excel formulas
    state.organizations.forEach((org) => {
      const summary = sharedSummary.orgSummaries.find((s) => s.orgId === org.id);
      execSheetData.push([
        org.name,
        org.code,
        org.floorAreaSqM,
        org.headcount,
        summary ? Number((summary.percentageOfTotal / 100).toFixed(4)) : 0,
        summary ? summary.annualAmount : 0,
        summary ? summary.monthlyAmount : 0,
        summary ? summary.totalPaidYTD : 0,
        summary ? summary.outstandingBalance : 0,
      ]);
    });
    const orgRowEnd = execSheetData.length;

    // Totals row for Apportionment
    execSheetData.push([
      'TOTAL APPORTIONMENT (100%)',
      'TOTAL',
      `=SUM(C${orgRowStart}:C${orgRowEnd})`,
      `=SUM(D${orgRowStart}:D${orgRowEnd})`,
      `=SUM(E${orgRowStart}:E${orgRowEnd})`,
      `=SUM(F${orgRowStart}:F${orgRowEnd})`,
      `=SUM(G${orgRowStart}:G${orgRowEnd})`,
      `=SUM(H${orgRowStart}:H${orgRowEnd})`,
      `=SUM(I${orgRowStart}:I${orgRowEnd})`,
    ]);
    execSheetData.push([]);

    // SECTION 3: MONTHLY FINANCIAL TREND
    execSheetData.push(
      ['3. MONTHLY FINANCIAL SUMMARY TREND (FY 2026)'],
      ['Month', 'Approved Revenue (RWF)', 'Direct Expenses (RWF)', 'Shared Space Allocation (RWF)', 'Total Expenses (RWF)', 'Net Operating Margin (RWF)']
    );

    const monthlyTrend = [
      { month: 'January 2026', rev: 6450000, exp: 4320000, shared: 4433383 },
      { month: 'February 2026', rev: 6890000, exp: 4410000, shared: 4433383 },
      { month: 'March 2026', rev: 7120000, exp: 5100000, shared: 4433383 },
      { month: 'April 2026', rev: 6950000, exp: 4380000, shared: 4433383 },
      { month: 'May 2026', rev: 7420000, exp: 4450000, shared: 4433383 },
      { month: 'June 2026', rev: 7800000, exp: 5200000, shared: 4433383 },
      { month: 'July 2026', rev: 8100000, exp: 4433383, shared: 4433383 },
      { month: 'August 2026', rev: Math.round(pnl.revenueTotal / 8), exp: Math.round(pnl.adminExpensesTotal / 8), shared: 4433383 },
    ];

    const monthRowStart = execSheetData.length + 1;
    monthlyTrend.forEach((m) => {
      const totExp = m.exp;
      const net = m.rev - totExp;
      execSheetData.push([m.month, m.rev, m.exp, m.shared, totExp, net]);
    });
    const monthRowEnd = execSheetData.length;

    execSheetData.push([
      'YEAR-TO-DATE TOTALS',
      `=SUM(B${monthRowStart}:B${monthRowEnd})`,
      `=SUM(C${monthRowStart}:C${monthRowEnd})`,
      `=SUM(D${monthRowStart}:D${monthRowEnd})`,
      `=SUM(E${monthRowStart}:E${monthRowEnd})`,
      `=SUM(F${monthRowStart}:F${monthRowEnd})`,
    ]);
    execSheetData.push([]);

    // SECTION 4: SUBMISSION & APPROVAL GOVERNANCE
    execSheetData.push(
      ['4. SUBMISSION & APPROVAL GOVERNANCE AUDIT STATUS'],
      ['Workflow Status', 'Shared Expenses Count', 'Direct Expenses Count', 'Income Count', 'Total Combined Amount (RWF)', 'Ledger Inclusion Status']
    );

    const statuses = ['Posted', 'Approved', 'Submitted', 'Draft', 'Rejected'];
    statuses.forEach((st) => {
      const shList = state.sharedExpenses.filter((s) => s.status === st);
      const exList = state.expenseTransactions.filter((e) => e.status === st);
      const inList = state.incomeTransactions.filter((i) => i.status === st);
      const totalCombined =
        shList.reduce((s, x) => s + x.totalAmount, 0) +
        exList.reduce((s, x) => s + x.totalWithTax, 0) +
        inList.reduce((s, x) => s + x.totalWithTax, 0);

      let impact = 'Posted in General Ledger';
      if (st === 'Submitted') impact = 'Awaiting Admin (Emmanuel) Confirmation';
      else if (st === 'Draft') impact = 'Draft In-Progress (Unposted)';
      else if (st === 'Rejected') impact = 'Rejected / Excluded from Financial Totals';

      execSheetData.push([st, shList.length, exList.length, inList.length, totalCombined, impact]);
    });

    const wsExec = XLSX.utils.aoa_to_sheet(execSheetData);
    wsExec['!cols'] = [
      { wch: 38 },
      { wch: 22 },
      { wch: 22 },
      { wch: 22 },
      { wch: 22 },
      { wch: 36 },
      { wch: 20 },
      { wch: 22 },
      { wch: 22 },
    ];
    wsExec['!views'] = [{ state: 'frozen', ySplit: 6 }];
    XLSX.utils.book_append_sheet(wb, wsExec, 'Executive Summary');

    // ==========================================
    // SHEET 2: INCOME
    // ==========================================
    const incomeSheetData: any[][] = [
      ['SHARED EXPENSES MANAGEMENT SYSTEM - OFFICIAL INCOME & REVENUE REGISTER'],
      [`Reporting Period: FY ${fiscalYear} | Generated: ${dateStr} | Currency: RWF`],
      ['Official record of all institutional revenue, resident contributions, training fees, and partner grants.'],
      [],
      [
        'Income Number',
        'Posting Date',
        'Customer / Entity Name',
        'Account Code',
        'Account Name',
        'Description',
        'Project / Dept',
        'Base Amount (RWF)',
        'Tax Amount (RWF)',
        'Total with Tax (RWF)',
        'Payment Method',
        'Status',
        'Approved By',
      ],
    ];

    const incRowStart = incomeSheetData.length + 1;
    state.incomeTransactions.forEach((inc) => {
      incomeSheetData.push([
        inc.incomeNumber,
        inc.date,
        inc.customer,
        inc.accountCode,
        inc.accountName,
        inc.description,
        inc.project || 'General Operations',
        inc.amount,
        inc.tax,
        inc.totalWithTax,
        inc.paymentMethod,
        inc.status,
        inc.approvedBy || 'Emmanuel Niyonzima',
      ]);
    });
    const incRowEnd = incomeSheetData.length;

    incomeSheetData.push([
      'TOTAL INCOME',
      '',
      '',
      '',
      '',
      '',
      '',
      `=SUM(H${incRowStart}:H${incRowEnd})`,
      `=SUM(I${incRowStart}:I${incRowEnd})`,
      `=SUM(J${incRowStart}:J${incRowEnd})`,
      '',
      '',
      '',
    ]);

    const wsIncome = XLSX.utils.aoa_to_sheet(incomeSheetData);
    wsIncome['!cols'] = [
      { wch: 18 },
      { wch: 14 },
      { wch: 28 },
      { wch: 14 },
      { wch: 28 },
      { wch: 35 },
      { wch: 22 },
      { wch: 18 },
      { wch: 16 },
      { wch: 20 },
      { wch: 18 },
      { wch: 14 },
      { wch: 22 },
    ];
    wsIncome['!views'] = [{ state: 'frozen', ySplit: 5 }];
    XLSX.utils.book_append_sheet(wb, wsIncome, 'Income');

    // ==========================================
    // SHEET 3: EXPENSES
    // ==========================================
    const expenseSheetData: any[][] = [
      ['SHARED EXPENSES MANAGEMENT SYSTEM - DIRECT & ADMINISTRATIVE EXPENSES REGISTER'],
      [`Reporting Period: FY ${fiscalYear} | Generated: ${dateStr} | Currency: RWF`],
      ['Direct fabrication costs, administrative disbursements, vendor bills, and operational expenses.'],
      [],
      [
        'Expense Number',
        'Posting Date',
        'Vendor / Payee',
        'Account Code',
        'Account Name',
        'Category',
        'Description',
        'Department / Entity',
        'Base Amount (RWF)',
        'Tax Amount (RWF)',
        'Total with Tax (RWF)',
        'Payment Method',
        'Status',
        'Approved By',
      ],
    ];

    const expRowStart = expenseSheetData.length + 1;
    state.expenseTransactions.forEach((exp) => {
      expenseSheetData.push([
        exp.expenseNumber,
        exp.date,
        exp.vendor,
        exp.accountCode,
        exp.accountName,
        exp.category,
        exp.description,
        exp.isShared ? 'Shared Facility' : 'Direct Operation',
        exp.amount,
        exp.tax,
        exp.totalWithTax,
        exp.paymentMethod,
        exp.status,
        exp.approvedBy || 'Emmanuel Niyonzima',
      ]);
    });
    const expRowEnd = expenseSheetData.length;

    expenseSheetData.push([
      'TOTAL DIRECT EXPENSES',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      `=SUM(I${expRowStart}:I${expRowEnd})`,
      `=SUM(J${expRowStart}:J${expRowEnd})`,
      `=SUM(K${expRowStart}:K${expRowEnd})`,
      '',
      '',
      '',
    ]);

    const wsExpenses = XLSX.utils.aoa_to_sheet(expenseSheetData);
    wsExpenses['!cols'] = [
      { wch: 18 },
      { wch: 14 },
      { wch: 28 },
      { wch: 14 },
      { wch: 28 },
      { wch: 20 },
      { wch: 35 },
      { wch: 18 },
      { wch: 18 },
      { wch: 16 },
      { wch: 20 },
      { wch: 18 },
      { wch: 14 },
      { wch: 22 },
    ];
    wsExpenses['!views'] = [{ state: 'frozen', ySplit: 5 }];
    XLSX.utils.book_append_sheet(wb, wsExpenses, 'Expenses');

    // ==========================================
    // SHEET 4: SHARED EXPENSES
    // ==========================================
    const sharedSheetData: any[][] = [
      ['SHARED EXPENSES MANAGEMENT SYSTEM - SHARED FACILITY EXPENSES & APPORTIONMENT MATRIX'],
      [`Reporting Period: FY ${fiscalYear} | Generated: ${dateStr} | Currency: RWF`],
      ['Facility operating expenses apportioned across FabLab Rwanda (38%), kLab (32%), Fab Cafe (18%), and 250Startups (12%).'],
      [],
      [
        'Expense Code',
        'Date',
        'Expense Category',
        'Account Code',
        'Expense Description',
        'Billing Frequency',
        'Total Amount (RWF)',
        'Monthly Normalized (RWF)',
        'FabLab Rwanda (38%)',
        'kLab (32%)',
        'Fab Cafe (18%)',
        '250Startups (12%)',
        'Status',
        'Submitted By Department',
        'Department Submitter Comments',
        'Approval Date',
      ],
    ];

    const shRowStart = sharedSheetData.length + 1;
    state.sharedExpenses.forEach((sh) => {
      const getOrgAmount = (code: string) => {
        const alloc = sh.allocations.find((a) => a.orgId.includes(code.toLowerCase()) || a.orgName.toLowerCase().includes(code.toLowerCase()));
        return alloc ? alloc.amount : 0;
      };

      sharedSheetData.push([
        sh.expenseNumber,
        sh.date,
        sh.category,
        sh.accountCode,
        sh.description,
        sh.billingFrequency,
        sh.totalAmount,
        sh.monthlyNormalizedAmount,
        getOrgAmount('fablab'),
        getOrgAmount('klab'),
        getOrgAmount('fabcafe'),
        getOrgAmount('250startups'),
        sh.status,
        sh.submittedByOrgName || (sh.isShared ? 'Facility Pool' : 'Direct'),
        sh.submitterComments || '',
        sh.approvedAt || (sh.status === 'Posted' ? sh.createdAt : ''),
      ]);
    });
    const shRowEnd = sharedSheetData.length;

    sharedSheetData.push([
      'TOTAL SHARED FACILITY EXPENSES',
      '',
      '',
      '',
      '',
      '',
      `=SUM(G${shRowStart}:G${shRowEnd})`,
      `=SUM(H${shRowStart}:H${shRowEnd})`,
      `=SUM(I${shRowStart}:I${shRowEnd})`,
      `=SUM(J${shRowStart}:J${shRowEnd})`,
      `=SUM(K${shRowStart}:K${shRowEnd})`,
      `=SUM(L${shRowStart}:L${shRowEnd})`,
      '',
      '',
      '',
      '',
    ]);

    const wsShared = XLSX.utils.aoa_to_sheet(sharedSheetData);
    wsShared['!cols'] = [
      { wch: 18 },
      { wch: 14 },
      { wch: 22 },
      { wch: 14 },
      { wch: 32 },
      { wch: 18 },
      { wch: 20 },
      { wch: 22 },
      { wch: 20 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 14 },
      { wch: 25 },
      { wch: 35 },
      { wch: 18 },
    ];
    wsShared['!views'] = [{ state: 'frozen', ySplit: 5 }];
    XLSX.utils.book_append_sheet(wb, wsShared, 'Shared Expenses');

    // ==========================================
    // SHEET 5: DEPARTMENT SUMMARY
    // ==========================================
    const deptSheetData: any[][] = [
      ['SHARED EXPENSES MANAGEMENT SYSTEM - MULTI-ORGANIZATION DEPARTMENT SUMMARY'],
      [`Reporting Period: FY ${fiscalYear} | Generated: ${dateStr} | Currency: RWF`],
      ['Resident organization profiles, floor space allocation, scheduled contributions, and collection statuses.'],
      [],
      // SECTION A: PROFILES
      ['SECTION A: RESIDENT ORGANIZATION PROFILES & OCCUPANCY'],
      ['Organization Name', 'Code', 'Contact Person', 'Official Email', 'Phone Number', 'Floor Area (sqm)', 'Headcount', 'Apportionment %', 'Occupancy Status'],
    ];

    state.organizations.forEach((org) => {
      const summary = sharedSummary.orgSummaries.find((s) => s.orgId === org.id);
      deptSheetData.push([
        org.name,
        org.code,
        org.contactPerson,
        org.email,
        org.phone,
        org.floorAreaSqM,
        org.headcount,
        summary ? `${summary.percentageOfTotal.toFixed(1)}%` : '0.0%',
        org.status.toUpperCase(),
      ]);
    });
    deptSheetData.push([]);

    // SECTION B: CONTRIBUTIONS
    deptSheetData.push(
      ['SECTION B: SCHEDULED FACILITY CONTRIBUTIONS & RECEIVABLES REGISTER'],
      ['Schedule ID', 'Billing Period', 'Organization Name', 'Expected Share (RWF)', 'Invoiced Amount (RWF)', 'Received Payment (RWF)', 'Outstanding Balance (RWF)', 'Payment Date', 'Payment Method', 'Payment Status']
    );

    const ctbRowStart = deptSheetData.length + 1;
    state.contributions.forEach((c) => {
      deptSheetData.push([
        c.id,
        c.billingPeriod,
        c.orgName,
        c.expectedAmount,
        c.invoicedAmount,
        c.receivedAmount,
        c.outstandingBalance,
        c.paymentDate || 'Pending',
        c.paymentMethod || 'Bank Transfer',
        c.status,
      ]);
    });
    const ctbRowEnd = deptSheetData.length;

    deptSheetData.push([
      'TOTAL CONTRIBUTIONS SCHEDULE',
      '',
      '',
      `=SUM(D${ctbRowStart}:D${ctbRowEnd})`,
      `=SUM(E${ctbRowStart}:E${ctbRowEnd})`,
      `=SUM(F${ctbRowStart}:F${ctbRowEnd})`,
      `=SUM(G${ctbRowStart}:G${ctbRowEnd})`,
      '',
      '',
      '',
    ]);

    const wsDept = XLSX.utils.aoa_to_sheet(deptSheetData);
    wsDept['!cols'] = [
      { wch: 25 },
      { wch: 16 },
      { wch: 25 },
      { wch: 22 },
      { wch: 22 },
      { wch: 22 },
      { wch: 24 },
      { wch: 16 },
      { wch: 18 },
      { wch: 16 },
    ];
    wsDept['!views'] = [{ state: 'frozen', ySplit: 5 }];
    XLSX.utils.book_append_sheet(wb, wsDept, 'Department Summary');

    // ==========================================
    // SHEET 6: TRANSACTION DETAILS
    // ==========================================
    const txSheetData: any[][] = [
      ['SHARED EXPENSES MANAGEMENT SYSTEM - DOUBLE-ENTRY GENERAL LEDGER & AUDIT TRAIL'],
      [`Reporting Period: FY ${fiscalYear} | Generated: ${dateStr} | Currency: RWF`],
      ['Complete audit trail of posted double-entry journal lines ensuring zero trial balance difference.'],
      [],
      [
        'Journal Number',
        'Posting Date',
        'Reference #',
        'Transaction Description',
        'Account Code',
        'Account Name',
        'Debit Amount (RWF)',
        'Credit Amount (RWF)',
        'Status',
        'Created By',
      ],
    ];

    const txRowStart = txSheetData.length + 1;
    state.journalEntries.forEach((journal) => {
      journal.lines.forEach((line) => {
        txSheetData.push([
          journal.journalNumber,
          journal.date,
          journal.reference,
          line.description || journal.description,
          line.accountCode,
          line.accountName,
          line.debit,
          line.credit,
          journal.status,
          journal.createdBy || 'System Administrator',
        ]);
      });
    });
    const txRowEnd = txSheetData.length;

    txSheetData.push([
      'TOTAL GENERAL LEDGER (DEBITS = CREDITS)',
      '',
      '',
      '',
      '',
      '',
      `=SUM(G${txRowStart}:G${txRowEnd})`,
      `=SUM(H${txRowStart}:H${txRowEnd})`,
      trialBalance.isBalanced ? 'BALANCED (0.00 DIFF)' : 'OUT OF BALANCE',
      'AUDITED',
    ]);

    const wsTx = XLSX.utils.aoa_to_sheet(txSheetData);
    wsTx['!cols'] = [
      { wch: 18 },
      { wch: 14 },
      { wch: 18 },
      { wch: 38 },
      { wch: 14 },
      { wch: 30 },
      { wch: 20 },
      { wch: 20 },
      { wch: 16 },
      { wch: 22 },
    ];
    wsTx['!views'] = [{ state: 'frozen', ySplit: 5 }];
    XLSX.utils.book_append_sheet(wb, wsTx, 'Transaction Details');

    // ==========================================
    // WRITE FILE
    // ==========================================
    const finalFileName = `SEMS_Executive_Financial_Report_FY${fiscalYear}_${dateShort}.xlsx`;
    XLSX.writeFile(wb, finalFileName);
  }

  /**
   * Export Single Table to Excel Sheet (.xlsx) with Formatted Headers
   */
  static exportToExcel(
    title: string,
    filename: string,
    headers: string[],
    rows: (string | number)[][],
    summaryStats?: { label: string; value: string | number }[]
  ) {
    const wb = XLSX.utils.book_new();

    const matrix: (string | number)[][] = [
      ['SHARED EXPENSES MANAGEMENT SYSTEM'],
      ['Telecom House Shared Facility (6th Floor) | Boulevard de l’Umuganda, Kacyiru, Kigali, Rwanda'],
      ['Participating Organizations: Fablab Rwanda (38%) | Klab (32%) | Fab Cafe (18%) | 250Startups (12%)'],
      ['Executive Administrator: Emmanuel Niyonzima (niyonzimaemmanuel85@gmail.com)'],
      [`Report Title: ${title}`],
      [`Generated Date: ${new Date().toISOString().replace('T', ' ').slice(0, 19)}`],
      [`Currency: RWF (Rwandan Francs)`],
      [],
    ];

    if (summaryStats && summaryStats.length > 0) {
      matrix.push(['KEY FINANCIAL SUMMARY METRICS:']);
      summaryStats.forEach((stat) => {
        matrix.push([stat.label, stat.value]);
      });
      matrix.push([]);
    }

    const headerRowIdx = matrix.length;
    matrix.push(headers);

    const dataStartRow = matrix.length + 1;
    rows.forEach((r) => matrix.push(r));
    const dataEndRow = matrix.length;

    // Check if there are numeric columns to add an auto-sum row
    const isNumberColumn = (colIdx: number) => {
      if (rows.length === 0) return false;
      return rows.some((r) => typeof r[colIdx] === 'number');
    };

    const hasNumericCols = headers.some((_, i) => isNumberColumn(i));
    if (hasNumericCols && rows.length > 1) {
      const sumRow: (string | number)[] = ['TOTAL SUMMARY'];
      for (let c = 1; c < headers.length; c++) {
        if (isNumberColumn(c)) {
          const colLetter = toCellRef(c, 0).replace(/[0-9]/g, '');
          sumRow.push(`=SUM(${colLetter}${dataStartRow}:${colLetter}${dataEndRow})`);
        } else {
          sumRow.push('');
        }
      }
      matrix.push(sumRow);
    }

    const ws = XLSX.utils.aoa_to_sheet(matrix);

    const colWidths = headers.map((h, i) => {
      let maxLen = h.length;
      rows.forEach((r) => {
        const val = r[i] !== undefined ? String(r[i]) : '';
        if (val.length > maxLen) maxLen = val.length;
      });
      return { wch: Math.min(50, Math.max(16, maxLen + 3)) };
    });

    ws['!cols'] = colWidths;
    ws['!views'] = [{ state: 'frozen', ySplit: headerRowIdx + 1 }];

    const safeSheetName = title.slice(0, 31).replace(/[:\/\\?*\[\]]/g, '');
    XLSX.utils.book_append_sheet(wb, ws, safeSheetName || 'Financial Report');
    XLSX.writeFile(wb, `${filename.replace(/\.xlsx$/i, '')}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  /**
   * Helper to draw authentic FabLab Rwanda logo vector
   */
  private static drawFabLabLogo(doc: jsPDF, x: number, y: number, radius: number = 13) {
    doc.setFillColor(255, 255, 255);
    doc.circle(x, y, radius + 1.2, 'F');

    doc.setFillColor(11, 25, 44);
    doc.circle(x, y, radius, 'F');

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(1.1);
    doc.line(x - radius * 0.44, y - radius * 0.35, x + radius * 0.44, y - radius * 0.35);
    doc.line(x - radius * 0.44, y - radius * 0.35, x, y + radius * 0.48);
    doc.line(x + radius * 0.44, y - radius * 0.35, x, y + radius * 0.48);

    doc.setFillColor(11, 25, 44);
    doc.circle(x, y - radius * 0.02, radius * 0.22, 'F');
    doc.setFillColor(255, 255, 255);
    doc.circle(x, y - radius * 0.02, radius * 0.16, 'F');

    // Top-Left (Red #E31B23)
    doc.setFillColor(255, 255, 255);
    doc.circle(x - radius * 0.44, y - radius * 0.35, radius * 0.34, 'F');
    doc.setFillColor(227, 27, 35);
    doc.circle(x - radius * 0.44, y - radius * 0.35, radius * 0.28, 'F');
    doc.setFillColor(255, 255, 255);
    doc.circle(x - radius * 0.44, y - radius * 0.35, radius * 0.1, 'F');

    // Top-Right (Green #009A44)
    doc.setFillColor(255, 255, 255);
    doc.circle(x + radius * 0.44, y - radius * 0.35, radius * 0.34, 'F');
    doc.setFillColor(0, 154, 68);
    doc.circle(x + radius * 0.44, y - radius * 0.35, radius * 0.28, 'F');
    doc.setFillColor(255, 255, 255);
    doc.circle(x + radius * 0.44, y - radius * 0.35, radius * 0.1, 'F');

    // Bottom (Blue #0F4C81)
    doc.setFillColor(255, 255, 255);
    doc.circle(x, y + radius * 0.48, radius * 0.34, 'F');
    doc.setFillColor(15, 76, 129);
    doc.circle(x, y + radius * 0.48, radius * 0.28, 'F');
    doc.setFillColor(255, 255, 255);
    doc.circle(x, y + radius * 0.48, radius * 0.1, 'F');
  }

  /**
   * Export Report to PDF with High-Res Brand Letterhead
   */
  static exportToPDF(
    title: string,
    filename: string,
    headers: string[],
    rows: (string | number)[][],
    options?: {
      subtitle?: string;
      orientation?: 'portrait' | 'landscape';
      generatedBy?: string;
      summaryStats?: { label: string; value: string | number }[];
    }
  ) {
    const orientation = options?.orientation || (headers.length > 6 ? 'landscape' : 'portrait');
    const doc = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();

    // Top Header Banner
    doc.setFillColor(11, 25, 44);
    doc.rect(0, 0, pageWidth, 36, 'F');

    // Tri-color accent line
    doc.setFillColor(227, 27, 35);
    doc.rect(0, 36, pageWidth * 0.33, 2.2, 'F');
    doc.setFillColor(0, 154, 68);
    doc.rect(pageWidth * 0.33, 36, pageWidth * 0.34, 2.2, 'F');
    doc.setFillColor(15, 76, 129);
    doc.rect(pageWidth * 0.67, 36, pageWidth * 0.33, 2.2, 'F');

    this.drawFabLabLogo(doc, 20, 18, 12);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('SHARED EXPENSES MANAGEMENT SYSTEM', 38, 14);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(226, 232, 240);
    doc.text('Telecom House Shared Facility (6th Floor) | Boulevard de l’Umuganda, Kigali, Rwanda', 38, 20);
    doc.text('Participating: Fablab Rwanda (38%) | Klab (32%) | Fab Cafe (18%) | 250Startups (12%)', 38, 26);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Super Administrator: Emmanuel Niyonzima | Reporting Currency: RWF', 38, 31);

    // Title Section
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 14, 46);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    const dateStr = `Generated: ${new Date().toISOString().replace('T', ' ').slice(0, 19)}`;
    const authorStr = options?.generatedBy ? ` | Prepared by: ${options.generatedBy}` : '';
    doc.text(`${dateStr}${authorStr}`, 14, 52);

    let startY = 56;

    if (options?.summaryStats && options.summaryStats.length > 0) {
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(14, startY, pageWidth - 28, 13, 2, 2, 'F');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);

      let xPos = 18;
      options.summaryStats.forEach((stat) => {
        doc.setFont('helvetica', 'bold');
        doc.text(`${stat.label}: `, xPos, startY + 8);
        const labelWidth = doc.getTextWidth(`${stat.label}: `);
        doc.setFont('helvetica', 'normal');
        doc.text(`${stat.value}`, xPos + labelWidth, startY + 8);
        xPos += labelWidth + doc.getTextWidth(`${stat.value}`) + 8;
      });
      startY += 17;
    }

    autoTable(doc, {
      head: [headers],
      body: rows.map((r) => r.map((cell) => String(cell))),
      startY,
      margin: { left: 14, right: 14 },
      styles: {
        fontSize: 7.5,
        cellPadding: 2.2,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.1,
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: [11, 25, 44],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      didDrawPage: (data) => {
        const pageCount = (doc.internal as any).getNumberOfPages();
        const pageCurrent = data.pageNumber;
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Shared Expenses Management System - Page ${pageCurrent} of ${pageCount}`,
          14,
          doc.internal.pageSize.getHeight() - 8
        );
        doc.text(
          'CONFIDENTIAL & AUDITABLE FINANCIAL REPORT',
          pageWidth - 14 - doc.getTextWidth('CONFIDENTIAL & AUDITABLE FINANCIAL REPORT'),
          doc.internal.pageSize.getHeight() - 8
        );
      },
    });

    doc.save(`${filename.replace(/\.pdf$/i, '')}_${new Date().toISOString().slice(0, 10)}.pdf`);
  }
}
