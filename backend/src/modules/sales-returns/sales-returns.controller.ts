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
import { SalesReturnsService } from './sales-returns.service';
import {
  CreateSalesReturnDto,
  UpdateSalesReturnDto,
  ReceiveReturnDto,
  ProcessRefundDto,
  SalesReturnQueryDto,
} from './dto/sales-return.dto';

@ApiTags('Sales Returns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sales-returns')
export class SalesReturnsController {
  constructor(private readonly salesReturnsService: SalesReturnsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a sales return' })
  create(
    @CurrentUser('organizationId') organizationId: string,
    @Body() dto: CreateSalesReturnDto,
  ) {
    return this.salesReturnsService.create(organizationId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all sales returns' })
  findAll(
    @CurrentUser('organizationId') organizationId: string,
    @Query() query: SalesReturnQueryDto,
  ) {
    return this.salesReturnsService.findAll(organizationId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a sales return by ID' })
  findOne(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
  ) {
    return this.salesReturnsService.findOne(organizationId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a sales return' })
  update(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSalesReturnDto,
  ) {
    return this.salesReturnsService.update(organizationId, id, dto);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve a sales return' })
  approve(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
  ) {
    return this.salesReturnsService.approve(organizationId, id);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject a sales return' })
  reject(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ) {
    return this.salesReturnsService.reject(organizationId, id, reason);
  }

  @Post(':id/receive')
  @ApiOperation({ summary: 'Receive returned items' })
  receiveReturn(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
    @Body() dto: ReceiveReturnDto,
  ) {
    return this.salesReturnsService.receiveReturn(organizationId, id, dto);
  }

  @Post(':id/refund')
  @ApiOperation({ summary: 'Process refund for a return' })
  processRefund(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
    @Body() dto: ProcessRefundDto,
  ) {
    return this.salesReturnsService.processRefund(organizationId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a sales return' })
  delete(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
  ) {
    return this.salesReturnsService.delete(organizationId, id);
  }
}
