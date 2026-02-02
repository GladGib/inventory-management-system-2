import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Engine Parts' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'All engine-related parts and components' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Parent category ID for subcategories' })
  @IsOptional()
  @IsString()
  parentId?: string;
}

export class UpdateCategoryDto {
  @ApiPropertyOptional({ example: 'Engine Parts' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  parentId?: string;
}

export class CategoryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  parentId?: string;

  @ApiProperty()
  level: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class CategoryTreeResponseDto extends CategoryResponseDto {
  @ApiPropertyOptional({ type: [CategoryTreeResponseDto] })
  children?: CategoryTreeResponseDto[];
}
