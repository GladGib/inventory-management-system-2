import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsDateString,
  ValidateNested,
  Min,
  IsNotEmpty,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum PurchaseOrderStatus {
  DRAFT = 'DRAFT',
  ISSUED = 'ISSUED',
  CONFIRMED = 'CONFIRMED',
  PARTIALLY_RECEIVED = 'PARTIALLY_RECEIVED',
  RECEIVED = 'RECEIVED',
  BILLED = 'BILLED',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
}

export class CreatePurchaseOrderLineDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  itemId: string;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ description: 'Override unit cost' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitCost?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdatePurchaseOrderLineDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitCost?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreatePurchaseOrderDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  vendorId: string;

  @ApiPropertyOptional({ description: 'Auto-generated if not provided' })
  @IsOptional()
  @IsString()
  poNumber?: string;

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
  @IsNotEmpty()
  warehouseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  internalNotes?: string;

  @ApiProperty({ type: [CreatePurchaseOrderLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseOrderLineDto)
  lines: CreatePurchaseOrderLineDto[];
}

export class UpdatePurchaseOrderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expectedDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  warehouseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  internalNotes?: string;
}

export class PurchaseOrderLineResponseDto {
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
  quantityReceived: number;

  @ApiProperty()
  unitCost: number;

  @ApiProperty()
  lineTotal: number;

  @ApiPropertyOptional()
  notes?: string;
}

export class PurchaseOrderResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  poNumber: string;

  @ApiProperty()
  vendorId: string;

  @ApiProperty()
  vendorCode: string;

  @ApiProperty()
  vendorName: string;

  @ApiProperty()
  orderDate: Date;

  @ApiPropertyOptional()
  expectedDate?: Date;

  @ApiProperty({ enum: PurchaseOrderStatus })
  status: PurchaseOrderStatus;

  @ApiPropertyOptional()
  warehouseId?: string;

  @ApiPropertyOptional()
  warehouseName?: string;

  @ApiProperty()
  subtotal: number;

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

  @ApiPropertyOptional({ type: [PurchaseOrderLineResponseDto] })
  lines?: PurchaseOrderLineResponseDto[];
}

export class PurchaseOrderSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  poNumber: string;

  @ApiProperty()
  vendorCode: string;

  @ApiProperty()
  vendorName: string;

  @ApiProperty()
  orderDate: Date;

  @ApiProperty({ enum: PurchaseOrderStatus })
  status: PurchaseOrderStatus;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty()
  lineCount: number;
}

export class CreateGRNDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  receiveDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  warehouseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: 'array' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GRNLineDto)
  lines: GRNLineDto[];
}

export class GRNLineDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  poLineId: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  quantityReceived: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  binLocationId?: string;
}

export class GRNResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  grnNumber: string;

  @ApiPropertyOptional({ description: 'Purchase order ID (null for direct GRN)' })
  purchaseOrderId?: string;

  @ApiPropertyOptional({ description: 'Purchase order number (null for direct GRN)' })
  poNumber?: string;

  @ApiPropertyOptional()
  vendorId?: string;

  @ApiProperty()
  vendorName: string;

  @ApiProperty()
  receiveDate: Date;

  @ApiPropertyOptional()
  warehouseId?: string;

  @ApiPropertyOptional()
  warehouseName?: string;

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
    quantityReceived: number;
    binLocationId?: string;
    binLocationCode?: string;
  }[];
}

export class ReorderSuggestionDto {
  @ApiProperty()
  itemId: string;

  @ApiProperty()
  itemCode: string;

  @ApiProperty()
  itemName: string;

  @ApiProperty()
  currentStock: number;

  @ApiProperty()
  reorderPoint: number;

  @ApiProperty()
  suggestedQty: number;

  @ApiPropertyOptional()
  preferredVendorId?: string;

  @ApiPropertyOptional()
  preferredVendorName?: string;

  @ApiPropertyOptional()
  vendorUnitCost?: number;
}

// Direct GRN (without PO) DTOs
export class DirectGRNLineDto {
  @ApiProperty({ description: 'Item ID' })
  @IsString()
  @IsNotEmpty()
  itemId: string;

  @ApiProperty({ description: 'Quantity received' })
  @IsNumber()
  @Min(1)
  quantityReceived: number;

  @ApiProperty({ description: 'Unit cost' })
  @IsNumber()
  @Min(0)
  unitCost: number;

  @ApiPropertyOptional({ description: 'Bin location ID' })
  @IsOptional()
  @IsString()
  binLocationId?: string;

  @ApiPropertyOptional({ description: 'Bin location code (alternative to ID)' })
  @IsOptional()
  @IsString()
  binLocationCode?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateDirectGRNDto {
  @ApiProperty({ description: 'Vendor ID' })
  @IsString()
  @IsNotEmpty()
  vendorId: string;

  @ApiProperty({ description: 'Warehouse ID' })
  @IsString()
  @IsNotEmpty()
  warehouseId: string;

  @ApiPropertyOptional({ description: 'Receive date' })
  @IsOptional()
  @IsDateString()
  receiveDate?: string;

  @ApiPropertyOptional({ description: 'Vendor invoice number' })
  @IsOptional()
  @IsString()
  vendorInvoiceNo?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [DirectGRNLineDto], description: 'Items received' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DirectGRNLineDto)
  @ArrayMinSize(1)
  lines: DirectGRNLineDto[];
}
