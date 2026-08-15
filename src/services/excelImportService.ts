import * as XLSX from 'xlsx';
import { storageService } from './storageService';
import { BillingFrequency } from '../types/financial';

export interface ParsedSheetData {
  sheetName: string;
  rawHeaders: string[];
  rawRows: Record<string, any>[];
  rowCount: number;
}

export interface ColumnMapping {
  systemField: string;
  excelColumn: string;
  required: boolean;
}

export interface ImportValidationItem {
  rowNumber: number;
  data: any;
  status: 'valid' | 'warning' | 'error';
  messages: string[];
}

export class ExcelImportService {
  /**
   * Parse uploaded Excel file and return available worksheets and preview
   */
  static async parseExcelFile(file: File): Promise<ParsedSheetData[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });

          const results: ParsedSheetData[] = [];

          workbook.SheetNames.forEach((sheetName) => {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            if (jsonData.length > 0) {
              const rawHeaders = (jsonData[0] || []).map((h: any) => String(h || '').trim());
              const rawRows: Record<string, any>[] = [];

              for (let i = 1; i < jsonData.length; i++) {
                const row = jsonData[i];
                if (!row || row.length === 0 || row.every((c: any) => c === undefined || c === '')) {
                  continue;
                }
                const rowObj: Record<string, any> = {};
                rawHeaders.forEach((header, idx) => {
                  rowObj[header] = row[idx] !== undefined ? row[idx] : '';
                });
                rawRows.push(rowObj);
              }

              results.push({
                sheetName,
                rawHeaders,
                rawRows,
                rowCount: rawRows.length,
              });
            }
          });

          resolve(results);
        } catch (error) {
          reject(new Error(`Failed to parse Excel file: ${(error as any).message}`));
        }
      };

      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Auto-guess mapping based on header names
   */
  static suggestMappings(rawHeaders: string[]): Record<string, string> {
    const suggestions: Record<string, string> = {};
    const lower = rawHeaders.map((h) => ({ original: h, lower: h.toLowerCase() }));

    const patterns: Record<string, string[]> = {
      date: ['date', 'expense date', 'period', 'trans date'],
      description: ['description', 'item', 'details', 'name', 'expense name'],
      category: ['category', 'expense category', 'type', 'item category'],
      quantity: ['quantity', 'qty', 'units', 'count'],
      unitPrice: ['unit price', 'unit cost', 'price', 'rate'],
      totalAmount: ['total amount', 'total', 'amount', 'cost', 'rwf', 'total rwf'],
      billingFrequency: ['billing frequency', 'frequency', 'periodicity', 'billing cycle'],
    };

    Object.keys(patterns).forEach((sysField) => {
      const match = lower.find((l) => patterns[sysField].some((p) => l.lower.includes(p)));
      if (match) {
        suggestions[sysField] = match.original;
      }
    });

    return suggestions;
  }

  /**
   * Validate mapped data rows
   */
  static validateRows(
    rows: Record<string, any>[],
    mappings: Record<string, string>
  ): {
    items: ImportValidationItem[];
    validCount: number;
    warningCount: number;
    errorCount: number;
  } {
    const items: ImportValidationItem[] = [];
    let validCount = 0;
    let warningCount = 0;
    let errorCount = 0;

    rows.forEach((row, idx) => {
      const messages: string[] = [];
      let status: ImportValidationItem['status'] = 'valid';

      const desc = row[mappings.description || ''];
      const cat = row[mappings.category || ''];
      const rawAmt = row[mappings.totalAmount || ''];
      const rawQty = row[mappings.quantity || ''];
      const rawPrice = row[mappings.unitPrice || ''];
      const rawFreq = row[mappings.billingFrequency || ''];

      if (!desc) {
        messages.push('Missing description');
        status = 'error';
      }

      let parsedAmount = parseFloat(String(rawAmt).replace(/[^0-9.-]+/g, ''));
      let parsedQty = parseFloat(String(rawQty).replace(/[^0-9.-]+/g, '')) || 1;
      let parsedPrice = parseFloat(String(rawPrice).replace(/[^0-9.-]+/g, '')) || 0;

      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        if (parsedQty > 0 && parsedPrice > 0) {
          parsedAmount = parsedQty * parsedPrice;
          messages.push(`Calculated total from qty (${parsedQty}) × price (${parsedPrice})`);
        } else {
          messages.push('Invalid or missing amount');
          status = 'error';
        }
      }

      // Check billing frequency
      let freq: BillingFrequency = 'monthly';
      if (rawFreq) {
        const fStr = String(rawFreq).toLowerCase();
        if (fStr.includes('quart')) freq = 'quarterly';
        else if (fStr.includes('ann') || fStr.includes('year')) freq = 'annual';
        else if (fStr.includes('one')) freq = 'one_off';
      }

      if (status === 'error') {
        errorCount++;
      } else if (messages.length > 0) {
        status = 'warning';
        warningCount++;
      } else {
        validCount++;
      }

      items.push({
        rowNumber: idx + 2, // Excel 1-based row with header
        data: {
          description: desc || 'Unnamed Expense',
          category: cat || 'General Shared',
          quantity: parsedQty,
          unitPrice: parsedPrice || parsedAmount,
          totalAmount: parsedAmount,
          billingFrequency: freq,
          date: row[mappings.date || ''] || new Date().toISOString().split('T')[0],
        },
        status,
        messages,
      });
    });

    return {
      items,
      validCount,
      warningCount,
      errorCount,
    };
  }

  /**
   * Execute import of validated rows into storage
   */
  static executeImport(items: ImportValidationItem[], defaultPolicyId: string): number {
    const validItems = items.filter((i) => i.status !== 'error');
    let imported = 0;

    validItems.forEach((item) => {
      const d = item.data;
      storageService.addSharedExpense({
        date: d.date,
        description: d.description,
        category: d.category,
        accountId: 'acc-6000',
        accountCode: '6000',
        quantity: d.quantity || 1,
        unitPrice: d.unitPrice || d.totalAmount,
        totalAmount: d.totalAmount,
        billingFrequency: d.billingFrequency || 'monthly',
        isShared: true,
        allocationPolicyId: defaultPolicyId,
        notes: `Imported via Excel bulk upload (Row ${item.rowNumber})`,
        status: 'Draft',
      });
      imported++;
    });

    return imported;
  }
}
