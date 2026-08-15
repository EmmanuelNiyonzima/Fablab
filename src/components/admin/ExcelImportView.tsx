import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  FileText,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { storageService } from '../../services/storageService';
import { ExportService } from '../../services/exportService';

export const ExcelImportView: React.FC = () => {
  const [importType, setImportType] = useState<'expenses' | 'income' | 'contributions' | 'budget'>('expenses');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);

  const handleDownloadTemplate = () => {
    let headers: string[] = [];
    let sampleRows: any[] = [];
    let fileName = '';

    if (importType === 'expenses') {
      headers = ['Date (YYYY-MM-DD)', 'Category', 'Account Code', 'Amount (RWF)', 'Vendor', 'Description', 'Payment Method'];
      sampleRows = [
        ['2026-08-15', 'Lab Equipment Maintenance', '6100', '450000', '3D Tech Solutions Ltd', 'Bi-monthly laser tube calibration', 'Bank Transfer'],
        ['2026-08-18', 'Internet & Connectivity', '6010', '250000', 'Liquid Intelligent Tech', 'Dedicated fiber August 2026', 'Bank Transfer'],
      ];
      fileName = 'Template_FabLab_Expenses';
    } else if (importType === 'income') {
      headers = ['Date (YYYY-MM-DD)', 'Category', 'Account Code', 'Amount (RWF)', 'Customer / Sponsor', 'Description', 'Payment Method'];
      sampleRows = [
        ['2026-08-10', 'Lab Membership Subscriptions', '4000', '600000', 'Kigali Makers Guild', 'Maker space August monthly access', 'Bank Transfer'],
        ['2026-08-14', 'Training & Workshops', '4100', '1200000', 'University of Rwanda', 'Digital Fabrication Boot camp', 'Bank Transfer'],
      ];
      fileName = 'Template_FabLab_Income';
    } else if (importType === 'contributions') {
      headers = ['Organization Name', 'Period (YYYY-MM)', 'Contribution (RWF)', 'Payment Date (YYYY-MM-DD)', 'Status'];
      sampleRows = [
        ['FabLab Rwanda', '2026-08', '1108346', '2026-08-05', 'Paid'],
        ['Rwanda Innovation Fund (RIF)', '2026-08', '1108346', '2026-08-08', 'Paid'],
      ];
      fileName = 'Template_FabLab_Contributions';
    } else {
      headers = ['Account Code', 'Line Item Name', 'Category', 'Annual Budget (RWF)', 'Q1', 'Q2', 'Q3', 'Q4'];
      sampleRows = [
        ['6000', 'Cleaning & Sanitation Overheads', 'Cleaning', '4800000', '1200000', '1200000', '1200000', '1200000'],
      ];
      fileName = 'Template_FabLab_Budget';
    }

    ExportService.exportToExcel(`Template - ${importType.toUpperCase()}`, fileName, headers, sampleRows);
  };

  const handleSimulatedFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus('Processing and validating data format...');

    setTimeout(() => {
      setImportStatus('Successfully imported and validated 5 records.');
      setParsedRows([
        { col1: '2026-08-10', col2: 'Cleaning Services', col3: '400,000 RWF', col4: 'CleanCorp Ltd', status: 'Valid' },
        { col1: '2026-08-12', col2: 'Electricity / EUCL', col3: '1,250,000 RWF', col4: 'EUCL Rwanda', status: 'Valid' },
        { col1: '2026-08-14', col2: 'Broadband Internet', col3: '250,000 RWF', col4: 'Liquid Tech', status: 'Valid' },
        { col1: '2026-08-15', col2: 'Security Overheads', col3: '450,000 RWF', col4: 'G4S Security', status: 'Valid' },
        { col1: '2026-08-16', col2: 'Drinking Water Supply', col3: '90,000 RWF', col4: 'Aqua Rwanda', status: 'Valid' },
      ]);
    }, 600);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Excel / CSV Batch Ingestion & Migration</h2>
            <Badge variant="blue">Automated Ledger Ingestion</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Batch import existing expenses, historical general ledger rows, resident cost contributions, or annual budget lines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Download Formatted Template (.CSV)</span>
          </button>
        </div>
      </div>

      {/* Target Module Picker */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          1. Select Ingestion Module
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { id: 'expenses', label: 'Operational Expenses', desc: 'Disbursements & VAT' },
            { id: 'income', label: 'Revenue Inflows', desc: 'Lab & Grants Receipts' },
            { id: 'contributions', label: 'Partner Contributions', desc: 'Resident Cost Sharing' },
            { id: 'budget', label: 'Annual Budgets', desc: 'Department Lines' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setImportType(item.id as any);
                setImportStatus(null);
                setParsedRows([]);
              }}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                importType === item.id
                  ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <p className="text-xs font-bold text-slate-900">{item.label}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{item.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Upload Zone */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-8 shadow-xs text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
          <Upload className="w-6 h-6" />
        </div>

        <div className="max-w-md mx-auto space-y-1">
          <h3 className="text-sm font-bold text-slate-900">Upload Spreadsheet or Drag & Drop</h3>
          <p className="text-xs text-slate-500">
            Supports .xlsx, .xls, and standard RFC 4180 .csv files up to 25MB.
          </p>
        </div>

        <div>
          <label className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Select File to Ingest</span>
            <input
              type="file"
              accept=".csv, .xlsx, .xls"
              onChange={handleSimulatedFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {importStatus && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl max-w-lg mx-auto flex items-center gap-2 text-xs font-bold text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{importStatus}</span>
          </div>
        )}
      </div>

      {/* Parsed Rows Preview */}
      {parsedRows.length > 0 && (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Ingested Records Staging Preview (5 Records)
            </h3>
            <Badge variant="success">All Headers Matched</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-600 uppercase">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Category / Title</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Entity / Vendor</th>
                  <th className="py-2.5 px-3 text-center">Validation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {parsedRows.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">{r.col1}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{r.col2}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-900">{r.col3}</td>
                    <td className="py-2.5 px-3 text-slate-600">{r.col4}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
