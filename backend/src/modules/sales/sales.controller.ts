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
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiProduces,
} from '@nestjs/swagger';
import { Response } from 'express';
import { SalesService } from './sales.service';
import { ShipmentsService } from './shipments.service';
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
  CreateShipmentDto,
  UpdateShipmentDto,
  ShipmentResponseDto,
} from './dto';
import { CurrentUser, RequirePermissions, AuditEntity } from '@/common/decorators';
import { PdfService } from '@/common/pdf';

@ApiTags('Sales Orders')
@ApiBearerAuth()
@AuditEntity('SalesOrder')
@Controller('sales-orders')
export class SalesController {
  constructor(
    private salesService: SalesService,
    private shipmentsService: ShipmentsService,
    private pdfService: PdfService,
  ) {}

  @Post()
  @RequirePermissions('sales:create')
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
  @RequirePermissions('sales:view')
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
  @RequirePermissions('sales:view')
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

  @Get(':id/pdf')
  @RequirePermissions('sales:view')
  @ApiOperation({ summary: 'Download sales order as PDF' })
  @ApiProduces('application/pdf')
  @ApiResponse({ status: 200, description: 'PDF file' })
  @ApiResponse({ status: 404, description: 'Sales order not found' })
  async downloadPdf(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const orderData = await this.salesService.getOrderForPdf(orgId, id);
    const pdfBuffer = await this.pdfService.generateSalesOrderPdf(orderData);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="sales-order-${orderData.orderNumber}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  }

  @Put(':id')
  @RequirePermissions('sales:edit')
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
  @RequirePermissions('sales:edit')
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
  @RequirePermissions('sales:edit')
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
  @RequirePermissions('sales:edit')
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
  @RequirePermissions('sales:edit')
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
  @RequirePermissions('sales:edit')
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
  @RequirePermissions('sales:edit')
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

  // Shipments
  @Post(':id/shipments')
  @RequirePermissions('sales:edit')
  @ApiOperation({ summary: 'Create shipment for sales order' })
  @ApiResponse({ status: 201, type: ShipmentResponseDto })
  @ApiResponse({ status: 400, description: 'Order not in shippable status' })
  @ApiResponse({ status: 404, description: 'Sales order not found' })
  async createShipment(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') orderId: string,
    @Body() dto: CreateShipmentDto,
  ) {
    const shipment = await this.shipmentsService.create(orgId, orderId, dto);
    return { data: shipment };
  }

  @Get(':id/shipments')
  @RequirePermissions('sales:view')
  @ApiOperation({ summary: 'Get shipments for sales order' })
  @ApiResponse({ status: 200, type: [ShipmentResponseDto] })
  @ApiResponse({ status: 404, description: 'Sales order not found' })
  async getShipments(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') orderId: string,
  ) {
    const shipments = await this.shipmentsService.findAll(orgId, orderId);
    return { data: shipments };
  }
}

@ApiTags('Shipments')
@ApiBearerAuth()
@AuditEntity('Shipment')
@Controller('shipments')
export class ShipmentsController {
  constructor(
    private shipmentsService: ShipmentsService,
    private pdfService: PdfService,
  ) {}

  @Get(':id')
  @RequirePermissions('sales:view')
  @ApiOperation({ summary: 'Get shipment by ID' })
  @ApiResponse({ status: 200, type: ShipmentResponseDto })
  @ApiResponse({ status: 404, description: 'Shipment not found' })
  async findOne(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
  ) {
    const shipment = await this.shipmentsService.findOne(orgId, id);
    return { data: shipment };
  }

  @Put(':id')
  @RequirePermissions('sales:edit')
  @ApiOperation({ summary: 'Update shipment' })
  @ApiResponse({ status: 200, type: ShipmentResponseDto })
  @ApiResponse({ status: 400, description: 'Cannot update delivered shipment' })
  @ApiResponse({ status: 404, description: 'Shipment not found' })
  async update(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateShipmentDto,
  ) {
    const shipment = await this.shipmentsService.update(orgId, id, dto);
    return { data: shipment };
  }

  @Post(':id/deliver')
  @RequirePermissions('sales:edit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark shipment as delivered' })
  @ApiResponse({ status: 200, type: ShipmentResponseDto })
  @ApiResponse({ status: 400, description: 'Shipment already delivered' })
  @ApiResponse({ status: 404, description: 'Shipment not found' })
  async markDelivered(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
  ) {
    const shipment = await this.shipmentsService.markDelivered(orgId, id);
    return { data: shipment };
  }

  @Get(':id/delivery-order')
  @RequirePermissions('sales:view')
  @ApiOperation({ summary: 'Download delivery order PDF' })
  @ApiProduces('application/pdf')
  @ApiResponse({ status: 200, description: 'PDF file' })
  @ApiResponse({ status: 404, description: 'Shipment not found' })
  async downloadDeliveryOrder(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const shipmentData = await this.shipmentsService.getShipmentForPdf(orgId, id);
    const pdfBuffer = await this.pdfService.generateDeliveryOrderPdf(shipmentData);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="DO-${shipmentData.shipmentNumber}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  }
}

@ApiTags('Pick Lists')
@ApiBearerAuth()
@Controller('pick-lists')
export class PickListsController {

  constructor(private salesService: SalesService) {}

  @Post(':id/process')
  @RequirePermissions('sales:edit')
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
