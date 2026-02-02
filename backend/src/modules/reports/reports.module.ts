import { Module } from '@nestjs/common';
import { ReportsController, DashboardController } from './reports.controller';
import { ReportsService } from './reports.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ReportsController, DashboardController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
