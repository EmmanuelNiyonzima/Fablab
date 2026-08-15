import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FinancialCalculator } from './calculationService';

export class ExportService {
  /**
   * Export JSON data to styled Excel Sheet (.xlsx)
   */
  static exportToExcel(
    title: string,
    filename: string,
    headers: string[],
    rows: (string | number)[][],
    summaryStats?: { label: string; value: string | number }[]
  ) {
    const wb = XLSX.utils.book_new();

    // Prepare content matrix
    const matrix: (string | number)[][] = [
      ['FABLAB RWANDA - FINANCIAL MANAGEMENT SYSTEM'],
      [`Report Title: ${title}`],
      [`Generated Date: ${new Date().toISOString().replace('T', ' ').slice(0, 19)}`],
      [`Currency: RWF (Rwandan Francs)`],
      [],
    ];

    if (summaryStats && summaryStats.length > 0) {
      matrix.push(['KEY SUMMARY METRICS:']);
      summaryStats.forEach((stat) => {
        matrix.push([stat.label, stat.value]);
      });
      matrix.push([]);
    }

    // Add headers
    matrix.push(headers);

    // Add rows
    rows.forEach((r) => matrix.push(r));

    const ws = XLSX.utils.aoa_to_sheet(matrix);

    // Set column widths
    const colWidths = headers.map((h, i) => {
      let maxLen = h.length;
      rows.forEach((r) => {
        const val = r[i] !== undefined ? String(r[i]) : '';
        if (val.length > maxLen) maxLen = val.length;
      });
      return { wch: Math.min(45, Math.max(15, maxLen + 3)) };
    });

    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, title.slice(0, 31).replace(/[:\/\\?*\[\]]/g, ''));
    XLSX.writeFile(wb, `${filename.replace(/\.xlsx$/i, '')}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  /**
   * Export Report to PDF with FabLab Rwanda Letterhead
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
    const orientation = options?.orientation || 'portrait';
    const doc = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();

    // Top Header Banner
    doc.setFillColor(15, 23, 42); // Deep Navy (#0f172a)
    doc.rect(0, 0, pageWidth, 28, 'F');

    // Accent line
    doc.setFillColor(16, 185, 129); // FabLab Emerald Green (#10b981)
    doc.rect(0, 28, pageWidth, 2, 'F');

    // Organization Name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('FABLAB RWANDA', 14, 12);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225);
    doc.text('Center for Innovation & Digital Fabrication | Kigali, Rwanda', 14, 18);
    doc.text(`Official Financial Report | Currency: RWF`, 14, 23);

    // Title Section
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 14, 38);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    const dateStr = `Generated: ${new Date().toISOString().replace('T', ' ').slice(0, 19)}`;
    const authorStr = options?.generatedBy ? ` | Prepared by: ${options.generatedBy}` : '';
    doc.text(`${dateStr}${authorStr}`, 14, 44);

    let startY = 48;

    // Summary Stat Badges if provided
    if (options?.summaryStats && options.summaryStats.length > 0) {
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(14, startY, pageWidth - 28, 14, 2, 2, 'F');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      
      let xPos = 18;
      options.summaryStats.forEach((stat) => {
        doc.setFont('helvetica', 'bold');
        doc.text(`${stat.label}: `, xPos, startY + 9);
        const labelWidth = doc.getTextWidth(`${stat.label}: `);
        doc.setFont('helvetica', 'normal');
        doc.text(`${stat.value}`, xPos + labelWidth, startY + 9);
        xPos += labelWidth + doc.getTextWidth(`${stat.value}`) + 10;
      });
      startY += 18;
    }

    // Render Data Table using AutoTable
    autoTable(doc, {
      head: [headers],
      body: rows.map((r) => r.map((cell) => String(cell))),
      startY,
      margin: { left: 14, right: 14 },
      styles: {
        fontSize: 8,
        cellPadding: 2.5,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      didDrawPage: (data) => {
        // Footer with Page Number
        const pageCount = (doc.internal as any).getNumberOfPages();
        const pageCurrent = data.pageNumber;
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `FabLab Rwanda Financial Management System - Page ${pageCurrent} of ${pageCount}`,
          14,
          doc.internal.pageSize.getHeight() - 8
        );
        doc.text(
          'CONFIDENTIAL & AUDITABLE FINANCIAL RECORD',
          pageWidth - 14 - doc.getTextWidth('CONFIDENTIAL & AUDITABLE FINANCIAL RECORD'),
          doc.internal.pageSize.getHeight() - 8
        );
      },
    });

    doc.save(`${filename.replace(/\.pdf$/i, '')}_${new Date().toISOString().slice(0, 10)}.pdf`);
  }
}
