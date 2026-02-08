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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
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
  @ApiResponse({ status: 201, description: 'Sales return created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(
    @CurrentUser('organizationId') organizationId: string,
    @Body() dto: CreateSalesReturnDto,
  ) {
    return this.salesReturnsService.create(organizationId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all sales returns' })
  @ApiResponse({ status: 200, description: 'Sales returns list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @CurrentUser('organizationId') organizationId: string,
    @Query() query: SalesReturnQueryDto,
  ) {
    return this.salesReturnsService.findAll(organizationId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a sales return by ID' })
  @ApiParam({ name: 'id', description: 'Sales return ID' })
  @ApiResponse({ status: 200, description: 'Sales return found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Sales return not found' })
  findOne(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
  ) {
    return this.salesReturnsService.findOne(organizationId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a sales return' })
  @ApiParam({ name: 'id', description: 'Sales return ID' })
  @ApiResponse({ status: 200, description: 'Sales return updated' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Sales return not found' })
  update(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSalesReturnDto,
  ) {
    return this.salesReturnsService.update(organizationId, id, dto);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve a sales return' })
  @ApiParam({ name: 'id', description: 'Sales return ID' })
  @ApiResponse({ status: 200, description: 'Sales return approved' })
  @ApiResponse({ status: 400, description: 'Cannot approve in current status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Sales return not found' })
  approve(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
  ) {
    return this.salesReturnsService.approve(organizationId, id);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject a sales return' })
  @ApiParam({ name: 'id', description: 'Sales return ID' })
  @ApiBody({ schema: { type: 'object', properties: { reason: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'Sales return rejected' })
  @ApiResponse({ status: 400, description: 'Cannot reject in current status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Sales return not found' })
  reject(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ) {
    return this.salesReturnsService.reject(organizationId, id, reason);
  }

  @Post(':id/receive')
  @ApiOperation({ summary: 'Receive returned items' })
  @ApiParam({ name: 'id', description: 'Sales return ID' })
  @ApiResponse({ status: 200, description: 'Return items received' })
  @ApiResponse({ status: 400, description: 'Cannot receive in current status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Sales return not found' })
  receiveReturn(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
    @Body() dto: ReceiveReturnDto,
  ) {
    return this.salesReturnsService.receiveReturn(organizationId, id, dto);
  }

  @Post(':id/refund')
  @ApiOperation({ summary: 'Process refund for a return' })
  @ApiParam({ name: 'id', description: 'Sales return ID' })
  @ApiResponse({ status: 200, description: 'Refund processed' })
  @ApiResponse({ status: 400, description: 'Invalid refund' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Sales return not found' })
  processRefund(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
    @Body() dto: ProcessRefundDto,
  ) {
    return this.salesReturnsService.processRefund(organizationId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a sales return' })
  @ApiParam({ name: 'id', description: 'Sales return ID' })
  @ApiResponse({ status: 200, description: 'Sales return deleted' })
  @ApiResponse({ status: 400, description: 'Cannot delete in current status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Sales return not found' })
  delete(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
  ) {
    return this.salesReturnsService.delete(organizationId, id);
  }
}
