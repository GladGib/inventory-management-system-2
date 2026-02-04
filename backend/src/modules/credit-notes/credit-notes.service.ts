import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreditNoteStatus as PrismaCreditNoteStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { OrganizationsService } from '../organizations/organizations.service';
import {
  CreateCreditNoteDto,
  UpdateCreditNoteDto,
  ApplyCreditNoteDto,
  RefundCreditNoteDto,
  CreditNoteQueryDto,
  CreditNoteResponseDto,
} from './dto/credit-note.dto';

@Injectable()
export class CreditNotesService {
  constructor(
    private prisma: PrismaService,
    private organizationsService: OrganizationsService,
  ) {}

  private async generateCreditNoteNumber(organizationId: string): Promise<string> {
    return this.organizationsService.getNextNumber(organizationId, 'CN');
  }

  async create(
    organizationId: string,
    dto: CreateCreditNoteDto,
  ): Promise<CreditNoteResponseDto> {
    // Validate customer exists
    const customer = await this.prisma.customer.findFirst({
      where: { id: dto.customerId, organizationId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Validate sales return if provided
    if (dto.salesReturnId) {
      const salesReturn = await this.prisma.salesReturn.findFirst({
        where: { id: dto.salesReturnId, organizationId },
      });

      if (!salesReturn) {
        throw new NotFoundException('Sales return not found');
      }

      if (!['APPROVED', 'COMPLETED'].includes(salesReturn.status)) {
        throw new BadRequestException(
          'Sales return must be approved or completed to create credit note',
        );
      }
    }

    // Calculate totals
    let subtotal = 0;
    let taxAmount = 0;

    const linesWithTotals = dto.lines.map((line) => {
      const lineSubtotal = line.unitPrice * line.quantity;
      const lineTax = lineSubtotal * ((line.taxPct || 0) / 100);

      subtotal += lineSubtotal;
      taxAmount += lineTax;

      return {
        itemId: line.itemId,
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        taxPct: line.taxPct || 0,
        lineTotal: lineSubtotal + lineTax,
      };
    });

    const total = subtotal + taxAmount;

    // Generate credit note number
    const creditNoteNumber = await this.generateCreditNoteNumber(organizationId);

    // Create credit note
    const creditNote = await this.prisma.creditNote.create({
      data: {
        organizationId,
        creditNoteNumber,
        customerId: dto.customerId,
        salesReturnId: dto.salesReturnId,
        invoiceId: dto.invoiceId,
        issueDate: dto.issueDate ? new Date(dto.issueDate) : new Date(),
        reason: dto.reason,
        notes: dto.notes,
        status: 'DRAFT',
        subtotal,
        taxAmount,
        total,
        appliedAmount: 0,
        refundedAmount: 0,
        lines: {
          create: linesWithTotals,
        },
      },
      include: {
        customer: true,
        lines: true,
      },
    });

    return this.toCreditNoteResponse(creditNote);
  }

  async createFromReturn(
    organizationId: string,
    salesReturnId: string,
  ): Promise<CreditNoteResponseDto> {
    // Get the approved sales return
    const salesReturn = await this.prisma.salesReturn.findFirst({
      where: { id: salesReturnId, organizationId },
      include: {
        customer: true,
        lines: true,
      },
    });

    if (!salesReturn) {
      throw new NotFoundException('Sales return not found');
    }

    if (!['APPROVED', 'COMPLETED'].includes(salesReturn.status)) {
      throw new BadRequestException(
        'Sales return must be approved or completed to create credit note',
      );
    }

    // Check if credit note already exists for this return
    const existingCreditNote = await this.prisma.creditNote.findFirst({
      where: { salesReturnId, organizationId },
    });

    if (existingCreditNote) {
      throw new BadRequestException(
        'Credit note already exists for this sales return',
      );
    }

    // Get item details
    const itemIds = salesReturn.lines.map((l) => l.itemId);
    const items = await this.prisma.item.findMany({
      where: { id: { in: itemIds } },
    });
    const itemMap = new Map(items.map((i) => [i.id, i]));

    // Create lines from return lines
    const lines = salesReturn.lines.map((line) => {
      const item = itemMap.get(line.itemId);
      return {
        itemId: line.itemId,
        description: item?.name || '',
        quantity: line.quantity,
        unitPrice: Number(line.unitPrice),
        taxPct: 0, // Would need to get from original invoice
      };
    });

    return this.create(organizationId, {
      customerId: salesReturn.customerId,
      salesReturnId,
      invoiceId: salesReturn.invoiceId || undefined,
      reason: salesReturn.reason || 'Sales return',
      lines,
    });
  }

  async findAll(
    organizationId: string,
    query: CreditNoteQueryDto,
  ) {
    const { page = 1, limit = 20, search, status, customerId, fromDate, toDate } = query;
    const skip = (page - 1) * limit;

    const where: any = { organizationId };

    if (search) {
      where.OR = [
        { creditNoteNumber: { contains: search, mode: 'insensitive' } },
        { customer: { companyName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (fromDate || toDate) {
      where.issueDate = {};
      if (fromDate) where.issueDate.gte = new Date(fromDate);
      if (toDate) where.issueDate.lte = new Date(toDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.creditNote.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: true,
          lines: true,
        },
      }),
      this.prisma.creditNote.count({ where }),
    ]);

    return {
      data: await Promise.all(data.map((cn) => this.toCreditNoteResponse(cn))),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(
    organizationId: string,
    id: string,
  ): Promise<CreditNoteResponseDto> {
    const creditNote = await this.prisma.creditNote.findFirst({
      where: { id, organizationId },
      include: {
        customer: true,
        lines: true,
        applications: true,
        refunds: true,
      },
    });

    if (!creditNote) {
      throw new NotFoundException('Credit note not found');
    }

    return this.toCreditNoteResponse(creditNote);
  }

  async update(
    organizationId: string,
    id: string,
    dto: UpdateCreditNoteDto,
  ): Promise<CreditNoteResponseDto> {
    const creditNote = await this.findOne(organizationId, id);

    if (creditNote.status !== 'DRAFT') {
      throw new BadRequestException('Can only update draft credit notes');
    }

    const updated = await this.prisma.creditNote.update({
      where: { id },
      data: {
        reason: dto.reason,
        notes: dto.notes,
      },
      include: {
        customer: true,
        lines: true,
      },
    });

    return this.toCreditNoteResponse(updated);
  }

  async issue(organizationId: string, id: string): Promise<CreditNoteResponseDto> {
    const creditNote = await this.findOne(organizationId, id);

    if (creditNote.status !== 'DRAFT') {
      throw new BadRequestException('Can only issue draft credit notes');
    }

    const updated = await this.prisma.creditNote.update({
      where: { id },
      data: { status: 'ISSUED' },
      include: {
        customer: true,
        lines: true,
      },
    });

    return this.toCreditNoteResponse(updated);
  }

  async void(organizationId: string, id: string): Promise<CreditNoteResponseDto> {
    const creditNote = await this.findOne(organizationId, id);

    if (['PARTIALLY_APPLIED', 'FULLY_APPLIED'].includes(creditNote.status)) {
      throw new BadRequestException('Cannot void applied credit notes');
    }

    const updated = await this.prisma.creditNote.update({
      where: { id },
      data: { status: 'VOID' },
      include: {
        customer: true,
        lines: true,
      },
    });

    return this.toCreditNoteResponse(updated);
  }

  async applyToInvoice(
    organizationId: string,
    id: string,
    dto: ApplyCreditNoteDto,
  ): Promise<CreditNoteResponseDto> {
    const creditNote = await this.findOne(organizationId, id);

    if (!['ISSUED', 'PARTIALLY_APPLIED'].includes(creditNote.status)) {
      throw new BadRequestException(
        'Credit note must be issued before applying',
      );
    }

    // Calculate available balance
    const balance = creditNote.total - creditNote.appliedAmount - creditNote.refundedAmount;

    if (dto.amount > balance) {
      throw new BadRequestException(
        `Amount exceeds available balance of ${balance}`,
      );
    }

    // Validate invoice exists and belongs to same customer
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: dto.invoiceId, organizationId },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.customerId !== creditNote.customerId) {
      throw new BadRequestException(
        'Invoice must belong to the same customer',
      );
    }

    // Calculate invoice balance
    const invoiceBalance = Number(invoice.total) - Number(invoice.amountPaid);

    if (dto.amount > invoiceBalance) {
      throw new BadRequestException(
        `Amount exceeds invoice balance of ${invoiceBalance}`,
      );
    }

    // Apply credit note
    const newAppliedAmount = creditNote.appliedAmount + dto.amount;
    const newInvoiceAmountPaid = Number(invoice.amountPaid) + dto.amount;
    const newBalance = creditNote.total - newAppliedAmount - creditNote.refundedAmount;

    let newStatus: PrismaCreditNoteStatus = creditNote.status as PrismaCreditNoteStatus;
    if (newBalance <= 0) {
      newStatus = PrismaCreditNoteStatus.FULLY_APPLIED;
    } else if (newAppliedAmount > 0) {
      newStatus = PrismaCreditNoteStatus.PARTIALLY_APPLIED;
    }

    // Determine invoice status
    let invoiceStatus = invoice.status;
    if (newInvoiceAmountPaid >= Number(invoice.total)) {
      invoiceStatus = 'PAID';
    } else if (newInvoiceAmountPaid > 0) {
      invoiceStatus = 'PARTIALLY_PAID';
    }

    await this.prisma.$transaction([
      this.prisma.creditNoteApplication.create({
        data: {
          creditNoteId: id,
          invoiceId: dto.invoiceId,
          amount: dto.amount,
          notes: dto.notes,
        },
      }),
      this.prisma.creditNote.update({
        where: { id },
        data: {
          appliedAmount: newAppliedAmount,
          status: newStatus,
        },
      }),
      this.prisma.invoice.update({
        where: { id: dto.invoiceId },
        data: {
          amountPaid: newInvoiceAmountPaid,
          status: invoiceStatus,
        },
      }),
    ]);

    return this.findOne(organizationId, id);
  }

  async refund(
    organizationId: string,
    id: string,
    dto: RefundCreditNoteDto,
  ): Promise<CreditNoteResponseDto> {
    const creditNote = await this.findOne(organizationId, id);

    if (!['ISSUED', 'PARTIALLY_APPLIED'].includes(creditNote.status)) {
      throw new BadRequestException(
        'Credit note must be issued before refunding',
      );
    }

    // Calculate available balance
    const balance = creditNote.total - creditNote.appliedAmount - creditNote.refundedAmount;

    if (dto.amount > balance) {
      throw new BadRequestException(
        `Amount exceeds available balance of ${balance}`,
      );
    }

    // Record refund
    const newRefundedAmount = creditNote.refundedAmount + dto.amount;
    const newBalance = creditNote.total - creditNote.appliedAmount - newRefundedAmount;

    let newStatus: PrismaCreditNoteStatus = creditNote.status as PrismaCreditNoteStatus;
    if (newBalance <= 0) {
      newStatus = PrismaCreditNoteStatus.FULLY_APPLIED;
    } else if (newRefundedAmount > 0 || creditNote.appliedAmount > 0) {
      newStatus = PrismaCreditNoteStatus.PARTIALLY_APPLIED;
    }

    await this.prisma.$transaction([
      this.prisma.creditNoteRefund.create({
        data: {
          creditNoteId: id,
          amount: dto.amount,
          refundMethod: dto.refundMethod,
          referenceNo: dto.referenceNo,
          notes: dto.notes,
        },
      }),
      this.prisma.creditNote.update({
        where: { id },
        data: {
          refundedAmount: newRefundedAmount,
          status: newStatus,
        },
      }),
    ]);

    return this.findOne(organizationId, id);
  }

  async getCreditNoteForPdf(organizationId: string, id: string) {
    const creditNote = await this.prisma.creditNote.findFirst({
      where: { id, organizationId },
      include: {
        organization: true,
        customer: true,
        lines: true,
        salesReturn: true,
      },
    });

    if (!creditNote) {
      throw new NotFoundException('Credit note not found');
    }

    // Get item details
    const itemIds = creditNote.lines.map((l) => l.itemId);
    const items = await this.prisma.item.findMany({
      where: { id: { in: itemIds } },
    });
    const itemMap = new Map(items.map((i) => [i.id, i]));

    return {
      creditNoteNumber: creditNote.creditNoteNumber,
      issueDate: creditNote.issueDate,
      organization: {
        name: creditNote.organization.name,
        address: creditNote.organization.address || undefined,
        phone: creditNote.organization.phone || undefined,
        email: creditNote.organization.email || undefined,
      },
      customer: {
        companyName: creditNote.customer.companyName,
        phone: creditNote.customer.phone || undefined,
        email: creditNote.customer.email || undefined,
      },
      salesReturnNumber: creditNote.salesReturn?.returnNumber || undefined,
      lines: creditNote.lines.map((line) => {
        const item = itemMap.get(line.itemId);
        return {
          itemCode: item?.code || '',
          itemName: line.description || item?.name || '',
          quantity: line.quantity,
          unitPrice: Number(line.unitPrice),
          taxPct: Number(line.taxPct),
          lineTotal: Number(line.lineTotal),
        };
      }),
      subtotal: Number(creditNote.subtotal),
      taxAmount: Number(creditNote.taxAmount),
      total: Number(creditNote.total),
      reason: creditNote.reason || undefined,
      notes: creditNote.notes || undefined,
    };
  }

  async delete(organizationId: string, id: string): Promise<void> {
    const creditNote = await this.findOne(organizationId, id);

    if (creditNote.status !== 'DRAFT') {
      throw new BadRequestException('Can only delete draft credit notes');
    }

    await this.prisma.creditNote.delete({ where: { id } });
  }

  private async toCreditNoteResponse(creditNote: any): Promise<CreditNoteResponseDto> {
    // Get item details for lines
    const itemIds = creditNote.lines.map((l: any) => l.itemId);
    const items = await this.prisma.item.findMany({
      where: { id: { in: itemIds } },
    });
    const itemMap = new Map(items.map((i) => [i.id, i]));

    const total = Number(creditNote.total);
    const appliedAmount = Number(creditNote.appliedAmount);
    const refundedAmount = Number(creditNote.refundedAmount);

    return {
      id: creditNote.id,
      creditNoteNumber: creditNote.creditNoteNumber,
      customerId: creditNote.customerId,
      customerName: creditNote.customer?.companyName,
      salesReturnId: creditNote.salesReturnId || undefined,
      invoiceId: creditNote.invoiceId || undefined,
      status: creditNote.status,
      issueDate: creditNote.issueDate,
      subtotal: Number(creditNote.subtotal),
      taxAmount: Number(creditNote.taxAmount),
      total,
      appliedAmount,
      refundedAmount,
      balance: total - appliedAmount - refundedAmount,
      reason: creditNote.reason || undefined,
      notes: creditNote.notes || undefined,
      lines: creditNote.lines.map((line: any) => {
        const item = itemMap.get(line.itemId);
        return {
          id: line.id,
          itemId: line.itemId,
          itemCode: item?.code,
          itemName: item?.name,
          description: line.description || undefined,
          quantity: line.quantity,
          unitPrice: Number(line.unitPrice),
          taxPct: Number(line.taxPct),
          lineTotal: Number(line.lineTotal),
        };
      }),
      createdAt: creditNote.createdAt,
    };
  }
}
