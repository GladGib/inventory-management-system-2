import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma';
import {
  CreateWarehouseDto,
  UpdateWarehouseDto,
  WarehouseResponseDto,
  CreateBinLocationDto,
  UpdateBinLocationDto,
  BinLocationResponseDto,
  WarehouseStockSummaryDto,
  StockLevelResponseDto,
} from './dto';

@Injectable()
export class WarehousesService {
  constructor(private prisma: PrismaService) {}

  async create(organizationId: string, dto: CreateWarehouseDto): Promise<WarehouseResponseDto> {
    // Generate code if not provided
    let code = dto.code;
    if (!code) {
      code = await this.generateWarehouseCode(organizationId);
    }

    // Check for duplicate code
    const existing = await this.prisma.warehouse.findUnique({
      where: {
        organizationId_code: { organizationId, code },
      },
    });

    if (existing) {
      throw new BadRequestException('Warehouse code already exists');
    }

    // If setting as primary, unset other primary warehouses
    if (dto.isPrimary) {
      await this.prisma.warehouse.updateMany({
        where: { organizationId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const warehouse = await this.prisma.warehouse.create({
      data: {
        organizationId,
        name: dto.name,
        code,
        address: dto.address,
        phone: dto.phone,
        isPrimary: dto.isPrimary ?? false,
        isActive: dto.isActive ?? true,
      },
    });

    return this.toWarehouseResponse(warehouse);
  }

  async findAll(
    organizationId: string,
    options?: {
      page?: number;
      limit?: number;
      search?: string;
      isActive?: boolean;
    },
  ) {
    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {
      organizationId,
      deletedAt: null,
    };

    if (options?.search) {
      where.OR = [
        { name: { contains: options.search, mode: 'insensitive' } },
        { code: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    if (options?.isActive !== undefined) {
      where.isActive = options.isActive;
    }

    const [warehouses, total] = await Promise.all([
      this.prisma.warehouse.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }],
      }),
      this.prisma.warehouse.count({ where }),
    ]);

    return {
      data: warehouses.map((w: any) => this.toWarehouseResponse(w)),
      meta: { total, page, limit },
    };
  }

  async findOne(organizationId: string, id: string): Promise<WarehouseResponseDto> {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id, organizationId, deletedAt: null },
    });

    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }

    return this.toWarehouseResponse(warehouse);
  }

  async update(
    organizationId: string,
    id: string,
    dto: UpdateWarehouseDto,
  ): Promise<WarehouseResponseDto> {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id, organizationId, deletedAt: null },
    });

    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }

    // Check for duplicate code if changing
    if (dto.code && dto.code !== warehouse.code) {
      const existing = await this.prisma.warehouse.findUnique({
        where: {
          organizationId_code: { organizationId, code: dto.code },
        },
      });

      if (existing) {
        throw new BadRequestException('Warehouse code already exists');
      }
    }

    // If setting as primary, unset other primary warehouses
    if (dto.isPrimary && !warehouse.isPrimary) {
      await this.prisma.warehouse.updateMany({
        where: { organizationId, isPrimary: true, id: { not: id } },
        data: { isPrimary: false },
      });
    }

    const updated = await this.prisma.warehouse.update({
      where: { id },
      data: dto,
    });

    return this.toWarehouseResponse(updated);
  }

  async remove(organizationId: string, id: string): Promise<void> {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id, organizationId, deletedAt: null },
    });

    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }

    // Check if warehouse has stock
    const stockCount = await this.prisma.stockLevel.count({
      where: { warehouseId: id, onHand: { gt: 0 } },
    });

    if (stockCount > 0) {
      throw new BadRequestException('Cannot delete warehouse with existing stock');
    }

    await this.prisma.warehouse.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async setPrimary(organizationId: string, id: string): Promise<WarehouseResponseDto> {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id, organizationId, deletedAt: null },
    });

    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }

    // Unset other primary warehouses
    await this.prisma.warehouse.updateMany({
      where: { organizationId, isPrimary: true },
      data: { isPrimary: false },
    });

    const updated = await this.prisma.warehouse.update({
      where: { id },
      data: { isPrimary: true },
    });

    return this.toWarehouseResponse(updated);
  }

  // Bin Locations
  async createBinLocation(
    organizationId: string,
    warehouseId: string,
    dto: CreateBinLocationDto,
  ): Promise<BinLocationResponseDto> {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: warehouseId, organizationId, deletedAt: null },
    });

    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }

    // Check for duplicate code in this warehouse
    const existing = await this.prisma.binLocation.findUnique({
      where: {
        warehouseId_code: { warehouseId, code: dto.code },
      },
    });

    if (existing) {
      throw new BadRequestException('Bin location code already exists in this warehouse');
    }

    const binLocation = await this.prisma.binLocation.create({
      data: {
        warehouseId,
        code: dto.code,
        isActive: dto.isActive ?? true,
      },
    });

    return this.toBinLocationResponse(binLocation);
  }

  async findAllBinLocations(
    organizationId: string,
    warehouseId: string,
    options?: {
      page?: number;
      limit?: number;
      isActive?: boolean;
    },
  ) {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: warehouseId, organizationId, deletedAt: null },
    });

    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }

    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 50, 200);
    const skip = (page - 1) * limit;

    const where: any = {
      warehouseId,
    };

    if (options?.isActive !== undefined) {
      where.isActive = options.isActive;
    }

    const [binLocations, total] = await Promise.all([
      this.prisma.binLocation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { code: 'asc' },
      }),
      this.prisma.binLocation.count({ where }),
    ]);

    return {
      data: binLocations.map((b: any) => this.toBinLocationResponse(b)),
      meta: { total, page, limit },
    };
  }

  async updateBinLocation(
    organizationId: string,
    warehouseId: string,
    binId: string,
    dto: UpdateBinLocationDto,
  ): Promise<BinLocationResponseDto> {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: warehouseId, organizationId, deletedAt: null },
    });

    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }

    const binLocation = await this.prisma.binLocation.findFirst({
      where: { id: binId, warehouseId },
    });

    if (!binLocation) {
      throw new NotFoundException('Bin location not found');
    }

    // Check for duplicate code if changing
    if (dto.code && dto.code !== binLocation.code) {
      const existing = await this.prisma.binLocation.findUnique({
        where: {
          warehouseId_code: { warehouseId, code: dto.code },
        },
      });

      if (existing) {
        throw new BadRequestException('Bin location code already exists in this warehouse');
      }
    }

    const updateData: any = {};
    if (dto.code !== undefined) updateData.code = dto.code;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    const updated = await this.prisma.binLocation.update({
      where: { id: binId },
      data: updateData,
    });

    return this.toBinLocationResponse(updated);
  }

  async removeBinLocation(
    organizationId: string,
    warehouseId: string,
    binId: string,
  ): Promise<void> {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: warehouseId, organizationId, deletedAt: null },
    });

    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }

    const binLocation = await this.prisma.binLocation.findFirst({
      where: { id: binId, warehouseId },
    });

    if (!binLocation) {
      throw new NotFoundException('Bin location not found');
    }

    // Check if bin has stock
    const stockCount = await this.prisma.stockLevel.count({
      where: { binLocationId: binId, onHand: { gt: 0 } },
    });

    if (stockCount > 0) {
      throw new BadRequestException('Cannot delete bin location with existing stock');
    }

    await this.prisma.binLocation.delete({
      where: { id: binId },
    });
  }

  // Stock queries
  async getStockSummary(
    organizationId: string,
    warehouseId: string,
  ): Promise<WarehouseStockSummaryDto> {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: warehouseId, organizationId, deletedAt: null },
    });

    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }

    const stockLevels = await this.prisma.stockLevel.findMany({
      where: { warehouseId },
      include: { item: true },
    });

    const summary = stockLevels.reduce(
      (acc: any, sl: any) => ({
        totalItems: acc.totalItems + 1,
        totalOnHand: acc.totalOnHand + sl.onHand,
        totalCommitted: acc.totalCommitted + sl.committed,
        totalAvailable: acc.totalAvailable + (sl.onHand - sl.committed),
        totalOnOrder: acc.totalOnOrder + sl.onOrder,
        lowStockItems:
          acc.lowStockItems +
          (sl.item.reorderPoint && sl.onHand <= sl.item.reorderPoint ? 1 : 0),
      }),
      {
        totalItems: 0,
        totalOnHand: 0,
        totalCommitted: 0,
        totalAvailable: 0,
        totalOnOrder: 0,
        lowStockItems: 0,
      },
    );

    return {
      warehouseId: warehouse.id,
      warehouseName: warehouse.name,
      ...summary,
    };
  }

  async getStockLevels(
    organizationId: string,
    warehouseId: string,
    options?: {
      page?: number;
      limit?: number;
      search?: string;
      lowStockOnly?: boolean;
      binLocationId?: string;
    },
  ) {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: warehouseId, organizationId, deletedAt: null },
    });

    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }

    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {
      warehouseId,
    };

    if (options?.binLocationId) {
      where.binLocationId = options.binLocationId;
    }

    if (options?.search) {
      where.item = {
        OR: [
          { code: { contains: options.search, mode: 'insensitive' } },
          { name: { contains: options.search, mode: 'insensitive' } },
        ],
      };
    }

    let stockLevels = await this.prisma.stockLevel.findMany({
      where,
      include: {
        item: true,
        warehouse: true,
        binLocation: true,
      },
      skip,
      take: limit,
      orderBy: { item: { name: 'asc' } },
    });

    // Filter low stock if requested
    if (options?.lowStockOnly) {
      stockLevels = stockLevels.filter(
        (sl: any) => sl.item.reorderPoint && sl.onHand <= sl.item.reorderPoint,
      );
    }

    const total = await this.prisma.stockLevel.count({ where });

    return {
      data: stockLevels.map((sl: any) => this.toStockLevelResponse(sl, warehouse)),
      meta: { total, page, limit },
    };
  }

  async getItemStockByWarehouse(
    organizationId: string,
    warehouseId: string,
    itemId: string,
  ): Promise<StockLevelResponseDto | null> {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: warehouseId, organizationId, deletedAt: null },
    });

    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }

    const stockLevel = await this.prisma.stockLevel.findFirst({
      where: {
        itemId,
        warehouseId,
        binLocationId: null,
      },
      include: {
        item: true,
        warehouse: true,
        binLocation: true,
      },
    });

    if (!stockLevel) {
      return null;
    }

    return this.toStockLevelResponse(stockLevel, warehouse);
  }

  // Helpers
  private async generateWarehouseCode(organizationId: string): Promise<string> {
    const lastWarehouse = await this.prisma.warehouse.findFirst({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });

    let nextNum = 1;
    if (lastWarehouse && lastWarehouse.code?.startsWith('WH-')) {
      const num = parseInt(lastWarehouse.code.replace('WH-', ''), 10);
      if (!isNaN(num)) {
        nextNum = num + 1;
      }
    }

    return `WH-${String(nextNum).padStart(3, '0')}`;
  }

  private toWarehouseResponse(warehouse: any): WarehouseResponseDto {
    return {
      id: warehouse.id,
      name: warehouse.name,
      code: warehouse.code,
      address: warehouse.address,
      phone: warehouse.phone,
      isPrimary: warehouse.isPrimary,
      isActive: warehouse.isActive,
      createdAt: warehouse.createdAt,
      updatedAt: warehouse.updatedAt,
    };
  }

  private toBinLocationResponse(binLocation: any): BinLocationResponseDto {
    return {
      id: binLocation.id,
      warehouseId: binLocation.warehouseId,
      code: binLocation.code,
      description: binLocation.zone || '', // BinLocation has no description field
      isActive: binLocation.isActive,
      createdAt: binLocation.createdAt,
      updatedAt: binLocation.updatedAt,
    };
  }

  private toStockLevelResponse(stockLevel: any, warehouse: any): StockLevelResponseDto {
    const available = stockLevel.onHand - stockLevel.committed;
    const isLowStock =
      stockLevel.item.reorderPoint && stockLevel.onHand <= stockLevel.item.reorderPoint;

    return {
      itemId: stockLevel.itemId,
      itemCode: stockLevel.item.code,
      itemName: stockLevel.item.name,
      warehouseId: stockLevel.warehouseId,
      warehouseName: warehouse.name,
      binLocationId: stockLevel.binLocationId,
      binLocationCode: stockLevel.binLocation?.code,
      onHand: stockLevel.onHand,
      committed: stockLevel.committed,
      available,
      onOrder: stockLevel.onOrder,
      reorderPoint: stockLevel.item.reorderPoint,
      isLowStock,
    };
  }
}
