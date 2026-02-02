import { Module } from '@nestjs/common';
import {
  StockAdjustmentsController,
  StockTransfersController,
  StockCountsController,
  StockMovementsController,
} from './inventory.controller';
import { InventoryService } from './inventory.service';
import { OrganizationsModule } from '../organizations/organizations.module';

@Module({
  imports: [OrganizationsModule],
  controllers: [
    StockAdjustmentsController,
    StockTransfersController,
    StockCountsController,
    StockMovementsController,
  ],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
