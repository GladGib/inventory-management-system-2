import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import { Readable } from 'stream';

interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  organization: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    taxRegistrationNo?: string;
  };
  customer: {
    companyName: string;
    address?: string;
    phone?: string;
    email?: string;
    taxRegistrationNo?: string;
  };
  lines: {
    itemCode: string;
    itemName: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    tax: number;
    lineTotal: number;
  }[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  notes?: string;
  paymentTerms?: string;
}

interface ReportData {
  title: string;
  organization: {
    name: string;
  };
  generatedAt: Date;
  dateRange?: {
    from?: Date;
    to?: Date;
  };
  sections: {
    title: string;
    type: 'summary' | 'table' | 'chart';
    data: any;
  }[];
}

@Injectable()
export class PdfService {
  async generateInvoicePdf(data: InvoiceData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        this.drawInvoiceHeader(doc, data);

        // Customer & Invoice Info
        this.drawInvoiceInfo(doc, data);

        // Line Items Table
        this.drawLineItems(doc, data);

        // Totals
        this.drawTotals(doc, data);

        // Footer
        this.drawInvoiceFooter(doc, data);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private drawInvoiceHeader(doc: PDFKit.PDFDocument, data: InvoiceData): void {
    // Company name
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text(data.organization.name, 50, 50);

    // Company details
    doc.fontSize(10).font('Helvetica');
    let y = 75;
    if (data.organization.address) {
      doc.text(data.organization.address, 50, y);
      y += 15;
    }
    if (data.organization.phone) {
      doc.text(`Tel: ${data.organization.phone}`, 50, y);
      y += 15;
    }
    if (data.organization.email) {
      doc.text(`Email: ${data.organization.email}`, 50, y);
      y += 15;
    }
    if (data.organization.taxRegistrationNo) {
      doc.text(`Tax Reg No: ${data.organization.taxRegistrationNo}`, 50, y);
    }

    // Invoice title
    doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .text('INVOICE', 400, 50, { align: 'right' });
  }

  private drawInvoiceInfo(doc: PDFKit.PDFDocument, data: InvoiceData): void {
    const startY = 160;

    // Bill To
    doc.fontSize(12).font('Helvetica-Bold').text('Bill To:', 50, startY);
    doc.fontSize(10).font('Helvetica');
    doc.text(data.customer.companyName, 50, startY + 18);

    let y = startY + 33;
    if (data.customer.address) {
      doc.text(data.customer.address, 50, y);
      y += 15;
    }
    if (data.customer.phone) {
      doc.text(`Tel: ${data.customer.phone}`, 50, y);
      y += 15;
    }
    if (data.customer.taxRegistrationNo) {
      doc.text(`Tax Reg No: ${data.customer.taxRegistrationNo}`, 50, y);
    }

    // Invoice details on the right
    doc.fontSize(10).font('Helvetica');
    doc.text(`Invoice No:`, 380, startY, { width: 80, align: 'right' });
    doc.text(data.invoiceNumber, 465, startY, { width: 100, align: 'left' });

    doc.text(`Invoice Date:`, 380, startY + 18, { width: 80, align: 'right' });
    doc.text(this.formatDate(data.invoiceDate), 465, startY + 18, { width: 100, align: 'left' });

    doc.text(`Due Date:`, 380, startY + 36, { width: 80, align: 'right' });
    doc.text(this.formatDate(data.dueDate), 465, startY + 36, { width: 100, align: 'left' });
  }

  private drawLineItems(doc: PDFKit.PDFDocument, data: InvoiceData): void {
    const tableTop = 260;
    const tableHeaders = ['Item', 'Description', 'Qty', 'Unit Price', 'Discount', 'Tax', 'Total'];
    const columnWidths = [60, 140, 40, 70, 60, 50, 75];
    const columnX = [50, 110, 250, 290, 360, 420, 470];

    // Table header background
    doc.rect(50, tableTop, 515, 25).fill('#f0f0f0');

    // Table headers
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#000');
    tableHeaders.forEach((header, i) => {
      doc.text(header, columnX[i], tableTop + 8, { width: columnWidths[i], align: i >= 2 ? 'right' : 'left' });
    });

    // Table rows
    let y = tableTop + 30;
    doc.font('Helvetica').fontSize(9);

    data.lines.forEach((line, index) => {
      // Alternate row colors
      if (index % 2 === 0) {
        doc.rect(50, y - 5, 515, 20).fill('#fafafa');
        doc.fillColor('#000');
      }

      doc.text(line.itemCode, columnX[0], y, { width: columnWidths[0], align: 'left' });
      doc.text(line.itemName, columnX[1], y, { width: columnWidths[1], align: 'left' });
      doc.text(line.quantity.toString(), columnX[2], y, { width: columnWidths[2], align: 'right' });
      doc.text(this.formatMoney(line.unitPrice), columnX[3], y, { width: columnWidths[3], align: 'right' });
      doc.text(this.formatMoney(line.discount), columnX[4], y, { width: columnWidths[4], align: 'right' });
      doc.text(this.formatMoney(line.tax), columnX[5], y, { width: columnWidths[5], align: 'right' });
      doc.text(this.formatMoney(line.lineTotal), columnX[6], y, { width: columnWidths[6], align: 'right' });

      y += 20;

      // Add new page if needed
      if (y > 700) {
        doc.addPage();
        y = 50;
      }
    });

    // Store the last Y position for totals
    (doc as any).lastItemY = y;
  }

  private drawTotals(doc: PDFKit.PDFDocument, data: InvoiceData): void {
    const y = (doc as any).lastItemY + 20;
    const labelX = 380;
    const valueX = 470;

    doc.fontSize(10).font('Helvetica');

    // Draw a line
    doc.moveTo(350, y).lineTo(565, y).stroke();

    // Subtotal
    doc.text('Subtotal:', labelX, y + 10, { width: 85, align: 'right' });
    doc.text(this.formatMoney(data.subtotal), valueX, y + 10, { width: 75, align: 'right' });

    // Discount
    if (data.discountAmount > 0) {
      doc.text('Discount:', labelX, y + 28, { width: 85, align: 'right' });
      doc.text(`-${this.formatMoney(data.discountAmount)}`, valueX, y + 28, { width: 75, align: 'right' });
    }

    // Tax
    doc.text('Tax:', labelX, y + 46, { width: 85, align: 'right' });
    doc.text(this.formatMoney(data.taxAmount), valueX, y + 46, { width: 75, align: 'right' });

    // Total
    doc.rect(350, y + 60, 215, 25).fill('#333');
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#fff');
    doc.text('TOTAL:', labelX, y + 67, { width: 85, align: 'right' });
    doc.text(`MYR ${this.formatMoney(data.total)}`, valueX, y + 67, { width: 75, align: 'right' });
  }

  private drawInvoiceFooter(doc: PDFKit.PDFDocument, data: InvoiceData): void {
    const pageHeight = doc.page.height;

    doc.fontSize(9).font('Helvetica').fillColor('#666');

    if (data.paymentTerms) {
      doc.text(`Payment Terms: ${data.paymentTerms}`, 50, pageHeight - 100);
    }

    if (data.notes) {
      doc.text(`Notes: ${data.notes}`, 50, pageHeight - 80);
    }

    doc.text('Thank you for your business!', 50, pageHeight - 50, {
      align: 'center',
      width: 515,
    });
  }

  async generateReportPdf(data: ReportData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Report Header
        doc
          .fontSize(20)
          .font('Helvetica-Bold')
          .text(data.title, { align: 'center' });

        doc
          .fontSize(12)
          .font('Helvetica')
          .text(data.organization.name, { align: 'center' });

        doc
          .fontSize(10)
          .fillColor('#666')
          .text(`Generated: ${this.formatDateTime(data.generatedAt)}`, { align: 'center' });

        if (data.dateRange?.from || data.dateRange?.to) {
          const rangeText = `Period: ${data.dateRange.from ? this.formatDate(data.dateRange.from) : 'All'} - ${data.dateRange.to ? this.formatDate(data.dateRange.to) : 'Present'}`;
          doc.text(rangeText, { align: 'center' });
        }

        doc.moveDown(2).fillColor('#000');

        // Sections
        for (const section of data.sections) {
          this.drawReportSection(doc, section);
          doc.moveDown();
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private drawReportSection(
    doc: PDFKit.PDFDocument,
    section: ReportData['sections'][0],
  ): void {
    // Section title
    doc.fontSize(14).font('Helvetica-Bold').text(section.title);
    doc.moveDown(0.5);

    switch (section.type) {
      case 'summary':
        this.drawSummarySection(doc, section.data);
        break;
      case 'table':
        this.drawTableSection(doc, section.data);
        break;
      default:
        doc.fontSize(10).font('Helvetica').text(JSON.stringify(section.data));
    }
  }

  private drawSummarySection(doc: PDFKit.PDFDocument, data: Record<string, any>): void {
    doc.fontSize(10).font('Helvetica');

    Object.entries(data).forEach(([key, value]) => {
      const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
      const formattedValue = typeof value === 'number' ? this.formatMoney(value) : String(value);

      doc.text(`${formattedKey}: ${formattedValue}`);
    });
  }

  private drawTableSection(
    doc: PDFKit.PDFDocument,
    data: { headers: string[]; rows: any[][] },
  ): void {
    const { headers, rows } = data;
    const startX = 50;
    const columnWidth = (doc.page.width - 100) / headers.length;

    // Draw headers
    doc.fontSize(9).font('Helvetica-Bold');
    headers.forEach((header, i) => {
      doc.text(header, startX + i * columnWidth, doc.y, {
        width: columnWidth,
        align: i === 0 ? 'left' : 'right',
      });
    });

    doc.moveDown(0.5);

    // Draw rows
    doc.font('Helvetica');
    rows.forEach((row) => {
      const y = doc.y;
      row.forEach((cell, i) => {
        const value = typeof cell === 'number' ? this.formatMoney(cell) : String(cell);
        doc.text(value, startX + i * columnWidth, y, {
          width: columnWidth,
          align: i === 0 ? 'left' : 'right',
        });
      });
      doc.moveDown(0.5);

      // Add new page if needed
      if (doc.y > doc.page.height - 100) {
        doc.addPage();
      }
    });
  }

  private formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  private formatDateTime(date: Date): string {
    return new Date(date).toLocaleString('en-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private formatMoney(amount: number): string {
    return amount.toLocaleString('en-MY', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
}
