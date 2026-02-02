import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';

export class UpdateOrganizationDto {
  @ApiPropertyOptional({ example: 'Demo Auto Parts Sdn Bhd' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'info@demoautoparts.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ example: '+60 3-1234 5678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: '123 Jalan Industri' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Petaling Jaya' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'Selangor' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: '47301' })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({ example: 'Malaysia' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ example: 'SST-123456-X' })
  @IsOptional()
  @IsString()
  taxRegistrationNo?: string;

  @ApiPropertyOptional({ example: 1, description: 'Fiscal year start month (1-12)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  fiscalYearStart?: number;
}

export class OrganizationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  logo?: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiPropertyOptional()
  address?: string;

  @ApiPropertyOptional()
  city?: string;

  @ApiPropertyOptional()
  state?: string;

  @ApiPropertyOptional()
  postalCode?: string;

  @ApiProperty()
  country: string;

  @ApiPropertyOptional()
  taxRegistrationNo?: string;

  @ApiProperty()
  baseCurrency: string;

  @ApiProperty()
  fiscalYearStart: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
