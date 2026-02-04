import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma';
import { OrganizationsService } from '../organizations/organizations.service';
import {
  CreateStockAdjustmentDto,
  StockAdjustmentResponseDto,
  CreateStockTransferDto,
  StockTransferResponseDto,
  CreateStockCountDto,
  RecordCountDto,
  StockCountResponseDto,
  StockMovementResponseDto,
  AdjustmentType,
} from './dto';

@Injectable()
export class InventoryService {
  constructor(
    private prisma: PrismaService,
    private organizationsService: OrganizationsService,
  ) {}

  // Stock Adjustments
  async createAdjustment(
    organizationId: string,
    dto: CreateStockAdjustmentDto,
  ): Promise<StockAdjustmentResponseDto> {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: dto.warehouseId, organizationId, deletedAt: null },
    });

    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }

    const adjustmentNo = await this.organizationsService.getNextNumber(organizationId, 'ADJ');

    // Validate items and quantities
    for (const line of dto.lines) {
      const item = await this.prisma.item.findFirst({
        where: { id: line.itemId, organizationId, deletedAt: null },
      });

      if (!item) {
        throw new NotFoundException(`Item ${line.itemId} not found`);
      }

      if (['WRITE_OFF', 'DAMAGE'].includes(dto.adjustmentType)) {
        const stockLevel = await this.prisma.stockLevel.findFirst({
          where: {
            itemId: line.itemId,
            warehouseId: dto.warehouseId,
          },
        });

        if (!stockLevel || stockLevel.onHand < line.quantity) {
          throw new BadRequestException(
            `Insufficient stock for item ${item.code}`,
          );
        }
      }
    }

    const adjustment = await this.prisma.stockAdjustment.create({
      data: {
        organizationId,
        adjustmentNo,
        warehouseId: dto.warehouseId,
        type: dto.adjustmentType as any,
        adjustmentDate: dto.adjustmentDate ? new Date(dto.adjustmentDate) : new Date(),
        reason: dto.reason,
        status: 'DRAFT',
        lines: {
          create: dto.lines.map((line) => ({
            itemId: line.itemId,
            quantity: line.quantity,
            unitCost: 0,
            binLocationId: line.binLocationId,
            notes: line.notes,
          })),
        },
      },
      include: {
        warehouse: true,
        lines: {
          include: { item: true },
        },
      },
    });

    return this.toAdjustmentResponse(adjustment);
  }

  async confirmAdjustment(
    organizationId: string,
    id: string,
  ): Promise<StockAdjustmentResponseDto> {
    const adjustment = await this.prisma.stockAdjustment.findFirst({
      where: { id, organizationId },
      include: {
        lines: { include: { item: true } },
      },
    });

    if (!adjustment) {
      throw new NotFoundException('Stock adjustment not found');
    }

    if (adjustment.status !== 'DRAFT') {
      throw new BadRequestException('Adjustment already confirmed');
    }

    const isAddition = adjustment.type === 'WRITE_IN' || adjustment.type === 'OPENING_STOCK' ||
      (adjustment.type === 'COUNT_ADJUSTMENT' && adjustment.lines.some((l: any) => l.quantity > 0));

    for (const line of adjustment.lines) {
      const quantityChange = ['WRITE_OFF', 'DAMAGE'].includes(adjustment.type)
        ? -Math.abs(line.quantity)
        : line.quantity;

      // Update stock level
      const existingStock = await this.prisma.stockLevel.findFirst({
        where: {
          itemId: line.itemId,
          warehouseId: adjustment.warehouseId,
          binLocationId: line.binLocationId || null,
        },
      });

      if (existingStock) {
        await this.prisma.stockLevel.update({
          where: { id: existingStock.id },
          data: { onHand: { increment: quantityChange } },
        });
      } else {
        await this.prisma.stockLevel.create({
          data: {
            itemId: line.itemId,
            warehouseId: adjustment.warehouseId,
            binLocationId: line.binLocationId,
            onHand: Math.max(0, quantityChange),
            committed: 0,
            onOrder: 0,
          },
        });
      }

      // Create stock movement
      await this.prisma.stockMovement.create({
        data: {
          itemId: line.itemId,
          warehouseId: adjustment.warehouseId,
          movementType: 'ADJUSTMENT',
          quantity: quantityChange,
          referenceType: 'ADJUSTMENT',
          referenceId: adjustment.id,
        },
      });
    }

    const updated = await this.prisma.stockAdjustment.update({
      where: { id },
      data: { status: 'CONFIRMED', approvedAt: new Date() },
      include: {
        warehouse: true,
        lines: {
          include: { item: true },
        },
      },
    });

    return this.toAdjustmentResponse(updated);
  }

  async findAllAdjustments(
    organizationId: string,
    options?: {
      page?: number;
      limit?: number;
      warehouseId?: string;
      status?: string;
    },
  ) {
    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = { organizationId };

    if (options?.warehouseId) {
      where.warehouseId = options.warehouseId;
    }

    if (options?.status) {
      where.status = options.status;
    }

    const [adjustments, total] = await Promise.all([
      this.prisma.stockAdjustment.findMany({
        where,
        include: {
          warehouse: true,
          lines: { include: { item: true } },
        },
        skip,
        take: limit,
        orderBy: { adjustmentDate: 'desc' },
      }),
      this.prisma.stockAdjustment.count({ where }),
    ]);

    return {
      data: adjustments.map((a: any) => this.toAdjustmentResponse(a)),
      meta: { total, page, limit },
    };
  }

  // Stock Transfers
  async createTransfer(
    organizationId: string,
    dto: CreateStockTransferDto,
  ): Promise<StockTransferResponseDto> {
    if (dto.fromWarehouseId === dto.toWarehouseId) {
      throw new BadRequestException('Source and destination warehouse must be different');
    }

    const [fromWarehouse, toWarehouse] = await Promise.all([
      this.prisma.warehouse.findFirst({
        where: { id: dto.fromWarehouseId, organizationId, deletedAt: null },
      }),
      this.prisma.warehouse.findFirst({
        where: { id: dto.toWarehouseId, organizationId, deletedAt: null },
      }),
    ]);

    if (!fromWarehouse) {
      throw new NotFoundException('Source warehouse not found');
    }

    if (!toWarehouse) {
      throw new NotFoundException('Destination warehouse not found');
    }

    // Validate stock availability
    for (const line of dto.lines) {
      const stockLevel = await this.prisma.stockLevel.findFirst({
        where: {
          itemId: line.itemId,
          warehouseId: dto.fromWarehouseId,
        },
      });

      if (!stockLevel || stockLevel.onHand - stockLevel.committed < line.quantity) {
        const item = await this.prisma.item.findUnique({ where: { id: line.itemId } });
        throw new BadRequestException(
          `Insufficient available stock for item ${item?.code}`,
        );
      }
    }

    const transferNo = await this.organizationsService.getNextNumber(organizationId, 'TRF');

    const transfer = await this.prisma.stockTransfer.create({
      data: {
        organizationId,
        transferNo,
        fromWarehouseId: dto.fromWarehouseId,
        toWarehouseId: dto.toWarehouseId,
        transferDate: dto.transferDate ? new Date(dto.transferDate) : new Date(),
        status: 'DRAFT',
        notes: dto.notes,
        lines: {
          create: dto.lines.map((line) => ({
            itemId: line.itemId,
            quantity: line.quantity,
          })),
        },
      },
      include: {
        fromWarehouse: true,
        toWarehouse: true,
        lines: { include: { item: true } },
      },
    });

    return this.toTransferResponse(transfer);
  }

  async confirmTransfer(
    organizationId: string,
    id: string,
  ): Promise<StockTransferResponseDto> {
    const transfer = await this.prisma.stockTransfer.findFirst({
      where: { id, organizationId },
      include: {
        lines: { include: { item: true } },
      },
    });

    if (!transfer) {
      throw new NotFoundException('Stock transfer not found');
    }

    if (transfer.status !== 'DRAFT') {
      throw new BadRequestException('Transfer already processed');
    }

    for (const line of transfer.lines) {
      // Decrease from source
      const fromStock = await this.prisma.stockLevel.findFirst({
        where: {
          itemId: line.itemId,
          warehouseId: transfer.fromWarehouseId,
        },
      });

      if (fromStock) {
        await this.prisma.stockLevel.update({
          where: { id: fromStock.id },
          data: { onHand: { decrement: line.quantity } },
        });
      }

      // Increase at destination
      const toStock = await this.prisma.stockLevel.findFirst({
        where: {
          itemId: line.itemId,
          warehouseId: transfer.toWarehouseId,
        },
      });

      if (toStock) {
        await this.prisma.stockLevel.update({
          where: { id: toStock.id },
          data: { onHand: { increment: line.quantity } },
        });
      } else {
        await this.prisma.stockLevel.create({
          data: {
            itemId: line.itemId,
            warehouseId: transfer.toWarehouseId,
            onHand: line.quantity,
            committed: 0,
            onOrder: 0,
          },
        });
      }

      // Create movements
      await this.prisma.stockMovement.createMany({
        data: [
          {
            itemId: line.itemId,
            warehouseId: transfer.fromWarehouseId,
            movementType: 'TRANSFER_OUT',
            quantity: -line.quantity,
            referenceType: 'TRANSFER',
            referenceId: transfer.id,
          },
          {
            itemId: line.itemId,
            warehouseId: transfer.toWarehouseId,
            movementType: 'TRANSFER_IN',
            quantity: line.quantity,
            referenceType: 'TRANSFER',
            referenceId: transfer.id,
          },
        ],
      });
    }

    const updated = await this.prisma.stockTransfer.update({
      where: { id },
      data: { status: 'COMPLETED' },
      include: {
        fromWarehouse: true,
        toWarehouse: true,
        lines: { include: { item: true } },
      },
    });

    return this.toTransferResponse(updated);
  }

  // Stock Counts
  async findAllStockCounts(
    organizationId: string,
    options?: {
      page?: number;
      limit?: number;
      warehouseId?: string;
      status?: string;
    },
  ) {
    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = { organizationId };

    if (options?.warehouseId) {
      where.warehouseId = options.warehouseId;
    }

    if (options?.status) {
      where.status = options.status;
    }

    const [counts, total] = await Promise.all([
      this.prisma.stockCount.findMany({
        where,
        include: {
          warehouse: true,
          lines: { include: { item: true } },
        },
        skip,
        take: limit,
        orderBy: { countDate: 'desc' },
      }),
      this.prisma.stockCount.count({ where }),
    ]);

    return {
      data: counts.map((c: any) => this.toStockCountResponse(c)),
      meta: { total, page, limit },
    };
  }

  async findOneStockCount(
    organizationId: string,
    id: string,
  ): Promise<StockCountResponseDto> {
    const stockCount = await this.prisma.stockCount.findFirst({
      where: { id, organizationId },
      include: {
        warehouse: true,
        lines: { include: { item: true } },
      },
    });

    if (!stockCount) {
      throw new NotFoundException('Stock count not found');
    }

    return this.toStockCountResponse(stockCount);
  }

  async createStockCount(
    organizationId: string,
    dto: CreateStockCountDto,
  ): Promise<StockCountResponseDto> {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: dto.warehouseId, organizationId, deletedAt: null },
    });

    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }

    const countNo = await this.organizationsService.getNextNumber(organizationId, 'CNT');

    // Get items to count
    const stockLevelWhere: any = { warehouseId: dto.warehouseId };
    if (dto.itemIds && dto.itemIds.length > 0) {
      stockLevelWhere.itemId = { in: dto.itemIds };
    }

    const stockLevels = await this.prisma.stockLevel.findMany({
      where: stockLevelWhere,
      include: { item: true },
    });

    if (stockLevels.length === 0) {
      throw new BadRequestException('No items to count in this warehouse');
    }

    const stockCount = await this.prisma.stockCount.create({
      data: {
        organizationId,
        countNo,
        warehouseId: dto.warehouseId,
        countDate: dto.countDate ? new Date(dto.countDate) : new Date(),
        status: 'IN_PROGRESS',
        notes: dto.notes,
        lines: {
          create: stockLevels.map((sl: any) => ({
            itemId: sl.itemId,
            systemQty: sl.onHand,
          })),
        },
      },
      include: {
        warehouse: true,
        lines: { include: { item: true } },
      },
    });

    return this.toStockCountResponse(stockCount);
  }

  async recordCount(
    organizationId: string,
    countId: string,
    dto: RecordCountDto[],
  ): Promise<StockCountResponseDto> {
    const stockCount = await this.prisma.stockCount.findFirst({
      where: { id: countId, organizationId },
    });

    if (!stockCount) {
      throw new NotFoundException('Stock count not found');
    }

    if (stockCount.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Stock count not in progress');
    }

    for (const record of dto) {
      await this.prisma.stockCountLine.update({
        where: { id: record.lineId },
        data: { countedQty: record.countedQty },
      });
    }

    const updated = await this.prisma.stockCount.findUnique({
      where: { id: countId },
      include: {
        warehouse: true,
        lines: { include: { item: true } },
      },
    });

    return this.toStockCountResponse(updated);
  }

  async completeStockCount(
    organizationId: string,
    countId: string,
    createAdjustment: boolean = true,
  ): Promise<StockCountResponseDto> {
    const stockCount = await this.prisma.stockCount.findFirst({
      where: { id: countId, organizationId },
      include: {
        warehouse: true,
        lines: { include: { item: true } },
      },
    });

    if (!stockCount) {
      throw new NotFoundException('Stock count not found');
    }

    if (stockCount.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Stock count not in progress');
    }

    const unCountedLines = stockCount.lines.filter((l: any) => l.countedQty === null);
    if (unCountedLines.length > 0) {
      throw new BadRequestException('All items must be counted');
    }

    // Create adjustment for variances if requested
    if (createAdjustment) {
      const varianceLines = stockCount.lines.filter(
        (l: any) => l.countedQty !== l.systemQty,
      );

      if (varianceLines.length > 0) {
        const adjustmentNo = await this.organizationsService.getNextNumber(
          organizationId,
          'ADJ',
        );

        await this.prisma.stockAdjustment.create({
          data: {
            organizationId,
            adjustmentNo,
            warehouseId: stockCount.warehouseId,
            type: 'COUNT_ADJUSTMENT',
            adjustmentDate: new Date(),
            reason: `Stock count adjustment from ${stockCount.countNo}`,
            status: 'CONFIRMED',
            approvedAt: new Date(),
            lines: {
              create: varianceLines.map((line: any) => ({
                itemId: line.itemId,
                quantity: line.countedQty! - line.systemQty,
                unitCost: 0,
              })),
            },
          },
        });

        // Update stock levels
        for (const line of varianceLines) {
          const variance = line.countedQty! - line.systemQty;

          const existingStock = await this.prisma.stockLevel.findFirst({
            where: {
              itemId: line.itemId,
              warehouseId: stockCount.warehouseId,
            },
          });

          if (existingStock) {
            await this.prisma.stockLevel.update({
              where: { id: existingStock.id },
              data: { onHand: { increment: variance } },
            });
          }

          await this.prisma.stockMovement.create({
            data: {
              itemId: line.itemId,
              warehouseId: stockCount.warehouseId,
              movementType: 'ADJUSTMENT',
              quantity: variance,
              referenceType: 'STOCK_COUNT',
              referenceId: stockCount.id,
            },
          });
        }
      }
    }

    const updated = await this.prisma.stockCount.update({
      where: { id: countId },
      data: { status: 'COMPLETED' },
      include: {
        warehouse: true,
        lines: { include: { item: true } },
      },
    });

    return this.toStockCountResponse(updated);
  }

  // Stock Movements
  async getStockMovements(
    organizationId: string,
    options?: {
      page?: number;
      limit?: number;
      itemId?: string;
      warehouseId?: string;
      fromDate?: string;
      toDate?: string;
    },
  ) {
    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 50, 200);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (options?.itemId) {
      where.itemId = options.itemId;
    }

    if (options?.warehouseId) {
      where.warehouseId = options.warehouseId;
    }

    if (options?.fromDate) {
      where.createdAt = { ...where.createdAt, gte: new Date(options.fromDate) };
    }

    if (options?.toDate) {
      where.createdAt = { ...where.createdAt, lte: new Date(options.toDate) };
    }

    // Filter by organization through warehouse
    if (!options?.warehouseId) {
      const warehouses = await this.prisma.warehouse.findMany({
        where: { organizationId },
        select: { id: true },
      });
      where.warehouseId = { in: warehouses.map((w: any) => w.id) };
    }

    const [movements, total] = await Promise.all([
      this.prisma.stockMovement.findMany({
        where,
        include: {
          item: true,
          warehouse: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.stockMovement.count({ where }),
    ]);

    return {
      data: movements.map((m: any) => this.toMovementResponse(m)),
      meta: { total, page, limit },
    };
  }

  // Helpers
  private toAdjustmentResponse(adjustment: any): StockAdjustmentResponseDto {
    return {
      id: adjustment.id,
      adjustmentNumber: adjustment.adjustmentNo,
      warehouseId: adjustment.warehouseId,
      warehouseName: adjustment.warehouse.name,
      adjustmentType: adjustment.type as AdjustmentType,
      adjustmentDate: adjustment.adjustmentDate,
      status: adjustment.status,
      reason: adjustment.reason,
      createdAt: adjustment.createdAt,
      lines: adjustment.lines.map((l: any) => ({
        id: l.id,
        itemId: l.itemId,
        itemCode: l.item.code,
        itemName: l.item.name,
        quantity: l.quantity,
        binLocationId: l.binLocationId,
        binLocationCode: undefined,
        notes: l.notes,
      })),
    };
  }

  private toTransferResponse(transfer: any): StockTransferResponseDto {
    return {
      id: transfer.id,
      transferNumber: transfer.transferNo,
      fromWarehouseId: transfer.fromWarehouseId,
      fromWarehouseName: transfer.fromWarehouse.name,
      toWarehouseId: transfer.toWarehouseId,
      toWarehouseName: transfer.toWarehouse.name,
      transferDate: transfer.transferDate,
      status: transfer.status,
      notes: transfer.notes,
      createdAt: transfer.createdAt,
      lines: transfer.lines.map((l: any) => ({
        id: l.id,
        itemId: l.itemId,
        itemCode: l.item.code,
        itemName: l.item.name,
        quantity: l.quantity,
        fromBinLocationId: undefined,
        toBinLocationId: undefined,
      })),
    };
  }

  private toStockCountResponse(count: any): StockCountResponseDto {
    return {
      id: count.id,
      countNumber: count.countNo,
      warehouseId: count.warehouseId,
      warehouseName: count.warehouse.name,
      countDate: count.countDate,
      status: count.status,
      notes: count.notes,
      createdAt: count.createdAt,
      completedAt: undefined,
      lines: count.lines.map((l: any) => ({
        id: l.id,
        itemId: l.itemId,
        itemCode: l.item.code,
        itemName: l.item.name,
        systemQty: l.systemQty,
        countedQty: l.countedQty,
        variance: l.countedQty !== null ? l.countedQty - l.systemQty : null,
      })),
    };
  }

  private toMovementResponse(movement: any): StockMovementResponseDto {
    return {
      id: movement.id,
      itemId: movement.itemId,
      itemCode: movement.item.code,
      itemName: movement.item.name,
      warehouseId: movement.warehouseId,
      warehouseName: movement.warehouse.name,
      binLocationId: undefined,
      binLocationCode: undefined,
      movementType: movement.movementType,
      quantity: movement.quantity,
      referenceType: movement.referenceType,
      referenceId: movement.referenceId,
      createdAt: movement.createdAt,
    };
  }
}
