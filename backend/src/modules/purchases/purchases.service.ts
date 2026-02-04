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
  CreateDirectGRNDto,
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

  async getOrderForPdf(organizationId: string, id: string) {
    const po = await this.prisma.purchaseOrder.findFirst({
      where: { id, organizationId },
      include: {
        organization: true,
        vendor: true,
        warehouse: true,
        lines: { include: { item: true } },
      },
    });

    if (!po) {
      throw new NotFoundException('Purchase order not found');
    }

    return {
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
      warehouse: po.warehouse
        ? { name: po.warehouse.name }
        : undefined,
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
  }

  async getGRNForPdf(organizationId: string, id: string) {
    const grn = await this.prisma.goodsReceivedNote.findFirst({
      where: { id, organizationId },
      include: {
        organization: true,
        purchaseOrder: true,
        vendor: true,
        warehouse: true,
        lines: {
          include: {
            item: true,
          },
        },
      },
    });

    if (!grn) {
      throw new NotFoundException('Goods received note not found');
    }

    return {
      grnNumber: grn.grnNumber,
      poNumber: grn.purchaseOrder?.orderNumber || undefined,
      receiveDate: grn.receiveDate,
      organization: {
        name: grn.organization.name,
      },
      vendor: {
        companyName: grn.vendor.companyName,
      },
      warehouse: {
        name: grn.warehouse?.name || '',
      },
      lines: grn.lines.map((line: any) => ({
        itemCode: line.item.code,
        itemName: line.item.name,
        orderedQty: line.orderedQty || undefined,
        receivedQty: line.receivedQty,
        binLocationId: line.binLocationId || undefined,
      })),
      notes: grn.notes || undefined,
    };
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
        vendor: true,
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

  // Direct GRN (without PO)
  async createDirectGRN(
    organizationId: string,
    dto: CreateDirectGRNDto,
  ): Promise<GRNResponseDto> {
    // Validate vendor exists
    const vendor = await this.prisma.vendor.findFirst({
      where: { id: dto.vendorId, organizationId, deletedAt: null },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    // Validate warehouse exists
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: dto.warehouseId, organizationId, deletedAt: null },
    });

    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }

    // Validate items and resolve bin locations
    const itemIds = dto.lines.map((l) => l.itemId);
    const items = await this.prisma.item.findMany({
      where: { id: { in: itemIds }, organizationId },
    });

    if (items.length !== itemIds.length) {
      throw new BadRequestException('One or more items not found');
    }

    const itemMap = new Map(items.map((i) => [i.id, i]));

    // Resolve bin location codes to IDs
    const resolvedLines: any[] = [];
    for (const line of dto.lines) {
      let binLocationId = line.binLocationId;

      // If bin code provided instead of ID, resolve it
      if (!binLocationId && line.binLocationCode) {
        const binLocation = await this.prisma.binLocation.findFirst({
          where: {
            warehouseId: dto.warehouseId,
            code: line.binLocationCode,
          },
        });

        if (!binLocation) {
          throw new BadRequestException(
            `Bin location '${line.binLocationCode}' not found in warehouse`,
          );
        }
        binLocationId = binLocation.id;
      }

      // Validate bin location belongs to warehouse if provided
      if (binLocationId) {
        const binLocation = await this.prisma.binLocation.findFirst({
          where: { id: binLocationId, warehouseId: dto.warehouseId },
        });

        if (!binLocation) {
          throw new BadRequestException('Bin location not found in specified warehouse');
        }
      }

      const item = itemMap.get(line.itemId);
      resolvedLines.push({
        itemId: line.itemId,
        receivedQty: line.quantityReceived,
        unitPrice: line.unitCost,
        binLocationId,
        notes: line.notes,
        item,
      });
    }

    const grnNumber = await this.organizationsService.getNextNumber(organizationId, 'GRN');

    const grn = await this.prisma.goodsReceivedNote.create({
      data: {
        organizationId,
        grnNumber,
        purchaseOrderId: null, // No PO
        vendorId: dto.vendorId,
        warehouseId: dto.warehouseId,
        receiveDate: dto.receiveDate ? new Date(dto.receiveDate) : new Date(),
        status: 'CONFIRMED',
        notes: dto.notes,
        lines: {
          create: resolvedLines.map((line) => ({
            itemId: line.itemId,
            orderedQty: 0, // No ordered qty for direct GRN
            receivedQty: line.receivedQty,
            unitPrice: line.unitPrice,
            binLocationId: line.binLocationId,
          })),
        },
      },
      include: {
        purchaseOrder: { include: { vendor: true } },
        vendor: true,
        warehouse: true,
        lines: {
          include: {
            item: true,
          },
        },
      },
    });

    // Update stock levels for each line
    for (const line of resolvedLines) {
      if (line.item?.trackInventory) {
        const existingStock = await this.prisma.stockLevel.findFirst({
          where: {
            itemId: line.itemId,
            warehouseId: dto.warehouseId,
            binLocationId: line.binLocationId || null,
          },
        });

        if (existingStock) {
          await this.prisma.stockLevel.update({
            where: { id: existingStock.id },
            data: {
              onHand: { increment: line.receivedQty },
            },
          });
        } else {
          await this.prisma.stockLevel.create({
            data: {
              itemId: line.itemId,
              warehouseId: dto.warehouseId,
              binLocationId: line.binLocationId,
              onHand: line.receivedQty,
              committed: 0,
              onOrder: 0,
            },
          });
        }

        // Create stock movement
        await this.prisma.stockMovement.create({
          data: {
            itemId: line.itemId,
            warehouseId: dto.warehouseId,
            movementType: 'IN',
            quantity: line.receivedQty,
            referenceType: 'GRN',
            referenceId: grn.id,
            notes: dto.vendorInvoiceNo ? `Vendor Invoice: ${dto.vendorInvoiceNo}` : undefined,
          },
        });
      }
    }

    return this.toGRNResponse(grn);
  }

  // GRN Listing
  async findAllGRNs(
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
        { grnNumber: { contains: options.search, mode: 'insensitive' } },
        { purchaseOrder: { orderNumber: { contains: options.search, mode: 'insensitive' } } },
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
      where.receiveDate = { ...where.receiveDate, gte: new Date(options.fromDate) };
    }

    if (options?.toDate) {
      where.receiveDate = { ...where.receiveDate, lte: new Date(options.toDate) };
    }

    const [grns, total] = await Promise.all([
      this.prisma.goodsReceivedNote.findMany({
        where,
        include: {
          purchaseOrder: { select: { orderNumber: true } },
          vendor: { select: { code: true, companyName: true } },
          warehouse: { select: { name: true } },
          _count: { select: { lines: true } },
        },
        skip,
        take: limit,
        orderBy: { receiveDate: 'desc' },
      }),
      this.prisma.goodsReceivedNote.count({ where }),
    ]);

    return {
      data: grns.map((grn: any) => ({
        id: grn.id,
        grnNumber: grn.grnNumber,
        purchaseOrderId: grn.purchaseOrderId,
        poNumber: grn.purchaseOrder?.orderNumber,
        vendorId: grn.vendorId,
        vendorCode: grn.vendor.code,
        vendorName: grn.vendor.companyName,
        warehouseId: grn.warehouseId,
        warehouseName: grn.warehouse?.name,
        receiveDate: grn.receiveDate,
        status: grn.status,
        lineCount: grn._count?.lines || 0,
        createdAt: grn.createdAt,
      })),
      meta: { total, page, limit },
    };
  }

  async findOneGRN(organizationId: string, id: string): Promise<GRNResponseDto> {
    const grn = await this.prisma.goodsReceivedNote.findFirst({
      where: { id, organizationId },
      include: {
        purchaseOrder: {
          include: {
            vendor: true,
            lines: { include: { item: true } },
          },
        },
        vendor: true,
        warehouse: true,
        lines: {
          include: {
            item: true,
          },
        },
      },
    });

    if (!grn) {
      throw new NotFoundException('Goods received note not found');
    }

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
      purchaseOrderId: grn.purchaseOrderId || undefined,
      poNumber: grn.purchaseOrder?.orderNumber || undefined,
      vendorId: grn.vendorId,
      vendorName: grn.purchaseOrder?.vendor?.companyName || grn.vendor?.companyName,
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
        binLocationCode: undefined, // binLocation relation not defined in schema
      })),
    };
  }
}
