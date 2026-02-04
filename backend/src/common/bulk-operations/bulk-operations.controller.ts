import {
  Controller,
  Post,
  Get,
  Query,
  Body,
  UseInterceptors,
  UploadedFile,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { BulkOperationsService } from './bulk-operations.service';
import { CurrentUser } from '../decorators/current-user.decorator';

interface JwtPayload {
  sub: string;
  email: string;
  organizationId: string;
  role: string;
}

@ApiTags('bulk-operations')
@ApiBearerAuth()
@Controller('bulk')
export class BulkOperationsController {
  constructor(private readonly bulkService: BulkOperationsService) {}

  // =====================
  // ITEM IMPORT
  // =====================

  @Get('items/template')
  @ApiOperation({ summary: 'Download item import CSV template' })
  @ApiResponse({ status: 200, description: 'CSV template file' })
  getItemTemplate(@Res() res: Response) {
    const csv = this.bulkService.getItemTemplate();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="item-import-template.csv"');
    res.send(csv);
  }

  @Post('items/validate')
  @ApiOperation({ summary: 'Validate item import CSV (dry run)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async validateItemImport(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!file) {
      return { statusCode: HttpStatus.BAD_REQUEST, message: 'No file provided' };
    }
    const content = file.buffer.toString('utf-8');
    return this.bulkService.validateItemImport(user.organizationId, content);
  }

  @Post('items/import')
  @ApiOperation({ summary: 'Import items from CSV' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        skipErrors: { type: 'boolean' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async importItems(
    @UploadedFile() file: Express.Multer.File,
    @Query('skipErrors') skipErrors: string,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!file) {
      return { statusCode: HttpStatus.BAD_REQUEST, message: 'No file provided' };
    }
    const content = file.buffer.toString('utf-8');
    return this.bulkService.importItems(
      user.organizationId,
      content,
      skipErrors === 'true',
    );
  }

  // =====================
  // CUSTOMER IMPORT
  // =====================

  @Get('customers/template')
  @ApiOperation({ summary: 'Download customer import CSV template' })
  getCustomerTemplate(@Res() res: Response) {
    const csv = this.bulkService.getCustomerTemplate();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="customer-import-template.csv"');
    res.send(csv);
  }

  @Post('customers/import')
  @ApiOperation({ summary: 'Import customers from CSV' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async importCustomers(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!file) {
      return { statusCode: HttpStatus.BAD_REQUEST, message: 'No file provided' };
    }
    const content = file.buffer.toString('utf-8');
    return this.bulkService.importCustomers(user.organizationId, content);
  }

  // =====================
  // VENDOR IMPORT
  // =====================

  @Get('vendors/template')
  @ApiOperation({ summary: 'Download vendor import CSV template' })
  getVendorTemplate(@Res() res: Response) {
    const csv = this.bulkService.getVendorTemplate();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="vendor-import-template.csv"');
    res.send(csv);
  }

  @Post('vendors/import')
  @ApiOperation({ summary: 'Import vendors from CSV' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async importVendors(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!file) {
      return { statusCode: HttpStatus.BAD_REQUEST, message: 'No file provided' };
    }
    const content = file.buffer.toString('utf-8');
    return this.bulkService.importVendors(user.organizationId, content);
  }

  // =====================
  // EXCEL EXPORTS
  // =====================

  @Get('export/stock-valuation')
  @ApiOperation({ summary: 'Export stock valuation report to Excel' })
  @ApiQuery({ name: 'warehouseId', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  async exportStockValuation(
    @CurrentUser() user: JwtPayload,
    @Query('warehouseId') warehouseId?: string,
    @Query('categoryId') categoryId?: string,
    @Res() res?: Response,
  ) {
    const buffer = await this.bulkService.exportStockValuation(
      user.organizationId,
      warehouseId,
      categoryId,
    );

    res!.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res!.setHeader('Content-Disposition', 'attachment; filename="stock-valuation.xlsx"');
    res!.send(buffer);
  }

  @Get('export/sales-by-customer')
  @ApiOperation({ summary: 'Export sales by customer report to Excel' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  async exportSalesByCustomer(
    @CurrentUser() user: JwtPayload,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Res() res?: Response,
  ) {
    const buffer = await this.bulkService.exportSalesByCustomer(
      user.organizationId,
      new Date(startDate),
      new Date(endDate),
    );

    res!.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res!.setHeader('Content-Disposition', 'attachment; filename="sales-by-customer.xlsx"');
    res!.send(buffer);
  }
}
