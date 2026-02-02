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
