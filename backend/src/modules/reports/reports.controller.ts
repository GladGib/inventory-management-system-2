import { Controller, Get, Query, UseGuards, Res, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiProduces, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, RequirePermissions } from '@/common/decorators';
import { ReportsService } from './reports.service';
import { ReportQueryDto } from './dto/report.dto';
import { PdfService } from '@/common/pdf/pdf.service';
import * as XLSX from 'xlsx';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly pdfService: PdfService,
  ) {}

  @Get('sales-summary')
  @RequirePermissions('reports:view')
  @ApiOperation({ summary: 'Get sales summary report' })
  @ApiResponse({ status: 200, description: 'Sales summary data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getSalesSummary(
    @CurrentUser('organizationId') organizationId: string,
    @Query() query: ReportQueryDto,
  ) {
    return this.reportsService.getSalesSummary(organizationId, query);
  }

  @Get('inventory-summary')
  @RequirePermissions('reports:view')
  @ApiOperation({ summary: 'Get inventory summary report' })
  @ApiResponse({ status: 200, description: 'Inventory summary data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getInventorySummary(
    @CurrentUser('organizationId') organizationId: string,
    @Query() query: ReportQueryDto,
  ) {
    return this.reportsService.getInventorySummary(organizationId, query);
  }

  @Get('purchase-summary')
  @RequirePermissions('reports:view')
  @ApiOperation({ summary: 'Get purchase summary report' })
  @ApiResponse({ status: 200, description: 'Purchase summary data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getPurchaseSummary(
    @CurrentUser('organizationId') organizationId: string,
    @Query() query: ReportQueryDto,
  ) {
    return this.reportsService.getPurchaseSummary(organizationId, query);
  }

  @Get('receivables-summary')
  @RequirePermissions('reports:view')
  @ApiOperation({ summary: 'Get accounts receivable summary' })
  @ApiResponse({ status: 200, description: 'Receivables summary data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getReceivablesSummary(
    @CurrentUser('organizationId') organizationId: string,
  ) {
    return this.reportsService.getReceivablesSummary(organizationId);
  }

  @Get('payables-summary')
  @RequirePermissions('reports:view')
  @ApiOperation({ summary: 'Get accounts payable summary' })
  @ApiResponse({ status: 200, description: 'Payables summary data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getPayablesSummary(
    @CurrentUser('organizationId') organizationId: string,
  ) {
    return this.reportsService.getPayablesSummary(organizationId);
  }

  @Get('stock-valuation')
  @RequirePermissions('reports:view')
  @ApiOperation({ summary: 'Get detailed stock valuation report' })
  @ApiQuery({ name: 'warehouseId', required: false, type: String })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Stock valuation data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getStockValuation(
    @CurrentUser('organizationId') organizationId: string,
    @Query() query: ReportQueryDto,
  ) {
    return this.reportsService.getStockValuation(organizationId, query);
  }

  @Get('sales-by-customer')
  @RequirePermissions('reports:view')
  @ApiOperation({ summary: 'Get detailed sales by customer report' })
  @ApiResponse({ status: 200, description: 'Sales by customer data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getSalesByCustomer(
    @CurrentUser('organizationId') organizationId: string,
    @Query() query: ReportQueryDto,
  ) {
    return this.reportsService.getSalesByCustomer(organizationId, query);
  }

  // Export endpoints
  @Get('stock-valuation/export/pdf')
  @RequirePermissions('reports:view')
  @ApiOperation({ summary: 'Export stock valuation report as PDF' })
  @ApiProduces('application/pdf')
  @ApiResponse({ status: 200, description: 'PDF file' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Header('Content-Type', 'application/pdf')
  async exportStockValuationPdf(
    @CurrentUser('organizationId') organizationId: string,
    @Query() query: ReportQueryDto,
    @Res() res: Response,
  ) {
    const data = await this.reportsService.getStockValuation(organizationId, query);
    const pdfBuffer = await this.pdfService.generateReportPdf({
      title: 'Stock Valuation Report',
      organization: { name: 'Organization' },
      generatedAt: new Date(),
      sections: [
        {
          title: 'Summary',
          type: 'summary',
          data: {
            'Total Items': data.summary.totalItems,
            'Total Quantity': data.summary.totalQuantity,
            'Total Value': `RM ${data.summary.totalValue.toFixed(2)}`,
          },
        },
        {
          title: 'Items by Value',
          type: 'table',
          data: {
            headers: ['Item Code', 'Item Name', 'Category', 'Unit Cost', 'Quantity', 'Total Value'],
            rows: data.items.map((item: any) => [
              item.itemCode,
              item.itemName,
              item.categoryName,
              `RM ${item.unitCost.toFixed(2)}`,
              item.totalQuantity.toString(),
              `RM ${item.totalValue.toFixed(2)}`,
            ]),
          },
        },
      ],
    });

    res.set({
      'Content-Disposition': `attachment; filename="stock-valuation-${new Date().toISOString().split('T')[0]}.pdf"`,
    });
    res.send(pdfBuffer);
  }

  @Get('stock-valuation/export/excel')
  @RequirePermissions('reports:view')
  @ApiOperation({ summary: 'Export stock valuation report as Excel' })
  @ApiProduces('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @ApiResponse({ status: 200, description: 'Excel file' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async exportStockValuationExcel(
    @CurrentUser('organizationId') organizationId: string,
    @Query() query: ReportQueryDto,
    @Res() res: Response,
  ) {
    const data = await this.reportsService.getStockValuation(organizationId, query);

    const worksheetData = [
      ['Stock Valuation Report'],
      [`Generated: ${new Date().toLocaleString()}`],
      [],
      ['Summary'],
      ['Total Items', data.summary.totalItems],
      ['Total Quantity', data.summary.totalQuantity],
      ['Total Value', data.summary.totalValue],
      [],
      ['Item Details'],
      ['Item Code', 'Item Name', 'Category', 'Unit Cost', 'Quantity', 'Total Value'],
      ...data.items.map((item: any) => [
        item.itemCode,
        item.itemName,
        item.categoryName,
        item.unitCost,
        item.totalQuantity,
        item.totalValue,
      ]),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock Valuation');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="stock-valuation-${new Date().toISOString().split('T')[0]}.xlsx"`,
    });
    res.send(buffer);
  }

  @Get('sales-by-customer/export/pdf')
  @RequirePermissions('reports:view')
  @ApiOperation({ summary: 'Export sales by customer report as PDF' })
  @ApiProduces('application/pdf')
  @ApiResponse({ status: 200, description: 'PDF file' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Header('Content-Type', 'application/pdf')
  async exportSalesByCustomerPdf(
    @CurrentUser('organizationId') organizationId: string,
    @Query() query: ReportQueryDto,
    @Res() res: Response,
  ) {
    const data = await this.reportsService.getSalesByCustomer(organizationId, query);
    const pdfBuffer = await this.pdfService.generateReportPdf({
      title: 'Sales by Customer Report',
      organization: { name: 'Organization' },
      generatedAt: new Date(),
      dateRange: query.fromDate || query.toDate ? {
        from: query.fromDate ? new Date(query.fromDate) : undefined,
        to: query.toDate ? new Date(query.toDate) : undefined,
      } : undefined,
      sections: [
        {
          title: 'Summary',
          type: 'summary',
          data: {
            'Total Customers': data.summary.totalCustomers,
            'Total Orders': data.summary.totalOrders,
            'Total Revenue': `RM ${data.summary.totalRevenue.toFixed(2)}`,
            'Total Profit': `RM ${data.summary.totalProfit.toFixed(2)}`,
          },
        },
        {
          title: 'Customers',
          type: 'table',
          data: {
            headers: ['Customer Code', 'Customer Name', 'Orders', 'Revenue', 'Profit', 'Avg Order'],
            rows: data.customers.map((c: any) => [
              c.customerCode,
              c.customerName,
              c.orderCount.toString(),
              `RM ${c.totalRevenue.toFixed(2)}`,
              `RM ${c.totalProfit.toFixed(2)}`,
              `RM ${c.averageOrderValue.toFixed(2)}`,
            ]),
          },
        },
      ],
    });

    res.set({
      'Content-Disposition': `attachment; filename="sales-by-customer-${new Date().toISOString().split('T')[0]}.pdf"`,
    });
    res.send(pdfBuffer);
  }

  @Get('sales-by-customer/export/excel')
  @RequirePermissions('reports:view')
  @ApiOperation({ summary: 'Export sales by customer report as Excel' })
  @ApiProduces('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @ApiResponse({ status: 200, description: 'Excel file' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async exportSalesByCustomerExcel(
    @CurrentUser('organizationId') organizationId: string,
    @Query() query: ReportQueryDto,
    @Res() res: Response,
  ) {
    const data = await this.reportsService.getSalesByCustomer(organizationId, query);

    const worksheetData = [
      ['Sales by Customer Report'],
      [`Generated: ${new Date().toLocaleString()}`],
      query.fromDate || query.toDate ? [`Date Range: ${query.fromDate || 'Start'} to ${query.toDate || 'End'}`] : [],
      [],
      ['Summary'],
      ['Total Customers', data.summary.totalCustomers],
      ['Total Orders', data.summary.totalOrders],
      ['Total Revenue', data.summary.totalRevenue],
      ['Total Profit', data.summary.totalProfit],
      [],
      ['Customer Details'],
      ['Customer Code', 'Customer Name', 'Orders', 'Quantity', 'Revenue', 'Profit', 'Avg Order Value'],
      ...data.customers.map((c: any) => [
        c.customerCode,
        c.customerName,
        c.orderCount,
        c.totalQuantity,
        c.totalRevenue,
        c.totalProfit,
        c.averageOrderValue,
      ]),
    ].filter((row: any) => row.length > 0);

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales by Customer');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="sales-by-customer-${new Date().toISOString().split('T')[0]}.xlsx"`,
    });
    res.send(buffer);
  }
}

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('stats')
  @RequirePermissions('reports:view')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard statistics' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getStats(@CurrentUser('organizationId') organizationId: string) {
    return this.reportsService.getDashboardStats(organizationId);
  }
}
