import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  FileSpreadsheet, 
  UploadCloud, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Building2, 
  DollarSign, 
  Layers, 
  RefreshCw, 
  FileText, 
  Check, 
  Trash2, 
  HelpCircle,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { storageService } from '../../services/storageService';
import { FinancialCalculator } from '../../services/calculationService';
import { SecurityScope } from '../../utils/securityScope';
import { IncomeTransaction, PaymentMethod } from '../../types/financial';

interface ExtractedRevenueRow {
  id: string;
  date: string;
  customer: string;
  description: string;
  accountCode: string;
  accountName: string;
  amount: number;
  tax: number;
  paymentMethod: PaymentMethod;
  project?: string;
  organizationId?: string;
  organizationName?: string;
  isValid: boolean;
  validationError?: string;
}

interface ImportRevenueDatasetViewProps {
  onNavigate?: (module: string) => void;
}

export const ImportRevenueDatasetView: React.FC<ImportRevenueDatasetViewProps> = ({ onNavigate }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const state = storageService.getState();
  const currentUser = state.currentUser;
  const isAdmin = SecurityScope.isSuperAdmin(currentUser);
  const userOrg = SecurityScope.getUserOrg(currentUser, state.organizations);

  const revenueAccounts = state.accounts.filter(
    (a) => a.type === 'Revenue' || a.type === 'Other Income'
  );

  // States
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<any[]>([]);
  
  // Column Mappings
  const [dateCol, setDateCol] = useState<string>('');
  const [customerCol, setCustomerCol] = useState<string>('');
  const [descCol, setDescCol] = useState<string>('');
  const [amountCol, setAmountCol] = useState<string>('');
  const [categoryCol, setCategoryCol] = useState<string>('');
  const [paymentMethodCol, setPaymentMethodCol] = useState<string>('');
  const [projectCol, setProjectCol] = useState<string>('');
  const [taxCol, setTaxCol] = useState<string>('');

  // Target Settings
  const [targetOrgId, setTargetOrgId] = useState<string>(userOrg?.id || 'org-fablab');
  const [defaultAccountId, setDefaultAccountId] = useState<string>(revenueAccounts[0]?.id || '');
  
  // Extracted Data
  const [extractedRows, setExtractedRows] = useState<ExtractedRevenueRow[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [importedCount, setImportedCount] = useState<number>(0);
  const [importedTotal, setImportedTotal] = useState<number>(0);

  // Helper: Normalize Excel Date
  const parseExcelDate = (val: any): string => {
    if (!val) return new Date().toISOString().split('T')[0];
    if (val instanceof Date) {
      return val.toISOString().split('T')[0];
    }
    if (typeof val === 'number') {
      // Excel serial date format
      const dateObj = new Date(Math.round((val - 25569) * 86400 * 1000));
      if (!isNaN(dateObj.getTime())) {
        return dateObj.toISOString().split('T')[0];
      }
    }
    const str = String(val).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      return str;
    }
    // Handle DD/MM/YYYY or MM/DD/YYYY
    const slashParts = str.split(/[/.-]/);
    if (slashParts.length === 3) {
      if (slashParts[0].length === 4) {
        return `${slashParts[0]}-${slashParts[1].padStart(2, '0')}-${slashParts[2].padStart(2, '0')}`;
      } else if (slashParts[2].length === 4) {
        return `${slashParts[2]}-${slashParts[1].padStart(2, '0')}-${slashParts[0].padStart(2, '0')}`;
      }
    }
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
  };

  // Helper: Normalize Amount
  const parseAmount = (val: any): number => {
    if (typeof val === 'number') return isNaN(val) ? 0 : Math.round(val);
    if (!val) return 0;
    const cleanStr = String(val)
      .replace(/[RWF$€£,\s]/gi, '')
      .trim();
    const num = parseFloat(cleanStr);
    return isNaN(num) ? 0 : Math.round(num);
  };

  // Helper: Parse Payment Method
  const parsePaymentMethod = (val: any): PaymentMethod => {
    if (!val) return 'Bank Transfer';
    const str = String(val).toLowerCase();
    if (str.includes('momo') || str.includes('mobile') || str.includes('mtn') || str.includes('airtel')) {
      return 'Momo / MoMoPay';
    }
    if (str.includes('cash')) return 'Cash';
    if (str.includes('card') || str.includes('visa') || str.includes('master')) return 'Credit Card';
    if (str.includes('cheque') || str.includes('check')) return 'Cheque';
    return 'Bank Transfer';
  };

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setFileName(uploadedFile.name);
    setIsProcessing(true);
    setIsSuccess(false);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array', cellDates: true });
        setWorkbook(wb);
        setSheetNames(wb.SheetNames);
        
        const firstSheetName = wb.SheetNames[0];
        setSelectedSheet(firstSheetName);
        processSheet(wb, firstSheetName);
      } catch (err) {
        console.error('Failed to parse Excel file:', err);
        alert('Could not read Excel file. Please ensure it is a valid .xlsx, .xls or .csv document.');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsArrayBuffer(uploadedFile);
  };

  // Process a selected worksheet
  const processSheet = (wb: XLSX.WorkBook, sheetName: string) => {
    const ws = wb.Sheets[sheetName];
    if (!ws) return;

    // Convert sheet to JSON array
    const rawData = XLSX.utils.sheet_to_json<any>(ws, { header: 1, defval: '' });
    if (!rawData || rawData.length < 2) {
      alert('The selected sheet does not contain enough data or header rows.');
      return;
    }

    // Find first non-empty row as header
    let headerIdx = 0;
    for (let i = 0; i < Math.min(5, rawData.length); i++) {
      if (Array.isArray(rawData[i]) && rawData[i].some((cell: any) => String(cell).trim() !== '')) {
        headerIdx = i;
        break;
      }
    }

    const headers: string[] = (rawData[headerIdx] as any[]).map((h) => String(h || '').trim());
    const dataRows = rawData.slice(headerIdx + 1).filter((r: any[]) => r.some((c) => c !== ''));

    setRawHeaders(headers);
    setRawRows(dataRows);

    // Auto-detect best column matches
    const dateMatch = headers.find((h) => /date|period|time/i.test(h)) || headers[0] || '';
    const customerMatch = headers.find((h) => /customer|client|payer|sponsor|partner|source|received from/i.test(h)) || headers[1] || '';
    const descMatch = headers.find((h) => /desc|particular|detail|service|memo|narration/i.test(h)) || headers[2] || '';
    const amountMatch = headers.find((h) => /amount|revenue|total|sum|rwf|price|subtotal|gross/i.test(h)) || headers[3] || '';
    const catMatch = headers.find((h) => /cat|stream|account|type/i.test(h)) || '';
    const payMatch = headers.find((h) => /pay|method|channel|mode/i.test(h)) || '';
    const projMatch = headers.find((h) => /project|ref|invoice|receipt/i.test(h)) || '';
    const taxMatch = headers.find((h) => /tax|vat|wht/i.test(h)) || '';

    setDateCol(dateMatch);
    setCustomerCol(customerMatch);
    setDescCol(descMatch);
    setAmountCol(amountMatch);
    setCategoryCol(catMatch);
    setPaymentMethodCol(payMatch);
    setProjectCol(projMatch);
    setTaxCol(taxMatch);

    // Generate Initial Extracted Rows
    extractRowsFromData(
      headers, 
      dataRows, 
      dateMatch, 
      customerMatch, 
      descMatch, 
      amountMatch, 
      catMatch, 
      payMatch, 
      projMatch, 
      taxMatch,
      targetOrgId,
      defaultAccountId
    );
  };

  const handleSheetChange = (sheet: string) => {
    setSelectedSheet(sheet);
    if (workbook) {
      processSheet(workbook, sheet);
    }
  };

  const extractRowsFromData = (
    headers: string[],
    data: any[][],
    dCol: string,
    cCol: string,
    deCol: string,
    aCol: string,
    catCol: string,
    pCol: string,
    prCol: string,
    tCol: string,
    orgId: string,
    accId: string
  ) => {
    const dIdx = headers.indexOf(dCol);
    const cIdx = headers.indexOf(cCol);
    const deIdx = headers.indexOf(deCol);
    const aIdx = headers.indexOf(aCol);
    const catIdx = headers.indexOf(catCol);
    const pIdx = headers.indexOf(pCol);
    const prIdx = headers.indexOf(prCol);
    const tIdx = headers.indexOf(tCol);

    const defaultAcc = revenueAccounts.find((a) => a.id === accId) || revenueAccounts[0];
    const org = state.organizations.find((o) => o.id === orgId);

    const rows: ExtractedRevenueRow[] = [];

    data.forEach((r, idx) => {
      const rawDate = dIdx !== -1 ? r[dIdx] : '';
      const rawCustomer = cIdx !== -1 ? String(r[cIdx] || '').trim() : '';
      const rawDesc = deIdx !== -1 ? String(r[deIdx] || '').trim() : '';
      const rawAmount = aIdx !== -1 ? r[aIdx] : 0;
      const rawCat = catIdx !== -1 ? String(r[catIdx] || '').trim() : '';
      const rawPay = pIdx !== -1 ? r[pIdx] : '';
      const rawProj = prIdx !== -1 ? String(r[prIdx] || '').trim() : '';
      const rawTax = tIdx !== -1 ? r[tIdx] : 0;

      const date = parseExcelDate(rawDate);
      const amount = parseAmount(rawAmount);
      const tax = parseAmount(rawTax);
      const paymentMethod = parsePaymentMethod(rawPay);
      const customer = rawCustomer || (org ? org.name : 'Walk-in Client');
      const description = rawDesc || `Revenue Collection - ${customer}`;

      // Match Revenue Account
      let matchedAcc = defaultAcc;
      if (rawCat) {
        const found = revenueAccounts.find(
          (a) => a.name.toLowerCase().includes(rawCat.toLowerCase()) || a.code === rawCat
        );
        if (found) matchedAcc = found;
      }

      const isValid = amount > 0 && customer.length > 0;
      const validationError = amount <= 0 ? 'Amount must be greater than 0' : undefined;

      if (rawDate || rawCustomer || rawDesc || amount > 0) {
        rows.push({
          id: `ext-${idx}-${Date.now()}`,
          date,
          customer,
          description,
          accountCode: matchedAcc?.code || '4000',
          accountName: matchedAcc?.name || 'Fabrication & 3D Prototyping Services',
          amount,
          tax,
          paymentMethod,
          project: rawProj || undefined,
          organizationId: org?.id,
          organizationName: org?.name,
          isValid,
          validationError,
        });
      }
    });

    setExtractedRows(rows);
  };

  // Re-apply extraction when user updates column mappings
  const handleApplyMapping = () => {
    extractRowsFromData(
      rawHeaders,
      rawRows,
      dateCol,
      customerCol,
      descCol,
      amountCol,
      categoryCol,
      paymentMethodCol,
      projectCol,
      taxCol,
      targetOrgId,
      defaultAccountId
    );
  };

  // Inline edit row
  const handleUpdateRow = (id: string, field: keyof ExtractedRevenueRow, value: any) => {
    setExtractedRows((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const updated = { ...r, [field]: value };
          if (field === 'amount') {
            updated.amount = Number(value) || 0;
            updated.isValid = updated.amount > 0 && updated.customer.length > 0;
            updated.validationError = updated.amount <= 0 ? 'Amount must be > 0' : undefined;
          }
          return updated;
        }
        return r;
      })
    );
  };

  const handleDeleteRow = (id: string) => {
    setExtractedRows((prev) => prev.filter((r) => r.id !== id));
  };

  // Perform Final Ingestion & Database Recording
  const handleRecordAllExtractedRevenues = () => {
    const validRows = extractedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      alert('There are no valid revenue records to import. Please check that amounts are positive.');
      return;
    }

    const assignedOrg = state.organizations.find((o) => o.id === targetOrgId);

    const payload = validRows.map((r) => ({
      date: r.date,
      customer: r.customer,
      description: r.description,
      accountId: revenueAccounts.find((a) => a.code === r.accountCode)?.id || defaultAccountId,
      accountCode: r.accountCode,
      accountName: r.accountName,
      amount: r.amount,
      tax: r.tax,
      paymentMethod: r.paymentMethod,
      organizationId: assignedOrg?.id,
      project: r.project || (assignedOrg ? `${assignedOrg.name} Revenue Stream` : undefined),
      supportingDocName: fileName || 'Imported_Excel_Dataset.xlsx',
      notes: `Ingested via Excel Dataset Extractor on ${new Date().toISOString().slice(0, 10)}. Original source: ${fileName}`,
      status: 'Posted' as const,
      approvedBy: currentUser.name,
    }));

    const added = storageService.batchAddIncomeTransactions(payload);
    const sumAmount = validRows.reduce((sum, r) => sum + r.amount + r.tax, 0);

    setImportedCount(added.length);
    setImportedTotal(sumAmount);
    setIsSuccess(true);
  };

  // Download official Excel Revenue Template
  const handleDownloadTemplate = () => {
    const templateHeaders = [
      'Date (YYYY-MM-DD)',
      'Customer / Client Name',
      'Revenue Stream / Category',
      'Description of Service / Goods',
      'Amount (RWF)',
      'Tax / VAT (RWF)',
      'Payment Method',
      'Reference / Invoice #',
      'Project / Department'
    ];

    const sampleRows = [
      ['2026-08-10', 'University of Rwanda - College of Science', 'Fabrication & 3D Prototyping Services', 'Precision CNC milling for drone chassis parts', 1250000, 0, 'Bank Transfer', 'INV-2026-089', 'FabLab Rwanda'],
      ['2026-08-12', 'Kigali Makers Guild', 'Training & Workshops', 'Digital Fabrication 5-day bootcamp registration', 750000, 0, 'Mobile Money (MoMo)', 'REC-MOMO-941', 'FabLab Rwanda'],
      ['2026-08-14', 'Norrsken Kigali Resident Members', 'Fab Cafe Food & Beverage', 'Event catering & specialty coffee services', 480000, 0, 'Credit/Debit Card', 'POS-8921', 'Fab Cafe'],
      ['2026-08-18', 'FinTech Innovators Cohort 4', 'Incubation & Acceleration Fees', 'Cohort 4 quarterly incubation workspace fee', 2200000, 0, 'Bank Transfer', 'INV-250S-412', '250Startups'],
      ['2026-08-20', 'MINICT Technology Grant', 'Grants & Sponsorships', 'IoT prototyping hardware development grant Q3', 5000000, 0, 'Bank Transfer', 'GRANT-2026-Q3', 'kLab'],
      ['2026-08-22', 'Smart Cities Initiative Ltd', 'Technical Consulting & Design', 'CAD architecture & PCB layout prototyping', 1850000, 0, 'Bank Transfer', 'INV-2026-104', 'FabLab Rwanda'],
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([templateHeaders, ...sampleRows]);

    // Formatting & Widths
    ws['!cols'] = [
      { wch: 18 },
      { wch: 32 },
      { wch: 35 },
      { wch: 45 },
      { wch: 18 },
      { wch: 16 },
      { wch: 22 },
      { wch: 22 },
      { wch: 22 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Revenue Dataset Template');
    XLSX.writeFile(wb, `Official_Revenue_Dataset_Template_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const validRowsCount = extractedRows.filter((r) => r.isValid).length;
  const totalRevenueSum = extractedRows.reduce((sum, r) => sum + (r.isValid ? r.amount + r.tax : 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200/60 font-bold">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Import Revenue Dataset</h2>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-block mt-0.5">
                Automated Excel & CSV Dataset Extraction
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2 max-w-3xl">
            Upload your departmental Excel spreadsheets (<code>.xlsx</code>, <code>.xls</code>, <code>.csv</code>). The system automatically parses client receipts, prototyping invoices, incubation fees, and syncs all revenue entries directly to the General Ledger.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Download Revenue Template (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {isSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 shadow-xs text-emerald-900 animate-in fade-in">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl mt-0.5">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-emerald-950">
                  Successfully Extracted & Recorded {importedCount} Revenue Records!
                </h3>
                <p className="text-xs text-emerald-800 mt-1">
                  A total of <strong className="font-mono font-bold text-emerald-950">{FinancialCalculator.formatRWF(importedTotal)}</strong> has been recorded into the Revenue Register, reconciled with cash accounts, and posted to the double-entry general ledger.
                </p>
                <div className="mt-3 flex items-center gap-3">
                  {onNavigate && (
                    <button
                      type="button"
                      onClick={() => onNavigate('record-revenue')}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <span>View in Record Revenue Register</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSuccess(false);
                      setFile(null);
                      setExtractedRows([]);
                    }}
                    className="px-3.5 py-2 bg-white border border-emerald-200 text-emerald-900 text-xs font-semibold rounded-xl hover:bg-emerald-100/60 cursor-pointer"
                  >
                    Import Another Spreadsheet
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Box */}
      {!isSuccess && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Upload Area & Extraction Mapping (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-emerald-600" />
                  <span>1. Select Excel / CSV Spreadsheet</span>
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">XLSX, XLS, CSV</span>
              </div>

              {/* Drag & Drop Input */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-emerald-200 hover:border-emerald-500 bg-emerald-50/30 hover:bg-emerald-50/60 rounded-2xl p-6 text-center cursor-pointer transition-all duration-150 group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="w-12 h-12 bg-white rounded-2xl shadow-xs border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600 group-hover:scale-105 transition-transform">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-800 mt-3">
                  {file ? file.name : 'Click to browse or drag & drop revenue file'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  {file ? `${(file.size / 1024).toFixed(1)} KB spreadsheet loaded` : 'Supports multi-sheet workbooks with instant column mapping'}
                </p>
              </div>

              {/* Sheet Selector (if multiple) */}
              {sheetNames.length > 1 && (
                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-bold text-slate-700">Select Worksheet</label>
                  <select
                    value={selectedSheet}
                    onChange={(e) => handleSheetChange(e.target.value)}
                    className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  >
                    {sheetNames.map((s) => (
                      <option key={s} value={s}>
                        Sheet: {s}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Destination Department & Account Configuration */}
              <div className="pt-2 border-t border-slate-100 space-y-3 text-xs">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-slate-600" />
                  <span>2. Target Department & Default Revenue Stream</span>
                </h4>

                <div className="grid grid-cols-1 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Crediting Department:
                    </label>
                    <select
                      value={targetOrgId}
                      onChange={(e) => {
                        setTargetOrgId(e.target.value);
                        setTimeout(handleApplyMapping, 50);
                      }}
                      disabled={!isAdmin}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 disabled:opacity-75"
                    >
                      {state.organizations.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name} ({o.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Default Revenue Account:
                    </label>
                    <select
                      value={defaultAccountId}
                      onChange={(e) => {
                        setDefaultAccountId(e.target.value);
                        setTimeout(handleApplyMapping, 50);
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800"
                    >
                      {revenueAccounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.code} - {a.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Smart Column Mapping Dropdowns */}
              {rawHeaders.length > 0 && (
                <div className="pt-2 border-t border-slate-100 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>3. Verify Extracted Column Fields</span>
                    </h4>
                    <button
                      type="button"
                      onClick={handleApplyMapping}
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Re-extract
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-500 font-medium">Date Column:</span>
                      <select
                        value={dateCol}
                        onChange={(e) => {
                          setDateCol(e.target.value);
                          setTimeout(handleApplyMapping, 50);
                        }}
                        className="w-full mt-0.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px]"
                      >
                        {rawHeaders.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <span className="text-slate-500 font-medium">Client / Customer:</span>
                      <select
                        value={customerCol}
                        onChange={(e) => {
                          setCustomerCol(e.target.value);
                          setTimeout(handleApplyMapping, 50);
                        }}
                        className="w-full mt-0.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px]"
                      >
                        {rawHeaders.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <span className="text-slate-500 font-medium">Amount Column:</span>
                      <select
                        value={amountCol}
                        onChange={(e) => {
                          setAmountCol(e.target.value);
                          setTimeout(handleApplyMapping, 50);
                        }}
                        className="w-full mt-0.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-bold text-emerald-800"
                      >
                        {rawHeaders.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <span className="text-slate-500 font-medium">Description:</span>
                      <select
                        value={descCol}
                        onChange={(e) => {
                          setDescCol(e.target.value);
                          setTimeout(handleApplyMapping, 50);
                        }}
                        className="w-full mt-0.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px]"
                      >
                        {rawHeaders.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Extracted Live Data Preview & Ingestion Action (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between h-full space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>Extracted Revenue Dataset ({extractedRows.length} rows)</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Review and verify extracted figures before recording directly to the financial database.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Revenue Sum</span>
                    <span className="text-base font-bold font-mono text-emerald-700">
                      {FinancialCalculator.formatRWF(totalRevenueSum)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Extraction Table Container */}
              {extractedRows.length === 0 ? (
                <div className="py-16 text-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <FileSpreadsheet className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-semibold text-slate-600">No Excel file loaded yet</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Upload a file on the left or download our formatted sample template to start.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[380px] overflow-y-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-600 sticky top-0 border-b border-slate-200 z-10">
                      <tr>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Customer / Client</th>
                        <th className="py-2.5 px-3">Service / Description</th>
                        <th className="py-2.5 px-3">Revenue Stream</th>
                        <th className="py-2.5 px-3 text-right">Amount (RWF)</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th className="py-2.5 px-2 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {extractedRows.map((row) => (
                        <tr key={row.id} className={`hover:bg-slate-50/80 transition-colors ${!row.isValid ? 'bg-rose-50/40' : ''}`}>
                          <td className="py-2 px-3 font-mono text-[11px] whitespace-nowrap">
                            <input
                              type="date"
                              value={row.date}
                              onChange={(e) => handleUpdateRow(row.id, 'date', e.target.value)}
                              className="bg-transparent border-0 p-0 text-[11px] font-mono focus:ring-0 text-slate-800"
                            />
                          </td>
                          <td className="py-2 px-3 font-bold text-slate-900 max-w-[140px] truncate">
                            <input
                              type="text"
                              value={row.customer}
                              onChange={(e) => handleUpdateRow(row.id, 'customer', e.target.value)}
                              className="bg-transparent border-0 p-0 text-xs font-bold focus:ring-0 text-slate-900 w-full"
                            />
                          </td>
                          <td className="py-2 px-3 max-w-[160px] truncate text-slate-600 text-[11px]">
                            <input
                              type="text"
                              value={row.description}
                              onChange={(e) => handleUpdateRow(row.id, 'description', e.target.value)}
                              className="bg-transparent border-0 p-0 text-[11px] focus:ring-0 text-slate-700 w-full"
                            />
                          </td>
                          <td className="py-2 px-3 text-[11px] whitespace-nowrap">
                            <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-medium truncate max-w-[110px] inline-block">
                              {row.accountName.split(' ')[0]}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                            <input
                              type="number"
                              value={row.amount}
                              onChange={(e) => handleUpdateRow(row.id, 'amount', e.target.value)}
                              className="bg-transparent border-0 p-0 text-xs font-mono font-bold text-right text-emerald-700 w-24 focus:ring-0"
                            />
                          </td>
                          <td className="py-2 px-3 text-center whitespace-nowrap">
                            {row.isValid ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                                <Check className="w-3 h-3" /> Valid
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded-full" title={row.validationError}>
                                <AlertCircle className="w-3 h-3" /> Fix
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(row.id)}
                              className="text-slate-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                              title="Remove row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Bottom Ingestion Action */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-slate-500">
                  <span>{validRowsCount} valid records ready to record.</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={validRowsCount === 0 || isProcessing}
                    onClick={handleRecordAllExtractedRevenues}
                    className="w-full sm:w-auto px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Record {validRowsCount} Revenues Into System</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
