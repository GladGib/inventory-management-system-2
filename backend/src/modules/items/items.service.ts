import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma';
import { OrganizationsService } from '../organizations/organizations.service';
import {
  CreateItemDto,
  UpdateItemDto,
  ItemResponseDto,
  ItemStockResponseDto,
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryResponseDto,
  CategoryTreeResponseDto,
} from './dto';

@Injectable()
export class ItemsService {
  constructor(
    private prisma: PrismaService,
    private organizationsService: OrganizationsService,
  ) {}

  // Items
  async create(organizationId: string, dto: CreateItemDto): Promise<ItemResponseDto> {
    // Generate code if not provided
    let code = dto.code;
    if (!code) {
      code = await this.generateItemCode(organizationId);
    }

    // Check for duplicate code
    const existing = await this.prisma.item.findUnique({
      where: {
        organizationId_code: { organizationId, code },
      },
    });

    if (existing) {
      throw new BadRequestException('Item code already exists');
    }

    // Check for duplicate barcode if provided
    if (dto.barcode) {
      const barcodeExists = await this.prisma.item.findFirst({
        where: {
          organizationId,
          barcode: dto.barcode,
          deletedAt: null,
        },
      });

      if (barcodeExists) {
        throw new BadRequestException('Barcode already assigned to another item');
      }
    }

    const item = await this.prisma.item.create({
      data: {
        organizationId,
        code,
        name: dto.name,
        description: dto.description,
        type: dto.type || 'SIMPLE',
        categoryId: dto.categoryId,
        taxRateId: dto.taxRateId,
        uom: dto.uom,
        barcode: dto.barcode,
        costPrice: dto.costPrice || 0,
        sellingPrice: dto.sellingPrice,
        wholesalePrice: dto.wholesalePrice,
        minSellingPrice: dto.minSellingPrice,
        trackInventory: dto.trackInventory ?? true,
        reorderPoint: dto.reorderPoint,
        reorderQty: dto.reorderQty,
        weight: dto.weight,
        length: dto.length,
        width: dto.width,
        height: dto.height,
        isActive: dto.isActive ?? true,
      },
      include: {
        category: true,
        taxRate: true,
      },
    });

    return this.toItemResponse(item);
  }

  async findAll(
    organizationId: string,
    options?: {
      page?: number;
      limit?: number;
      search?: string;
      categoryId?: string;
      isActive?: boolean;
      type?: string;
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
        { code: { contains: options.search, mode: 'insensitive' } },
        { name: { contains: options.search, mode: 'insensitive' } },
        { barcode: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    if (options?.categoryId) {
      where.categoryId = options.categoryId;
    }

    if (options?.isActive !== undefined) {
      where.isActive = options.isActive;
    }

    if (options?.type) {
      where.type = options.type;
    }

    const [items, total] = await Promise.all([
      this.prisma.item.findMany({
        where,
        include: { category: true, taxRate: true },
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.item.count({ where }),
    ]);

    return {
      data: items.map((item: any) => this.toItemResponse(item)),
      meta: { total, page, limit },
    };
  }

  async findOne(organizationId: string, id: string): Promise<ItemResponseDto> {
    const item = await this.prisma.item.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: { category: true, taxRate: true },
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    return this.toItemResponse(item);
  }

  async findByBarcode(organizationId: string, barcode: string): Promise<ItemResponseDto> {
    const item = await this.prisma.item.findFirst({
      where: { organizationId, barcode, deletedAt: null },
      include: { category: true, taxRate: true },
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    return this.toItemResponse(item);
  }

  async update(
    organizationId: string,
    id: string,
    dto: UpdateItemDto,
  ): Promise<ItemResponseDto> {
    const item = await this.prisma.item.findFirst({
      where: { id, organizationId, deletedAt: null },
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    // Check for duplicate barcode if changing
    if (dto.barcode && dto.barcode !== item.barcode) {
      const barcodeExists = await this.prisma.item.findFirst({
        where: {
          organizationId,
          barcode: dto.barcode,
          deletedAt: null,
          id: { not: id },
        },
      });

      if (barcodeExists) {
        throw new BadRequestException('Barcode already assigned to another item');
      }
    }

    const updated = await this.prisma.item.update({
      where: { id },
      data: dto,
      include: { category: true, taxRate: true },
    });

    return this.toItemResponse(updated);
  }

  async remove(organizationId: string, id: string): Promise<void> {
    const item = await this.prisma.item.findFirst({
      where: { id, organizationId, deletedAt: null },
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    // Soft delete
    await this.prisma.item.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async getStock(organizationId: string, id: string): Promise<ItemStockResponseDto> {
    const item = await this.prisma.item.findFirst({
      where: { id, organizationId, deletedAt: null },
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    const stockLevels = await this.prisma.stockLevel.findMany({
      where: { itemId: id },
      include: { warehouse: true },
    });

    const byWarehouse = stockLevels.map((sl: any) => ({
      warehouseId: sl.warehouseId,
      warehouseName: sl.warehouse.name,
      onHand: sl.onHand,
      committed: sl.committed,
      available: sl.onHand - sl.committed,
      onOrder: sl.onOrder,
    }));

    const totals = byWarehouse.reduce(
      (acc: any, wh: any) => ({
        onHand: acc.onHand + wh.onHand,
        committed: acc.committed + wh.committed,
        available: acc.available + wh.available,
        onOrder: acc.onOrder + wh.onOrder,
      }),
      { onHand: 0, committed: 0, available: 0, onOrder: 0 },
    );

    return {
      itemId: item.id,
      itemCode: item.code,
      itemName: item.name,
      totalOnHand: totals.onHand,
      totalCommitted: totals.committed,
      totalAvailable: totals.available,
      totalOnOrder: totals.onOrder,
      byWarehouse,
    };
  }

  // Categories
  async createCategory(
    organizationId: string,
    dto: CreateCategoryDto,
  ): Promise<CategoryResponseDto> {
    let level = 1;

    if (dto.parentId) {
      const parent = await this.prisma.category.findFirst({
        where: { id: dto.parentId, organizationId, deletedAt: null },
      });

      if (!parent) {
        throw new BadRequestException('Parent category not found');
      }

      if (parent.level >= 3) {
        throw new BadRequestException('Maximum category depth is 3 levels');
      }

      level = parent.level + 1;
    }

    const category = await this.prisma.category.create({
      data: {
        organizationId,
        name: dto.name,
        description: dto.description,
        parentId: dto.parentId,
        level,
      },
    });

    return this.toCategoryResponse(category);
  }

  async findAllCategories(
    organizationId: string,
    tree?: boolean,
  ): Promise<CategoryResponseDto[] | CategoryTreeResponseDto[]> {
    const categories = await this.prisma.category.findMany({
      where: { organizationId, deletedAt: null },
      orderBy: [{ level: 'asc' }, { name: 'asc' }],
    });

    if (tree) {
      return this.buildCategoryTree(categories);
    }

    return categories.map((c: any) => this.toCategoryResponse(c));
  }

  async updateCategory(
    organizationId: string,
    id: string,
    dto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const category = await this.prisma.category.findFirst({
      where: { id, organizationId, deletedAt: null },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const updated = await this.prisma.category.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
      },
    });

    return this.toCategoryResponse(updated);
  }

  async removeCategory(organizationId: string, id: string): Promise<void> {
    const category = await this.prisma.category.findFirst({
      where: { id, organizationId, deletedAt: null },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Check if category has children
    const childCount = await this.prisma.category.count({
      where: { parentId: id, deletedAt: null },
    });

    if (childCount > 0) {
      throw new BadRequestException('Cannot delete category with subcategories');
    }

    // Soft delete
    await this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // Helpers
  private async generateItemCode(organizationId: string): Promise<string> {
    const lastItem = await this.prisma.item.findFirst({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });

    let nextNum = 1;
    if (lastItem && lastItem.code.startsWith('ITEM-')) {
      const num = parseInt(lastItem.code.replace('ITEM-', ''), 10);
      if (!isNaN(num)) {
        nextNum = num + 1;
      }
    }

    return `ITEM-${String(nextNum).padStart(5, '0')}`;
  }

  private toItemResponse(item: any): ItemResponseDto {
    return {
      id: item.id,
      code: item.code,
      name: item.name,
      description: item.description,
      type: item.type,
      categoryId: item.categoryId,
      categoryName: item.category?.name,
      taxRateId: item.taxRateId,
      taxRateName: item.taxRate?.name,
      uom: item.uom,
      barcode: item.barcode,
      costPrice: Number(item.costPrice),
      sellingPrice: Number(item.sellingPrice),
      wholesalePrice: item.wholesalePrice ? Number(item.wholesalePrice) : undefined,
      minSellingPrice: item.minSellingPrice ? Number(item.minSellingPrice) : undefined,
      trackInventory: item.trackInventory,
      reorderPoint: item.reorderPoint,
      reorderQty: item.reorderQty,
      isActive: item.isActive,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  private toCategoryResponse(category: any): CategoryResponseDto {
    return {
      id: category.id,
      name: category.name,
      description: category.description,
      parentId: category.parentId,
      level: category.level,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }

  private buildCategoryTree(categories: any[]): CategoryTreeResponseDto[] {
    const map = new Map<string, CategoryTreeResponseDto>();
    const roots: CategoryTreeResponseDto[] = [];

    // First pass: create all nodes
    categories.forEach((c) => {
      map.set(c.id, { ...this.toCategoryResponse(c), children: [] });
    });

    // Second pass: build tree
    categories.forEach((c) => {
      const node = map.get(c.id)!;
      if (c.parentId && map.has(c.parentId)) {
        map.get(c.parentId)!.children!.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }
}
