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
import { CurrentUser } from '@/common/decorators';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller()
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Post('devices/register')
  @ApiOperation({ summary: 'Register a device token for push notifications' })
  @ApiResponse({ status: 201, description: 'Device registered' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async registerDevice(
    @CurrentUser('userId') userId: string,
    @Body() dto: RegisterDeviceDto,
  ) {
    const device = await this.notificationsService.registerDevice(userId, dto);
    return { data: device };
  }

  @Delete('devices/:token')
  @ApiOperation({ summary: 'Unregister a device token' })
  @ApiResponse({ status: 200, description: 'Device unregistered' })
  async unregisterDevice(
    @Param('token') token: string,
  ) {
    const result = await this.notificationsService.unregisterDevice(token);
    return { data: result };
  }

  @Get('users/me/notification-preferences')
  @ApiOperation({ summary: 'Get current user notification preferences' })
  @ApiResponse({ status: 200, description: 'Notification preferences' })
  async getPreferences(
    @CurrentUser('userId') userId: string,
  ) {
    const prefs = await this.notificationsService.getPreferences(userId);
    return { data: prefs };
  }

  @Put('users/me/notification-preferences')
  @ApiOperation({ summary: 'Update current user notification preferences' })
  @ApiResponse({ status: 200, description: 'Preferences updated' })
  async updatePreferences(
    @CurrentUser('userId') userId: string,
    @Body() dto: UpdatePreferencesDto,
  ) {
    const prefs = await this.notificationsService.updatePreferences(userId, dto);
    return { data: prefs };
  }

  @Get('notifications')
  @ApiOperation({ summary: 'Get notification log for current user' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Notification log' })
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
