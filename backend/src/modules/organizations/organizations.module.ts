import { Module } from '@nestjs/common';
import { OrganizationsController, SettingsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';

@Module({
  controllers: [OrganizationsController, SettingsController],
  providers: [OrganizationsService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
