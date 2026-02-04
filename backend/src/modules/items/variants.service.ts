import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma';
import {
  CreateVariantsDto,
  UpdateVariantDto,
  VariantResponseDto,
  ItemWithVariantsResponseDto,
  VariantAttributeResponseDto,
} from './dto';

@Injectable()
export class VariantsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate all variant combinations from attributes
   */
  private generateVariantCombinations(
    attributes: { name: string; values: string[] }[],
  ): { attribute: string; value: string }[][] {
    if (attributes.length === 0) return [[]];

    const [first, ...rest] = attributes;
    const restCombinations = this.generateVariantCombinations(rest);

    const combinations: { attribute: string; value: string }[][] = [];
    for (const value of first.values) {
      for (const restCombo of restCombinations) {
        combinations.push([
          { attribute: first.name, value },
          ...restCombo,
        ]);
      }
    }

    return combinations;
  }

  /**
   * Generate variant SKU from parent code and attribute values
   */
  private generateVariantSku(
    parentCode: string,
    attributeValues: { attribute: string; value: string }[],
  ): string {
    const suffix = attributeValues
      .map((av) => av.value.substring(0, 3).toUpperCase())
      .join('-');
    return `${parentCode}-${suffix}`;
  }

  /**
   * Generate variant name from parent name and attribute values
   */
  private generateVariantName(
    parentName: string,
    attributeValues: { attribute: string; value: string }[],
  ): string {
    const suffix = attributeValues.map((av) => av.value).join(' / ');
    return `${parentName} (${suffix})`;
  }

  /**
   * Create variants for an item
   */
  async createVariants(
    organizationId: string,
    itemId: string,
    dto: CreateVariantsDto,
  ): Promise<ItemWithVariantsResponseDto> {
    // Get the parent item
    const parentItem = await this.prisma.item.findFirst({
      where: { id: itemId, organizationId, deletedAt: null },
    });

    if (!parentItem) {
      throw new NotFoundException('Item not found');
    }

    if (parentItem.type === 'VARIANT') {
      throw new BadRequestException('Cannot create variants for a variant item');
    }

    // Check if item already has variants
    const existingVariants = await this.prisma.item.findMany({
      where: { parentItemId: itemId, deletedAt: null },
    });

    if (existingVariants.length > 0) {
      throw new BadRequestException(
        'Item already has variants. Delete existing variants first.',
      );
    }

    // Generate all combinations
    const combinations = this.generateVariantCombinations(dto.attributes);

    // Create variants in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Update parent item type
      await tx.item.update({
        where: { id: itemId },
        data: { type: 'VARIANT_PARENT', trackInventory: false },
      });

      // Store variant attributes
      for (let i = 0; i < dto.attributes.length; i++) {
        const attr = dto.attributes[i];
        await tx.itemVariantAttribute.create({
          data: {
            itemId,
            name: attr.name,
            values: attr.values,
            sortOrder: i,
          },
        });
      }

      // Create variant items
      const createdVariants: any[] = [];
      for (const combo of combinations) {
        const code = this.generateVariantSku(parentItem.code, combo);
        const name = this.generateVariantName(parentItem.name, combo);

        // Check for duplicate code
        const existing = await tx.item.findFirst({
          where: { organizationId, code, deletedAt: null },
        });

        if (existing) {
          throw new BadRequestException(`Variant code ${code} already exists`);
        }

        const variant = await tx.item.create({
          data: {
            organizationId,
            code,
            name,
            type: 'VARIANT',
            parentItemId: itemId,
            categoryId: parentItem.categoryId,
            taxRateId: parentItem.taxRateId,
            uom: parentItem.uom,
            costPrice: dto.basePrice || parentItem.costPrice,
            sellingPrice: dto.basePrice || parentItem.sellingPrice,
            wholesalePrice: parentItem.wholesalePrice,
            trackInventory: true,
            isActive: true,
          },
        });

        // Store variant attribute values
        for (const av of combo) {
          await tx.itemVariantValue.create({
            data: {
              itemId: variant.id,
              attribute: av.attribute,
              value: av.value,
            },
          });
        }

        createdVariants.push({
          ...variant,
          attributes: combo,
        });
      }

      return createdVariants;
    });

    return this.getItemWithVariants(organizationId, itemId);
  }

  /**
   * Get item with all its variants
   */
  async getItemWithVariants(
    organizationId: string,
    itemId: string,
  ): Promise<ItemWithVariantsResponseDto> {
    const item = await this.prisma.item.findFirst({
      where: { id: itemId, organizationId, deletedAt: null },
      include: {
        variants: {
          where: { deletedAt: null },
          include: {
            stockLevels: true,
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    // Get variant attributes
    const attributes = await this.prisma.itemVariantAttribute.findMany({
      where: { itemId },
      orderBy: { sortOrder: 'asc' },
    });

    // Get variant values for each variant
    const variantIds = item.variants.map((v) => v.id);
    const variantValues = await this.prisma.itemVariantValue.findMany({
      where: { itemId: { in: variantIds } },
    });

    const variantValueMap = new Map<string, { attribute: string; value: string }[]>();
    for (const vv of variantValues) {
      if (!variantValueMap.has(vv.itemId)) {
        variantValueMap.set(vv.itemId, []);
      }
      variantValueMap.get(vv.itemId)!.push({
        attribute: vv.attribute,
        value: vv.value,
      });
    }

    const variants: VariantResponseDto[] = item.variants.map((v) => ({
      id: v.id,
      code: v.code,
      name: v.name,
      barcode: v.barcode || undefined,
      costPrice: Number(v.costPrice),
      sellingPrice: Number(v.sellingPrice),
      isActive: v.isActive,
      attributes: variantValueMap.get(v.id) || [],
      stockOnHand: v.stockLevels.reduce((sum, sl) => sum + sl.onHand, 0),
    }));

    const totalStock = variants.reduce((sum, v) => sum + v.stockOnHand, 0);

    return {
      id: item.id,
      code: item.code,
      name: item.name,
      type: item.type,
      variantAttributes: attributes.map((a) => ({
        name: a.name,
        values: a.values,
      })),
      variants,
      totalStock,
    };
  }

  /**
   * Update a specific variant
   */
  async updateVariant(
    organizationId: string,
    variantId: string,
    dto: UpdateVariantDto,
  ): Promise<VariantResponseDto> {
    const variant = await this.prisma.item.findFirst({
      where: {
        id: variantId,
        organizationId,
        type: 'VARIANT',
        deletedAt: null,
      },
      include: { stockLevels: true },
    });

    if (!variant) {
      throw new NotFoundException('Variant not found');
    }

    // Check for duplicate code if updating
    if (dto.code && dto.code !== variant.code) {
      const existing = await this.prisma.item.findFirst({
        where: {
          organizationId,
          code: dto.code,
          id: { not: variantId },
          deletedAt: null,
        },
      });

      if (existing) {
        throw new BadRequestException('Item code already exists');
      }
    }

    // Check for duplicate barcode if updating
    if (dto.barcode && dto.barcode !== variant.barcode) {
      const existing = await this.prisma.item.findFirst({
        where: {
          organizationId,
          barcode: dto.barcode,
          id: { not: variantId },
          deletedAt: null,
        },
      });

      if (existing) {
        throw new BadRequestException('Barcode already assigned');
      }
    }

    const updated = await this.prisma.item.update({
      where: { id: variantId },
      data: {
        code: dto.code,
        barcode: dto.barcode,
        costPrice: dto.costPrice,
        sellingPrice: dto.sellingPrice,
        isActive: dto.isActive,
      },
      include: { stockLevels: true },
    });

    // Get variant values
    const values = await this.prisma.itemVariantValue.findMany({
      where: { itemId: variantId },
    });

    return {
      id: updated.id,
      code: updated.code,
      name: updated.name,
      barcode: updated.barcode || undefined,
      costPrice: Number(updated.costPrice),
      sellingPrice: Number(updated.sellingPrice),
      isActive: updated.isActive,
      attributes: values.map((v) => ({ attribute: v.attribute, value: v.value })),
      stockOnHand: updated.stockLevels.reduce((sum, sl) => sum + sl.onHand, 0),
    };
  }

  /**
   * Delete all variants for an item
   */
  async deleteVariants(
    organizationId: string,
    itemId: string,
  ): Promise<{ message: string; deletedCount: number }> {
    const item = await this.prisma.item.findFirst({
      where: { id: itemId, organizationId, deletedAt: null },
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    if (item.type !== 'VARIANT_PARENT') {
      throw new BadRequestException('Item does not have variants');
    }

    // Check if any variants have stock
    const variantsWithStock = await this.prisma.item.findMany({
      where: {
        parentItemId: itemId,
        deletedAt: null,
        stockLevels: {
          some: {
            onHand: { gt: 0 },
          },
        },
      },
    });

    if (variantsWithStock.length > 0) {
      throw new BadRequestException(
        'Cannot delete variants with stock. Adjust stock to zero first.',
      );
    }

    // Soft delete variants and cleanup
    const result = await this.prisma.$transaction(async (tx) => {
      // Soft delete variants
      const deleteResult = await tx.item.updateMany({
        where: { parentItemId: itemId, deletedAt: null },
        data: { deletedAt: new Date() },
      });

      // Delete variant attributes
      await tx.itemVariantAttribute.deleteMany({
        where: { itemId },
      });

      // Reset parent item type
      await tx.item.update({
        where: { id: itemId },
        data: { type: 'SIMPLE', trackInventory: true },
      });

      return deleteResult.count;
    });

    return {
      message: 'Variants deleted successfully',
      deletedCount: result,
    };
  }

  /**
   * Bulk update variant prices
   */
  async bulkUpdatePrices(
    organizationId: string,
    itemId: string,
    updates: { variantId: string; costPrice?: number; sellingPrice?: number }[],
  ): Promise<{ updated: number }> {
    // Verify item exists and has variants
    const item = await this.prisma.item.findFirst({
      where: { id: itemId, organizationId, type: 'VARIANT_PARENT', deletedAt: null },
    });

    if (!item) {
      throw new NotFoundException('Item not found or has no variants');
    }

    let updatedCount = 0;

    for (const update of updates) {
      const variant = await this.prisma.item.findFirst({
        where: {
          id: update.variantId,
          parentItemId: itemId,
          deletedAt: null,
        },
      });

      if (variant) {
        await this.prisma.item.update({
          where: { id: update.variantId },
          data: {
            costPrice: update.costPrice ?? variant.costPrice,
            sellingPrice: update.sellingPrice ?? variant.sellingPrice,
          },
        });
        updatedCount++;
      }
    }

    return { updated: updatedCount };
  }
}
