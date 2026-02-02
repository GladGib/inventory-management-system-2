import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators';
import { ReportsService } from './reports.service';
import { ReportQueryDto } from './dto/report.dto';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales-summary')
  @ApiOperation({ summary: 'Get sales summary report' })
  getSalesSummary(
    @CurrentUser('organizationId') organizationId: string,
    @Query() query: ReportQueryDto,
  ) {
    return this.reportsService.getSalesSummary(organizationId, query);
  }

  @Get('inventory-summary')
  @ApiOperation({ summary: 'Get inventory summary report' })
  getInventorySummary(
    @CurrentUser('organizationId') organizationId: string,
    @Query() query: ReportQueryDto,
  ) {
    return this.reportsService.getInventorySummary(organizationId, query);
  }

  @Get('purchase-summary')
  @ApiOperation({ summary: 'Get purchase summary report' })
  getPurchaseSummary(
    @CurrentUser('organizationId') organizationId: string,
    @Query() query: ReportQueryDto,
  ) {
    return this.reportsService.getPurchaseSummary(organizationId, query);
  }

  @Get('receivables-summary')
  @ApiOperation({ summary: 'Get accounts receivable summary' })
  getReceivablesSummary(
    @CurrentUser('organizationId') organizationId: string,
  ) {
    return this.reportsService.getReceivablesSummary(organizationId);
  }

  @Get('payables-summary')
  @ApiOperation({ summary: 'Get accounts payable summary' })
  getPayablesSummary(
    @CurrentUser('organizationId') organizationId: string,
  ) {
    return this.reportsService.getPayablesSummary(organizationId);
  }
}

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  getStats(@CurrentUser('organizationId') organizationId: string) {
    return this.reportsService.getDashboardStats(organizationId);
  }
}
