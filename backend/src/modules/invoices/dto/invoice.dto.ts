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

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  VOIDED = 'VOIDED',
}

export class CreateInvoiceLineDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  itemId: string;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @Min(1)
  quantity: number;

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
  description?: string;
}

export class CreateInvoiceFromOrderDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  salesOrderId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  invoiceDate?: string;

  @ApiPropertyOptional({ description: 'Override payment terms (days)' })
  @IsOptional()
  @IsNumber()
  paymentTerms?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateDirectInvoiceDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  invoiceDate?: string;

  @ApiPropertyOptional({ description: 'Payment terms in days' })
  @IsOptional()
  @IsNumber()
  paymentTerms?: number;

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

  @ApiProperty({ type: [CreateInvoiceLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceLineDto)
  lines: CreateInvoiceLineDto[];
}

export class RecordPaymentDto {
  @ApiProperty({ example: 1000.00 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  paymentDate?: string;

  @ApiProperty({ example: 'BANK_TRANSFER', enum: ['CASH', 'BANK_TRANSFER', 'CHEQUE', 'CREDIT_CARD', 'OTHER'] })
  @IsString()
  paymentMethod: string;

  @ApiPropertyOptional({ example: 'TRF-123456' })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class InvoiceLineResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  itemId: string;

  @ApiProperty()
  itemCode: string;

  @ApiProperty()
  itemName: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  quantity: number;

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
}

export class InvoiceResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  invoiceNumber: string;

  @ApiProperty()
  customerId: string;

  @ApiProperty()
  customerCode: string;

  @ApiProperty()
  customerName: string;

  @ApiPropertyOptional()
  salesOrderId?: string;

  @ApiPropertyOptional()
  salesOrderNumber?: string;

  @ApiProperty()
  invoiceDate: Date;

  @ApiProperty()
  dueDate: Date;

  @ApiProperty({ enum: InvoiceStatus })
  status: InvoiceStatus;

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

  @ApiProperty()
  amountPaid: number;

  @ApiProperty()
  balanceDue: number;

  @ApiPropertyOptional()
  notes?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ type: [InvoiceLineResponseDto] })
  lines?: InvoiceLineResponseDto[];
}

export class InvoiceSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  invoiceNumber: string;

  @ApiProperty()
  customerCode: string;

  @ApiProperty()
  customerName: string;

  @ApiProperty()
  invoiceDate: Date;

  @ApiProperty()
  dueDate: Date;

  @ApiProperty({ enum: InvoiceStatus })
  status: InvoiceStatus;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty()
  balanceDue: number;
}

export class PaymentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  paymentNumber: string;

  @ApiProperty()
  customerId: string;

  @ApiProperty()
  customerName: string;

  @ApiProperty()
  paymentDate: Date;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  paymentMethod: string;

  @ApiPropertyOptional()
  reference?: string;

  @ApiPropertyOptional()
  notes?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ type: 'array' })
  allocations: {
    invoiceId: string;
    invoiceNumber: string;
    amount: number;
  }[];
}
