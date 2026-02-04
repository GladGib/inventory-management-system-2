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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators';
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
@Controller('bills')
export class BillsController {
  constructor(private readonly billsService: BillsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a bill' })
  create(
    @CurrentUser('organizationId') organizationId: string,
    @Body() dto: CreateBillDto,
  ) {
    return this.billsService.create(organizationId, dto);
  }

  @Post('from-grn')
  @ApiOperation({ summary: 'Create bill from goods received note' })
  createFromGRN(
    @CurrentUser('organizationId') organizationId: string,
    @Body('grnId') grnId: string,
  ) {
    return this.billsService.createFromGRN(organizationId, grnId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all bills' })
  findAll(
    @CurrentUser('organizationId') organizationId: string,
    @Query() query: BillQueryDto,
  ) {
    return this.billsService.findAll(organizationId, query);
  }

  @Get('payment-summary')
  @ApiOperation({ summary: 'Get payment summary' })
  getPaymentSummary(
    @CurrentUser('organizationId') organizationId: string,
    @Query('vendorId') vendorId?: string,
  ) {
    return this.billsService.getPaymentSummary(organizationId, vendorId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a bill by ID' })
  findOne(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
  ) {
    return this.billsService.findOne(organizationId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a bill' })
  update(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
    @Body() dto: UpdateBillDto,
  ) {
    return this.billsService.update(organizationId, id, dto);
  }

  @Post(':id/payments')
  @ApiOperation({ summary: 'Record payment for a bill' })
  recordPayment(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
    @Body() dto: RecordBillPaymentDto,
  ) {
    return this.billsService.recordPayment(organizationId, id, dto);
  }

  @Post(':id/void')
  @ApiOperation({ summary: 'Void a bill' })
  voidBill(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
  ) {
    return this.billsService.voidBill(organizationId, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a bill' })
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
  @ApiOperation({ summary: 'Get all payments made' })
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
  @ApiOperation({ summary: 'Create a vendor credit note' })
  create(
    @CurrentUser('organizationId') organizationId: string,
    @Body() dto: CreateVendorCreditNoteDto,
  ) {
    return this.billsService.createVendorCreditNote(organizationId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all vendor credit notes' })
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
  @ApiOperation({ summary: 'Get vendor credit note by ID' })
  findOne(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
  ) {
    return this.billsService.findOneVendorCreditNote(organizationId, id);
  }

  @Post(':id/issue')
  @ApiOperation({ summary: 'Issue vendor credit note' })
  issue(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
  ) {
    return this.billsService.issueVendorCreditNote(organizationId, id);
  }

  @Post(':id/apply')
  @ApiOperation({ summary: 'Apply vendor credit note to bill' })
  apply(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
    @Body() dto: ApplyVendorCreditNoteDto,
  ) {
    return this.billsService.applyVendorCreditNote(organizationId, id, dto);
  }

  @Post(':id/void')
  @ApiOperation({ summary: 'Void vendor credit note' })
  void(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
  ) {
    return this.billsService.voidVendorCreditNote(organizationId, id);
  }
}
