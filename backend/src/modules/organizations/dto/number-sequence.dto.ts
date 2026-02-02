import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class UpdateNumberSequenceDto {
  @ApiPropertyOptional({ example: 'SO' })
  @IsOptional()
  @IsString()
  prefix?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  resetMonthly?: boolean;
}

export class NumberSequenceResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'SO' })
  documentType: string;

  @ApiProperty({ example: 'SO' })
  prefix: string;

  @ApiProperty()
  currentNumber: number;

  @ApiProperty()
  resetMonthly: boolean;

  @ApiProperty()
  lastResetDate: Date;
}
