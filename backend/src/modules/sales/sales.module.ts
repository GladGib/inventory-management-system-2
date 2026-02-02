import { Module } from '@nestjs/common';
import { SalesController, PickListsController } from './sales.controller';
import { SalesService } from './sales.service';
import { OrganizationsModule } from '../organizations/organizations.module';

@Module({
  imports: [OrganizationsModule],
  controllers: [SalesController, PickListsController],
  providers: [SalesService],
  exports: [SalesService],
})
export class SalesModule {}
