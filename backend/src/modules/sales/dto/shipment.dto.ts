import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  IsDateString,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ShipmentLineDto {
  @ApiProperty({ description: 'Item ID' })
  @IsString()
  itemId: string;

  @ApiProperty({ description: 'Quantity to ship' })
  @IsNumber()
  quantity: number;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateShipmentDto {
  @ApiPropertyOptional({ description: 'Carrier name' })
  @IsOptional()
  @IsString()
  carrier?: string;

  @ApiPropertyOptional({ description: 'Tracking number' })
  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @ApiPropertyOptional({ description: 'Ship date' })
  @IsOptional()
  @IsDateString()
  shipDate?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Shipment lines', type: [ShipmentLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShipmentLineDto)
  @ArrayMinSize(1)
  lines: ShipmentLineDto[];
}

export class UpdateShipmentDto {
  @ApiPropertyOptional({ description: 'Carrier name' })
  @IsOptional()
  @IsString()
  carrier?: string;

  @ApiPropertyOptional({ description: 'Tracking number' })
  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @ApiPropertyOptional({ description: 'Ship date' })
  @IsOptional()
  @IsDateString()
  shipDate?: string;

  @ApiPropertyOptional({ description: 'Delivered date' })
  @IsOptional()
  @IsDateString()
  deliveredDate?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ShipmentLineResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  itemId: string;

  @ApiProperty()
  itemCode: string;

  @ApiProperty()
  itemName: string;

  @ApiProperty()
  quantity: number;

  @ApiPropertyOptional()
  notes?: string;
}

export class ShipmentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  shipmentNumber: string;

  @ApiProperty()
  salesOrderId: string;

  @ApiProperty()
  orderNumber: string;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  carrier?: string;

  @ApiPropertyOptional()
  trackingNumber?: string;

  @ApiPropertyOptional()
  shipDate?: Date;

  @ApiPropertyOptional()
  deliveredDate?: Date;

  @ApiPropertyOptional()
  notes?: string;

  @ApiProperty({ type: [ShipmentLineResponseDto] })
  lines: ShipmentLineResponseDto[];

  @ApiProperty()
  createdAt: Date;
}
