import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsOptional, Min, Max } from 'class-validator';

export class CreateTaxRateDto {
  @ApiProperty({ example: 'SST 10%' })
  @IsString()
  name: string;

  @ApiProperty({ example: 10, description: 'Tax rate percentage' })
  @IsNumber()
  @Min(0)
  @Max(100)
  rate: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateTaxRateDto {
  @ApiPropertyOptional({ example: 'SST 10%' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  rate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class TaxRateResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  rate: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
