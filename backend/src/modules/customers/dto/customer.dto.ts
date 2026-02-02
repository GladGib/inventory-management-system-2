import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsEmail,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCustomerAddressDto {
  @ApiProperty({ example: 'Billing Address' })
  @IsString()
  label: string;

  @ApiProperty({ example: '123 Main Street' })
  @IsString()
  addressLine1: string;

  @ApiPropertyOptional({ example: 'Unit 4B' })
  @IsOptional()
  @IsString()
  addressLine2?: string;

  @ApiProperty({ example: 'Kuala Lumpur' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'Wilayah Persekutuan' })
  @IsString()
  state: string;

  @ApiProperty({ example: '50000' })
  @IsString()
  postalCode: string;

  @ApiPropertyOptional({ example: 'Malaysia', default: 'Malaysia' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateCustomerAddressDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  addressLine1?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  addressLine2?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class CreateCustomerContactDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Purchasing Manager' })
  @IsOptional()
  @IsString()
  designation?: string;

  @ApiPropertyOptional({ example: '+60123456789' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'john@company.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class UpdateCustomerContactDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  designation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class CreateCustomerDto {
  @ApiPropertyOptional({ example: 'CUST-001', description: 'Auto-generated if not provided' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ example: 'ABC Trading Sdn Bhd' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'ABC Trading' })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional({ example: '+60312345678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'accounts@abctrading.com.my' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '201901012345' })
  @IsOptional()
  @IsString()
  taxId?: string;

  @ApiPropertyOptional({ example: 30, description: 'Payment terms in days' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  paymentTerms?: number;

  @ApiPropertyOptional({ example: 50000, description: 'Credit limit in MYR' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  creditLimit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ type: [CreateCustomerAddressDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCustomerAddressDto)
  addresses?: CreateCustomerAddressDto[];

  @ApiPropertyOptional({ type: [CreateCustomerContactDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCustomerContactDto)
  contacts?: CreateCustomerContactDto[];
}

export class UpdateCustomerDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  taxId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  paymentTerms?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  creditLimit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CustomerAddressResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  label: string;

  @ApiProperty()
  addressLine1: string;

  @ApiPropertyOptional()
  addressLine2?: string;

  @ApiProperty()
  city: string;

  @ApiProperty()
  state: string;

  @ApiProperty()
  postalCode: string;

  @ApiProperty()
  country: string;

  @ApiProperty()
  isDefault: boolean;
}

export class CustomerContactResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  designation?: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiProperty()
  isPrimary: boolean;
}

export class CustomerResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  displayName?: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiPropertyOptional()
  taxId?: string;

  @ApiProperty()
  paymentTerms: number;

  @ApiProperty()
  creditLimit: number;

  @ApiProperty()
  balance: number;

  @ApiPropertyOptional()
  notes?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ type: [CustomerAddressResponseDto] })
  addresses?: CustomerAddressResponseDto[];

  @ApiPropertyOptional({ type: [CustomerContactResponseDto] })
  contacts?: CustomerContactResponseDto[];
}

export class CustomerSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  displayName?: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiProperty()
  balance: number;

  @ApiProperty()
  isActive: boolean;
}
