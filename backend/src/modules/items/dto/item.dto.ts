import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsEnum,
  IsInt,
  Min,
} from 'class-validator';

export enum ItemType {
  SIMPLE = 'SIMPLE',
  VARIANT_PARENT = 'VARIANT_PARENT',
  VARIANT = 'VARIANT',
  BUNDLE = 'BUNDLE',
}

export class CreateItemDto {
  @ApiPropertyOptional({ example: 'BP-001' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ example: 'Brake Pad Set - Front' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'High quality brake pads for passenger vehicles' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ItemType, default: ItemType.SIMPLE })
  @IsOptional()
  @IsEnum(ItemType)
  type?: ItemType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  taxRateId?: string;

  @ApiProperty({ example: 'set', default: 'pcs' })
  @IsString()
  uom: string;

  @ApiPropertyOptional({ example: '4806512345678' })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiPropertyOptional({ example: 45.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  costPrice?: number;

  @ApiProperty({ example: 89.0 })
  @IsNumber()
  @Min(0)
  sellingPrice: number;

  @ApiPropertyOptional({ example: 75.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  wholesalePrice?: number;

  @ApiPropertyOptional({ example: 60.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minSellingPrice?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  trackInventory?: boolean;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  reorderPoint?: number;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @IsInt()
  @Min(0)
  reorderQty?: number;

  @ApiPropertyOptional({ example: 0.5, description: 'Weight in kg' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @ApiPropertyOptional({ example: 20, description: 'Length in cm' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  length?: number;

  @ApiPropertyOptional({ example: 15, description: 'Width in cm' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  width?: number;

  @ApiPropertyOptional({ example: 5, description: 'Height in cm' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  height?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateItemDto {
  @ApiPropertyOptional({ example: 'Brake Pad Set - Front' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  taxRateId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  costPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  sellingPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  wholesalePrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  minSellingPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  trackInventory?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  reorderPoint?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  reorderQty?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  length?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  width?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  height?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty({ enum: ItemType })
  type: ItemType;

  @ApiPropertyOptional()
  categoryId?: string;

  @ApiPropertyOptional()
  categoryName?: string;

  @ApiPropertyOptional()
  taxRateId?: string;

  @ApiPropertyOptional()
  taxRateName?: string;

  @ApiProperty()
  uom: string;

  @ApiPropertyOptional()
  barcode?: string;

  @ApiProperty()
  costPrice: number;

  @ApiProperty()
  sellingPrice: number;

  @ApiPropertyOptional()
  wholesalePrice?: number;

  @ApiPropertyOptional()
  minSellingPrice?: number;

  @ApiProperty()
  trackInventory: boolean;

  @ApiPropertyOptional()
  reorderPoint?: number;

  @ApiPropertyOptional()
  reorderQty?: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class ItemStockResponseDto {
  @ApiProperty()
  itemId: string;

  @ApiProperty()
  itemCode: string;

  @ApiProperty()
  itemName: string;

  @ApiProperty()
  totalOnHand: number;

  @ApiProperty()
  totalCommitted: number;

  @ApiProperty()
  totalAvailable: number;

  @ApiProperty()
  totalOnOrder: number;

  @ApiProperty({ type: 'array' })
  byWarehouse: {
    warehouseId: string;
    warehouseName: string;
    onHand: number;
    committed: number;
    available: number;
    onOrder: number;
  }[];
}
