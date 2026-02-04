import { Module } from '@nestjs/common';
import { CreditNotesController } from './credit-notes.controller';
import { CreditNotesService } from './credit-notes.service';
import { OrganizationsModule } from '../organizations/organizations.module';
import { PdfModule } from '@/common/pdf';

@Module({
  imports: [OrganizationsModule, PdfModule],
  controllers: [CreditNotesController],
  providers: [CreditNotesService],
  exports: [CreditNotesService],
})
export class CreditNotesModule {}
