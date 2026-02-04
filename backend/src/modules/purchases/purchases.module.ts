import { Module } from '@nestjs/common';
import { PurchasesController, GRNsController } from './purchases.controller';
import { PurchasesService } from './purchases.service';
import { OrganizationsModule } from '../organizations/organizations.module';
import { PdfModule } from '@/common/pdf';

@Module({
  imports: [OrganizationsModule, PdfModule],
  controllers: [PurchasesController, GRNsController],
  providers: [PurchasesService],
  exports: [PurchasesService],
})
export class PurchasesModule {}
