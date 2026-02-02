import { IsString, IsOptional, IsArray, ValidateNested, IsNumber, IsEnum, IsNotEmpty, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ReturnReason {
  DEFECTIVE = 'DEFECTIVE',
  WRONG_ITEM = 'WRONG_ITEM',
  DAMAGED = 'DAMAGED',
  NOT_AS_DESCRIBED = 'NOT_AS_DESCRIBED',
  CUSTOMER_CHANGED_MIND = 'CUSTOMER_CHANGED_MIND',
  OTHER = 'OTHER',
}

export enum ReturnStatus {
  DRAFT = 'DRAFT',
  PENDING_INSPECTION = 'PENDING_INSPECTION',
  APPROVED = 'APPROVED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export class CreateSalesReturnItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  itemId: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(ReturnReason)
  reason?: ReturnReason;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateSalesReturnDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  invoiceId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  returnDate?: string;

  @ApiPropertyOptional({ enum: ReturnReason })
  @IsOptional()
  @IsEnum(ReturnReason)
  reason?: ReturnReason;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [CreateSalesReturnItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSalesReturnItemDto)
  items: CreateSalesReturnItemDto[];
}

export class UpdateSalesReturnDto {
  @ApiPropertyOptional({ enum: ReturnReason })
  @IsOptional()
  @IsEnum(ReturnReason)
  reason?: ReturnReason;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ReceiveReturnDto {
  @ApiProperty({ type: [Object] })
  @IsArray()
  items: {
    itemId: string;
    receivedQuantity: number;
    condition?: string;
    restockable?: boolean;
  }[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  warehouseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ProcessRefundDto {
  @ApiProperty()
  @IsNumber()
  @Min(0)
  refundAmount: number;

  @ApiProperty()
  @IsString()
  refundMethod: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class SalesReturnQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ReturnStatus })
  @IsOptional()
  @IsEnum(ReturnStatus)
  status?: ReturnStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  customerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fromDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  toDate?: string;
}
