import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class CreateWarehouseDto {
  @ApiProperty({ example: 'Main Warehouse' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'WH-001' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ example: '123 Industrial Park, Shah Alam' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: '+60356781234' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ default: false, description: 'Set as primary warehouse' })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateWarehouseDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class WarehouseResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  code?: string;

  @ApiPropertyOptional()
  address?: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiProperty()
  isPrimary: boolean;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class CreateBinLocationDto {
  @ApiProperty({ example: 'A-01-01', description: 'Bin location code (e.g., Aisle-Rack-Shelf)' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ example: 'Aisle A, Rack 1, Shelf 1' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateBinLocationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class BinLocationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  warehouseId: string;

  @ApiProperty()
  code: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class WarehouseStockSummaryDto {
  @ApiProperty()
  warehouseId: string;

  @ApiProperty()
  warehouseName: string;

  @ApiProperty()
  totalItems: number;

  @ApiProperty()
  totalOnHand: number;

  @ApiProperty()
  totalCommitted: number;

  @ApiProperty()
  totalAvailable: number;

  @ApiProperty()
  totalOnOrder: number;

  @ApiProperty()
  lowStockItems: number;
}

export class StockLevelResponseDto {
  @ApiProperty()
  itemId: string;

  @ApiProperty()
  itemCode: string;

  @ApiProperty()
  itemName: string;

  @ApiProperty()
  warehouseId: string;

  @ApiProperty()
  warehouseName: string;

  @ApiPropertyOptional()
  binLocationId?: string;

  @ApiPropertyOptional()
  binLocationCode?: string;

  @ApiProperty()
  onHand: number;

  @ApiProperty()
  committed: number;

  @ApiProperty()
  available: number;

  @ApiProperty()
  onOrder: number;

  @ApiPropertyOptional()
  reorderPoint?: number;

  @ApiProperty()
  isLowStock: boolean;
}
