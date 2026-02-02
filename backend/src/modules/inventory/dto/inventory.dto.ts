import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsDateString,
  IsEnum,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum AdjustmentType {
  ADD = 'ADD',
  SUBTRACT = 'SUBTRACT',
  DAMAGE = 'DAMAGE',
  THEFT = 'THEFT',
  CORRECTION = 'CORRECTION',
  OTHER = 'OTHER',
}

export class CreateAdjustmentLineDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  itemId: string;

  @ApiProperty()
  @IsNumber()
  quantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  binLocationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateStockAdjustmentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  warehouseId: string;

  @ApiProperty({ enum: AdjustmentType })
  @IsEnum(AdjustmentType)
  adjustmentType: AdjustmentType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  adjustmentDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ type: [CreateAdjustmentLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAdjustmentLineDto)
  lines: CreateAdjustmentLineDto[];
}

export class StockAdjustmentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  adjustmentNumber: string;

  @ApiProperty()
  warehouseId: string;

  @ApiProperty()
  warehouseName: string;

  @ApiProperty({ enum: AdjustmentType })
  adjustmentType: AdjustmentType;

  @ApiProperty()
  adjustmentDate: Date;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  reason?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ type: 'array' })
  lines: {
    id: string;
    itemId: string;
    itemCode: string;
    itemName: string;
    quantity: number;
    binLocationId?: string;
    binLocationCode?: string;
    notes?: string;
  }[];
}

export class CreateStockTransferDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fromWarehouseId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  toWarehouseId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  transferDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: 'array' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransferLineDto)
  lines: TransferLineDto[];
}

export class TransferLineDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  itemId: string;

  @ApiProperty()
  @IsNumber()
  quantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  fromBinLocationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  toBinLocationId?: string;
}

export class StockTransferResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  transferNumber: string;

  @ApiProperty()
  fromWarehouseId: string;

  @ApiProperty()
  fromWarehouseName: string;

  @ApiProperty()
  toWarehouseId: string;

  @ApiProperty()
  toWarehouseName: string;

  @ApiProperty()
  transferDate: Date;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  notes?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ type: 'array' })
  lines: {
    id: string;
    itemId: string;
    itemCode: string;
    itemName: string;
    quantity: number;
    fromBinLocationId?: string;
    toBinLocationId?: string;
  }[];
}

export class CreateStockCountDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  warehouseId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  countDate?: string;

  @ApiPropertyOptional({ description: 'Leave empty for full count' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  itemIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RecordCountDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  lineId: string;

  @ApiProperty()
  @IsNumber()
  countedQty: number;
}

export class StockCountResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  countNumber: string;

  @ApiProperty()
  warehouseId: string;

  @ApiProperty()
  warehouseName: string;

  @ApiProperty()
  countDate: Date;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  notes?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  completedAt?: Date;

  @ApiProperty({ type: 'array' })
  lines: {
    id: string;
    itemId: string;
    itemCode: string;
    itemName: string;
    systemQty: number;
    countedQty: number | null;
    variance: number | null;
  }[];
}

export class StockMovementResponseDto {
  @ApiProperty()
  id: string;

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
  movementType: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  referenceType: string;

  @ApiProperty()
  referenceId: string;

  @ApiProperty()
  createdAt: Date;
}
