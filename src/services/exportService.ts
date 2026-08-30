import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FinancialCalculator } from './calculationService';

export class ExportService {
  /**
   * Export JSON data to styled Excel Sheet (.xlsx) with Shared Expenses Management System Official Header
   */
  static exportToExcel(
    title: string,
    filename: string,
    headers: string[],
    rows: (string | number)[][],
    summaryStats?: { label: string; value: string | number }[]
  ) {
    const wb = XLSX.utils.book_new();

    // Prepare content matrix with branded header
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
      matrix.push(['KEY SUMMARY FINANCIAL METRICS:']);
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
   * Helper to draw the authentic FabLab Rwanda logo vector with high visibility and size into the jsPDF canvas
   */
  private static drawFabLabLogo(doc: jsPDF, x: number, y: number, radius: number = 13) {
    // Outer white rim for ultra-high contrast on dark header backgrounds
    doc.setFillColor(255, 255, 255);
    doc.circle(x, y, radius + 1.2, 'F');

    // Background disc
    doc.setFillColor(11, 25, 44); // Dark Navy #0B192C
    doc.circle(x, y, radius, 'F');

    // High-visibility connector technical circuit lines
    doc.setDrawColor(226, 232, 240); // Slate-200
    doc.setLineWidth(1.1);
    doc.line(x - radius * 0.44, y - radius * 0.35, x + radius * 0.44, y - radius * 0.35);
    doc.line(x - radius * 0.44, y - radius * 0.35, x, y + radius * 0.48);
    doc.line(x + radius * 0.44, y - radius * 0.35, x, y + radius * 0.48);

    // Inner central hub with outer rim
    doc.setFillColor(11, 25, 44);
    doc.circle(x, y - radius * 0.02, radius * 0.22, 'F');
    doc.setFillColor(255, 255, 255);
    doc.circle(x, y - radius * 0.02, radius * 0.16, 'F');

    // Top-Left Node (FabLab Red #E31B23)
    doc.setFillColor(255, 255, 255);
    doc.circle(x - radius * 0.44, y - radius * 0.35, radius * 0.34, 'F');
    doc.setFillColor(227, 27, 35);
    doc.circle(x - radius * 0.44, y - radius * 0.35, radius * 0.28, 'F');
    doc.setFillColor(255, 255, 255);
    doc.circle(x - radius * 0.44, y - radius * 0.35, radius * 0.1, 'F');

    // Top-Right Node (FabLab Green #009A44)
    doc.setFillColor(255, 255, 255);
    doc.circle(x + radius * 0.44, y - radius * 0.35, radius * 0.34, 'F');
    doc.setFillColor(0, 154, 68);
    doc.circle(x + radius * 0.44, y - radius * 0.35, radius * 0.28, 'F');
    doc.setFillColor(255, 255, 255);
    doc.circle(x + radius * 0.44, y - radius * 0.35, radius * 0.1, 'F');

    // Bottom Node (FabLab Blue #0F4C81)
    doc.setFillColor(255, 255, 255);
    doc.circle(x, y + radius * 0.48, radius * 0.34, 'F');
    doc.setFillColor(15, 76, 129);
    doc.circle(x, y + radius * 0.48, radius * 0.28, 'F');
    doc.setFillColor(255, 255, 255);
    doc.circle(x, y + radius * 0.48, radius * 0.1, 'F');
  }

  /**
   * Export Report to PDF with FabLab Rwanda High-Res Vector Brand Letterhead
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

    // Top Header Banner (Spacious 38mm height to accommodate big prominent logo)
    doc.setFillColor(11, 25, 44); // Deep Navy (#0B192C)
    doc.rect(0, 0, pageWidth, 38, 'F');

    // Accent line (FabLab Tri-color strip)
    doc.setFillColor(227, 27, 35); // Red
    doc.rect(0, 38, pageWidth * 0.33, 2.5, 'F');
    doc.setFillColor(0, 154, 68); // Green
    doc.rect(pageWidth * 0.33, 38, pageWidth * 0.34, 2.5, 'F');
    doc.setFillColor(15, 76, 129); // Blue
    doc.rect(pageWidth * 0.67, 38, pageWidth * 0.33, 2.5, 'F');

    // Render Large, High-Visibility FabLab Official Tri-Color Vector Logo in Header (radius 13mm = 26mm diameter)
    this.drawFabLabLogo(doc, 22, 19, 13);

    // Organization Brand Typography
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text('SHARED EXPENSES MANAGEMENT SYSTEM', 42, 14);

    // Mini SEMS badge
    doc.setFillColor(0, 154, 68);
    doc.roundedRect(pageWidth - 28, 9, 16, 7, 1.5, 1.5, 'F');
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('SEMS', pageWidth - 25, 14);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(226, 232, 240);
    doc.text('Telecom House Shared Facility (6th Floor) | Kigali, Rwanda', 42, 21);
    doc.text('Participating: Fablab Rwanda (38%) | Klab (32%) | Fab Cafe (18%) | 250Startups (12%)', 42, 27);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Super Administrator: Emmanuel Niyonzima | Currency: RWF (Rwandan Francs)', 42, 33);

    // Title Section
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 14, 47);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    const dateStr = `Generated: ${new Date().toISOString().replace('T', ' ').slice(0, 19)}`;
    const authorStr = options?.generatedBy ? ` | Prepared by: ${options.generatedBy}` : '';
    doc.text(`${dateStr}${authorStr}`, 14, 53);

    let startY = 57;

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
        fillColor: [11, 25, 44],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      didDrawPage: (data) => {
        // Footer with Page Number & FabLab Mini Mark
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

