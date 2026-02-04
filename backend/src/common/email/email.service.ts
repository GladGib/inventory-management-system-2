import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as nodemailer from 'nodemailer';
import * as Handlebars from 'handlebars';

export interface EmailOptions {
  to: string;
  subject: string;
  template: 'purchase-order' | 'invoice' | 'notification';
  context: Record<string, any>;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType?: string;
  }>;
}

export interface EmailLogEntry {
  id: string;
  recipient: string;
  subject: string;
  status: 'sent' | 'failed';
  sentAt: Date;
  errorMessage?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private templates: Map<string, Handlebars.TemplateDelegate> = new Map();
  private isConfigured = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.initializeTransporter();
    this.loadTemplates();
  }

  private initializeTransporter(): void {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (!host || !port) {
      this.logger.warn(
        'SMTP not configured. Email sending will be skipped. Set SMTP_HOST and SMTP_PORT environment variables to enable email functionality.',
      );
      this.isConfigured = false;
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: user && pass ? { user, pass } : undefined,
      });
      this.isConfigured = true;
      this.logger.log(`Email service initialized with SMTP host: ${host}:${port}`);
    } catch (error: any) {
      this.logger.error(`Failed to initialize email transporter: ${error.message}`);
      this.isConfigured = false;
    }
  }

  /**
   * Check if the email service is properly configured
   */
  isEmailConfigured(): boolean {
    return this.isConfigured && this.transporter !== null;
  }

  private loadTemplates(): void {
    // Purchase Order Template
    this.templates.set('purchase-order', Handlebars.compile(`
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background: #2563eb; color: white; padding: 20px; }
    .content { padding: 20px; }
    .details { background: #f5f5f5; padding: 15px; margin: 15px 0; border-radius: 5px; }
    .items { width: 100%; border-collapse: collapse; margin: 15px 0; }
    .items th { background: #e5e5e5; padding: 10px; text-align: left; }
    .items td { padding: 10px; border-bottom: 1px solid #ddd; }
    .total { font-weight: bold; font-size: 1.2em; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 0.9em; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Purchase Order: {{poNumber}}</h1>
  </div>
  <div class="content">
    <p>Dear {{vendorName}},</p>
    <p>Please find attached our Purchase Order <strong>{{poNumber}}</strong>.</p>

    <div class="details">
      <p><strong>Order Date:</strong> {{orderDate}}</p>
      <p><strong>Expected Delivery:</strong> {{expectedDate}}</p>
      <p><strong>Delivery Address:</strong> {{deliveryAddress}}</p>
    </div>

    <h3>Order Summary</h3>
    <table class="items">
      <thead>
        <tr>
          <th>Item</th>
          <th>Quantity</th>
          <th>Unit Price</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        {{#each items}}
        <tr>
          <td>{{name}}</td>
          <td>{{quantity}}</td>
          <td>MYR {{unitPrice}}</td>
          <td>MYR {{lineTotal}}</td>
        </tr>
        {{/each}}
      </tbody>
    </table>

    <p class="total">Total: MYR {{total}}</p>

    <p>{{#if notes}}Notes: {{notes}}{{/if}}</p>

    <div class="footer">
      <p>If you have any questions, please contact us.</p>
      <p><strong>{{organizationName}}</strong></p>
      <p>{{organizationEmail}} | {{organizationPhone}}</p>
    </div>
  </div>
</body>
</html>
`));

    // Invoice Template
    this.templates.set('invoice', Handlebars.compile(`
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background: #059669; color: white; padding: 20px; }
    .content { padding: 20px; }
    .details { background: #f5f5f5; padding: 15px; margin: 15px 0; border-radius: 5px; }
    .items { width: 100%; border-collapse: collapse; margin: 15px 0; }
    .items th { background: #e5e5e5; padding: 10px; text-align: left; }
    .items td { padding: 10px; border-bottom: 1px solid #ddd; }
    .total { font-weight: bold; font-size: 1.2em; }
    .due { color: #dc2626; font-weight: bold; }
    .payment-info { background: #fef3c7; padding: 15px; margin: 15px 0; border-radius: 5px; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 0.9em; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Invoice: {{invoiceNumber}}</h1>
  </div>
  <div class="content">
    <p>Dear {{customerName}},</p>
    <p>Please find attached Invoice <strong>{{invoiceNumber}}</strong>.</p>

    <div class="details">
      <p><strong>Invoice Date:</strong> {{invoiceDate}}</p>
      <p class="due"><strong>Due Date:</strong> {{dueDate}}</p>
      <p><strong>Payment Terms:</strong> {{paymentTerms}}</p>
    </div>

    <h3>Invoice Details</h3>
    <table class="items">
      <thead>
        <tr>
          <th>Description</th>
          <th>Quantity</th>
          <th>Unit Price</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        {{#each items}}
        <tr>
          <td>{{description}}</td>
          <td>{{quantity}}</td>
          <td>MYR {{unitPrice}}</td>
          <td>MYR {{lineTotal}}</td>
        </tr>
        {{/each}}
      </tbody>
    </table>

    <p>Subtotal: MYR {{subtotal}}</p>
    <p>Tax: MYR {{taxAmount}}</p>
    <p class="total">Total Due: MYR {{total}}</p>

    <div class="payment-info">
      <h4>Payment Information</h4>
      <p><strong>Bank:</strong> {{bankName}}</p>
      <p><strong>Account Name:</strong> {{bankAccountName}}</p>
      <p><strong>Account No:</strong> {{bankAccountNo}}</p>
      <p>Please include invoice number <strong>{{invoiceNumber}}</strong> as payment reference.</p>
    </div>

    <div class="footer">
      <p>Thank you for your business.</p>
      <p><strong>{{organizationName}}</strong></p>
      <p>{{organizationEmail}} | {{organizationPhone}}</p>
    </div>
  </div>
</body>
</html>
`));

    // Generic Notification Template
    this.templates.set('notification', Handlebars.compile(`
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background: #4f46e5; color: white; padding: 20px; }
    .content { padding: 20px; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 0.9em; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <h1>{{title}}</h1>
  </div>
  <div class="content">
    {{{message}}}
    <div class="footer">
      <p><strong>{{organizationName}}</strong></p>
    </div>
  </div>
</body>
</html>
`));
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.isConfigured || !this.transporter) {
      return { success: false, message: 'Email not configured. Set SMTP_HOST and SMTP_PORT environment variables.' };
    }

    try {
      await this.transporter.verify();
      return { success: true, message: 'SMTP connection successful' };
    } catch (error: any) {
      return { success: false, message: `Connection failed: ${error.message}` };
    }
  }

  async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; skipped?: boolean }> {
    // Handle missing SMTP config gracefully - log warning and skip sending
    if (!this.isConfigured || !this.transporter) {
      this.logger.warn(
        `Skipping email to ${options.to} (subject: "${options.subject}") - SMTP not configured`,
      );
      return { success: false, skipped: true };
    }

    const template = this.templates.get(options.template);
    if (!template) {
      throw new BadRequestException(`Template '${options.template}' not found`);
    }

    const html = template(options.context);

    try {
      const result = await this.transporter.sendMail({
        from: this.configService.get<string>('SMTP_FROM') || 'noreply@example.com',
        to: options.to,
        subject: options.subject,
        html,
        attachments: options.attachments?.map((a) => ({
          filename: a.filename,
          content: a.content,
          contentType: a.contentType,
        })),
      });

      this.logger.log(`Email sent to ${options.to} (messageId: ${result.messageId})`);
      return { success: true, messageId: result.messageId };
    } catch (error: any) {
      this.logger.error(`Failed to send email to ${options.to}: ${error.message}`);
      throw new InternalServerErrorException(`Failed to send email: ${error.message}`);
    }
  }

  async sendPurchaseOrderEmail(
    organizationId: string,
    purchaseOrderId: string,
    pdfBuffer: Buffer,
  ): Promise<{ success: boolean; sentAt?: Date; skipped?: boolean; message?: string }> {
    // Handle missing SMTP config gracefully
    if (!this.isConfigured || !this.transporter) {
      this.logger.warn(
        `Skipping purchase order email for PO ${purchaseOrderId} - SMTP not configured`,
      );
      return { success: false, skipped: true, message: 'SMTP not configured' };
    }

    const po = await this.prisma.purchaseOrder.findFirst({
      where: { id: purchaseOrderId, organizationId },
      include: {
        organization: true,
        vendor: true,
        lines: { include: { item: true } },
      },
    });

    if (!po) {
      throw new BadRequestException('Purchase order not found');
    }

    if (!po.vendor.email) {
      throw new BadRequestException('Vendor has no email address configured');
    }

    const context = {
      poNumber: po.orderNumber,
      vendorName: po.vendor.companyName,
      orderDate: po.orderDate.toLocaleDateString('en-MY'),
      expectedDate: po.expectedDeliveryDate?.toLocaleDateString('en-MY') || 'TBD',
      deliveryAddress: '', // Could be enhanced with warehouse address
      items: po.lines.map((line) => ({
        name: line.item.name,
        quantity: line.quantity,
        unitPrice: Number(line.unitPrice).toFixed(2),
        lineTotal: Number(line.lineTotal).toFixed(2),
      })),
      total: Number(po.total).toFixed(2),
      notes: po.notes,
      organizationName: po.organization.name,
      organizationEmail: po.organization.email,
      organizationPhone: po.organization.phone,
    };

    const result = await this.sendEmail({
      to: po.vendor.email,
      subject: `Purchase Order ${po.orderNumber} from ${po.organization.name}`,
      template: 'purchase-order',
      context,
      attachments: [
        {
          filename: `PO-${po.orderNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    if (result.skipped) {
      return { success: false, skipped: true, message: 'SMTP not configured' };
    }

    return { success: true, sentAt: new Date() };
  }

  async sendInvoiceEmail(
    organizationId: string,
    invoiceId: string,
    pdfBuffer: Buffer,
  ): Promise<{ success: boolean; sentAt?: Date; skipped?: boolean; message?: string }> {
    // Handle missing SMTP config gracefully
    if (!this.isConfigured || !this.transporter) {
      this.logger.warn(
        `Skipping invoice email for Invoice ${invoiceId} - SMTP not configured`,
      );
      return { success: false, skipped: true, message: 'SMTP not configured' };
    }

    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, organizationId },
      include: {
        organization: true,
        customer: true,
        lines: { include: { item: true } },
      },
    });

    if (!invoice) {
      throw new BadRequestException('Invoice not found');
    }

    if (!invoice.customer.email) {
      throw new BadRequestException('Customer has no email address configured');
    }

    const context = {
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customer.companyName,
      invoiceDate: invoice.invoiceDate.toLocaleDateString('en-MY'),
      dueDate: invoice.dueDate.toLocaleDateString('en-MY'),
      paymentTerms: invoice.customer.paymentTerms || 'Due on receipt',
      items: invoice.lines.map((line) => ({
        description: line.description || line.item.name,
        quantity: line.quantity,
        unitPrice: Number(line.unitPrice).toFixed(2),
        lineTotal: Number(line.lineTotal).toFixed(2),
      })),
      subtotal: Number(invoice.subtotal).toFixed(2),
      taxAmount: Number(invoice.taxAmount).toFixed(2),
      total: Number(invoice.total).toFixed(2),
      bankName: '', // Could be enhanced with organization bank details
      bankAccountName: '',
      bankAccountNo: '',
      organizationName: invoice.organization.name,
      organizationEmail: invoice.organization.email,
      organizationPhone: invoice.organization.phone,
    };

    const result = await this.sendEmail({
      to: invoice.customer.email,
      subject: `Invoice ${invoice.invoiceNumber} from ${invoice.organization.name} - MYR ${context.total}`,
      template: 'invoice',
      context,
      attachments: [
        {
          filename: `Invoice-${invoice.invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    if (result.skipped) {
      return { success: false, skipped: true, message: 'SMTP not configured' };
    }

    return { success: true, sentAt: new Date() };
  }
}
