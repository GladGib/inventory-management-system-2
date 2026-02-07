import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn } from 'class-validator';

export class RegisterDeviceDto {
  @ApiProperty({ example: 'fcm_token_abc123...' })
  @IsString()
  token: string;

  @ApiProperty({ example: 'android', enum: ['android', 'ios', 'web'] })
  @IsString()
  @IsIn(['android', 'ios', 'web'])
  platform: string;

  @ApiPropertyOptional({ example: 'Samsung Galaxy S24' })
  @IsOptional()
  @IsString()
  deviceName?: string;
}
