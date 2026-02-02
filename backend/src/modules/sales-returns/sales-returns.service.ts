import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CreateSalesReturnDto,
  UpdateSalesReturnDto,
  ReceiveReturnDto,
  ProcessRefundDto,
  SalesReturnQueryDto,
  ReturnStatus,
} from './dto/sales-return.dto';

@Injectable()
export class SalesReturnsService {
  constructor(private prisma: PrismaService) {}

  async create(organizationId: string, dto: CreateSalesReturnDto) {
    // Validate invoice exists
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: dto.invoiceId, organizationId },
      include: { lines: { include: { item: true } } },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    // Validate return quantities don't exceed invoice quantities
    for (const returnItem of dto.items) {
      const invoiceLine = invoice.lines.find((l: any) => l.itemId === returnItem.itemId);
      if (!invoiceLine) {
        throw new BadRequestException(`Item ${returnItem.itemId} not found in invoice`);
      }
      if (returnItem.quantity > invoiceLine.quantity) {
        throw new BadRequestException(`Return quantity exceeds invoice quantity for item ${returnItem.itemId}`);
      }
    }

    // Generate return number
    const count = await this.prisma.salesReturn.count({ where: { organizationId } });
    const returnNumber = `RET-${String(count + 1).padStart(6, '0')}`;

    // Calculate totals
    let subtotal = 0;
    let taxAmount = 0;

    const itemsWithPricing = dto.items.map(item => {
      const invoiceLine = invoice.lines.find((l: any) => l.itemId === item.itemId)!;
      const lineSubtotal = Number(invoiceLine.unitPrice) * item.quantity;
      const lineTax = lineSubtotal * (Number(invoiceLine.taxPct) / 100);

      subtotal += lineSubtotal;
      taxAmount += lineTax;

      return {
        itemId: item.itemId,
        quantity: item.quantity,
        unitPrice: invoiceLine.unitPrice,
        reason: item.reason || dto.reason,
      };
    });

    const total = subtotal + taxAmount;

    return this.prisma.salesReturn.create({
      data: {
        organizationId,
        returnNumber,
        customerId: invoice.customerId,
        invoiceId: dto.invoiceId,
        returnDate: dto.returnDate ? new Date(dto.returnDate) : new Date(),
        reason: dto.reason,
        status: 'DRAFT',
        subtotal,
        taxAmount,
        total,
        notes: dto.notes,
        lines: {
          create: itemsWithPricing,
        },
      },
      include: {
        customer: true,
        lines: true,
      },
    });
  }

  async findAll(organizationId: string, query: SalesReturnQueryDto) {
    const { page = 1, limit = 20, search, status, customerId, fromDate, toDate } = query;
    const skip = (page - 1) * limit;

    const where: any = { organizationId };

    if (search) {
      where.OR = [
        { returnNumber: { contains: search, mode: 'insensitive' } },
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
      where.returnDate = {};
      if (fromDate) where.returnDate.gte = new Date(fromDate);
      if (toDate) where.returnDate.lte = new Date(toDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.salesReturn.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: true,
          lines: true,
        },
      }),
      this.prisma.salesReturn.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(organizationId: string, id: string) {
    const salesReturn = await this.prisma.salesReturn.findFirst({
      where: { id, organizationId },
      include: {
        customer: true,
        lines: true,
      },
    });

    if (!salesReturn) {
      throw new NotFoundException('Sales return not found');
    }

    return salesReturn;
  }

  async update(organizationId: string, id: string, dto: UpdateSalesReturnDto) {
    const salesReturn = await this.findOne(organizationId, id);

    if (salesReturn.status === 'COMPLETED') {
      throw new BadRequestException('Cannot update a completed return');
    }

    return this.prisma.salesReturn.update({
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
  }

  async approve(organizationId: string, id: string) {
    const salesReturn = await this.findOne(organizationId, id);

    if (salesReturn.status !== 'DRAFT') {
      throw new BadRequestException('Return must be draft to approve');
    }

    return this.prisma.salesReturn.update({
      where: { id },
      data: { status: 'APPROVED' },
      include: {
        customer: true,
        lines: true,
      },
    });
  }

  async reject(organizationId: string, id: string, reason?: string) {
    const salesReturn = await this.findOne(organizationId, id);

    if (!['DRAFT', 'PENDING_INSPECTION'].includes(salesReturn.status)) {
      throw new BadRequestException('Return cannot be rejected in current status');
    }

    return this.prisma.salesReturn.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        notes: reason ? `${salesReturn.notes || ''}\nRejection reason: ${reason}` : salesReturn.notes,
      },
      include: {
        customer: true,
        lines: true,
      },
    });
  }

  async receiveReturn(organizationId: string, id: string, dto: ReceiveReturnDto) {
    const salesReturn = await this.findOne(organizationId, id);

    if (salesReturn.status !== 'APPROVED') {
      throw new BadRequestException('Return must be approved before receiving');
    }

    // Get default warehouse if not specified
    let warehouseId = dto.warehouseId;
    if (!warehouseId) {
      const primaryWarehouse = await this.prisma.warehouse.findFirst({
        where: { organization: { id: organizationId }, isPrimary: true },
      });
      warehouseId = primaryWarehouse?.id;
    }

    if (!warehouseId) {
      throw new BadRequestException('Warehouse is required');
    }

    // Update stock for restockable items and create stock movements
    const operations: any[] = [];

    for (const item of dto.items) {
      if (item.restockable !== false) {
        // Find existing stock level or create one
        const existingStockLevel = await this.prisma.stockLevel.findFirst({
          where: {
            itemId: item.itemId,
            warehouseId,
            binLocationId: null,
          },
        });

        if (existingStockLevel) {
          operations.push(
            this.prisma.stockLevel.update({
              where: { id: existingStockLevel.id },
              data: { onHand: { increment: item.receivedQuantity } },
            })
          );
        } else {
          operations.push(
            this.prisma.stockLevel.create({
              data: {
                itemId: item.itemId,
                warehouseId,
                onHand: item.receivedQuantity,
                committed: 0,
                onOrder: 0,
              },
            })
          );
        }
      }

      // Create stock movement
      operations.push(
        this.prisma.stockMovement.create({
          data: {
            itemId: item.itemId,
            warehouseId,
            movementType: 'IN',
            quantity: item.receivedQuantity,
            referenceType: 'SALES_RETURN',
            referenceId: id,
            notes: `Return received - ${item.restockable !== false ? 'Restocked' : 'Not restockable'}`,
          },
        })
      );
    }

    // Update return status and lines
    const lineUpdates = dto.items.map(item =>
      this.prisma.salesReturnLine.updateMany({
        where: {
          salesReturnId: id,
          itemId: item.itemId,
        },
        data: {
          inspectionStatus: item.restockable !== false ? 'PASSED' : 'FAILED',
          restockQty: item.restockable !== false ? item.receivedQuantity : 0,
          writeOffQty: item.restockable === false ? item.receivedQuantity : 0,
        },
      })
    );

    operations.push(...lineUpdates);

    operations.push(
      this.prisma.salesReturn.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          notes: dto.notes ? `${salesReturn.notes || ''}\n${dto.notes}` : salesReturn.notes,
        },
      })
    );

    await this.prisma.$transaction(operations);

    return this.findOne(organizationId, id);
  }

  async processRefund(organizationId: string, id: string, dto: ProcessRefundDto) {
    const salesReturn = await this.findOne(organizationId, id);

    if (salesReturn.status !== 'COMPLETED') {
      throw new BadRequestException('Return must be completed before processing refund');
    }

    if (dto.refundAmount > Number(salesReturn.total)) {
      throw new BadRequestException('Refund amount exceeds return value');
    }

    // Create a credit note or payment record
    // For now, just update the return with refund details
    return this.prisma.salesReturn.update({
      where: { id },
      data: {
        notes: `${salesReturn.notes || ''}\nRefund processed: ${dto.refundAmount} via ${dto.refundMethod}${dto.referenceNumber ? ` (Ref: ${dto.referenceNumber})` : ''}`,
      },
      include: {
        customer: true,
        lines: true,
      },
    });
  }

  async delete(organizationId: string, id: string) {
    const salesReturn = await this.findOne(organizationId, id);

    if (salesReturn.status !== 'DRAFT') {
      throw new BadRequestException('Only draft returns can be deleted');
    }

    await this.prisma.salesReturn.delete({ where: { id } });
  }
}
