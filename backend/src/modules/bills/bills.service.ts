import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CreateBillDto,
  UpdateBillDto,
  RecordBillPaymentDto,
  BillQueryDto,
  BillStatus,
} from './dto/bill.dto';

@Injectable()
export class BillsService {
  constructor(private prisma: PrismaService) {}

  async create(organizationId: string, dto: CreateBillDto) {
    // Generate bill number
    const count = await this.prisma.purchaseBill.count({ where: { organizationId } });
    const billNumber = `BILL-${String(count + 1).padStart(6, '0')}`;

    // Get vendor for payment terms
    const vendor = await this.prisma.vendor.findFirst({
      where: { id: dto.vendorId, organizationId },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    // Parse payment terms (assume days like "Net 30" = 30)
    const paymentTermsDays = vendor.paymentTerms
      ? parseInt(vendor.paymentTerms.replace(/\D/g, '')) || 30
      : 30;

    // Calculate due date based on payment terms
    const billDate = dto.billDate ? new Date(dto.billDate) : new Date();
    const dueDate = dto.dueDate
      ? new Date(dto.dueDate)
      : new Date(billDate.getTime() + paymentTermsDays * 24 * 60 * 60 * 1000);

    // Calculate totals
    let subtotal = 0;
    let totalTax = 0;

    const itemsWithTotals = dto.items.map(item => {
      const lineSubtotal = item.quantity * item.unitPrice;
      const taxAmount = lineSubtotal * ((item.taxPercent || 0) / 100);
      const lineTotal = lineSubtotal + taxAmount;

      subtotal += lineSubtotal;
      totalTax += taxAmount;

      return {
        description: item.description || '',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxPct: item.taxPercent || 0,
        lineTotal,
      };
    });

    const totalAmount = subtotal + totalTax;

    const bill = await this.prisma.purchaseBill.create({
      data: {
        organizationId,
        billNumber,
        grnId: dto.grnId,
        vendorId: dto.vendorId,
        vendorInvoiceNo: dto.vendorInvoiceNumber,
        billDate,
        dueDate,
        status: 'PENDING',
        subtotal,
        discountAmount: dto.discountAmount || 0,
        taxAmount: totalTax,
        total: totalAmount - (dto.discountAmount || 0),
        amountPaid: 0,
        notes: dto.notes,
        lines: {
          create: itemsWithTotals,
        },
      },
      include: {
        vendor: true,
        lines: true,
      },
    });

    return bill;
  }

  async createFromGRN(organizationId: string, grnId: string) {
    const grn = await this.prisma.goodsReceivedNote.findFirst({
      where: { id: grnId, organizationId },
      include: {
        vendor: true,
        lines: {
          include: {
            item: true,
          },
        },
      },
    });

    if (!grn) {
      throw new NotFoundException('GRN not found');
    }

    // Check if bill already exists for this GRN
    const existingBill = await this.prisma.purchaseBill.findFirst({
      where: { grnId, organizationId },
    });

    if (existingBill) {
      throw new BadRequestException('Bill already exists for this GRN');
    }

    const items = grn.lines.map((line: any) => ({
      description: line.item.name,
      quantity: line.receivedQty,
      unitPrice: Number(line.unitPrice),
      taxPercent: 0,
    }));

    return this.create(organizationId, {
      grnId,
      vendorId: grn.vendorId,
      items,
    });
  }

  async findAll(organizationId: string, query: BillQueryDto) {
    const { page = 1, limit = 20, search, status, vendorId, fromDate, toDate } = query;
    const skip = (page - 1) * limit;

    const where: any = { organizationId };

    if (search) {
      where.OR = [
        { billNumber: { contains: search, mode: 'insensitive' } },
        { vendorInvoiceNo: { contains: search, mode: 'insensitive' } },
        { vendor: { companyName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (vendorId) {
      where.vendorId = vendorId;
    }

    if (fromDate || toDate) {
      where.billDate = {};
      if (fromDate) where.billDate.gte = new Date(fromDate);
      if (toDate) where.billDate.lte = new Date(toDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.purchaseBill.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          vendor: true,
          grn: true,
          lines: true,
        },
      }),
      this.prisma.purchaseBill.count({ where }),
    ]);

    // Check for overdue bills
    const now = new Date();
    const updatedData = data.map((bill: typeof data[0]) => {
      const balanceDue = Number(bill.total) - Number(bill.amountPaid);
      if (
        bill.status === 'PENDING' &&
        bill.dueDate < now &&
        balanceDue > 0
      ) {
        return { ...bill, status: 'OVERDUE' as const };
      }
      return bill;
    });

    return {
      data: updatedData,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(organizationId: string, id: string) {
    const bill = await this.prisma.purchaseBill.findFirst({
      where: { id, organizationId },
      include: {
        vendor: true,
        grn: true,
        lines: true,
        payments: {
          include: {
            paymentMade: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!bill) {
      throw new NotFoundException('Bill not found');
    }

    return bill;
  }

  async update(organizationId: string, id: string, dto: UpdateBillDto) {
    const bill = await this.findOne(organizationId, id);

    if (bill.status === 'PAID') {
      throw new BadRequestException('Cannot update a paid bill');
    }

    return this.prisma.purchaseBill.update({
      where: { id },
      data: {
        vendorInvoiceNo: dto.vendorInvoiceNumber,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        notes: dto.notes,
      },
      include: {
        vendor: true,
        lines: true,
      },
    });
  }

  async recordPayment(organizationId: string, billId: string, dto: RecordBillPaymentDto) {
    const bill = await this.findOne(organizationId, billId);
    const balanceDue = Number(bill.total) - Number(bill.amountPaid);

    if (bill.status === 'PAID') {
      throw new BadRequestException('Bill is already fully paid');
    }

    if (dto.amount > balanceDue) {
      throw new BadRequestException('Payment amount exceeds balance due');
    }

    // Generate payment number
    const paymentCount = await this.prisma.paymentMade.count({ where: { organizationId } });
    const paymentNumber = `PAY-${String(paymentCount + 1).padStart(6, '0')}`;

    const newPaidAmount = Number(bill.amountPaid) + dto.amount;
    const newBalanceDue = Number(bill.total) - newPaidAmount;
    const newStatus = newBalanceDue <= 0 ? 'PAID' : 'PARTIALLY_PAID';

    await this.prisma.$transaction([
      // Create payment record
      this.prisma.paymentMade.create({
        data: {
          organizationId,
          paymentNumber,
          vendorId: bill.vendorId,
          paymentDate: new Date(dto.paymentDate),
          amount: dto.amount,
          paymentMethod: dto.paymentMethod,
          referenceNo: dto.referenceNumber,
          notes: dto.notes,
          allocations: {
            create: {
              billId,
              amount: dto.amount,
            },
          },
        },
      }),
      // Update bill
      this.prisma.purchaseBill.update({
        where: { id: billId },
        data: {
          amountPaid: newPaidAmount,
          status: newStatus,
        },
      }),
    ]);

    return this.findOne(organizationId, billId);
  }

  async voidBill(organizationId: string, id: string) {
    const bill = await this.findOne(organizationId, id);

    if (Number(bill.amountPaid) > 0) {
      throw new BadRequestException('Cannot void a bill with payments');
    }

    await this.prisma.purchaseBill.update({
      where: { id },
      data: { status: 'VOID' },
    });

    return this.findOne(organizationId, id);
  }

  async delete(organizationId: string, id: string) {
    const bill = await this.findOne(organizationId, id);

    if (bill.status !== 'DRAFT') {
      throw new BadRequestException('Only draft bills can be deleted');
    }

    await this.prisma.purchaseBill.delete({ where: { id } });
  }

  async getPaymentSummary(organizationId: string, vendorId?: string) {
    const where: any = { organizationId };
    if (vendorId) where.vendorId = vendorId;

    const bills = await this.prisma.purchaseBill.findMany({
      where,
      select: {
        status: true,
        total: true,
        amountPaid: true,
        dueDate: true,
      },
    });

    const now = new Date();
    let totalOutstanding = 0;
    let totalOverdue = 0;
    let overdueCount = 0;

    bills.forEach((bill: typeof bills[0]) => {
      const balanceDue = Number(bill.total) - Number(bill.amountPaid);
      if (balanceDue > 0) {
        totalOutstanding += balanceDue;
        if (bill.dueDate < now) {
          totalOverdue += balanceDue;
          overdueCount++;
        }
      }
    });

    return {
      totalOutstanding,
      totalOverdue,
      overdueCount,
      totalBills: bills.length,
    };
  }
}
