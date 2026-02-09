import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { RegisterDeviceDto, UpdatePreferencesDto } from './dto';
import { CurrentUser, RequirePermissions, AuditEntity } from '@/common/decorators';

@ApiTags('Notifications')
@ApiBearerAuth()
@AuditEntity('Notification')
@Controller()
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Post('devices/register')
  @RequirePermissions('notifications:edit')
  @ApiOperation({ summary: 'Register a device token for push notifications' })
  @ApiResponse({ status: 201, description: 'Device registered' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async registerDevice(
    @CurrentUser('userId') userId: string,
    @Body() dto: RegisterDeviceDto,
  ) {
    const device = await this.notificationsService.registerDevice(userId, dto);
    return { data: device };
  }

  @Delete('devices/:token')
  @RequirePermissions('notifications:edit')
  @ApiOperation({ summary: 'Unregister a device token' })
  @ApiResponse({ status: 200, description: 'Device unregistered' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Device token not found' })
  async unregisterDevice(
    @Param('token') token: string,
  ) {
    const result = await this.notificationsService.unregisterDevice(token);
    return { data: result };
  }

  @Get('users/me/notification-preferences')
  @RequirePermissions('notifications:view')
  @ApiOperation({ summary: 'Get current user notification preferences' })
  @ApiResponse({ status: 200, description: 'Notification preferences' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPreferences(
    @CurrentUser('userId') userId: string,
  ) {
    const prefs = await this.notificationsService.getPreferences(userId);
    return { data: prefs };
  }

  @Put('users/me/notification-preferences')
  @RequirePermissions('notifications:edit')
  @ApiOperation({ summary: 'Update current user notification preferences' })
  @ApiResponse({ status: 200, description: 'Preferences updated' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updatePreferences(
    @CurrentUser('userId') userId: string,
    @Body() dto: UpdatePreferencesDto,
  ) {
    const prefs = await this.notificationsService.updatePreferences(userId, dto);
    return { data: prefs };
  }

  @Get('notifications')
  @RequirePermissions('notifications:view')
  @ApiOperation({ summary: 'Get notification log for current user' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Notification log' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getNotifications(
    @CurrentUser('userId') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.notificationsService.getNotificationLog(
      userId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }
}
