import {
  Controller,
  Get,
  Post,
  Put,
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
import { PurchasesService } from './purchases.service';
import {
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
  PurchaseOrderResponseDto,
  CreatePurchaseOrderLineDto,
  CreateGRNDto,
  CreateDirectGRNDto,
  GRNResponseDto,
} from './dto';
import { CurrentUser } from '@/common/decorators';
import { PdfService } from '@/common/pdf';

@ApiTags('Purchase Orders')
@ApiBearerAuth()
@Controller('purchase-orders')
export class PurchasesController {
  constructor(
    private purchasesService: PurchasesService,
    private pdfService: PdfService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new purchase order' })
  @ApiResponse({ status: 201, type: PurchaseOrderResponseDto })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async create(
    @CurrentUser('organizationId') orgId: string,
    @Body() dto: CreatePurchaseOrderDto,
  ) {
    const po = await this.purchasesService.create(orgId, dto);
    return { data: po };
  }

  @Get()
  @ApiOperation({ summary: 'List all purchase orders' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'vendorId', required: false, type: String })
  @ApiQuery({ name: 'fromDate', required: false, type: String })
  @ApiQuery({ name: 'toDate', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Purchase orders list' })
  async findAll(
    @CurrentUser('organizationId') orgId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('vendorId') vendorId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.purchasesService.findAll(orgId, {
      page,
      limit,
      search,
      status,
      vendorId,
      fromDate,
      toDate,
    });
  }

  @Get('reorder-suggestions')
  @ApiOperation({ summary: 'Get reorder suggestions for low stock items' })
  @ApiResponse({ status: 200, description: 'Reorder suggestions list' })
  async getReorderSuggestions(@CurrentUser('organizationId') orgId: string) {
    const suggestions = await this.purchasesService.getReorderSuggestions(orgId);
    return { data: suggestions };
  }

  @Get('grn')
  @ApiOperation({ summary: 'List all goods received notes' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'vendorId', required: false, type: String })
  @ApiQuery({ name: 'fromDate', required: false, type: String })
  @ApiQuery({ name: 'toDate', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Goods received notes list' })
  async findAllGRNs(
    @CurrentUser('organizationId') orgId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('vendorId') vendorId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.purchasesService.findAllGRNs(orgId, {
      page,
      limit,
      search,
      status,
      vendorId,
      fromDate,
      toDate,
    });
  }

  @Get('grn/:id')
  @ApiOperation({ summary: 'Get goods received note by ID' })
  @ApiResponse({ status: 200, type: GRNResponseDto })
  @ApiResponse({ status: 404, description: 'GRN not found' })
  async findOneGRN(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
  ) {
    const grn = await this.purchasesService.findOneGRN(orgId, id);
    return { data: grn };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get purchase order by ID' })
  @ApiResponse({ status: 200, type: PurchaseOrderResponseDto })
  @ApiResponse({ status: 404, description: 'Purchase order not found' })
  async findOne(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
  ) {
    const po = await this.purchasesService.findOne(orgId, id);
    return { data: po };
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Download purchase order as PDF' })
  @ApiProduces('application/pdf')
  @ApiResponse({ status: 200, description: 'PDF file' })
  @ApiResponse({ status: 404, description: 'Purchase order not found' })
  async downloadPdf(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const orderData = await this.purchasesService.getOrderForPdf(orgId, id);
    const pdfBuffer = await this.pdfService.generatePurchaseOrderPdf(orderData);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="purchase-order-${orderData.poNumber}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  }

  @Get('grn/:id/pdf')
  @ApiOperation({ summary: 'Download goods received note as PDF' })
  @ApiProduces('application/pdf')
  @ApiResponse({ status: 200, description: 'PDF file' })
  @ApiResponse({ status: 404, description: 'GRN not found' })
  async downloadGRNPdf(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const grnData = await this.purchasesService.getGRNForPdf(orgId, id);
    const pdfBuffer = await this.pdfService.generateGRNPdf(grnData);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="grn-${grnData.grnNumber}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update purchase order' })
  @ApiResponse({ status: 200, type: PurchaseOrderResponseDto })
  @ApiResponse({ status: 400, description: 'Can only update draft orders' })
  @ApiResponse({ status: 404, description: 'Purchase order not found' })
  async update(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePurchaseOrderDto,
  ) {
    const po = await this.purchasesService.update(orgId, id, dto);
    return { data: po };
  }

  @Post(':id/lines')
  @ApiOperation({ summary: 'Add line to purchase order' })
  @ApiResponse({ status: 201, type: PurchaseOrderResponseDto })
  @ApiResponse({ status: 400, description: 'Can only add to draft orders' })
  @ApiResponse({ status: 404, description: 'Purchase order not found' })
  async addLine(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') poId: string,
    @Body() dto: CreatePurchaseOrderLineDto,
  ) {
    const po = await this.purchasesService.addLine(orgId, poId, dto);
    return { data: po };
  }

  @Post(':id/send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send purchase order to vendor' })
  @ApiResponse({ status: 200, type: PurchaseOrderResponseDto })
  @ApiResponse({ status: 400, description: 'Order already sent' })
  @ApiResponse({ status: 404, description: 'Purchase order not found' })
  async send(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
  ) {
    const po = await this.purchasesService.send(orgId, id);
    return { data: po };
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel purchase order' })
  @ApiResponse({ status: 200, type: PurchaseOrderResponseDto })
  @ApiResponse({ status: 400, description: 'Cannot cancel in current status' })
  @ApiResponse({ status: 404, description: 'Purchase order not found' })
  async cancel(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
  ) {
    const po = await this.purchasesService.cancel(orgId, id);
    return { data: po };
  }

  @Post(':id/receive')
  @ApiOperation({ summary: 'Create goods received note (GRN)' })
  @ApiResponse({ status: 201, type: GRNResponseDto })
  @ApiResponse({ status: 400, description: 'Order must be sent to receive' })
  @ApiResponse({ status: 404, description: 'Purchase order not found' })
  async createGRN(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') poId: string,
    @Body() dto: CreateGRNDto,
  ) {
    const grn = await this.purchasesService.createGRN(orgId, poId, dto);
    return { data: grn };
  }
}

@ApiTags('Goods Received Notes')
@ApiBearerAuth()
@Controller('grns')
export class GRNsController {
  constructor(
    private purchasesService: PurchasesService,
    private pdfService: PdfService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create direct GRN (without PO)' })
  @ApiResponse({ status: 201, type: GRNResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 404, description: 'Vendor or warehouse not found' })
  async createDirectGRN(
    @CurrentUser('organizationId') orgId: string,
    @Body() dto: CreateDirectGRNDto,
  ) {
    const grn = await this.purchasesService.createDirectGRN(orgId, dto);
    return { data: grn };
  }

  @Get()
  @ApiOperation({ summary: 'List all goods received notes' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'vendorId', required: false, type: String })
  @ApiQuery({ name: 'fromDate', required: false, type: String })
  @ApiQuery({ name: 'toDate', required: false, type: String })
  async findAll(
    @CurrentUser('organizationId') orgId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('vendorId') vendorId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.purchasesService.findAllGRNs(orgId, {
      page,
      limit,
      search,
      status,
      vendorId,
      fromDate,
      toDate,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get GRN by ID' })
  @ApiResponse({ status: 200, type: GRNResponseDto })
  @ApiResponse({ status: 404, description: 'GRN not found' })
  async findOne(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
  ) {
    const grn = await this.purchasesService.findOneGRN(orgId, id);
    return { data: grn };
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Download GRN as PDF' })
  @ApiProduces('application/pdf')
  @ApiResponse({ status: 200, description: 'PDF file' })
  @ApiResponse({ status: 404, description: 'GRN not found' })
  async downloadPdf(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const grnData = await this.purchasesService.getGRNForPdf(orgId, id);
    const pdfBuffer = await this.pdfService.generateGRNPdf(grnData);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="GRN-${grnData.grnNumber}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  }
}
