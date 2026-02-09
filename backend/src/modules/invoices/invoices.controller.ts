import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Res,
  StreamableFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiProduces,
} from '@nestjs/swagger';
import { Response } from 'express';
import { InvoicesService } from './invoices.service';
import {
  CreateInvoiceFromOrderDto,
  CreateDirectInvoiceDto,
  InvoiceResponseDto,
  RecordPaymentDto,
  PaymentResponseDto,
} from './dto';
import { CurrentUser, RequirePermissions, AuditEntity } from '@/common/decorators';
import { PdfService } from '@/common/pdf';
import { EmailService } from '@/common/email';

@ApiTags('Invoices')
@ApiBearerAuth()
@AuditEntity('Invoice')
@Controller('invoices')
export class InvoicesController {
  constructor(
    private invoicesService: InvoicesService,
    private pdfService: PdfService,
    private emailService: EmailService,
  ) {}

  @Post('from-order')
  @RequirePermissions('invoices:create')
  @ApiOperation({ summary: 'Create invoice from sales order' })
  @ApiResponse({ status: 201, type: InvoiceResponseDto })
  @ApiResponse({ status: 400, description: 'Order not confirmed' })
  @ApiResponse({ status: 404, description: 'Sales order not found' })
  async createFromOrder(
    @CurrentUser('organizationId') orgId: string,
    @Body() dto: CreateInvoiceFromOrderDto,
  ) {
    const invoice = await this.invoicesService.createFromOrder(orgId, dto);
    return { data: invoice };
  }

  @Post()
  @RequirePermissions('invoices:create')
  @ApiOperation({ summary: 'Create direct invoice' })
  @ApiResponse({ status: 201, type: InvoiceResponseDto })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async createDirect(
    @CurrentUser('organizationId') orgId: string,
    @Body() dto: CreateDirectInvoiceDto,
  ) {
    const invoice = await this.invoicesService.createDirect(orgId, dto);
    return { data: invoice };
  }

  @Get()
  @RequirePermissions('invoices:view')
  @ApiOperation({ summary: 'List all invoices' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'customerId', required: false, type: String })
  @ApiQuery({ name: 'fromDate', required: false, type: String })
  @ApiQuery({ name: 'toDate', required: false, type: String })
  @ApiQuery({ name: 'overdue', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Invoices list' })
  async findAll(
    @CurrentUser('organizationId') orgId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('customerId') customerId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('overdue') overdue?: boolean,
  ) {
    return this.invoicesService.findAll(orgId, {
      page,
      limit,
      search,
      status,
      customerId,
      fromDate,
      toDate,
      overdue,
    });
  }

  @Get(':id')
  @RequirePermissions('invoices:view')
  @ApiOperation({ summary: 'Get invoice by ID' })
  @ApiResponse({ status: 200, type: InvoiceResponseDto })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async findOne(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
  ) {
    const invoice = await this.invoicesService.findOne(orgId, id);
    return { data: invoice };
  }

  @Get(':id/pdf')
  @RequirePermissions('invoices:view')
  @ApiOperation({ summary: 'Download invoice as PDF' })
  @ApiProduces('application/pdf')
  @ApiResponse({ status: 200, description: 'PDF file' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async downloadPdf(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const invoiceData = await this.invoicesService.getInvoiceForPdf(orgId, id);
    const pdfBuffer = await this.pdfService.generateInvoicePdf(invoiceData);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${invoiceData.invoiceNumber}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  }

  @Post(':id/send')
  @RequirePermissions('invoices:edit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark invoice as sent' })
  @ApiResponse({ status: 200, type: InvoiceResponseDto })
  @ApiResponse({ status: 400, description: 'Invoice already sent' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async send(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
  ) {
    const invoice = await this.invoicesService.send(orgId, id);
    return { data: invoice };
  }

  @Post(':id/void')
  @RequirePermissions('invoices:edit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Void invoice' })
  @ApiResponse({ status: 200, type: InvoiceResponseDto })
  @ApiResponse({ status: 400, description: 'Cannot void invoice with payments' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async void(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
  ) {
    const invoice = await this.invoicesService.void(orgId, id);
    return { data: invoice };
  }

  @Post(':id/payments')
  @RequirePermissions('invoices:edit')
  @ApiOperation({ summary: 'Record payment for invoice' })
  @ApiResponse({ status: 201, type: PaymentResponseDto })
  @ApiResponse({ status: 400, description: 'Amount exceeds balance' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async recordPayment(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') invoiceId: string,
    @Body() dto: RecordPaymentDto,
  ) {
    const payment = await this.invoicesService.recordPayment(orgId, invoiceId, dto);
    return { data: payment };
  }

  @Post(':id/send-email')
  @RequirePermissions('invoices:edit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send invoice via email to customer' })
  @ApiResponse({
    status: 200,
    description: 'Email sent successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            sentAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Customer has no email or email not configured' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async sendEmail(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
  ) {
    // Generate PDF first
    const invoiceData = await this.invoicesService.getInvoiceForPdf(orgId, id);
    const pdfBuffer = await this.pdfService.generateInvoicePdf(invoiceData);

    // Send email with PDF attachment
    const result = await this.emailService.sendInvoiceEmail(orgId, id, pdfBuffer);

    return { data: result };
  }
}

@ApiTags('Payments Received')
@ApiBearerAuth()
@Controller('payments-received')
export class PaymentsReceivedController {
  constructor(private invoicesService: InvoicesService) {}

  @Get()
  @RequirePermissions('invoices:view')
  @ApiOperation({ summary: 'List all payments received' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'customerId', required: false, type: String })
  @ApiQuery({ name: 'fromDate', required: false, type: String })
  @ApiQuery({ name: 'toDate', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Payments list' })
  async findAll(
    @CurrentUser('organizationId') orgId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('customerId') customerId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.invoicesService.getPayments(orgId, {
      page,
      limit,
      customerId,
      fromDate,
      toDate,
    });
  }
}
