import { Module } from '@nestjs/common';
import { PurchasesController, GRNsController } from './purchases.controller';
import { PurchasesService } from './purchases.service';
import { OrganizationsModule } from '../organizations/organizations.module';
import { PdfModule } from '@/common/pdf';
import { EmailModule } from '@/common/email';

@Module({
  imports: [OrganizationsModule, PdfModule, EmailModule],
  controllers: [PurchasesController, GRNsController],
  providers: [PurchasesService],
  exports: [PurchasesService],
})
export class PurchasesModule {}
