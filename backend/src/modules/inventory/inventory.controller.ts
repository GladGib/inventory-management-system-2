import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import {
  CreateStockAdjustmentDto,
  StockAdjustmentResponseDto,
  CreateStockTransferDto,
  StockTransferResponseDto,
  CreateStockCountDto,
  RecordCountDto,
  StockCountResponseDto,
} from './dto';
import { CurrentUser } from '@/common/decorators';

@ApiTags('Stock Adjustments')
@ApiBearerAuth()
@Controller('stock-adjustments')
export class StockAdjustmentsController {
  constructor(private inventoryService: InventoryService) {}

  @Post()
  @ApiOperation({ summary: 'Create stock adjustment' })
  @ApiResponse({ status: 201, type: StockAdjustmentResponseDto })
  async create(
    @CurrentUser('organizationId') orgId: string,
    @Body() dto: CreateStockAdjustmentDto,
  ) {
    const adjustment = await this.inventoryService.createAdjustment(orgId, dto);
    return { data: adjustment };
  }

  @Get()
  @ApiOperation({ summary: 'List stock adjustments' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'warehouseId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Stock adjustments list' })
  async findAll(
    @CurrentUser('organizationId') orgId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('warehouseId') warehouseId?: string,
    @Query('status') status?: string,
  ) {
    return this.inventoryService.findAllAdjustments(orgId, {
      page,
      limit,
      warehouseId,
      status,
    });
  }

  @Post(':id/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm stock adjustment' })
  @ApiResponse({ status: 200, type: StockAdjustmentResponseDto })
  @ApiResponse({ status: 400, description: 'Already confirmed' })
  async confirm(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
  ) {
    const adjustment = await this.inventoryService.confirmAdjustment(orgId, id);
    return { data: adjustment };
  }
}

@ApiTags('Stock Transfers')
@ApiBearerAuth()
@Controller('stock-transfers')
export class StockTransfersController {
  constructor(private inventoryService: InventoryService) {}

  @Post()
  @ApiOperation({ summary: 'Create stock transfer' })
  @ApiResponse({ status: 201, type: StockTransferResponseDto })
  async create(
    @CurrentUser('organizationId') orgId: string,
    @Body() dto: CreateStockTransferDto,
  ) {
    const transfer = await this.inventoryService.createTransfer(orgId, dto);
    return { data: transfer };
  }

  @Post(':id/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm stock transfer' })
  @ApiResponse({ status: 200, type: StockTransferResponseDto })
  @ApiResponse({ status: 400, description: 'Already processed' })
  async confirm(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
  ) {
    const transfer = await this.inventoryService.confirmTransfer(orgId, id);
    return { data: transfer };
  }
}

@ApiTags('Stock Counts')
@ApiBearerAuth()
@Controller('stock-counts')
export class StockCountsController {
  constructor(private inventoryService: InventoryService) {}

  @Post()
  @ApiOperation({ summary: 'Create stock count' })
  @ApiResponse({ status: 201, type: StockCountResponseDto })
  async create(
    @CurrentUser('organizationId') orgId: string,
    @Body() dto: CreateStockCountDto,
  ) {
    const count = await this.inventoryService.createStockCount(orgId, dto);
    return { data: count };
  }

  @Post(':id/record')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record count entries' })
  @ApiResponse({ status: 200, type: StockCountResponseDto })
  async recordCount(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') countId: string,
    @Body() dto: RecordCountDto[],
  ) {
    const count = await this.inventoryService.recordCount(orgId, countId, dto);
    return { data: count };
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete stock count and generate adjustment' })
  @ApiQuery({ name: 'createAdjustment', required: false, type: Boolean })
  @ApiResponse({ status: 200, type: StockCountResponseDto })
  async complete(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') countId: string,
    @Query('createAdjustment') createAdjustment?: boolean,
  ) {
    const count = await this.inventoryService.completeStockCount(
      orgId,
      countId,
      createAdjustment !== false,
    );
    return { data: count };
  }
}

@ApiTags('Stock Movements')
@ApiBearerAuth()
@Controller('stock-movements')
export class StockMovementsController {
  constructor(private inventoryService: InventoryService) {}

  @Get()
  @ApiOperation({ summary: 'Get stock movement history' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'itemId', required: false, type: String })
  @ApiQuery({ name: 'warehouseId', required: false, type: String })
  @ApiQuery({ name: 'fromDate', required: false, type: String })
  @ApiQuery({ name: 'toDate', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Stock movements list' })
  async findAll(
    @CurrentUser('organizationId') orgId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('itemId') itemId?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.inventoryService.getStockMovements(orgId, {
      page,
      limit,
      itemId,
      warehouseId,
      fromDate,
      toDate,
    });
  }
}
