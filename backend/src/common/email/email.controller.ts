import {
  Controller,
  Post,
  Get,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { EmailService } from './email.service';
import { PdfService } from '../pdf/pdf.service';
import { CurrentUser } from '../decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

interface JwtPayload {
  sub: string;
  email: string;
  organizationId: string;
  role: string;
}

@ApiTags('email')
@ApiBearerAuth()
@Controller()
export class EmailController {
  constructor(
    private readonly emailService: EmailService,
    private readonly pdfService: PdfService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('email/test-connection')
  @ApiOperation({ summary: 'Test SMTP connection' })
  @ApiResponse({ status: 200, description: 'Connection test result' })
  async testConnection() {
    return this.emailService.testConnection();
  }

  @Post('purchase-orders/:id/send-email')
  @ApiOperation({ summary: 'Send purchase order to vendor via email' })
  @ApiParam({ name: 'id', description: 'Purchase Order ID' })
  @ApiResponse({ status: 200, description: 'Email sent successfully' })
  @ApiResponse({ status: 400, description: 'Vendor has no email' })
  async sendPurchaseOrderEmail(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    // Get PO data for PDF
    const po = await this.prisma.purchaseOrder.findFirst({
      where: { id, organizationId: user.organizationId },
      include: {
        organization: true,
        vendor: true,
        warehouse: true,
        lines: { include: { item: true } },
      },
    });

    if (!po) {
      return { success: false, message: 'Purchase order not found' };
    }

    // Generate PDF
    const pdfData = {
      poNumber: po.orderNumber,
      orderDate: po.orderDate,
      expectedDate: po.expectedDeliveryDate || undefined,
      organization: {
        name: po.organization.name,
        address: po.organization.address || undefined,
        phone: po.organization.phone || undefined,
        email: po.organization.email || undefined,
      },
      vendor: {
        companyName: po.vendor.companyName,
        phone: po.vendor.phone || undefined,
        email: po.vendor.email || undefined,
      },
      warehouse: po.warehouse ? { name: po.warehouse.name } : undefined,
      lines: po.lines.map((line: any) => ({
        itemCode: line.item.code,
        itemName: line.item.name,
        quantity: line.quantity,
        unitCost: Number(line.unitPrice),
        lineTotal: Number(line.lineTotal),
      })),
      subtotal: Number(po.subtotal),
      taxAmount: Number(po.taxAmount),
      total: Number(po.total),
      notes: po.notes || undefined,
    };

    const pdfBuffer = await this.pdfService.generatePurchaseOrderPdf(pdfData);

    // Send email
    const result = await this.emailService.sendPurchaseOrderEmail(
      user.organizationId,
      id,
      pdfBuffer,
    );

    return result;
  }

  @Post('invoices/:id/send-email')
  @ApiOperation({ summary: 'Send invoice to customer via email' })
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  @ApiResponse({ status: 200, description: 'Email sent successfully' })
  @ApiResponse({ status: 400, description: 'Customer has no email' })
  async sendInvoiceEmail(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    // Get invoice data for PDF
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, organizationId: user.organizationId },
      include: {
        organization: true,
        customer: true,
        lines: { include: { item: true } },
      },
    });

    if (!invoice) {
      return { success: false, message: 'Invoice not found' };
    }

    // Generate PDF
    const pdfData = {
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      organization: {
        name: invoice.organization.name,
        address: invoice.organization.address || undefined,
        phone: invoice.organization.phone || undefined,
        email: invoice.organization.email || undefined,
      },
      customer: {
        companyName: invoice.customer.companyName,
        phone: invoice.customer.phone || undefined,
        email: invoice.customer.email || undefined,
      },
      lines: invoice.lines.map((line: any) => ({
        itemCode: line.item.code,
        itemName: line.item.name,
        quantity: line.quantity,
        unitPrice: Number(line.unitPrice),
        discount: Number(line.discountPct) * Number(line.lineTotal) / 100,
        tax: Number(line.taxPct) * Number(line.lineTotal) / 100,
        lineTotal: Number(line.lineTotal),
      })),
      subtotal: Number(invoice.subtotal),
      discountAmount: Number(invoice.discountAmount) || 0,
      taxAmount: Number(invoice.taxAmount),
      total: Number(invoice.total),
      notes: invoice.notes || undefined,
    };

    const pdfBuffer = await this.pdfService.generateInvoicePdf(pdfData);

    // Send email
    const result = await this.emailService.sendInvoiceEmail(
      user.organizationId,
      id,
      pdfBuffer,
    );

    return result;
  }
}
