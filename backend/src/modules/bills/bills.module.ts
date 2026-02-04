import { Module } from '@nestjs/common';
import { BillsController, PaymentsMadeController, VendorCreditNotesController } from './bills.controller';
import { BillsService } from './bills.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BillsController, PaymentsMadeController, VendorCreditNotesController],
  providers: [BillsService],
  exports: [BillsService],
})
export class BillsModule {}
