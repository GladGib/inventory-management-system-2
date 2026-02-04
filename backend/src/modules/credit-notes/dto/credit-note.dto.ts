import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  IsDateString,
  ValidateNested,
  ArrayMinSize,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum CreditNoteStatus {
  DRAFT = 'DRAFT',
  ISSUED = 'ISSUED',
  PARTIALLY_APPLIED = 'PARTIALLY_APPLIED',
  FULLY_APPLIED = 'FULLY_APPLIED',
  VOID = 'VOID',
}

export class CreditNoteLineDto {
  @ApiProperty({ description: 'Item ID' })
  @IsString()
  itemId: string;

  @ApiPropertyOptional({ description: 'Line description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Quantity' })
  @IsNumber()
  quantity: number;

  @ApiProperty({ description: 'Unit price' })
  @IsNumber()
  unitPrice: number;

  @ApiPropertyOptional({ description: 'Tax percentage', default: 0 })
  @IsOptional()
  @IsNumber()
  taxPct?: number;
}

export class CreateCreditNoteDto {
  @ApiProperty({ description: 'Customer ID' })
  @IsString()
  customerId: string;

  @ApiPropertyOptional({ description: 'Sales return ID' })
  @IsOptional()
  @IsString()
  salesReturnId?: string;

  @ApiPropertyOptional({ description: 'Original invoice ID' })
  @IsOptional()
  @IsString()
  invoiceId?: string;

  @ApiPropertyOptional({ description: 'Issue date' })
  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @ApiPropertyOptional({ description: 'Reason for credit note' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Credit note lines', type: [CreditNoteLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreditNoteLineDto)
  @ArrayMinSize(1)
  lines: CreditNoteLineDto[];
}

export class UpdateCreditNoteDto {
  @ApiPropertyOptional({ description: 'Reason' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ApplyCreditNoteDto {
  @ApiProperty({ description: 'Invoice ID to apply credit to' })
  @IsString()
  invoiceId: string;

  @ApiProperty({ description: 'Amount to apply' })
  @IsNumber()
  amount: number;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RefundCreditNoteDto {
  @ApiProperty({ description: 'Refund amount' })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Refund method (Cash, Cheque, Bank Transfer)' })
  @IsString()
  refundMethod: string;

  @ApiPropertyOptional({ description: 'Reference number' })
  @IsOptional()
  @IsString()
  referenceNo?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreditNoteQueryDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({ description: 'Search term' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by status', enum: CreditNoteStatus })
  @IsOptional()
  @IsEnum(CreditNoteStatus)
  status?: CreditNoteStatus;

  @ApiPropertyOptional({ description: 'Filter by customer ID' })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({ description: 'From date' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'To date' })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}

export class CreditNoteLineResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  itemId: string;

  @ApiPropertyOptional()
  itemCode?: string;

  @ApiPropertyOptional()
  itemName?: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  unitPrice: number;

  @ApiProperty()
  taxPct: number;

  @ApiProperty()
  lineTotal: number;
}

export class CreditNoteResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  creditNoteNumber: string;

  @ApiProperty()
  customerId: string;

  @ApiPropertyOptional()
  customerName?: string;

  @ApiPropertyOptional()
  salesReturnId?: string;

  @ApiPropertyOptional()
  invoiceId?: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  issueDate: Date;

  @ApiProperty()
  subtotal: number;

  @ApiProperty()
  taxAmount: number;

  @ApiProperty()
  total: number;

  @ApiProperty()
  appliedAmount: number;

  @ApiProperty()
  refundedAmount: number;

  @ApiProperty()
  balance: number;

  @ApiPropertyOptional()
  reason?: string;

  @ApiPropertyOptional()
  notes?: string;

  @ApiProperty({ type: [CreditNoteLineResponseDto] })
  lines: CreditNoteLineResponseDto[];

  @ApiProperty()
  createdAt: Date;
}
