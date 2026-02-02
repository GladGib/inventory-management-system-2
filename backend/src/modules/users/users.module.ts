import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { RolesGuard } from '@/common/guards/roles.guard';

@Module({
  controllers: [UsersController],
  providers: [
    UsersService,
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  exports: [UsersService],
})
export class UsersModule {}
