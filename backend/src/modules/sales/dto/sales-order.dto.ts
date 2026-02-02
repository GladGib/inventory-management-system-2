import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsEnum,
  IsDateString,
  ValidateNested,
  Min,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum SalesOrderStatus {
  DRAFT = 'DRAFT',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  READY_TO_SHIP = 'READY_TO_SHIP',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export class CreateSalesOrderLineDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  itemId: string;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ description: 'Override selling price' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;

  @ApiPropertyOptional({ example: 5, description: 'Discount percentage' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountPercent?: number;

  @ApiPropertyOptional({ example: 10, description: 'Fixed discount amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateSalesOrderLineDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountPercent?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateSalesOrderDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @ApiPropertyOptional({ description: 'Auto-generated if not provided' })
  @IsOptional()
  @IsString()
  orderNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  orderDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expectedDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  warehouseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shippingAddressId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  billingAddressId?: string;

  @ApiPropertyOptional({ example: 5, description: 'Order-level discount percentage' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountPercent?: number;

  @ApiPropertyOptional({ example: 50, description: 'Order-level fixed discount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  internalNotes?: string;

  @ApiProperty({ type: [CreateSalesOrderLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSalesOrderLineDto)
  lines: CreateSalesOrderLineDto[];
}

export class UpdateSalesOrderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expectedDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  warehouseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shippingAddressId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  billingAddressId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountPercent?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  internalNotes?: string;
}

export class SalesOrderLineResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  itemId: string;

  @ApiProperty()
  itemCode: string;

  @ApiProperty()
  itemName: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  quantityPicked: number;

  @ApiProperty()
  quantityShipped: number;

  @ApiProperty()
  unitPrice: number;

  @ApiPropertyOptional()
  discountPercent?: number;

  @ApiPropertyOptional()
  discountAmount?: number;

  @ApiProperty()
  lineTotal: number;

  @ApiProperty()
  taxAmount: number;

  @ApiPropertyOptional()
  notes?: string;
}

export class SalesOrderResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  orderNumber: string;

  @ApiProperty()
  customerId: string;

  @ApiProperty()
  customerCode: string;

  @ApiProperty()
  customerName: string;

  @ApiProperty()
  orderDate: Date;

  @ApiPropertyOptional()
  expectedDate?: Date;

  @ApiProperty({ enum: SalesOrderStatus })
  status: SalesOrderStatus;

  @ApiPropertyOptional()
  warehouseId?: string;

  @ApiPropertyOptional()
  warehouseName?: string;

  @ApiPropertyOptional()
  shippingAddressId?: string;

  @ApiPropertyOptional()
  billingAddressId?: string;

  @ApiProperty()
  subtotal: number;

  @ApiPropertyOptional()
  discountPercent?: number;

  @ApiPropertyOptional()
  discountAmount?: number;

  @ApiProperty()
  taxAmount: number;

  @ApiProperty()
  totalAmount: number;

  @ApiPropertyOptional()
  notes?: string;

  @ApiPropertyOptional()
  internalNotes?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ type: [SalesOrderLineResponseDto] })
  lines?: SalesOrderLineResponseDto[];
}

export class SalesOrderSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  orderNumber: string;

  @ApiProperty()
  customerCode: string;

  @ApiProperty()
  customerName: string;

  @ApiProperty()
  orderDate: Date;

  @ApiProperty({ enum: SalesOrderStatus })
  status: SalesOrderStatus;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty()
  lineCount: number;
}

export class ConfirmOrderDto {
  @ApiPropertyOptional({ description: 'Warehouse to allocate stock from' })
  @IsOptional()
  @IsString()
  warehouseId?: string;
}

export class CreatePickListDto {
  @ApiPropertyOptional({ description: 'Specific lines to pick (all if not specified)' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  lineIds?: string[];
}

export class PickListLineDto {
  @ApiProperty()
  lineId: string;

  @ApiProperty()
  quantityPicked: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  binLocationId?: string;
}

export class ProcessPickListDto {
  @ApiProperty({ type: [PickListLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PickListLineDto)
  lines: PickListLineDto[];
}

export class PickListResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  pickListNumber: string;

  @ApiProperty()
  salesOrderId: string;

  @ApiProperty()
  salesOrderNumber: string;

  @ApiProperty()
  status: string;

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
    quantityToPick: number;
    quantityPicked: number;
    binLocationId?: string;
    binLocationCode?: string;
  }[];
}
