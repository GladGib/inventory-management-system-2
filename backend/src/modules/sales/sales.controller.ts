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
import { SalesService } from './sales.service';
import {
  CreateSalesOrderDto,
  UpdateSalesOrderDto,
  SalesOrderResponseDto,
  CreateSalesOrderLineDto,
  UpdateSalesOrderLineDto,
  ConfirmOrderDto,
  CreatePickListDto,
  ProcessPickListDto,
  PickListResponseDto,
} from './dto';
import { CurrentUser } from '@/common/decorators';

@ApiTags('Sales Orders')
@ApiBearerAuth()
@Controller('sales-orders')
export class SalesController {
  constructor(private salesService: SalesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new sales order' })
  @ApiResponse({ status: 201, type: SalesOrderResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(
    @CurrentUser('organizationId') orgId: string,
    @Body() dto: CreateSalesOrderDto,
  ) {
    const order = await this.salesService.create(orgId, dto);
    return { data: order };
  }

  @Get()
  @ApiOperation({ summary: 'List all sales orders' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'customerId', required: false, type: String })
  @ApiQuery({ name: 'fromDate', required: false, type: String })
  @ApiQuery({ name: 'toDate', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Sales orders list' })
  async findAll(
    @CurrentUser('organizationId') orgId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('customerId') customerId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.salesService.findAll(orgId, {
      page,
      limit,
      search,
      status,
      customerId,
      fromDate,
      toDate,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get sales order by ID' })
  @ApiResponse({ status: 200, type: SalesOrderResponseDto })
  @ApiResponse({ status: 404, description: 'Sales order not found' })
  async findOne(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
  ) {
    const order = await this.salesService.findOne(orgId, id);
    return { data: order };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update sales order' })
  @ApiResponse({ status: 200, type: SalesOrderResponseDto })
  @ApiResponse({ status: 400, description: 'Can only update draft orders' })
  @ApiResponse({ status: 404, description: 'Sales order not found' })
  async update(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSalesOrderDto,
  ) {
    const order = await this.salesService.update(orgId, id, dto);
    return { data: order };
  }

  // Line management
  @Post(':id/lines')
  @ApiOperation({ summary: 'Add line to sales order' })
  @ApiResponse({ status: 201, type: SalesOrderResponseDto })
  @ApiResponse({ status: 400, description: 'Can only add to draft orders' })
  @ApiResponse({ status: 404, description: 'Sales order not found' })
  async addLine(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') orderId: string,
    @Body() dto: CreateSalesOrderLineDto,
  ) {
    const order = await this.salesService.addLine(orgId, orderId, dto);
    return { data: order };
  }

  @Put(':id/lines/:lineId')
  @ApiOperation({ summary: 'Update sales order line' })
  @ApiResponse({ status: 200, type: SalesOrderResponseDto })
  @ApiResponse({ status: 400, description: 'Can only update draft orders' })
  @ApiResponse({ status: 404, description: 'Order or line not found' })
  async updateLine(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') orderId: string,
    @Param('lineId') lineId: string,
    @Body() dto: UpdateSalesOrderLineDto,
  ) {
    const order = await this.salesService.updateLine(orgId, orderId, lineId, dto);
    return { data: order };
  }

  @Delete(':id/lines/:lineId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove line from sales order' })
  @ApiResponse({ status: 200, type: SalesOrderResponseDto })
  @ApiResponse({ status: 400, description: 'Can only remove from draft orders' })
  @ApiResponse({ status: 404, description: 'Order or line not found' })
  async removeLine(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') orderId: string,
    @Param('lineId') lineId: string,
  ) {
    const order = await this.salesService.removeLine(orgId, orderId, lineId);
    return { data: order };
  }

  // Status transitions
  @Post(':id/confirm')
  @ApiOperation({ summary: 'Confirm sales order and allocate stock' })
  @ApiResponse({ status: 200, type: SalesOrderResponseDto })
  @ApiResponse({ status: 400, description: 'Insufficient stock or not draft' })
  @ApiResponse({ status: 404, description: 'Sales order not found' })
  async confirm(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
    @Body() dto?: ConfirmOrderDto,
  ) {
    const order = await this.salesService.confirm(orgId, id, dto);
    return { data: order };
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel sales order' })
  @ApiResponse({ status: 200, type: SalesOrderResponseDto })
  @ApiResponse({ status: 400, description: 'Cannot cancel in current status' })
  @ApiResponse({ status: 404, description: 'Sales order not found' })
  async cancel(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
  ) {
    const order = await this.salesService.cancel(orgId, id);
    return { data: order };
  }

  // Pick list
  @Post(':id/pick-list')
  @ApiOperation({ summary: 'Create pick list for order' })
  @ApiResponse({ status: 201, type: PickListResponseDto })
  @ApiResponse({ status: 400, description: 'Order not confirmed' })
  @ApiResponse({ status: 404, description: 'Sales order not found' })
  async createPickList(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') orderId: string,
    @Body() dto?: CreatePickListDto,
  ) {
    const pickList = await this.salesService.createPickList(orgId, orderId, dto);
    return { data: pickList };
  }
}

@ApiTags('Pick Lists')
@ApiBearerAuth()
@Controller('pick-lists')
export class PickListsController {
  constructor(private salesService: SalesService) {}

  @Post(':id/process')
  @ApiOperation({ summary: 'Process pick list' })
  @ApiResponse({ status: 200, type: PickListResponseDto })
  @ApiResponse({ status: 400, description: 'Pick list already processed' })
  @ApiResponse({ status: 404, description: 'Pick list not found' })
  async processPickList(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') pickListId: string,
    @Body() dto: ProcessPickListDto,
  ) {
    const pickList = await this.salesService.processPickList(orgId, pickListId, dto);
    return { data: pickList };
  }
}
