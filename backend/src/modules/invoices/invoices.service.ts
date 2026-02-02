import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma';
import { OrganizationsService } from '../organizations/organizations.service';
import {
  CreateInvoiceFromOrderDto,
  CreateDirectInvoiceDto,
  InvoiceResponseDto,
  InvoiceSummaryDto,
  RecordPaymentDto,
  PaymentResponseDto,
  InvoiceStatus,
  CreateInvoiceLineDto,
} from './dto';

@Injectable()
export class InvoicesService {
  constructor(
    private prisma: PrismaService,
    private organizationsService: OrganizationsService,
  ) {}

  async createFromOrder(
    organizationId: string,
    dto: CreateInvoiceFromOrderDto,
  ): Promise<InvoiceResponseDto> {
    const salesOrder = await this.prisma.salesOrder.findFirst({
      where: { id: dto.salesOrderId, organizationId },
      include: {
        customer: true,
        lines: { include: { item: true } },
      },
    });

    if (!salesOrder) {
      throw new NotFoundException('Sales order not found');
    }

    if (!['CONFIRMED', 'PICKING', 'PACKED', 'SHIPPED', 'INVOICED'].includes(salesOrder.status)) {
      throw new BadRequestException('Sales order must be confirmed to create invoice');
    }

    const invoiceNumber = await this.organizationsService.getNextNumber(organizationId, 'INV');
    const invoiceDate = dto.invoiceDate ? new Date(dto.invoiceDate) : new Date();
    const paymentTermsStr = salesOrder.customer.paymentTerms || 'Net 30';
    const paymentTermsDays = dto.paymentTerms ?? (parseInt(paymentTermsStr.replace(/\D/g, '')) || 30);
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + paymentTermsDays);

    const invoice = await this.prisma.invoice.create({
      data: {
        organizationId,
        invoiceNumber,
        customerId: salesOrder.customerId,
        salesOrderId: salesOrder.id,
        invoiceDate,
        dueDate,
        status: 'DRAFT',
        subtotal: salesOrder.subtotal,
        discountAmount: salesOrder.discountAmount,
        taxAmount: salesOrder.taxAmount,
        total: salesOrder.total,
        amountPaid: 0,
        notes: dto.notes || salesOrder.notes,
        lines: {
          create: salesOrder.lines.map((line: any) => ({
            itemId: line.itemId,
            description: line.notes,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            discountPct: line.discountPct,
            taxPct: line.taxPct,
            lineTotal: line.lineTotal,
          })),
        },
      },
      include: {
        customer: true,
        salesOrder: true,
        lines: { include: { item: true } },
      },
    });

    return this.toInvoiceResponse(invoice);
  }

  async createDirect(
    organizationId: string,
    dto: CreateDirectInvoiceDto,
  ): Promise<InvoiceResponseDto> {
    const customer = await this.prisma.customer.findFirst({
      where: { id: dto.customerId, organizationId, deletedAt: null },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const invoiceNumber = dto.invoiceNumber ||
      await this.organizationsService.getNextNumber(organizationId, 'INV');
    const invoiceDate = dto.invoiceDate ? new Date(dto.invoiceDate) : new Date();
    const paymentTermsStr = customer.paymentTerms || 'Net 30';
    const paymentTermsDays = dto.paymentTerms ?? (parseInt(paymentTermsStr.replace(/\D/g, '')) || 30);
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + paymentTermsDays);

    const lineData = await this.prepareInvoiceLines(organizationId, dto.lines);
    const { subtotal, taxAmount, totalAmount } = this.calculateTotals(
      lineData,
      dto.discountPercent,
      dto.discountAmount,
    );

    const invoice = await this.prisma.invoice.create({
      data: {
        organizationId,
        invoiceNumber,
        customerId: dto.customerId,
        invoiceDate,
        dueDate,
        status: 'DRAFT',
        subtotal,
        discountAmount: dto.discountAmount || 0,
        taxAmount,
        total: totalAmount,
        amountPaid: 0,
        notes: dto.notes,
        lines: {
          create: lineData.map((line) => ({
            itemId: line.itemId,
            description: line.description,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            discountPct: line.discountPercent || 0,
            taxPct: line.taxPct || 0,
            lineTotal: line.lineTotal,
          })),
        },
      },
      include: {
        customer: true,
        lines: { include: { item: true } },
      },
    });

    return this.toInvoiceResponse(invoice);
  }

  async findAll(
    organizationId: string,
    options?: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      customerId?: string;
      fromDate?: string;
      toDate?: string;
      overdue?: boolean;
    },
  ) {
    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {
      organizationId,
    };

    if (options?.search) {
      where.OR = [
        { invoiceNumber: { contains: options.search, mode: 'insensitive' } },
        { customer: { companyName: { contains: options.search, mode: 'insensitive' } } },
      ];
    }

    if (options?.status) {
      where.status = options.status;
    }

    if (options?.customerId) {
      where.customerId = options.customerId;
    }

    if (options?.fromDate) {
      where.invoiceDate = { ...where.invoiceDate, gte: new Date(options.fromDate) };
    }

    if (options?.toDate) {
      where.invoiceDate = { ...where.invoiceDate, lte: new Date(options.toDate) };
    }

    if (options?.overdue) {
      where.dueDate = { lt: new Date() };
      where.status = { in: ['SENT', 'PARTIALLY_PAID'] };
    }

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        include: { customer: true },
        skip,
        take: limit,
        orderBy: { invoiceDate: 'desc' },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return {
      data: invoices.map((i: any) => this.toInvoiceSummary(i)),
      meta: { total, page, limit },
    };
  }

  async findOne(organizationId: string, id: string): Promise<InvoiceResponseDto> {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, organizationId },
      include: {
        customer: true,
        salesOrder: true,
        lines: { include: { item: true } },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return this.toInvoiceResponse(invoice);
  }

  async send(organizationId: string, id: string): Promise<InvoiceResponseDto> {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, organizationId },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.status !== 'DRAFT') {
      throw new BadRequestException('Invoice already sent');
    }

    const updated = await this.prisma.invoice.update({
      where: { id },
      data: { status: 'SENT' },
      include: {
        customer: true,
        salesOrder: true,
        lines: { include: { item: true } },
      },
    });

    return this.toInvoiceResponse(updated);
  }

  async void(organizationId: string, id: string): Promise<InvoiceResponseDto> {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, organizationId },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (Number(invoice.amountPaid) > 0) {
      throw new BadRequestException('Cannot void invoice with payments');
    }

    const updated = await this.prisma.invoice.update({
      where: { id },
      data: { status: 'VOID' },
      include: {
        customer: true,
        salesOrder: true,
        lines: { include: { item: true } },
      },
    });

    return this.toInvoiceResponse(updated);
  }

  async recordPayment(
    organizationId: string,
    invoiceId: string,
    dto: RecordPaymentDto,
  ): Promise<PaymentResponseDto> {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, organizationId },
      include: { customer: true },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (['DRAFT', 'VOID', 'PAID'].includes(invoice.status)) {
      throw new BadRequestException('Cannot record payment for this invoice');
    }

    const balanceDue = Number(invoice.total) - Number(invoice.amountPaid);
    if (dto.amount > balanceDue) {
      throw new BadRequestException(`Amount exceeds balance due (${balanceDue})`);
    }

    const paymentNumber = await this.organizationsService.getNextNumber(organizationId, 'PMT');
    const paymentDate = dto.paymentDate ? new Date(dto.paymentDate) : new Date();

    const payment = await this.prisma.paymentReceived.create({
      data: {
        organizationId,
        paymentNumber,
        customerId: invoice.customerId,
        paymentDate,
        amount: dto.amount,
        paymentMethod: dto.paymentMethod,
        referenceNo: dto.reference,
        notes: dto.notes,
        allocations: {
          create: {
            invoiceId,
            amount: dto.amount,
          },
        },
      },
      include: {
        customer: true,
        allocations: {
          include: { invoice: true },
        },
      },
    });

    // Update invoice
    const newAmountPaid = Number(invoice.amountPaid) + dto.amount;
    const newStatus = newAmountPaid >= Number(invoice.total) ? 'PAID' : 'PARTIALLY_PAID';

    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        amountPaid: newAmountPaid,
        status: newStatus,
      },
    });

    return this.toPaymentResponse(payment);
  }

  async getPayments(
    organizationId: string,
    options?: {
      page?: number;
      limit?: number;
      customerId?: string;
      fromDate?: string;
      toDate?: string;
    },
  ) {
    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = { organizationId };

    if (options?.customerId) {
      where.customerId = options.customerId;
    }

    if (options?.fromDate) {
      where.paymentDate = { ...where.paymentDate, gte: new Date(options.fromDate) };
    }

    if (options?.toDate) {
      where.paymentDate = { ...where.paymentDate, lte: new Date(options.toDate) };
    }

    const [payments, total] = await Promise.all([
      this.prisma.paymentReceived.findMany({
        where,
        include: {
          customer: true,
          allocations: { include: { invoice: true } },
        },
        skip,
        take: limit,
        orderBy: { paymentDate: 'desc' },
      }),
      this.prisma.paymentReceived.count({ where }),
    ]);

    return {
      data: payments.map((p: any) => this.toPaymentResponse(p)),
      meta: { total, page, limit },
    };
  }

  // Helpers
  private async prepareInvoiceLines(
    organizationId: string,
    lines: CreateInvoiceLineDto[],
  ) {
    const preparedLines = [];

    for (const line of lines) {
      const item = await this.prisma.item.findFirst({
        where: { id: line.itemId, organizationId, deletedAt: null },
        include: { taxRate: true },
      });

      if (!item) {
        throw new NotFoundException(`Item ${line.itemId} not found`);
      }

      const unitPrice = line.unitPrice ?? Number(item.sellingPrice);
      let lineTotal = line.quantity * unitPrice;

      if (line.discountPercent) {
        lineTotal -= lineTotal * (line.discountPercent / 100);
      }
      if (line.discountAmount) {
        lineTotal -= line.discountAmount;
      }

      const taxAmount = item.taxRate
        ? lineTotal * (Number(item.taxRate.rate) / 100)
        : 0;

      preparedLines.push({
        itemId: item.id,
        description: line.description,
        quantity: line.quantity,
        unitPrice,
        discountPercent: line.discountPercent,
        discountAmount: line.discountAmount,
        taxPct: item.taxRate ? Number(item.taxRate.rate) : 0,
        taxAmount,
        lineTotal,
      });
    }

    return preparedLines;
  }

  private calculateTotals(
    lines: { lineTotal: number; taxAmount: number }[],
    discountPercent?: number,
    discountAmount?: number,
  ) {
    const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
    let discountedSubtotal = subtotal;

    if (discountPercent) {
      discountedSubtotal -= subtotal * (discountPercent / 100);
    }
    if (discountAmount) {
      discountedSubtotal -= discountAmount;
    }

    const taxRatio = subtotal > 0 ? discountedSubtotal / subtotal : 1;
    const taxAmount = lines.reduce((sum, l) => sum + l.taxAmount, 0) * taxRatio;
    const totalAmount = discountedSubtotal + taxAmount;

    return { subtotal, taxAmount, totalAmount };
  }

  private toInvoiceResponse(invoice: any): InvoiceResponseDto {
    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerId: invoice.customerId,
      customerCode: invoice.customer.code,
      customerName: invoice.customer.companyName,
      salesOrderId: invoice.salesOrderId,
      salesOrderNumber: invoice.salesOrder?.orderNumber,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      status: invoice.status as InvoiceStatus,
      subtotal: Number(invoice.subtotal),
      discountPercent: undefined,
      discountAmount: invoice.discountAmount ? Number(invoice.discountAmount) : undefined,
      taxAmount: Number(invoice.taxAmount),
      totalAmount: Number(invoice.total),
      amountPaid: Number(invoice.amountPaid),
      balanceDue: Number(invoice.total) - Number(invoice.amountPaid),
      notes: invoice.notes,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
      lines: invoice.lines?.map((l: any) => ({
        id: l.id,
        itemId: l.itemId,
        itemCode: l.item.code,
        itemName: l.item.name,
        description: l.description,
        quantity: l.quantity,
        unitPrice: Number(l.unitPrice),
        discountPercent: Number(l.discountPct),
        discountAmount: undefined,
        lineTotal: Number(l.lineTotal),
        taxAmount: Number(l.taxPct),
      })),
    };
  }

  private toInvoiceSummary(invoice: any): InvoiceSummaryDto {
    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerCode: invoice.customer.code,
      customerName: invoice.customer.companyName,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      status: invoice.status as InvoiceStatus,
      totalAmount: Number(invoice.total),
      balanceDue: Number(invoice.total) - Number(invoice.amountPaid),
    };
  }

  private toPaymentResponse(payment: any): PaymentResponseDto {
    return {
      id: payment.id,
      paymentNumber: payment.paymentNumber,
      customerId: payment.customerId,
      customerName: payment.customer.companyName,
      paymentDate: payment.paymentDate,
      amount: Number(payment.amount),
      paymentMethod: payment.paymentMethod,
      reference: payment.referenceNo,
      notes: payment.notes,
      createdAt: payment.createdAt,
      allocations: payment.allocations.map((a: any) => ({
        invoiceId: a.invoiceId,
        invoiceNumber: a.invoice.invoiceNumber,
        amount: Number(a.amount),
      })),
    };
  }

  async getInvoiceForPdf(organizationId: string, invoiceId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, organizationId },
      include: {
        customer: {
          include: {
            addresses: { where: { isDefaultBilling: true }, take: 1 },
          },
        },
        lines: {
          include: { item: true },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    const billingAddress = invoice.customer.addresses[0];

    return {
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      organization: {
        name: organization?.name || '',
        address: organization?.address || undefined,
        phone: organization?.phone || undefined,
        email: organization?.email || undefined,
        taxRegistrationNo: organization?.taxRegistrationNo || undefined,
      },
      customer: {
        companyName: invoice.customer.companyName,
        address: billingAddress
          ? `${billingAddress.addressLine1}${billingAddress.addressLine2 ? ', ' + billingAddress.addressLine2 : ''}, ${billingAddress.city}, ${billingAddress.state} ${billingAddress.postalCode}`
          : undefined,
        phone: invoice.customer.phone || undefined,
        email: invoice.customer.email || undefined,
        taxRegistrationNo: invoice.customer.taxRegistrationNo || undefined,
      },
      lines: invoice.lines.map((line: any) => ({
        itemCode: line.item.code,
        itemName: line.item.name,
        quantity: line.quantity,
        unitPrice: Number(line.unitPrice),
        discount: Number(line.discountPct || 0),
        tax: Number(line.taxPct || 0),
        lineTotal: Number(line.lineTotal),
      })),
      subtotal: Number(invoice.subtotal),
      discountAmount: Number(invoice.discountAmount || 0),
      taxAmount: Number(invoice.taxAmount),
      total: Number(invoice.total),
      notes: invoice.notes || undefined,
      paymentTerms: invoice.customer.paymentTerms || undefined,
    };
  }
}
