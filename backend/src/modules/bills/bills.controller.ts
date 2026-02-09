import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, RequirePermissions, AuditEntity } from '@/common/decorators';
import { BillsService } from './bills.service';
import {
  CreateBillDto,
  UpdateBillDto,
  RecordBillPaymentDto,
  BillQueryDto,
  CreateVendorCreditNoteDto,
  ApplyVendorCreditNoteDto,
  PaymentsMadeQueryDto,
} from './dto/bill.dto';

@ApiTags('Bills')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@AuditEntity('Bill')
@Controller('bills')
export class BillsController {
  constructor(private readonly billsService: BillsService) {}

  @Post()
  @RequirePermissions('bills:create')
  @ApiOperation({ summary: 'Create a bill' })
  @ApiResponse({ status: 201, description: 'Bill created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(
    @CurrentUser('organizationId') organizationId: string,
    @Body() dto: CreateBillDto,
  ) {
    return this.billsService.create(organizationId, dto);
  }

  @Post('from-grn')
  @RequirePermissions('bills:create')
  @ApiOperation({ summary: 'Create bill from goods received note' })
  @ApiResponse({ status: 201, description: 'Bill created from GRN' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'GRN not found' })
  @ApiBody({ schema: { type: 'object', properties: { grnId: { type: 'string' } }, required: ['grnId'] } })
  createFromGRN(
    @CurrentUser('organizationId') organizationId: string,
    @Body('grnId') grnId: string,
  ) {
    return this.billsService.createFromGRN(organizationId, grnId);
  }

  @Get()
  @RequirePermissions('bills:view')
  @ApiOperation({ summary: 'Get all bills' })
  @ApiResponse({ status: 200, description: 'Bills list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @CurrentUser('organizationId') organizationId: string,
    @Query() query: BillQueryDto,
  ) {
    return this.billsService.findAll(organizationId, query);
  }

  @Get('payment-summary')
  @RequirePermissions('bills:view')
  @ApiOperation({ summary: 'Get payment summary' })
  @ApiQuery({ name: 'vendorId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Payment summary' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getPaymentSummary(
    @CurrentUser('organizationId') organizationId: string,
    @Query('vendorId') vendorId?: string,
  ) {
    return this.billsService.getPaymentSummary(organizationId, vendorId);
  }

  @Get(':id')
  @RequirePermissions('bills:view')
  @ApiOperation({ summary: 'Get a bill by ID' })
  @ApiParam({ name: 'id', description: 'Bill ID' })
  @ApiResponse({ status: 200, description: 'Bill found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Bill not found' })
  findOne(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
  ) {
    return this.billsService.findOne(organizationId, id);
  }

  @Put(':id')
  @RequirePermissions('bills:edit')
  @ApiOperation({ summary: 'Update a bill' })
  @ApiParam({ name: 'id', description: 'Bill ID' })
  @ApiResponse({ status: 200, description: 'Bill updated' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Bill not found' })
  update(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
    @Body() dto: UpdateBillDto,
  ) {
    return this.billsService.update(organizationId, id, dto);
  }

  @Post(':id/payments')
  @RequirePermissions('bills:edit')
  @ApiOperation({ summary: 'Record payment for a bill' })
  @ApiParam({ name: 'id', description: 'Bill ID' })
  @ApiResponse({ status: 201, description: 'Payment recorded' })
  @ApiResponse({ status: 400, description: 'Amount exceeds balance' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Bill not found' })
  recordPayment(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
    @Body() dto: RecordBillPaymentDto,
  ) {
    return this.billsService.recordPayment(organizationId, id, dto);
  }

  @Post(':id/void')
  @RequirePermissions('bills:edit')
  @ApiOperation({ summary: 'Void a bill' })
  @ApiParam({ name: 'id', description: 'Bill ID' })
  @ApiResponse({ status: 200, description: 'Bill voided' })
  @ApiResponse({ status: 400, description: 'Cannot void bill' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Bill not found' })
  voidBill(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
  ) {
    return this.billsService.voidBill(organizationId, id);
  }

  @Delete(':id')
  @RequirePermissions('bills:delete')
  @ApiOperation({ summary: 'Delete a bill' })
  @ApiParam({ name: 'id', description: 'Bill ID' })
  @ApiResponse({ status: 200, description: 'Bill deleted' })
  @ApiResponse({ status: 400, description: 'Cannot delete bill' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Bill not found' })
  delete(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
  ) {
    return this.billsService.delete(organizationId, id);
  }
}

@ApiTags('Payments Made')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payments-made')
export class PaymentsMadeController {
  constructor(private readonly billsService: BillsService) {}

  @Get()
  @RequirePermissions('bills:view')
  @ApiOperation({ summary: 'Get all payments made' })
  @ApiResponse({ status: 200, description: 'Payments made list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @CurrentUser('organizationId') organizationId: string,
    @Query() query: PaymentsMadeQueryDto,
  ) {
    return this.billsService.findAllPayments(organizationId, query);
  }
}

@ApiTags('Vendor Credit Notes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('vendor-credit-notes')
export class VendorCreditNotesController {
  constructor(private readonly billsService: BillsService) {}

  @Post()
  @RequirePermissions('bills:create')
  @ApiOperation({ summary: 'Create a vendor credit note' })
  @ApiResponse({ status: 201, description: 'Vendor credit note created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(
    @CurrentUser('organizationId') organizationId: string,
    @Body() dto: CreateVendorCreditNoteDto,
  ) {
    return this.billsService.createVendorCreditNote(organizationId, dto);
  }

  @Get()
  @RequirePermissions('bills:view')
  @ApiOperation({ summary: 'Get all vendor credit notes' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'vendorId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Vendor credit notes list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @CurrentUser('organizationId') organizationId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('vendorId') vendorId?: string,
    @Query('status') status?: string,
  ) {
    return this.billsService.findAllVendorCreditNotes(organizationId, { page, limit, vendorId, status });
  }

  @Get(':id')
  @RequirePermissions('bills:view')
  @ApiOperation({ summary: 'Get vendor credit note by ID' })
  @ApiParam({ name: 'id', description: 'Vendor credit note ID' })
  @ApiResponse({ status: 200, description: 'Vendor credit note found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Vendor credit note not found' })
  findOne(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
  ) {
    return this.billsService.findOneVendorCreditNote(organizationId, id);
  }

  @Post(':id/issue')
  @RequirePermissions('bills:edit')
  @ApiOperation({ summary: 'Issue vendor credit note' })
  @ApiParam({ name: 'id', description: 'Vendor credit note ID' })
  @ApiResponse({ status: 200, description: 'Vendor credit note issued' })
  @ApiResponse({ status: 400, description: 'Cannot issue credit note' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Vendor credit note not found' })
  issue(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
  ) {
    return this.billsService.issueVendorCreditNote(organizationId, id);
  }

  @Post(':id/apply')
  @RequirePermissions('bills:edit')
  @ApiOperation({ summary: 'Apply vendor credit note to bill' })
  @ApiParam({ name: 'id', description: 'Vendor credit note ID' })
  @ApiResponse({ status: 200, description: 'Credit note applied to bill' })
  @ApiResponse({ status: 400, description: 'Invalid application' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Credit note or bill not found' })
  apply(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
    @Body() dto: ApplyVendorCreditNoteDto,
  ) {
    return this.billsService.applyVendorCreditNote(organizationId, id, dto);
  }

  @Post(':id/void')
  @RequirePermissions('bills:edit')
  @ApiOperation({ summary: 'Void vendor credit note' })
  @ApiParam({ name: 'id', description: 'Vendor credit note ID' })
  @ApiResponse({ status: 200, description: 'Vendor credit note voided' })
  @ApiResponse({ status: 400, description: 'Cannot void credit note' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Vendor credit note not found' })
  void(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
  ) {
    return this.billsService.voidVendorCreditNote(organizationId, id);
  }
}
