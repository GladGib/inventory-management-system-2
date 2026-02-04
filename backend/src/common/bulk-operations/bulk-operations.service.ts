import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import * as XLSX from 'xlsx';

export interface ImportResult {
  success: boolean;
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: Array<{ row: number; field: string; message: string }>;
  createdIds?: string[];
}

export interface ValidationResult {
  isValid: boolean;
  totalRows: number;
  validCount: number;
  errorCount: number;
  errors: Array<{ row: number; field: string; message: string }>;
  preview: any[];
}

@Injectable()
export class BulkOperationsService {
  constructor(private readonly prisma: PrismaService) {}

  // =====================
  // ITEM IMPORT
  // =====================

  getItemTemplate(): string {
    const headers = [
      'code',
      'name',
      'description',
      'categoryCode',
      'uom',
      'barcode',
      'costPrice',
      'sellingPrice',
      'wholesalePrice',
      'reorderPoint',
      'reorderQty',
    ];
    const example = [
      'ITEM-001',
      'Sample Item',
      'Item description',
      'CAT-01',
      'pcs',
      '1234567890123',
      '10.00',
      '15.00',
      '12.50',
      '10',
      '50',
    ];
    return stringify([headers, example]);
  }

  async validateItemImport(
    organizationId: string,
    csvContent: string,
  ): Promise<ValidationResult> {
    const records = this.parseCsv(csvContent);
    const errors: Array<{ row: number; field: string; message: string }> = [];
    const preview: any[] = [];

    // Get existing codes
    const existingItems = await this.prisma.item.findMany({
      where: { organizationId },
      select: { code: true },
    });
    const existingCodes = new Set(existingItems.map((i) => i.code));

    // Get categories
    const categories = await this.prisma.category.findMany({
      where: { organizationId },
      select: { id: true, name: true },
    });
    const categoryMap = new Map(categories.map((c) => [c.name.toLowerCase(), c.id]));

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNum = i + 2; // Account for header row

      // Required fields
      if (!row.code) {
        errors.push({ row: rowNum, field: 'code', message: 'Code is required' });
      } else if (existingCodes.has(row.code)) {
        errors.push({ row: rowNum, field: 'code', message: 'Duplicate SKU' });
      }

      if (!row.name) {
        errors.push({ row: rowNum, field: 'name', message: 'Name is required' });
      }

      // Validate numbers
      if (row.costPrice && isNaN(parseFloat(row.costPrice))) {
        errors.push({ row: rowNum, field: 'costPrice', message: 'Invalid cost price' });
      }
      if (row.sellingPrice && isNaN(parseFloat(row.sellingPrice))) {
        errors.push({ row: rowNum, field: 'sellingPrice', message: 'Invalid selling price' });
      }

      preview.push({
        row: rowNum,
        code: row.code,
        name: row.name,
        isValid: !errors.some((e) => e.row === rowNum),
      });
    }

    return {
      isValid: errors.length === 0,
      totalRows: records.length,
      validCount: records.length - errors.filter((e, i, arr) =>
        arr.findIndex((x) => x.row === e.row) === i
      ).length,
      errorCount: errors.filter((e, i, arr) =>
        arr.findIndex((x) => x.row === e.row) === i
      ).length,
      errors,
      preview: preview.slice(0, 10),
    };
  }

  async importItems(
    organizationId: string,
    csvContent: string,
    skipErrors: boolean = false,
  ): Promise<ImportResult> {
    const records = this.parseCsv(csvContent);
    const errors: Array<{ row: number; field: string; message: string }> = [];
    const createdIds: string[] = [];

    // Get existing codes
    const existingItems = await this.prisma.item.findMany({
      where: { organizationId },
      select: { code: true },
    });
    const existingCodes = new Set(existingItems.map((i) => i.code));

    // Get categories
    const categories = await this.prisma.category.findMany({
      where: { organizationId },
    });
    const categoryMap = new Map(categories.map((c) => [c.name.toLowerCase(), c.id]));

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNum = i + 2;

      // Validate
      if (!row.code || !row.name) {
        errors.push({ row: rowNum, field: 'code/name', message: 'Required fields missing' });
        if (!skipErrors) continue;
      }

      if (existingCodes.has(row.code)) {
        errors.push({ row: rowNum, field: 'code', message: 'Duplicate SKU' });
        continue;
      }

      try {
        const categoryId = row.categoryCode
          ? categoryMap.get(row.categoryCode.toLowerCase())
          : undefined;

        const item = await this.prisma.item.create({
          data: {
            organizationId,
            code: row.code,
            name: row.name,
            description: row.description || undefined,
            categoryId: categoryId || undefined,
            uom: row.uom || 'pcs',
            barcode: row.barcode || undefined,
            costPrice: row.costPrice ? parseFloat(row.costPrice) : 0,
            sellingPrice: row.sellingPrice ? parseFloat(row.sellingPrice) : 0,
            wholesalePrice: row.wholesalePrice ? parseFloat(row.wholesalePrice) : undefined,
            reorderPoint: row.reorderPoint ? parseInt(row.reorderPoint) : undefined,
            reorderQty: row.reorderQty ? parseInt(row.reorderQty) : undefined,
          },
        });
        createdIds.push(item.id);
        existingCodes.add(row.code);
      } catch (error: any) {
        errors.push({ row: rowNum, field: 'database', message: error.message });
      }
    }

    return {
      success: errors.length === 0,
      totalRows: records.length,
      successCount: createdIds.length,
      errorCount: errors.length,
      errors,
      createdIds,
    };
  }

  // =====================
  // CUSTOMER IMPORT
  // =====================

  getCustomerTemplate(): string {
    const headers = [
      'code',
      'companyName',
      'contactPerson',
      'email',
      'phone',
      'taxRegistrationNo',
      'paymentTerms',
      'creditLimit',
      'customerGroup',
    ];
    const example = [
      'CUST-001',
      'ABC Company Sdn Bhd',
      'John Doe',
      'john@abc.com',
      '+60123456789',
      '12345678',
      'Net 30',
      '50000',
      'Retail',
    ];
    return stringify([headers, example]);
  }

  async importCustomers(
    organizationId: string,
    csvContent: string,
  ): Promise<ImportResult> {
    const records = this.parseCsv(csvContent);
    const errors: Array<{ row: number; field: string; message: string }> = [];
    const createdIds: string[] = [];

    const existingCustomers = await this.prisma.customer.findMany({
      where: { organizationId },
      select: { code: true },
    });
    const existingCodes = new Set(existingCustomers.map((c) => c.code));

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNum = i + 2;

      if (!row.code || !row.companyName) {
        errors.push({ row: rowNum, field: 'code/companyName', message: 'Required fields missing' });
        continue;
      }

      if (existingCodes.has(row.code)) {
        errors.push({ row: rowNum, field: 'code', message: 'Duplicate customer code' });
        continue;
      }

      try {
        const customer = await this.prisma.customer.create({
          data: {
            organizationId,
            code: row.code,
            companyName: row.companyName,
            contactPerson: row.contactPerson || undefined,
            email: row.email || undefined,
            phone: row.phone || undefined,
            taxRegistrationNo: row.taxRegistrationNo || undefined,
            paymentTerms: row.paymentTerms || undefined,
            creditLimit: row.creditLimit ? parseFloat(row.creditLimit) : undefined,
            customerGroup: row.customerGroup || undefined,
          },
        });
        createdIds.push(customer.id);
        existingCodes.add(row.code);
      } catch (error: any) {
        errors.push({ row: rowNum, field: 'database', message: error.message });
      }
    }

    return {
      success: errors.length === 0,
      totalRows: records.length,
      successCount: createdIds.length,
      errorCount: errors.length,
      errors,
      createdIds,
    };
  }

  // =====================
  // VENDOR IMPORT
  // =====================

  getVendorTemplate(): string {
    const headers = [
      'code',
      'companyName',
      'contactPerson',
      'email',
      'phone',
      'taxRegistrationNo',
      'paymentTerms',
      'bankName',
      'bankAccountNo',
    ];
    const example = [
      'VEND-001',
      'XYZ Supplier Sdn Bhd',
      'Jane Smith',
      'jane@xyz.com',
      '+60198765432',
      '87654321',
      'Net 45',
      'Maybank',
      '1234567890',
    ];
    return stringify([headers, example]);
  }

  async importVendors(
    organizationId: string,
    csvContent: string,
  ): Promise<ImportResult> {
    const records = this.parseCsv(csvContent);
    const errors: Array<{ row: number; field: string; message: string }> = [];
    const createdIds: string[] = [];

    const existingVendors = await this.prisma.vendor.findMany({
      where: { organizationId },
      select: { code: true },
    });
    const existingCodes = new Set(existingVendors.map((v) => v.code));

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNum = i + 2;

      if (!row.code || !row.companyName) {
        errors.push({ row: rowNum, field: 'code/companyName', message: 'Required fields missing' });
        continue;
      }

      if (existingCodes.has(row.code)) {
        errors.push({ row: rowNum, field: 'code', message: 'Duplicate vendor code' });
        continue;
      }

      try {
        const vendor = await this.prisma.vendor.create({
          data: {
            organizationId,
            code: row.code,
            companyName: row.companyName,
            contactPerson: row.contactPerson || undefined,
            email: row.email || undefined,
            phone: row.phone || undefined,
            taxRegistrationNo: row.taxRegistrationNo || undefined,
            paymentTerms: row.paymentTerms || undefined,
            bankName: row.bankName || undefined,
            bankAccountNo: row.bankAccountNo || undefined,
          },
        });
        createdIds.push(vendor.id);
        existingCodes.add(row.code);
      } catch (error: any) {
        errors.push({ row: rowNum, field: 'database', message: error.message });
      }
    }

    return {
      success: errors.length === 0,
      totalRows: records.length,
      successCount: createdIds.length,
      errorCount: errors.length,
      errors,
      createdIds,
    };
  }

  // =====================
  // EXCEL EXPORT
  // =====================

  async exportStockValuation(
    organizationId: string,
    warehouseId?: string,
    categoryId?: string,
  ): Promise<Buffer> {
    const where: any = { organizationId, isActive: true };
    if (categoryId) where.categoryId = categoryId;

    const items = await this.prisma.item.findMany({
      where,
      include: {
        category: true,
        stockLevels: warehouseId
          ? { where: { warehouseId } }
          : { include: { warehouse: true } },
      },
      orderBy: { code: 'asc' },
    });

    const data = items.map((item) => {
      const totalQty = item.stockLevels.reduce((sum, sl) => sum + sl.onHand, 0);
      const totalValue = totalQty * Number(item.costPrice);
      return {
        'Item Code': item.code,
        'Item Name': item.name,
        Category: item.category?.name || '',
        UOM: item.uom,
        'Cost Price (MYR)': Number(item.costPrice),
        'On Hand Qty': totalQty,
        'Total Value (MYR)': totalValue,
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Stock Valuation');

    // Add summary row
    const totalValue = data.reduce((sum, row) => sum + row['Total Value (MYR)'], 0);
    const summaryWs = XLSX.utils.json_to_sheet([
      { Label: 'Report Generated', Value: new Date().toISOString() },
      { Label: 'Total Items', Value: data.length },
      { Label: 'Total Value (MYR)', Value: totalValue },
    ]);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

    return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
  }

  async exportSalesByCustomer(
    organizationId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Buffer> {
    const customers = await this.prisma.customer.findMany({
      where: { organizationId, isActive: true },
      include: {
        invoices: {
          where: {
            invoiceDate: { gte: startDate, lte: endDate },
            status: { not: 'VOID' },
          },
          include: { lines: true },
        },
      },
    });

    const data = customers
      .filter((c) => c.invoices.length > 0)
      .map((customer) => {
        const totalRevenue = customer.invoices.reduce(
          (sum, inv) => sum + Number(inv.total),
          0,
        );
        const totalOrders = customer.invoices.length;
        const totalItems = customer.invoices.reduce(
          (sum, inv) => sum + inv.lines.reduce((s, l) => s + l.quantity, 0),
          0,
        );
        return {
          'Customer Code': customer.code,
          'Customer Name': customer.companyName,
          'Contact Person': customer.contactPerson || '',
          Phone: customer.phone || '',
          'Total Orders': totalOrders,
          'Total Items Sold': totalItems,
          'Total Revenue (MYR)': totalRevenue,
          'Avg Order Value (MYR)': totalOrders > 0 ? totalRevenue / totalOrders : 0,
        };
      })
      .sort((a, b) => b['Total Revenue (MYR)'] - a['Total Revenue (MYR)']);

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sales by Customer');

    // Summary sheet
    const totalRevenue = data.reduce((sum, row) => sum + row['Total Revenue (MYR)'], 0);
    const summaryWs = XLSX.utils.json_to_sheet([
      { Label: 'Report Period', Value: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}` },
      { Label: 'Report Generated', Value: new Date().toISOString() },
      { Label: 'Total Customers', Value: data.length },
      { Label: 'Total Revenue (MYR)', Value: totalRevenue },
    ]);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

    return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
  }

  // =====================
  // UTILITIES
  // =====================

  private parseCsv(content: string): any[] {
    try {
      return parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } catch (error: any) {
      throw new BadRequestException(`Invalid CSV format: ${error.message}`);
    }
  }
}
