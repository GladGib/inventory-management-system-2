import { Module } from '@nestjs/common';
import { ItemsController, CategoriesController } from './items.controller';
import { ItemsService } from './items.service';
import { VariantsService } from './variants.service';
import { OrganizationsModule } from '../organizations/organizations.module';

@Module({
  imports: [OrganizationsModule],
  controllers: [ItemsController, CategoriesController],
  providers: [ItemsService, VariantsService],
  exports: [ItemsService, VariantsService],
})
export class ItemsModule {}
