import { Module } from '@nestjs/common';
import { SalesController, PickListsController, ShipmentsController } from './sales.controller';
import { SalesService } from './sales.service';
import { ShipmentsService } from './shipments.service';
import { OrganizationsModule } from '../organizations/organizations.module';
import { PdfModule } from '@/common/pdf';

@Module({
  imports: [OrganizationsModule, PdfModule],
  controllers: [SalesController, PickListsController, ShipmentsController],
  providers: [SalesService, ShipmentsService],
  exports: [SalesService, ShipmentsService],
})
export class SalesModule {}
