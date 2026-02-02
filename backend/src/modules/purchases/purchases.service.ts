import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma';
import { OrganizationsService } from '../organizations/organizations.service';
import {
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
  PurchaseOrderResponseDto,
  PurchaseOrderSummaryDto,
  CreatePurchaseOrderLineDto,
  UpdatePurchaseOrderLineDto,
  CreateGRNDto,
  GRNResponseDto,
  ReorderSuggestionDto,
  PurchaseOrderStatus,
} from './dto';

@Injectable()
export class PurchasesService {
  constructor(
    private prisma: PrismaService,
    private organizationsService: OrganizationsService,
  ) {}

  async create(organizationId: string, dto: CreatePurchaseOrderDto): Promise<PurchaseOrderResponseDto> {
    const vendor = await this.prisma.vendor.findFirst({
      where: { id: dto.vendorId, organizationId, deletedAt: null },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const orderNumber = dto.poNumber ||
      await this.organizationsService.getNextNumber(organizationId, 'PO');

    let warehouseId = dto.warehouseId;
    if (!warehouseId) {
      const primaryWarehouse = await this.prisma.warehouse.findFirst({
        where: { organizationId, isPrimary: true, deletedAt: null },
      });
      warehouseId = primaryWarehouse?.id;
    }

    if (!warehouseId) {
      throw new BadRequestException('Warehouse must be specified');
    }

    const lineData = await this.prepareOrderLines(organizationId, dto.vendorId, dto.lines);
    const { subtotal, taxAmount, totalAmount } = this.calculateTotals(lineData);

    const po = await this.prisma.purchaseOrder.create({
      data: {
        organizationId,
        orderNumber,
        vendorId: dto.vendorId,
        warehouseId,
        orderDate: dto.orderDate ? new Date(dto.orderDate) : new Date(),
        expectedDeliveryDate: dto.expectedDate ? new Date(dto.expectedDate) : undefined,
        status: 'DRAFT',
        subtotal,
        taxAmount,
        total: totalAmount,
        notes: dto.notes,
        internalNotes: dto.internalNotes,
        lines: {
          create: lineData.map((line) => ({
            itemId: line.itemId,
            quantity: line.quantity,
            unitPrice: line.unitCost,
            discountPct: 0,
            taxPct: line.taxPct || 0,
            lineTotal: line.lineTotal,
            notes: line.notes,
          })),
        },
      },
      include: {
        vendor: true,
        warehouse: true,
        lines: { include: { item: true } },
      },
    });

    return this.toPurchaseOrderResponse(po);
  }

  async findAll(
    organizationId: string,
    options?: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      vendorId?: string;
      fromDate?: string;
      toDate?: string;
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
        { orderNumber: { contains: options.search, mode: 'insensitive' } },
        { vendor: { companyName: { contains: options.search, mode: 'insensitive' } } },
      ];
    }

    if (options?.status) {
      where.status = options.status;
    }

    if (options?.vendorId) {
      where.vendorId = options.vendorId;
    }

    if (options?.fromDate) {
      where.orderDate = { ...where.orderDate, gte: new Date(options.fromDate) };
    }

    if (options?.toDate) {
      where.orderDate = { ...where.orderDate, lte: new Date(options.toDate) };
    }

    const [orders, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where,
        include: {
          vendor: true,
          _count: { select: { lines: true } },
        },
        skip,
        take: limit,
        orderBy: { orderDate: 'desc' },
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);

    return {
      data: orders.map((o: any) => this.toPurchaseOrderSummary(o)),
      meta: { total, page, limit },
    };
  }

  async findOne(organizationId: string, id: string): Promise<PurchaseOrderResponseDto> {
    const po = await this.prisma.purchaseOrder.findFirst({
      where: { id, organizationId },
      include: {
        vendor: true,
        warehouse: true,
        lines: { include: { item: true } },
      },
    });

    if (!po) {
      throw new NotFoundException('Purchase order not found');
    }

    return this.toPurchaseOrderResponse(po);
  }

  async update(
    organizationId: string,
    id: string,
    dto: UpdatePurchaseOrderDto,
  ): Promise<PurchaseOrderResponseDto> {
    const po = await this.prisma.purchaseOrder.findFirst({
      where: { id, organizationId },
    });

    if (!po) {
      throw new NotFoundException('Purchase order not found');
    }

    if (po.status !== 'DRAFT') {
      throw new BadRequestException('Can only update draft orders');
    }

    const updateData: any = { ...dto };
    if (dto.expectedDate) {
      updateData.expectedDeliveryDate = new Date(dto.expectedDate);
      delete updateData.expectedDate;
    }

    const updated = await this.prisma.purchaseOrder.update({
      where: { id },
      data: updateData,
      include: {
        vendor: true,
        warehouse: true,
        lines: { include: { item: true } },
      },
    });

    return this.toPurchaseOrderResponse(updated);
  }

  async addLine(
    organizationId: string,
    poId: string,
    dto: CreatePurchaseOrderLineDto,
  ): Promise<PurchaseOrderResponseDto> {
    const po = await this.prisma.purchaseOrder.findFirst({
      where: { id: poId, organizationId },
      include: { lines: true },
    });

    if (!po) {
      throw new NotFoundException('Purchase order not found');
    }

    if (po.status !== 'DRAFT') {
      throw new BadRequestException('Can only add lines to draft orders');
    }

    const lineData = await this.prepareOrderLines(organizationId, po.vendorId, [dto]);
    const line = lineData[0];

    await this.prisma.purchaseOrderLine.create({
      data: {
        purchaseOrderId: poId,
        itemId: line.itemId,
        quantity: line.quantity,
        unitPrice: line.unitCost,
        discountPct: 0,
        taxPct: line.taxPct || 0,
        lineTotal: line.lineTotal,
        notes: line.notes,
      },
    });

    await this.recalculateOrderTotals(poId);

    return this.findOne(organizationId, poId);
  }

  async send(organizationId: string, id: string): Promise<PurchaseOrderResponseDto> {
    const po = await this.prisma.purchaseOrder.findFirst({
      where: { id, organizationId },
    });

    if (!po) {
      throw new NotFoundException('Purchase order not found');
    }

    if (po.status !== 'DRAFT') {
      throw new BadRequestException('Order already sent');
    }

    // Update on-order quantities
    const lines = await this.prisma.purchaseOrderLine.findMany({
      where: { purchaseOrderId: id },
      include: { item: true },
    });

    for (const line of lines) {
      if (line.item.trackInventory && po.warehouseId) {
        const existingStock = await this.prisma.stockLevel.findFirst({
          where: { itemId: line.itemId, warehouseId: po.warehouseId },
        });

        if (existingStock) {
          await this.prisma.stockLevel.update({
            where: { id: existingStock.id },
            data: { onOrder: { increment: line.quantity } },
          });
        } else {
          await this.prisma.stockLevel.create({
            data: {
              itemId: line.itemId,
              warehouseId: po.warehouseId,
              onHand: 0,
              committed: 0,
              onOrder: line.quantity,
            },
          });
        }
      }
    }

    const updated = await this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'ISSUED' },
      include: {
        vendor: true,
        warehouse: true,
        lines: { include: { item: true } },
      },
    });

    return this.toPurchaseOrderResponse(updated);
  }

  async cancel(organizationId: string, id: string): Promise<PurchaseOrderResponseDto> {
    const po = await this.prisma.purchaseOrder.findFirst({
      where: { id, organizationId },
      include: { lines: { include: { item: true } } },
    });

    if (!po) {
      throw new NotFoundException('Purchase order not found');
    }

    if (!['DRAFT', 'ISSUED'].includes(po.status)) {
      throw new BadRequestException('Cannot cancel order in current status');
    }

    // Release on-order quantities if issued
    if (po.status === 'ISSUED' && po.warehouseId) {
      for (const line of po.lines) {
        if (line.item.trackInventory) {
          const remaining = line.quantity - line.receivedQty;
          if (remaining > 0) {
            const existingStock = await this.prisma.stockLevel.findFirst({
              where: { itemId: line.itemId, warehouseId: po.warehouseId },
            });
            if (existingStock) {
              await this.prisma.stockLevel.update({
                where: { id: existingStock.id },
                data: { onOrder: { decrement: remaining } },
              });
            }
          }
        }
      }
    }

    const updated = await this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        vendor: true,
        warehouse: true,
        lines: { include: { item: true } },
      },
    });

    return this.toPurchaseOrderResponse(updated);
  }

  // GRN (Goods Received Note)
  async createGRN(
    organizationId: string,
    poId: string,
    dto: CreateGRNDto,
  ): Promise<GRNResponseDto> {
    const po = await this.prisma.purchaseOrder.findFirst({
      where: { id: poId, organizationId },
      include: {
        vendor: true,
        lines: { include: { item: true } },
      },
    });

    if (!po) {
      throw new NotFoundException('Purchase order not found');
    }

    if (!['ISSUED', 'PARTIALLY_RECEIVED'].includes(po.status)) {
      throw new BadRequestException('Order must be issued to receive goods');
    }

    const warehouseId = dto.warehouseId || po.warehouseId;
    if (!warehouseId) {
      throw new BadRequestException('Warehouse must be specified');
    }

    // Validate lines
    for (const grnLine of dto.lines) {
      const poLine = po.lines.find((l: any) => l.id === grnLine.poLineId);
      if (!poLine) {
        throw new BadRequestException(`PO line ${grnLine.poLineId} not found`);
      }

      const remaining = poLine.quantity - poLine.receivedQty;
      if (grnLine.quantityReceived > remaining) {
        throw new BadRequestException(
          `Cannot receive more than ordered for item ${poLine.item.code}`,
        );
      }
    }

    const grnNumber = await this.organizationsService.getNextNumber(organizationId, 'GRN');

    const grn = await this.prisma.goodsReceivedNote.create({
      data: {
        organizationId,
        grnNumber,
        purchaseOrderId: poId,
        vendorId: po.vendorId,
        warehouseId,
        receiveDate: dto.receiveDate ? new Date(dto.receiveDate) : new Date(),
        status: 'CONFIRMED',
        notes: dto.notes,
        lines: {
          create: dto.lines.map((line: any) => {
            const poLine = po.lines.find((l: any) => l.id === line.poLineId)!;
            return {
              itemId: poLine.itemId,
              orderedQty: poLine.quantity,
              receivedQty: line.quantityReceived,
              unitPrice: poLine.unitPrice,
              binLocationId: line.binLocationId,
            };
          }),
        },
      },
      include: {
        purchaseOrder: { include: { vendor: true } },
        warehouse: true,
        lines: {
          include: {
            item: true,
          },
        },
      },
    });

    // Update PO lines and stock
    for (const grnLine of dto.lines) {
      const poLine = po.lines.find((l: any) => l.id === grnLine.poLineId)!;

      // Update PO line received quantity
      await this.prisma.purchaseOrderLine.update({
        where: { id: grnLine.poLineId },
        data: { receivedQty: { increment: grnLine.quantityReceived } },
      });

      // Update stock level
      if (poLine.item.trackInventory) {
        const existingStock = await this.prisma.stockLevel.findFirst({
          where: { itemId: poLine.itemId, warehouseId },
        });

        if (existingStock) {
          await this.prisma.stockLevel.update({
            where: { id: existingStock.id },
            data: {
              onHand: { increment: grnLine.quantityReceived },
              onOrder: { decrement: grnLine.quantityReceived },
            },
          });
        } else {
          await this.prisma.stockLevel.create({
            data: {
              itemId: poLine.itemId,
              warehouseId,
              binLocationId: grnLine.binLocationId,
              onHand: grnLine.quantityReceived,
              committed: 0,
              onOrder: 0,
            },
          });
        }

        // Create stock movement
        await this.prisma.stockMovement.create({
          data: {
            itemId: poLine.itemId,
            warehouseId,
            movementType: 'IN',
            quantity: grnLine.quantityReceived,
            referenceType: 'GRN',
            referenceId: grn.id,
          },
        });
      }
    }

    // Update PO status
    const updatedLines = await this.prisma.purchaseOrderLine.findMany({
      where: { purchaseOrderId: poId },
    });

    const allReceived = updatedLines.every((l: any) => l.receivedQty >= l.quantity);
    await this.prisma.purchaseOrder.update({
      where: { id: poId },
      data: { status: allReceived ? 'RECEIVED' : 'PARTIALLY_RECEIVED' },
    });

    return this.toGRNResponse(grn);
  }

  async getReorderSuggestions(organizationId: string): Promise<ReorderSuggestionDto[]> {
    const items = await this.prisma.item.findMany({
      where: {
        organizationId,
        deletedAt: null,
        trackInventory: true,
        reorderPoint: { not: null },
      },
      include: {
        stockLevels: true,
        vendorItems: {
          where: { isPreferred: true },
          include: { vendor: true },
        },
      },
    });

    const suggestions: ReorderSuggestionDto[] = [];

    for (const item of items) {
      const totalStock = item.stockLevels.reduce((sum: number, sl: any) => sum + sl.onHand, 0);

      if (item.reorderPoint && totalStock <= item.reorderPoint) {
        const preferredVendor = item.vendorItems[0];

        suggestions.push({
          itemId: item.id,
          itemCode: item.code,
          itemName: item.name,
          currentStock: totalStock,
          reorderPoint: item.reorderPoint,
          suggestedQty: item.reorderQty || (item.reorderPoint * 2 - totalStock),
          preferredVendorId: preferredVendor?.vendorId,
          preferredVendorName: preferredVendor?.vendor.companyName,
          vendorUnitCost: preferredVendor ? Number(preferredVendor.price) : undefined,
        });
      }
    }

    return suggestions;
  }

  // Helpers
  private async prepareOrderLines(
    organizationId: string,
    vendorId: string,
    lines: CreatePurchaseOrderLineDto[],
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

      // Get vendor pricing if available
      let unitCost = line.unitCost;
      if (!unitCost) {
        const vendorItem = await this.prisma.vendorItem.findUnique({
          where: {
            vendorId_itemId: { vendorId, itemId: line.itemId },
          },
        });
        unitCost = vendorItem ? Number(vendorItem.price) : Number(item.costPrice);
      }

      const lineTotal = line.quantity * unitCost;
      const taxPct = item.taxRate ? Number(item.taxRate.rate) : 0;
      const taxAmount = lineTotal * (taxPct / 100);

      preparedLines.push({
        itemId: item.id,
        quantity: line.quantity,
        unitCost,
        taxPct,
        taxAmount,
        lineTotal,
        notes: line.notes,
      });
    }

    return preparedLines;
  }

  private calculateTotals(lines: { lineTotal: number; taxAmount: number }[]) {
    const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
    const taxAmount = lines.reduce((sum, l) => sum + l.taxAmount, 0);
    const totalAmount = subtotal + taxAmount;

    return { subtotal, taxAmount, totalAmount };
  }

  private async recalculateOrderTotals(poId: string) {
    const lines = await this.prisma.purchaseOrderLine.findMany({
      where: { purchaseOrderId: poId },
    });

    const { subtotal, taxAmount, totalAmount } = this.calculateTotals(
      lines.map((l: any) => ({
        lineTotal: Number(l.lineTotal),
        taxAmount: Number(l.taxAmount),
      })),
    );

    await this.prisma.purchaseOrder.update({
      where: { id: poId },
      data: { subtotal, taxAmount, total: totalAmount },
    });
  }

  private toPurchaseOrderResponse(po: any): PurchaseOrderResponseDto {
    return {
      id: po.id,
      poNumber: po.orderNumber,
      vendorId: po.vendorId,
      vendorCode: po.vendor.code,
      vendorName: po.vendor.companyName,
      orderDate: po.orderDate,
      expectedDate: po.expectedDeliveryDate,
      status: po.status as PurchaseOrderStatus,
      warehouseId: po.warehouseId,
      warehouseName: po.warehouse?.name,
      subtotal: Number(po.subtotal),
      taxAmount: Number(po.taxAmount),
      totalAmount: Number(po.total),
      notes: po.notes,
      internalNotes: po.internalNotes,
      createdAt: po.createdAt,
      updatedAt: po.updatedAt,
      lines: po.lines?.map((l: any) => ({
        id: l.id,
        itemId: l.itemId,
        itemCode: l.item.code,
        itemName: l.item.name,
        quantity: l.quantity,
        quantityReceived: l.receivedQty,
        unitCost: Number(l.unitPrice),
        lineTotal: Number(l.lineTotal),
        notes: l.notes,
      })),
    };
  }

  private toPurchaseOrderSummary(po: any): PurchaseOrderSummaryDto {
    return {
      id: po.id,
      poNumber: po.orderNumber,
      vendorCode: po.vendor.code,
      vendorName: po.vendor.companyName,
      orderDate: po.orderDate,
      status: po.status as PurchaseOrderStatus,
      totalAmount: Number(po.total),
      lineCount: po._count?.lines || 0,
    };
  }

  private toGRNResponse(grn: any): GRNResponseDto {
    return {
      id: grn.id,
      grnNumber: grn.grnNumber,
      purchaseOrderId: grn.purchaseOrderId,
      poNumber: grn.purchaseOrder.orderNumber,
      vendorName: grn.purchaseOrder.vendor.companyName,
      receiveDate: grn.receiveDate,
      warehouseId: grn.warehouseId,
      warehouseName: grn.warehouse?.name,
      status: grn.status,
      notes: grn.notes,
      createdAt: grn.createdAt,
      lines: grn.lines.map((l: any) => ({
        id: l.id,
        itemId: l.itemId,
        itemCode: l.item.code,
        itemName: l.item.name,
        quantityReceived: l.receivedQty,
        binLocationId: l.binLocationId,
        binLocationCode: undefined,
      })),
    };
  }
}
