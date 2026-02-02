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

export class CreateVendorAddressDto {
  @ApiProperty({ example: 'Main Warehouse' })
  @IsString()
  label: string;

  @ApiProperty({ example: '456 Industrial Road' })
  @IsString()
  addressLine1: string;

  @ApiPropertyOptional({ example: 'Block B' })
  @IsOptional()
  @IsString()
  addressLine2?: string;

  @ApiProperty({ example: 'Shah Alam' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'Selangor' })
  @IsString()
  state: string;

  @ApiProperty({ example: '40000' })
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

export class UpdateVendorAddressDto {
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

export class CreateVendorContactDto {
  @ApiProperty({ example: 'Ahmad bin Ali' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Sales Manager' })
  @IsOptional()
  @IsString()
  designation?: string;

  @ApiPropertyOptional({ example: '+60198765432' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'ahmad@supplier.com.my' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class UpdateVendorContactDto {
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

export class VendorItemPricingDto {
  @ApiProperty({ description: 'Item ID' })
  @IsString()
  itemId: string;

  @ApiPropertyOptional({ example: 'SUP-BP-001', description: 'Vendor part number' })
  @IsOptional()
  @IsString()
  vendorPartNumber?: string;

  @ApiProperty({ example: 42.50, description: 'Unit cost from this vendor' })
  @IsNumber()
  @Min(0)
  unitCost: number;

  @ApiPropertyOptional({ example: 10, description: 'Minimum order quantity' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  minOrderQty?: number;

  @ApiPropertyOptional({ example: 7, description: 'Lead time in days' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  leadTimeDays?: number;

  @ApiPropertyOptional({ default: false, description: 'Is this the preferred vendor for this item' })
  @IsOptional()
  @IsBoolean()
  isPreferred?: boolean;
}

export class CreateVendorDto {
  @ApiPropertyOptional({ example: 'VEND-001', description: 'Auto-generated if not provided' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ example: 'Auto Parts Supplier Sdn Bhd' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Auto Parts Supplier' })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional({ example: '+60356789012' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'orders@autopartssupplier.com.my' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '199901023456' })
  @IsOptional()
  @IsString()
  taxId?: string;

  @ApiPropertyOptional({ example: 30, description: 'Payment terms in days' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  paymentTerms?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ type: [CreateVendorAddressDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVendorAddressDto)
  addresses?: CreateVendorAddressDto[];

  @ApiPropertyOptional({ type: [CreateVendorContactDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVendorContactDto)
  contacts?: CreateVendorContactDto[];
}

export class UpdateVendorDto {
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
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class VendorAddressResponseDto {
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

export class VendorContactResponseDto {
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

export class VendorItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  itemId: string;

  @ApiProperty()
  itemCode: string;

  @ApiProperty()
  itemName: string;

  @ApiPropertyOptional()
  vendorPartNumber?: string;

  @ApiProperty()
  unitCost: number;

  @ApiPropertyOptional()
  minOrderQty?: number;

  @ApiPropertyOptional()
  leadTimeDays?: number;

  @ApiProperty()
  isPreferred: boolean;
}

export class VendorResponseDto {
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
  balance: number;

  @ApiPropertyOptional()
  notes?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ type: [VendorAddressResponseDto] })
  addresses?: VendorAddressResponseDto[];

  @ApiPropertyOptional({ type: [VendorContactResponseDto] })
  contacts?: VendorContactResponseDto[];
}

export class VendorSummaryDto {
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
