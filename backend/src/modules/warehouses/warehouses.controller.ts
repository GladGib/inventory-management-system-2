import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
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
import { WarehousesService } from './warehouses.service';
import {
  CreateWarehouseDto,
  UpdateWarehouseDto,
  WarehouseResponseDto,
  CreateBinLocationDto,
  UpdateBinLocationDto,
  BinLocationResponseDto,
  WarehouseStockSummaryDto,
} from './dto';
import { CurrentUser, RequirePermissions, AuditEntity } from '@/common/decorators';

@ApiTags('Warehouses')
@ApiBearerAuth()
@AuditEntity('Warehouse')
@Controller('warehouses')
export class WarehousesController {
  constructor(private warehousesService: WarehousesService) {}

  @Post()
  @RequirePermissions('warehouses:create')
  @ApiOperation({ summary: 'Create a new warehouse' })
  @ApiResponse({ status: 201, type: WarehouseResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(
    @CurrentUser('organizationId') orgId: string,
    @Body() dto: CreateWarehouseDto,
  ) {
    const warehouse = await this.warehousesService.create(orgId, dto);
    return { data: warehouse };
  }

  @Get()
  @RequirePermissions('warehouses:view')
  @ApiOperation({ summary: 'List all warehouses' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Warehouses list' })
  async findAll(
    @CurrentUser('organizationId') orgId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('isActive') isActive?: boolean,
  ) {
    return this.warehousesService.findAll(orgId, {
      page,
      limit,
      search,
      isActive,
    });
  }

  @Get(':id')
  @RequirePermissions('warehouses:view')
  @ApiOperation({ summary: 'Get warehouse by ID' })
  @ApiResponse({ status: 200, type: WarehouseResponseDto })
  @ApiResponse({ status: 404, description: 'Warehouse not found' })
  async findOne(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
  ) {
    const warehouse = await this.warehousesService.findOne(orgId, id);
    return { data: warehouse };
  }

  @Get(':id/summary')
  @RequirePermissions('warehouses:view')
  @ApiOperation({ summary: 'Get warehouse stock summary' })
  @ApiResponse({ status: 200, type: WarehouseStockSummaryDto })
  @ApiResponse({ status: 404, description: 'Warehouse not found' })
  async getStockSummary(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
  ) {
    const summary = await this.warehousesService.getStockSummary(orgId, id);
    return { data: summary };
  }

  @Get(':id/stock')
  @RequirePermissions('warehouses:view')
  @ApiOperation({ summary: 'Get warehouse stock levels' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'lowStockOnly', required: false, type: Boolean })
  @ApiQuery({ name: 'binLocationId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Stock levels list' })
  @ApiResponse({ status: 404, description: 'Warehouse not found' })
  async getStockLevels(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('lowStockOnly') lowStockOnly?: boolean,
    @Query('binLocationId') binLocationId?: string,
  ) {
    return this.warehousesService.getStockLevels(orgId, id, {
      page,
      limit,
      search,
      lowStockOnly,
      binLocationId,
    });
  }

  @Get(':id/stock/:itemId')
  @RequirePermissions('warehouses:view')
  @ApiOperation({ summary: 'Get item stock level in warehouse' })
  @ApiResponse({ status: 200, description: 'Stock level' })
  @ApiResponse({ status: 404, description: 'Warehouse not found' })
  async getItemStock(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') warehouseId: string,
    @Param('itemId') itemId: string,
  ) {
    const stockLevel = await this.warehousesService.getItemStockByWarehouse(
      orgId,
      warehouseId,
      itemId,
    );
    return { data: stockLevel };
  }

  @Put(':id')
  @RequirePermissions('warehouses:edit')
  @ApiOperation({ summary: 'Update warehouse' })
  @ApiResponse({ status: 200, type: WarehouseResponseDto })
  @ApiResponse({ status: 404, description: 'Warehouse not found' })
  async update(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateWarehouseDto,
  ) {
    const warehouse = await this.warehousesService.update(orgId, id, dto);
    return { data: warehouse };
  }

  @Put(':id/primary')
  @RequirePermissions('warehouses:edit')
  @ApiOperation({ summary: 'Set warehouse as primary' })
  @ApiResponse({ status: 200, type: WarehouseResponseDto })
  @ApiResponse({ status: 404, description: 'Warehouse not found' })
  async setPrimary(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
  ) {
    const warehouse = await this.warehousesService.setPrimary(orgId, id);
    return { data: warehouse };
  }

  @Delete(':id')
  @RequirePermissions('warehouses:delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete warehouse' })
  @ApiResponse({ status: 200, description: 'Warehouse deleted' })
  @ApiResponse({ status: 400, description: 'Warehouse has stock' })
  @ApiResponse({ status: 404, description: 'Warehouse not found' })
  async remove(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
  ) {
    await this.warehousesService.remove(orgId, id);
    return { data: { message: 'Warehouse deleted successfully' } };
  }

  // Bin Locations
  @Post(':id/bins')
  @RequirePermissions('warehouses:create')
  @ApiOperation({ summary: 'Create bin location in warehouse' })
  @ApiResponse({ status: 201, type: BinLocationResponseDto })
  @ApiResponse({ status: 400, description: 'Bin code already exists' })
  @ApiResponse({ status: 404, description: 'Warehouse not found' })
  async createBinLocation(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') warehouseId: string,
    @Body() dto: CreateBinLocationDto,
  ) {
    const binLocation = await this.warehousesService.createBinLocation(
      orgId,
      warehouseId,
      dto,
    );
    return { data: binLocation };
  }

  @Get(':id/bins')
  @RequirePermissions('warehouses:view')
  @ApiOperation({ summary: 'List bin locations in warehouse' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Bin locations list' })
  @ApiResponse({ status: 404, description: 'Warehouse not found' })
  async findAllBinLocations(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') warehouseId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('isActive') isActive?: boolean,
  ) {
    return this.warehousesService.findAllBinLocations(orgId, warehouseId, {
      page,
      limit,
      isActive,
    });
  }

  @Put(':id/bins/:binId')
  @RequirePermissions('warehouses:edit')
  @ApiOperation({ summary: 'Update bin location' })
  @ApiResponse({ status: 200, type: BinLocationResponseDto })
  @ApiResponse({ status: 400, description: 'Bin code already exists' })
  @ApiResponse({ status: 404, description: 'Warehouse or bin not found' })
  async updateBinLocation(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') warehouseId: string,
    @Param('binId') binId: string,
    @Body() dto: UpdateBinLocationDto,
  ) {
    const binLocation = await this.warehousesService.updateBinLocation(
      orgId,
      warehouseId,
      binId,
      dto,
    );
    return { data: binLocation };
  }

  @Delete(':id/bins/:binId')
  @RequirePermissions('warehouses:delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete bin location' })
  @ApiResponse({ status: 200, description: 'Bin location deleted' })
  @ApiResponse({ status: 400, description: 'Bin has stock' })
  @ApiResponse({ status: 404, description: 'Warehouse or bin not found' })
  async removeBinLocation(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') warehouseId: string,
    @Param('binId') binId: string,
  ) {
    await this.warehousesService.removeBinLocation(orgId, warehouseId, binId);
    return { data: { message: 'Bin location deleted successfully' } };
  }
}
