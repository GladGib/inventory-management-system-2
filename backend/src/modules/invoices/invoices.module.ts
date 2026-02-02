import { Module } from '@nestjs/common';
import { InvoicesController, PaymentsReceivedController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { OrganizationsModule } from '../organizations/organizations.module';

@Module({
  imports: [OrganizationsModule],
  controllers: [InvoicesController, PaymentsReceivedController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
