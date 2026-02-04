import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class VariantAttributeDto {
  @ApiProperty({ description: 'Attribute name', example: 'Size' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Attribute values', example: ['S', 'M', 'L', 'XL'] })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  values: string[];
}

export class CreateVariantsDto {
  @ApiProperty({ description: 'Variant attributes', type: [VariantAttributeDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantAttributeDto)
  @ArrayMinSize(1)
  attributes: VariantAttributeDto[];

  @ApiPropertyOptional({ description: 'Base price for all variants' })
  @IsOptional()
  @IsNumber()
  basePrice?: number;

  @ApiPropertyOptional({ description: 'Generate barcodes for variants' })
  @IsOptional()
  generateBarcodes?: boolean;
}

export class UpdateVariantDto {
  @ApiPropertyOptional({ description: 'Variant SKU/code' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ description: 'Variant barcode' })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiPropertyOptional({ description: 'Cost price' })
  @IsOptional()
  @IsNumber()
  costPrice?: number;

  @ApiPropertyOptional({ description: 'Selling price' })
  @IsOptional()
  @IsNumber()
  sellingPrice?: number;

  @ApiPropertyOptional({ description: 'Is active' })
  @IsOptional()
  isActive?: boolean;
}

export class VariantValueDto {
  @ApiProperty({ description: 'Attribute name' })
  attribute: string;

  @ApiProperty({ description: 'Attribute value' })
  value: string;
}

export class VariantResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  barcode?: string;

  @ApiProperty()
  costPrice: number;

  @ApiProperty()
  sellingPrice: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ type: [VariantValueDto] })
  attributes: VariantValueDto[];

  @ApiProperty()
  stockOnHand: number;
}

export class VariantAttributeResponseDto {
  @ApiProperty()
  name: string;

  @ApiProperty({ type: [String] })
  values: string[];
}

export class ItemWithVariantsResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  type: string;

  @ApiProperty({ type: [VariantAttributeResponseDto] })
  variantAttributes: VariantAttributeResponseDto[];

  @ApiProperty({ type: [VariantResponseDto] })
  variants: VariantResponseDto[];

  @ApiProperty()
  totalStock: number;
}
