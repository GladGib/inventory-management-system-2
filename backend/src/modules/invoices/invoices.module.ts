import { Module } from '@nestjs/common';
import { InvoicesController, PaymentsReceivedController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { OrganizationsModule } from '../organizations/organizations.module';
import { PdfModule } from '@/common/pdf';
import { EmailModule } from '@/common/email';

@Module({
  imports: [OrganizationsModule, PdfModule, EmailModule],
  controllers: [InvoicesController, PaymentsReceivedController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
