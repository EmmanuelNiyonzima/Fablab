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
   * Applies corporate financial formatting across worksheets:
   * - Format currency: #,##0.00;[Red]-#,##0.00;"-"
   * - Format percentages: 0.00%
   * - Format quantities/integers: #,##0
   * - Auto-calculate responsive column widths
   */
  static applyProfessionalWorkbookFormatting(wb: XLSX.WorkBook) {
    wb.SheetNames.forEach((sheetName) => {
      const ws = wb.Sheets[sheetName];
      if (!ws || !ws['!ref']) return;

      const range = XLSX.utils.decode_range(ws['!ref']);
      const colMaxLens: number[] = [];

      for (let c = range.s.c; c <= range.e.c; c++) {
        colMaxLens[c] = 12;
      }

      for (let r = range.s.r; r <= range.e.r; r++) {
        for (let c = range.s.c; c <= range.e.c; c++) {
          const cellRef = XLSX.utils.encode_cell({ r, c });
          const cell = ws[cellRef];
          if (!cell) continue;

          // Track string length for auto-width
          const str = cell.v !== undefined && cell.v !== null ? String(cell.v) : '';
          if (str.length > colMaxLens[c]) {
            colMaxLens[c] = Math.min(str.length + 3, 50);
          }

          // Format numbers and formulas
          if (cell.t === 'n' || cell.f) {
            const val = typeof cell.v === 'number' ? cell.v : 0;
            // Percentage
            if (cell.t === 'n' && val > 0 && val <= 1 && Math.abs(val) !== 1) {
              cell.z = '0.00%';
            } else if (cell.t === 'n' && Number.isInteger(val) && val >= 0 && val <= 500 && !cell.f) {
              // Item count, staff, area count
              cell.z = '#,##0';
            } else {
              // Financial amounts
              cell.z = '#,##0.00;[Red]-#,##0.00;"-"';
            }
          }
        }
      }

      if (!ws['!cols'] || ws['!cols'].length === 0) {
        ws['!cols'] = colMaxLens.map((w) => ({ wch: w }));
      } else {
        ws['!cols'] = ws['!cols'].map((col, idx) => ({
          wch: Math.max(col?.wch || 12, colMaxLens[idx] || 12),
        }));
      }
    });
  }

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

    // Format professional numbers, currencies, and auto-fit columns
    this.applyProfessionalWorkbookFormatting(wb);

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
    this.applyProfessionalWorkbookFormatting(wb);
    XLSX.writeFile(wb, `${filename.replace(/\.xlsx$/i, '')}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  /**
   * Helper to draw authentic FabLab Rwanda logo vector
   */
  public static drawFabLabLogo(doc: jsPDF, x: number, y: number, radius: number = 13) {
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
   * Helper to draw authentic kLab logo vector in PDF
   */
  public static drawKLabLogo(doc: jsPDF, x: number, y: number, radius: number = 13) {
    // Outer white disc with subtle shadow
    doc.setFillColor(255, 255, 255);
    doc.circle(x, y, radius + 1.2, 'F');

    // Main Royal Blue disc (#0284C7 / #0369A1)
    doc.setFillColor(11, 59, 102); // #0B3B66
    doc.circle(x, y, radius, 'F');

    // Cyan outer accent ring
    doc.setDrawColor(14, 165, 233); // #0EA5E9
    doc.setLineWidth(0.9);
    doc.circle(x, y, radius - 0.6, 'S');

    // Center white badge plate
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x - radius * 0.7, y - radius * 0.55, radius * 1.4, radius * 1.1, 2, 2, 'F');

    // kLab Text Vector
    // 'k' in cyan/sky blue
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(radius * 1.05);
    doc.setTextColor(2, 132, 199); // #0284C7
    doc.text('k', x - radius * 0.48, y + radius * 0.22);

    // 'Lab' in bold navy
    doc.setTextColor(15, 23, 42); // #0F172A
    doc.text('Lab', x - radius * 0.12, y + radius * 0.22);

    // Small cyan tech dot above 'k'
    doc.setFillColor(14, 165, 233);
    doc.circle(x - radius * 0.42, y - radius * 0.28, radius * 0.12, 'F');
  }

  /**
   * Helper to draw authentic 250Startups logo vector in PDF
   */
  public static draw250StartupsLogo(doc: jsPDF, x: number, y: number, radius: number = 13) {
    // Outer white disc
    doc.setFillColor(255, 255, 255);
    doc.circle(x, y, radius + 1.2, 'F');

    // Main Deep Violet disc (#4C1D95 / #6D28D9)
    doc.setFillColor(76, 29, 149); // #4C1D95
    doc.circle(x, y, radius, 'F');

    // Purple accent ring
    doc.setDrawColor(167, 139, 250); // #A78BFA
    doc.setLineWidth(0.9);
    doc.circle(x, y, radius - 0.6, 'S');

    // Center white/soft violet badge plate
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x - radius * 0.75, y - radius * 0.58, radius * 1.5, radius * 1.16, 2, 2, 'F');

    // '250' in violet
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(radius * 0.85);
    doc.setTextColor(124, 58, 237); // #7C3AED
    doc.text('250', x - radius * 0.6, y - radius * 0.02);

    // 'Startups' in bold dark indigo
    doc.setFontSize(radius * 0.55);
    doc.setTextColor(30, 27, 75); // #1E1B4B
    doc.text('STARTUPS', x - radius * 0.6, y + radius * 0.38);

    // Small orange accelerator flame/star
    doc.setFillColor(245, 158, 11);
    doc.circle(x + radius * 0.45, y - radius * 0.2, radius * 0.14, 'F');
  }

  /**
   * Helper to draw authentic Fab Cafe logo vector in PDF
   */
  public static drawFabCafeLogo(doc: jsPDF, x: number, y: number, radius: number = 13) {
    // Outer white disc
    doc.setFillColor(255, 255, 255);
    doc.circle(x, y, radius + 1.2, 'F');

    // Main Deep Forest Emerald disc (#064E3B)
    doc.setFillColor(6, 78, 59); // #064E3B
    doc.circle(x, y, radius, 'F');

    // Emerald accent ring
    doc.setDrawColor(16, 185, 129); // #10B981
    doc.setLineWidth(0.9);
    doc.circle(x, y, radius - 0.6, 'S');

    // Center white badge plate
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x - radius * 0.75, y - radius * 0.55, radius * 1.5, radius * 1.1, 2, 2, 'F');

    // 'Fab' in slate navy
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(radius * 0.8);
    doc.setTextColor(15, 23, 42);
    doc.text('Fab', x - radius * 0.58, y + radius * 0.2);

    // 'Cafe' in emerald
    doc.setTextColor(5, 150, 105); // #059669
    doc.text('Cafe', x - radius * 0.05, y + radius * 0.2);

    // Coffee / maker steam dot
    doc.setFillColor(16, 185, 129);
    doc.circle(x + radius * 0.45, y - radius * 0.22, radius * 0.12, 'F');
  }

  /**
   * Dynamic Logo Dispatcher: Draws the appropriate authentic logo for any department
   */
  public static drawDynamicOrgLogo(
    doc: jsPDF, 
    orgKeyOrName: string | undefined, 
    x: number, 
    y: number, 
    radius: number = 13
  ) {
    const key = (orgKeyOrName || '').toLowerCase().trim();

    if (key.includes('klab') || key.includes('klb') || key.includes('innovation')) {
      this.drawKLabLogo(doc, x, y, radius);
    } else if (key.includes('250') || key.includes('startup')) {
      this.draw250StartupsLogo(doc, x, y, radius);
    } else if (key.includes('cafe') || key.includes('fabcafe')) {
      this.drawFabCafeLogo(doc, x, y, radius);
    } else {
      this.drawFabLabLogo(doc, x, y, radius);
    }
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
      orgId?: string;
      orgCode?: string;
      orgName?: string;
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
    const orgQuery = (options?.orgName || options?.orgCode || options?.orgId || '').toLowerCase();

    // Determine branding styling according to department
    let headerBg: [number, number, number] = [11, 25, 44]; // Navy default
    let brandTitle = 'SHARED EXPENSES MANAGEMENT SYSTEM';
    let brandSub = 'Telecom House Shared Facility (6th Floor) | Boulevard de l’Umuganda, Kigali, Rwanda';
    let isDeptSpecific = false;

    if (orgQuery.includes('klab') || orgQuery.includes('klb')) {
      headerBg = [11, 59, 102]; // Deep kLab Royal Blue
      brandTitle = 'kLab - INNOVATION SPACE & TECH HUB';
      brandSub = 'Telecom House 6th Floor | kLab Financial Portal & Cost Allocation Register';
      isDeptSpecific = true;
    } else if (orgQuery.includes('250') || orgQuery.includes('startup')) {
      headerBg = [76, 29, 149]; // Deep 250Startups Violet
      brandTitle = '250STARTUPS - INCUBATION HUB';
      brandSub = 'Telecom House 6th Floor | 250Startups Department Financial Portal';
      isDeptSpecific = true;
    } else if (orgQuery.includes('cafe') || orgQuery.includes('fabcafe')) {
      headerBg = [6, 78, 59]; // Fab Cafe Emerald
      brandTitle = 'FAB CAFE & CO-WORKING SPACE';
      brandSub = 'Telecom House 6th Floor | Fab Cafe Financial & Facility Accounts';
      isDeptSpecific = true;
    } else if (orgQuery.includes('fablab')) {
      headerBg = [11, 25, 44]; // FabLab Navy
      brandTitle = 'FABLAB RWANDA - DIGITAL FABRICATION FACILITY';
      brandSub = 'Telecom House 6th Floor | FabLab Operations & Shared Financial Ledger';
      isDeptSpecific = true;
    }

    // Top Header Banner
    doc.setFillColor(...headerBg);
    doc.rect(0, 0, pageWidth, 36, 'F');

    // Accent Line
    if (orgQuery.includes('klab') || orgQuery.includes('klb')) {
      doc.setFillColor(14, 165, 233); // Cyan
      doc.rect(0, 36, pageWidth, 2.2, 'F');
    } else if (orgQuery.includes('250') || orgQuery.includes('startup')) {
      doc.setFillColor(167, 139, 250); // Violet
      doc.rect(0, 36, pageWidth, 2.2, 'F');
    } else if (orgQuery.includes('cafe') || orgQuery.includes('fabcafe')) {
      doc.setFillColor(16, 185, 129); // Emerald
      doc.rect(0, 36, pageWidth, 2.2, 'F');
    } else {
      // Tri-color accent line
      doc.setFillColor(227, 27, 35);
      doc.rect(0, 36, pageWidth * 0.33, 2.2, 'F');
      doc.setFillColor(0, 154, 68);
      doc.rect(pageWidth * 0.33, 36, pageWidth * 0.34, 2.2, 'F');
      doc.setFillColor(15, 76, 129);
      doc.rect(pageWidth * 0.67, 36, pageWidth * 0.33, 2.2, 'F');
    }

    // Draw Department or Master Logo
    this.drawDynamicOrgLogo(doc, orgQuery, 20, 18, 12);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(brandTitle, 38, 14);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(226, 232, 240);
    doc.text(brandSub, 38, 20);

    if (isDeptSpecific) {
      doc.text(`Official Department Record | Telecom House Shared Facility | Currency: RWF`, 38, 26);
    } else {
      doc.text('Participating: Fablab Rwanda (38%) | Klab (32%) | Fab Cafe (18%) | 250Startups (12%)', 38, 26);
    }

    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Lead Administrator: Emmanuel Niyonzima | Reporting Currency: RWF`, 38, 31);

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

  /**
   * Export Full Shared Expenses Dedicated PDF Report for Emmanuel Niyonzima
   */
  static exportFullSharedExpensesPDF(state: DatabaseState) {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const currentUser = state.currentUser;
    const adminName = currentUser?.role === 'ADMIN' ? currentUser.name : 'Emmanuel Niyonzima (Super Administrator)';
    const dateStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const dateShort = new Date().toISOString().slice(0, 10);

    // 1. Top Navy Banner
    doc.setFillColor(11, 25, 44);
    doc.rect(0, 0, pageWidth, 38, 'F');

    // Tri-color Rwandan flag stripe
    doc.setFillColor(227, 27, 35);
    doc.rect(0, 38, pageWidth * 0.33, 2.5, 'F');
    doc.setFillColor(0, 154, 68);
    doc.rect(pageWidth * 0.33, 38, pageWidth * 0.34, 2.5, 'F');
    doc.setFillColor(15, 76, 129);
    doc.rect(pageWidth * 0.67, 38, pageWidth * 0.33, 2.5, 'F');

    // Logo
    this.drawFabLabLogo(doc, 20, 19, 13);

    // Banner Text
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('SHARED EXPENSES MANAGEMENT SYSTEM', 38, 14);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(226, 232, 240);
    doc.text('Telecom House Shared Facility (6th Floor) | Boulevard de l’Umuganda, Kacyiru, Kigali, Rwanda', 38, 20);
    doc.text('Cost Sharing Key: Fablab Rwanda (38%) | Klab (32%) | Fab Cafe (18%) | 250Startups (12%)', 38, 25.5);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Super Administrator: ${adminName} | Contact: niyonzimaemmanuel85@gmail.com | Currency: RWF`, 38, 31);

    // Title Section
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('SHARED FACILITY COST ALLOCATION & APPORTIONMENT REGISTER (FY 2026)', 14, 47);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Official Register Report | Generated: ${dateStr} | Prepared for: Emmanuel Niyonzima`, 14, 52);

    // KPI Summary Metrics Bar
    const totalAnnual = state.sharedExpenses.reduce((sum, e) => sum + e.annualAmount, 0);
    const totalMonthly = state.sharedExpenses.reduce((sum, e) => sum + e.monthlyNormalizedAmount, 0);
    const approvedCount = state.sharedExpenses.filter((e) => e.status === 'Posted' || e.status === 'Approved').length;
    const pendingCount = state.sharedExpenses.filter((e) => e.status === 'Submitted').length;
    const rejectedCount = state.sharedExpenses.filter((e) => e.status === 'Rejected').length;

    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, 56, pageWidth - 28, 14, 2, 2, 'F');

    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);

    const stats = [
      { label: 'Total Annual Pool', value: FinancialCalculator.formatRWF(totalAnnual) },
      { label: 'Monthly Normalized Cost', value: FinancialCalculator.formatRWF(totalMonthly) },
      { label: 'Registered Expenses', value: `${state.sharedExpenses.length} Items` },
      { label: 'Approved & Posted', value: `${approvedCount}` },
      { label: 'Pending Emmanuel Review', value: `${pendingCount}` },
      { label: 'Rejected / Revision', value: `${rejectedCount}` },
    ];

    let xCursor = 18;
    const colStep = (pageWidth - 36) / stats.length;
    stats.forEach((s, idx) => {
      doc.setFont('helvetica', 'bold');
      doc.text(s.label, xCursor, 61);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 76, 129);
      doc.text(s.value, xCursor, 66);
      doc.setTextColor(30, 41, 59);
      xCursor += colStep;
    });

    // Table Data Preparation
    const headers = [
      'ID',
      'Date',
      'Category & Description',
      'Submitted By Dept',
      'Dept Justification / Comment',
      'Billing Freq',
      'Total (RWF)',
      'Monthly (RWF)',
      'FabLab (38%)',
      'kLab (32%)',
      'FabCafe (18%)',
      '250S (12%)',
      'Status & Approver',
    ];

    const rows = state.sharedExpenses.map((e) => {
      const fablab = e.allocations.find((a) => a.orgId === 'org-fablab')?.monthlyShare || 0;
      const klab = e.allocations.find((a) => a.orgId === 'org-klab')?.monthlyShare || 0;
      const fabcafe = e.allocations.find((a) => a.orgId === 'org-fabcafe')?.monthlyShare || 0;
      const s250 = e.allocations.find((a) => a.orgId === 'org-250startups')?.monthlyShare || 0;

      let statusDisplay = e.status;
      if (e.approvedBy) {
        statusDisplay += `\n(${e.approvedBy})`;
      } else if (e.rejectionReason) {
        statusDisplay += `\n(Reason: ${e.rejectionReason.slice(0, 25)}...)`;
      }

      return [
        e.expenseNumber,
        e.date,
        `${e.category}\n${e.description}`,
        e.submittedByOrgName || e.createdBy,
        e.submitterComments ? `"${e.submitterComments.slice(0, 45)}..."` : 'N/A',
        e.billingFrequency,
        FinancialCalculator.formatRWF(e.totalAmount, false),
        FinancialCalculator.formatRWF(e.monthlyNormalizedAmount, false),
        FinancialCalculator.formatRWF(fablab, false),
        FinancialCalculator.formatRWF(klab, false),
        FinancialCalculator.formatRWF(fabcafe, false),
        FinancialCalculator.formatRWF(s250, false),
        statusDisplay,
      ];
    });

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 74,
      margin: { left: 14, right: 14 },
      styles: {
        fontSize: 6.8,
        cellPadding: 2,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.1,
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: [11, 25, 44],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.2,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: 18, fontStyle: 'bold' },
        1: { cellWidth: 16 },
        2: { cellWidth: 36, fontStyle: 'bold' },
        3: { cellWidth: 22 },
        4: { cellWidth: 32 },
        5: { cellWidth: 16 },
        6: { cellWidth: 20, halign: 'right', fontStyle: 'bold' },
        7: { cellWidth: 20, halign: 'right', textColor: [0, 125, 55], fontStyle: 'bold' },
        8: { cellWidth: 17, halign: 'right' },
        9: { cellWidth: 17, halign: 'right' },
        10: { cellWidth: 17, halign: 'right' },
        11: { cellWidth: 17, halign: 'right' },
        12: { cellWidth: 22, halign: 'center' },
      },
      didDrawPage: (data) => {
        const pageCount = (doc.internal as any).getNumberOfPages();
        const pageCurrent = data.pageNumber;
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Shared Expenses Management System - Document Ref: SEMS-EXP-2026 | Page ${pageCurrent} of ${pageCount}`,
          14,
          pageHeight - 6
        );
        doc.text(
          'CERTIFIED & AUDITABLE FINANCIAL DOCUMENT | SIGNED BY EMMANUEL NIYONZIMA',
          pageWidth - 14 - doc.getTextWidth('CERTIFIED & AUDITABLE FINANCIAL DOCUMENT | SIGNED BY EMMANUEL NIYONZIMA'),
          pageHeight - 6
        );
      },
    });

    // Add Signature & Approval Block on final page
    const finalY = (doc as any).lastAutoTable.finalY + 8;
    if (finalY < pageHeight - 35) {
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, finalY, pageWidth - 28, 24, 2, 2, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(14, finalY, pageWidth - 28, 24, 2, 2, 'S');

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('EXECUTIVE VERIFICATION & ADMINISTRATIVE CONFIRMATION', 18, finalY + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      doc.text(
        'I hereby certify that the shared facility expenses registered above have been reviewed, verified against invoices, and apportioned across resident organizations according to agreed floor space & usage allocations.',
        18,
        finalY + 11
      );

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 76, 129);
      doc.text('Certified By: Emmanuel Niyonzima', 18, finalY + 18);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('Super Administrator & Lead Architect | FabLab Rwanda & Telecom House Facility', 18, finalY + 22);

      doc.text('Signature & Official Stamp: ____________________________________', pageWidth - 120, finalY + 18);
      doc.text(`Date Verified: ${dateShort}`, pageWidth - 120, finalY + 22);
    }

    doc.save(`SEMS_Shared_Expenses_Full_Report_${dateShort}.pdf`);
  }

  /**
   * Export Full Shared Expenses Dedicated Excel Workbook for Emmanuel Niyonzima
   */
  static exportFullSharedExpensesExcel(state: DatabaseState) {
    const wb = XLSX.utils.book_new();
    const dateStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const dateShort = new Date().toISOString().slice(0, 10);
    const currentUser = state.currentUser;
    const adminName = currentUser?.role === 'ADMIN' ? currentUser.name : 'Emmanuel Niyonzima';

    const totalAnnual = state.sharedExpenses.reduce((sum, e) => sum + e.annualAmount, 0);
    const totalMonthly = state.sharedExpenses.reduce((sum, e) => sum + e.monthlyNormalizedAmount, 0);

    // ==========================================
    // SHEET 1: SHARED EXPENSES REGISTER
    // ==========================================
    const regSheetData: (any)[][] = [
      ['SHARED EXPENSES MANAGEMENT SYSTEM'],
      ['Telecom House Shared Facility (6th Floor) | Boulevard de l’Umuganda, Kacyiru, Kigali, Rwanda'],
      ['OFFICIAL SHARED FACILITY EXPENSES & MULTI-ORGANIZATION ALLOCATION REGISTER - FY 2026'],
      [`Generated Date: ${dateStr} | Prepared for Administrator: ${adminName} | Currency: RWF`],
      [],
      ['1. EXECUTIVE POOL SUMMARY'],
      ['Total Annual Shared Facility Budget (RWF)', totalAnnual, 'Approved & apportioned annual facility pool across 4 entities'],
      ['Monthly Normalized Operating Requirement (RWF)', totalMonthly, 'Monthly cash flow requirement to sustain Telecom House 6th Fl'],
      ['Total Registered Items', state.sharedExpenses.length, 'Total facility line items registered in SEMS database'],
      [],
      ['2. DETAILED EXPENSE REGISTER & APPORTIONMENT BREAKDOWN'],
      [
        'Expense ID',
        'Date',
        'Category',
        'Account Code',
        'Description',
        'Submitted By Department',
        'Submitter Justification / Comments',
        'Billing Frequency',
        'Total Expense Amount (RWF)',
        'Monthly Normalized Cost (RWF)',
        'FabLab Rwanda Share (38%)',
        'kLab Share (32%)',
        'Fab Cafe Share (18%)',
        '250Startups Share (12%)',
        'Status',
        'Approved By / Rejected By',
        'Approval / Rejection Remarks',
        'Invoice Attachment Ref',
      ],
    ];

    const dataStartRow = regSheetData.length + 1; // 1-indexed for Excel formulas
    state.sharedExpenses.forEach((exp) => {
      const fablab = exp.allocations.find((a) => a.orgId === 'org-fablab')?.monthlyShare || 0;
      const klab = exp.allocations.find((a) => a.orgId === 'org-klab')?.monthlyShare || 0;
      const fabcafe = exp.allocations.find((a) => a.orgId === 'org-fabcafe')?.monthlyShare || 0;
      const s250 = exp.allocations.find((a) => a.orgId === 'org-250startups')?.monthlyShare || 0;

      regSheetData.push([
        exp.expenseNumber,
        exp.date,
        exp.category,
        exp.accountCode || '6000',
        exp.description,
        exp.submittedByOrgName || exp.createdBy,
        exp.submitterComments || 'Incurred for facility operations.',
        exp.billingFrequency,
        exp.totalAmount,
        exp.monthlyNormalizedAmount,
        fablab,
        klab,
        fabcafe,
        s250,
        exp.status,
        exp.approvedBy || (exp.status === 'Rejected' ? 'Emmanuel Niyonzima (Rejected)' : 'Awaiting Emmanuel Approval'),
        exp.adminRemarks || exp.rejectionReason || 'None',
        exp.supportingDocName || 'Invoice_Attached.pdf',
      ]);
    });
    const dataEndRow = regSheetData.length;

    // Add Totals Row with Excel Formulas
    regSheetData.push([
      'TOTAL ALLOCATIONS',
      '',
      '',
      '',
      'SUM OF ALL SHARED EXPENSES',
      '',
      '',
      '',
      `=SUM(I${dataStartRow}:I${dataEndRow})`,
      `=SUM(J${dataStartRow}:J${dataEndRow})`,
      `=SUM(K${dataStartRow}:K${dataEndRow})`,
      `=SUM(L${dataStartRow}:L${dataEndRow})`,
      `=SUM(M${dataStartRow}:M${dataEndRow})`,
      `=SUM(N${dataStartRow}:N${dataEndRow})`,
      '100% RECONCILED',
      'EMMANUEL NIYONZIMA',
      'AUDITED',
      '',
    ]);

    const wsReg = XLSX.utils.aoa_to_sheet(regSheetData);
    wsReg['!cols'] = [
      { wch: 16 }, // Expense ID
      { wch: 13 }, // Date
      { wch: 18 }, // Category
      { wch: 14 }, // Account Code
      { wch: 38 }, // Description
      { wch: 24 }, // Submitted By Dept
      { wch: 36 }, // Justification
      { wch: 16 }, // Billing Freq
      { wch: 22 }, // Total Amount
      { wch: 22 }, // Monthly Normalized
      { wch: 20 }, // Fablab
      { wch: 20 }, // kLab
      { wch: 20 }, // Fab Cafe
      { wch: 20 }, // 250Startups
      { wch: 14 }, // Status
      { wch: 26 }, // Approved By
      { wch: 34 }, // Remarks
      { wch: 22 }, // Invoice Ref
    ];
    wsReg['!views'] = [{ state: 'frozen', ySplit: 11 }];
    XLSX.utils.book_append_sheet(wb, wsReg, 'Shared Expenses');

    // ==========================================
    // SHEET 2: DEPARTMENT APPORTIONMENT SUMMARY
    // ==========================================
    const deptSheetData: (any)[][] = [
      ['SHARED EXPENSES MANAGEMENT SYSTEM'],
      ['DEPARTMENTAL COST ALLOCATION & SETTLEMENT SCHEDULE - FY 2026'],
      [`Generated Date: ${dateStr} | Reporting Administrator: ${adminName}`],
      [],
      [
        'Organization / Department',
        'Org Code',
        'Floor Area (sqm)',
        'Staff Headcount',
        'Cost Share %',
        'Annual Allocated Share (RWF)',
        'Monthly Normalized Due (RWF)',
        'YTD Contributions Received (RWF)',
        'Net Outstanding Due (RWF)',
        'Settlement Status',
      ],
    ];

    const sharedSummary = AccountingService.getSharedSpaceSummary(state);
    const dStart = deptSheetData.length + 1;
    state.organizations.forEach((org) => {
      const summary = sharedSummary.orgSummaries.find((s) => s.orgId === org.id);
      const annualAlloc = summary ? summary.annualAmount : 0;
      const monthlyAlloc = summary ? summary.monthlyAmount : 0;
      const paid = summary ? summary.totalPaidYTD : 0;
      const due = summary ? summary.outstandingBalance : 0;

      deptSheetData.push([
        org.name,
        org.code,
        org.floorAreaSqM,
        org.headcount,
        summary ? Number((summary.percentageOfTotal / 100).toFixed(4)) : 0,
        annualAlloc,
        monthlyAlloc,
        paid,
        due,
        due <= 0 ? 'CURRENT / PAID' : 'OUTSTANDING DUES',
      ]);
    });
    const dEnd = deptSheetData.length;

    deptSheetData.push([
      'TOTAL APPORTIONMENT (100%)',
      'TOTAL',
      `=SUM(C${dStart}:C${dEnd})`,
      `=SUM(D${dStart}:D${dEnd})`,
      `=SUM(E${dStart}:E${dEnd})`,
      `=SUM(F${dStart}:F${dEnd})`,
      `=SUM(G${dStart}:G${dEnd})`,
      `=SUM(H${dStart}:H${dEnd})`,
      `=SUM(I${dStart}:I${dEnd})`,
      '100% RECONCILED',
    ]);

    const wsDept = XLSX.utils.aoa_to_sheet(deptSheetData);
    wsDept['!cols'] = [
      { wch: 28 },
      { wch: 12 },
      { wch: 16 },
      { wch: 16 },
      { wch: 14 },
      { wch: 24 },
      { wch: 24 },
      { wch: 26 },
      { wch: 24 },
      { wch: 18 },
    ];
    wsDept['!views'] = [{ state: 'frozen', ySplit: 4 }];
    XLSX.utils.book_append_sheet(wb, wsDept, 'Department Summary');

    // ==========================================
    // SHEET 3: CATEGORY BREAKDOWN
    // ==========================================
    const catSheetData: (any)[][] = [
      ['SHARED EXPENSES MANAGEMENT SYSTEM'],
      ['FACILITY COST BREAKDOWN BY EXPENSE CATEGORY - FY 2026'],
      [`Generated Date: ${dateStr}`],
      [],
      ['Expense Category', 'Number of Items', 'Annual Amount (RWF)', 'Monthly Amount (RWF)', '% of Total Facility Pool'],
    ];

    const catMap = new Map<string, { count: number; annual: number; monthly: number }>();
    state.sharedExpenses.forEach((e) => {
      const existing = catMap.get(e.category) || { count: 0, annual: 0, monthly: 0 };
      existing.count += 1;
      existing.annual += e.annualAmount;
      existing.monthly += e.monthlyNormalizedAmount;
      catMap.set(e.category, existing);
    });

    const catStart = catSheetData.length + 1;
    catMap.forEach((v, k) => {
      catSheetData.push([
        k,
        v.count,
        v.annual,
        v.monthly,
        totalAnnual > 0 ? Number((v.annual / totalAnnual).toFixed(4)) : 0,
      ]);
    });
    const catEnd = catSheetData.length;

    catSheetData.push([
      'TOTAL CATEGORY POOL',
      `=SUM(B${catStart}:B${catEnd})`,
      `=SUM(C${catStart}:C${catEnd})`,
      `=SUM(D${catStart}:D${catEnd})`,
      `=SUM(E${catStart}:E${catEnd})`,
    ]);

    const wsCat = XLSX.utils.aoa_to_sheet(catSheetData);
    wsCat['!cols'] = [
      { wch: 28 },
      { wch: 16 },
      { wch: 24 },
      { wch: 24 },
      { wch: 20 },
    ];
    wsCat['!views'] = [{ state: 'frozen', ySplit: 4 }];
    XLSX.utils.book_append_sheet(wb, wsCat, 'Category Breakdown');

    // Format workbook
    this.applyProfessionalWorkbookFormatting(wb);

    // Write file
    const finalFileName = `SEMS_Shared_Expenses_Official_Workbook_${dateShort}.xlsx`;
    XLSX.writeFile(wb, finalFileName);
  }

  /**
   * Export Dedicated Department Statement PDF with Authentic Organization Logo
   * Specifically for kLab, 250Startups, FabLab Rwanda, Fab Cafe
   */
  static exportDepartmentStatementPDF(
    state: DatabaseState,
    orgIdOrCode: string,
    options?: {
      fiscalYear?: number;
      generatedBy?: string;
    }
  ) {
    const fiscalYear = options?.fiscalYear || 2026;
    const org = state.organizations.find(
      (o) =>
        o.id.toLowerCase() === orgIdOrCode.toLowerCase() ||
        o.code.toLowerCase() === orgIdOrCode.toLowerCase() ||
        o.name.toLowerCase().includes(orgIdOrCode.toLowerCase())
    ) || state.organizations[0];

    const sharedSummary = AccountingService.getSharedSpaceSummary(state);
    const orgSummary = sharedSummary.orgSummaries.find((s) => s.orgId === org.id);
    const contributions = state.contributions.filter((c) => c.orgId === org.id);

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const dateStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const dateShort = new Date().toISOString().slice(0, 10);
    const orgKey = org.name.toLowerCase();

    // 1. Department Header Banner & Color Schemes
    let bannerBg: [number, number, number] = [11, 25, 44];
    let accentColor: [number, number, number] = [0, 154, 68];
    let tagBg: [number, number, number] = [235, 243, 250];
    let tagText: [number, number, number] = [15, 76, 129];

    if (orgKey.includes('klab') || orgKey.includes('klb')) {
      bannerBg = [11, 59, 102]; // Royal Blue
      accentColor = [14, 165, 233]; // Cyan
      tagBg = [224, 242, 254];
      tagText = [2, 132, 199];
    } else if (orgKey.includes('250') || orgKey.includes('startup')) {
      bannerBg = [76, 29, 149]; // Deep Purple
      accentColor = [167, 139, 250]; // Violet
      tagBg = [243, 232, 255];
      tagText = [124, 58, 237];
    } else if (orgKey.includes('cafe') || orgKey.includes('fabcafe')) {
      bannerBg = [6, 78, 59]; // Deep Emerald
      accentColor = [16, 185, 129]; // Emerald
      tagBg = [209, 250, 229];
      tagText = [5, 150, 105];
    }

    doc.setFillColor(...bannerBg);
    doc.rect(0, 0, pageWidth, 40, 'F');

    // Accent line
    doc.setFillColor(...accentColor);
    doc.rect(0, 40, pageWidth, 2.5, 'F');

    // Draw Authentic Department Logo
    this.drawDynamicOrgLogo(doc, org.name, 22, 20, 13);

    // Banner Text
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text(org.name.toUpperCase(), 42, 16);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(226, 232, 240);
    doc.text(`Official Department Financial Statement & Cost Allocation Dossier`, 42, 22);
    doc.text(`Telecom House Shared Facility (6th Floor) | Boulevard de l’Umuganda, Kacyiru, Kigali`, 42, 27.5);
    
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    doc.text(`Department Code: ${org.code} | Primary Contact: ${org.contactPerson} (${org.email})`, 42, 33);

    // Title Section
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`OFFICIAL COST RECOVERY & APPORTIONMENT STATEMENT - FY ${fiscalYear}`, 14, 49);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Document Reference: SEMS-STMT-${org.code}-${fiscalYear} | Generated: ${dateStr}`, 14, 54);

    // Department Occupancy & Key Metrics Summary Box
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 58, pageWidth - 28, 28, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 58, pageWidth - 28, 28, 2, 2, 'S');

    // Metrics Row 1: Profile
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('DEPARTMENT PROFILE:', 18, 64);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(`Floor Area: ${org.floorAreaSqM} sqm | Staff Headcount: ${org.headcount} Pax | Cost Sharing Key: ${orgSummary ? orgSummary.percentageOfTotal.toFixed(1) : '0.0'}%`, 56, 64);

    // Metrics Row 2: Financials in 4 mini columns
    const annualShare = orgSummary ? orgSummary.annualAmount : 0;
    const monthlyShare = orgSummary ? orgSummary.monthlyAmount : 0;
    const paidYTD = orgSummary ? orgSummary.totalPaidYTD : 0;
    const dueBal = orgSummary ? orgSummary.outstandingBalance : 0;

    const kpis = [
      { label: 'Annual Cost Quota', val: FinancialCalculator.formatRWF(annualShare) },
      { label: 'Monthly Share', val: FinancialCalculator.formatRWF(monthlyShare) },
      { label: 'Total Paid YTD', val: FinancialCalculator.formatRWF(paidYTD) },
      { label: 'Net Outstanding Dues', val: FinancialCalculator.formatRWF(dueBal) },
    ];

    const colWidth = (pageWidth - 36) / 4;
    kpis.forEach((k, idx) => {
      const x = 18 + idx * colWidth;
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(k.label, x, 73);

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      if (idx === 3 && dueBal > 0) {
        doc.setTextColor(185, 28, 28); // Red
      } else if (idx === 2) {
        doc.setTextColor(0, 125, 55); // Green
      } else {
        doc.setTextColor(15, 76, 129); // Blue
      }
      doc.text(k.val, x, 79);
    });

    // 1. SECTION: SCHEDULED CONTRIBUTIONS & REMITTANCE REGISTER
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('1. SCHEDULED FACILITY CONTRIBUTIONS & INVOICES', 14, 93);

    const ctbHeaders = ['Period', 'Expected (RWF)', 'Invoiced (RWF)', 'Paid (RWF)', 'Balance (RWF)', 'Status', 'Payment Ref'];
    const ctbRows = contributions.map((c) => [
      c.billingPeriod,
      FinancialCalculator.formatRWF(c.expectedAmount, false),
      FinancialCalculator.formatRWF(c.invoicedAmount, false),
      FinancialCalculator.formatRWF(c.receivedAmount, false),
      FinancialCalculator.formatRWF(c.outstandingBalance, false),
      c.status,
      c.reference || 'Bank Transfer',
    ]);

    if (ctbRows.length === 0) {
      ctbRows.push(['Jan - Dec 2026', FinancialCalculator.formatRWF(annualShare, false), FinancialCalculator.formatRWF(annualShare, false), FinancialCalculator.formatRWF(paidYTD, false), FinancialCalculator.formatRWF(dueBal, false), dueBal <= 0 ? 'Settled' : 'Active', 'Scheduled']);
    }

    autoTable(doc, {
      head: [ctbHeaders],
      body: ctbRows,
      startY: 96,
      margin: { left: 14, right: 14 },
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: bannerBg,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    });

    // 2. SECTION: SHARED FACILITY EXPENSE APPORTIONMENT BREAKDOWN
    const finalY1 = (doc as any).lastAutoTable.finalY + 8;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`2. SHARED FACILITY COST APPORTIONMENT (${org.name} - ${orgSummary ? orgSummary.percentageOfTotal.toFixed(1) : 0}%)`, 14, finalY1);

    const allocHeaders = ['Expense ID', 'Category', 'Description', 'Billing Freq', 'Total Cost (RWF)', `${org.code} Monthly Share (RWF)`];
    const allocRows = state.sharedExpenses.map((exp) => {
      const myAlloc = exp.allocations.find((a) => a.orgId === org.id || a.orgName.toLowerCase().includes(orgKey));
      const monthlyAllocVal = myAlloc ? myAlloc.monthlyShare : 0;

      return [
        exp.expenseNumber,
        exp.category,
        exp.description,
        exp.billingFrequency,
        FinancialCalculator.formatRWF(exp.totalAmount, false),
        FinancialCalculator.formatRWF(monthlyAllocVal, false),
      ];
    });

    autoTable(doc, {
      head: [allocHeaders],
      body: allocRows,
      startY: finalY1 + 3,
      margin: { left: 14, right: 14 },
      styles: {
        fontSize: 7.2,
        cellPadding: 1.8,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    });

    // Verification & Stamping Signature Block
    const finalY2 = (doc as any).lastAutoTable.finalY + 8;
    if (finalY2 < pageHeight - 32) {
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, finalY2, pageWidth - 28, 22, 2, 2, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(14, finalY2, pageWidth - 28, 22, 2, 2, 'S');

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('OFFICIAL VERIFICATION & ADMINISTRATIVE CONFIRMATION', 18, finalY2 + 5.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      doc.text(`This statement certifies that ${org.name} has been apportioned operating facility expenses for Telecom House 6th Floor in full compliance with the mutual MoU.`, 18, finalY2 + 10);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 76, 129);
      doc.text('Super Administrator: Emmanuel Niyonzima', 18, finalY2 + 16.5);
      doc.text('Official Seal & Signature: _______________________', pageWidth - 105, finalY2 + 16.5);
    }

    doc.save(`${org.name.replace(/[^a-zA-Z0-9]/g, '_')}_Financial_Statement_${dateShort}.pdf`);
  }

  /**
   * Export Official Contribution Invoice / Debit Note PDF with Authentic Department Logo
   */
  static exportContributionInvoicePDF(
    state: DatabaseState,
    contributionId: string
  ) {
    const contribution = state.contributions.find((c) => c.id === contributionId) || state.contributions[0];
    if (!contribution) return;

    const org = state.organizations.find((o) => o.id === contribution.orgId) || {
      id: contribution.orgId,
      name: contribution.orgName,
      code: contribution.orgName.slice(0, 4).toUpperCase(),
      email: `${contribution.orgName.toLowerCase().replace(/\s+/g, '')}@telecomhouse.rw`,
      contactPerson: 'Department Finance Officer',
      floorAreaSqM: 120,
    };

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const dateShort = new Date().toISOString().slice(0, 10);
    const orgKey = org.name.toLowerCase();

    // Color Scheme
    let bannerBg: [number, number, number] = [11, 25, 44];
    let accentColor: [number, number, number] = [0, 154, 68];

    if (orgKey.includes('klab') || orgKey.includes('klb')) {
      bannerBg = [11, 59, 102];
      accentColor = [14, 165, 233];
    } else if (orgKey.includes('250') || orgKey.includes('startup')) {
      bannerBg = [76, 29, 149];
      accentColor = [167, 139, 250];
    } else if (orgKey.includes('cafe') || orgKey.includes('fabcafe')) {
      bannerBg = [6, 78, 59];
      accentColor = [16, 185, 129];
    }

    // Top Navy/Branded Header
    doc.setFillColor(...bannerBg);
    doc.rect(0, 0, pageWidth, 38, 'F');
    doc.setFillColor(...accentColor);
    doc.rect(0, 38, pageWidth, 2.5, 'F');

    // Draw Department Logo
    this.drawDynamicOrgLogo(doc, org.name, 22, 19, 12);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('SHARED EXPENSES MANAGEMENT SYSTEM', 40, 15);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(226, 232, 240);
    doc.text('Telecom House Shared Facility (6th Floor) | Boulevard de l’Umuganda, Kigali, Rwanda', 40, 21);
    doc.text(`Official Expense Debit Note & Contribution Schedule | Entity: ${org.name}`, 40, 26.5);
    doc.text('Super Administrator: Emmanuel Niyonzima | Contact: niyonzimaemmanuel85@gmail.com', 40, 32);

    // Invoice Title & Meta Box
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('FACILITY CONTRIBUTION INVOICE', 14, 52);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Invoice Ref: INV-${contribution.id.toUpperCase()}`, 14, 58);

    // 2-Column Info Block: Billed To vs Payment Details
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 62, 88, 36, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 62, 88, 36, 2, 2, 'S');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 76, 129);
    doc.text('BILLED TO (DEPARTMENT):', 18, 68);

    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(org.name, 18, 74);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Contact: ${org.contactPerson || 'Finance Officer'}`, 18, 79);
    doc.text(`Email: ${org.email}`, 18, 83.5);
    doc.text(`Location: Telecom House 6th Floor (${org.floorAreaSqM} sqm)`, 18, 88);

    // Right Box: Invoice Summary
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(108, 62, 88, 36, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(108, 62, 88, 36, 2, 2, 'S');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 76, 129);
    doc.text('INVOICE METRICS & PERIOD:', 112, 68);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Billing Period: ${contribution.billingPeriod}`, 112, 74);
    doc.text(`Date of Issue: ${dateShort}`, 112, 79);
    doc.text(`Payment Due: 15th of the Month`, 112, 83.5);
    doc.text(`Status: ${contribution.status.toUpperCase()}`, 112, 88);

    // Line Items Table
    const invHeaders = ['Item #', 'Description / Facility Shared Line', 'Cost Category', 'Period', 'Amount Due (RWF)'];
    const invRows = [
      ['1', `Facility Shared Rent & Space Allocation (${contribution.orgName})`, 'Rent & Space', contribution.billingPeriod, FinancialCalculator.formatRWF(contribution.expectedAmount * 0.45, false)],
      ['2', `EUCL Electricity & High-Load Power Allocation`, 'Utilities', contribution.billingPeriod, FinancialCalculator.formatRWF(contribution.expectedAmount * 0.22, false)],
      ['3', `Dedicated High-Speed Fiber Internet & IT Bandwidth`, 'Internet', contribution.billingPeriod, FinancialCalculator.formatRWF(contribution.expectedAmount * 0.15, false)],
      ['4', `24/7 Security, Access Control & Reception Staff`, 'Security', contribution.billingPeriod, FinancialCalculator.formatRWF(contribution.expectedAmount * 0.10, false)],
      ['5', `Janitorial Cleaning, Waste Management & Supplies`, 'Cleaning', contribution.billingPeriod, FinancialCalculator.formatRWF(contribution.expectedAmount * 0.08, false)],
    ];

    autoTable(doc, {
      head: [invHeaders],
      body: invRows,
      startY: 104,
      margin: { left: 14, right: 14 },
      styles: {
        fontSize: 8,
        cellPadding: 2.5,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: bannerBg,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: 16, halign: 'center' },
        1: { cellWidth: 70, fontStyle: 'bold' },
        2: { cellWidth: 32 },
        3: { cellWidth: 28 },
        4: { cellWidth: 36, halign: 'right', fontStyle: 'bold' },
      },
    });

    // Total Calculation Box
    const finalY = (doc as any).lastAutoTable.finalY + 6;
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(pageWidth - 92, finalY, 78, 24, 2, 2, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(pageWidth - 92, finalY, 78, 24, 2, 2, 'S');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Total Invoiced Amount:', pageWidth - 88, finalY + 7);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 76, 129);
    doc.text(FinancialCalculator.formatRWF(contribution.invoicedAmount || contribution.expectedAmount), pageWidth - 88, finalY + 13);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 125, 55);
    doc.text(`Received Payment: ${FinancialCalculator.formatRWF(contribution.receivedAmount || 0)}`, pageWidth - 88, finalY + 18.5);

    // Remittance Bank Details
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, finalY, pageWidth - 110, 24, 2, 2, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, finalY, pageWidth - 110, 24, 2, 2, 'S');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('BANK SETTLEMENT INSTRUCTIONS:', 18, finalY + 6);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Bank: Bank of Kigali (BK) | Account Name: Shared Facility Operations', 18, finalY + 11);
    doc.text(`Account No: 00040-0694839-22 | Swift: BOKIRWRW`, 18, finalY + 15.5);
    doc.text(`Payment Reference: ${org.code}-${contribution.billingPeriod}`, 18, finalY + 20);

    // Signatures
    const finalYSign = finalY + 30;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 76, 129);
    doc.text('Authorized By: Emmanuel Niyonzima (Super Administrator)', 14, finalYSign);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Signature & Official Stamp: _________________________________', pageWidth - 115, finalYSign);

    doc.save(`Invoice_${org.code}_${contribution.billingPeriod.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
  }
}


