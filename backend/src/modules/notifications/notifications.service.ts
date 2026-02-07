import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/common/prisma';
import { RegisterDeviceDto, UpdatePreferencesDto } from './dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Register a device token for push notifications
   */
  async registerDevice(
    userId: string,
    dto: RegisterDeviceDto,
  ) {
    // Upsert: if token exists, update; otherwise create
    const device = await this.prisma.deviceToken.upsert({
      where: { token: dto.token },
      update: {
        userId,
        platform: dto.platform,
        deviceName: dto.deviceName,
        isActive: true,
        updatedAt: new Date(),
      },
      create: {
        userId,
        token: dto.token,
        platform: dto.platform,
        deviceName: dto.deviceName,
        isActive: true,
      },
    });

    this.logger.log(`Device registered for user ${userId}: ${dto.platform}`);
    return device;
  }

  /**
   * Unregister a device token
   */
  async unregisterDevice(token: string) {
    try {
      await this.prisma.deviceToken.update({
        where: { token },
        data: { isActive: false },
      });
      this.logger.log(`Device unregistered: ${token.substring(0, 20)}...`);
      return { message: 'Device unregistered successfully' };
    } catch {
      // Token may not exist, that's fine
      return { message: 'Device token not found or already removed' };
    }
  }

  /**
   * Get notification preferences for a user
   */
  async getPreferences(userId: string) {
    let prefs = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });

    // Return defaults if no preferences exist yet
    if (!prefs) {
      prefs = await this.prisma.notificationPreference.create({
        data: {
          userId,
          pickListAlerts: true,
          lowStockAlerts: true,
          grnAlerts: true,
        },
      });
    }

    return prefs;
  }

  /**
   * Update notification preferences for a user
   */
  async updatePreferences(userId: string, dto: UpdatePreferencesDto) {
    const prefs = await this.prisma.notificationPreference.upsert({
      where: { userId },
      update: {
        ...(dto.pickListAlerts !== undefined && { pickListAlerts: dto.pickListAlerts }),
        ...(dto.lowStockAlerts !== undefined && { lowStockAlerts: dto.lowStockAlerts }),
        ...(dto.grnAlerts !== undefined && { grnAlerts: dto.grnAlerts }),
      },
      create: {
        userId,
        pickListAlerts: dto.pickListAlerts ?? true,
        lowStockAlerts: dto.lowStockAlerts ?? true,
        grnAlerts: dto.grnAlerts ?? true,
      },
    });

    return prefs;
  }

  /**
   * Send a notification to a specific user.
   * Logs the notification and would send via FCM in production.
   */
  async sendNotification(
    userId: string,
    title: string,
    body: string,
    type: string,
    referenceId?: string,
  ) {
    // Check user preferences
    const prefs = await this.getPreferences(userId);

    // Filter based on preference type
    if (type === 'PICK_LIST' && !prefs.pickListAlerts) return null;
    if (type === 'LOW_STOCK' && !prefs.lowStockAlerts) return null;
    if (type === 'GRN' && !prefs.grnAlerts) return null;

    // Log the notification
    const log = await this.prisma.notificationLog.create({
      data: {
        userId,
        title,
        body,
        type,
        referenceId,
        status: 'pending',
      },
    });

    // Get active device tokens for the user
    const devices = await this.prisma.deviceToken.findMany({
      where: { userId, isActive: true },
    });

    if (devices.length === 0) {
      this.logger.warn(`No active devices for user ${userId}, notification logged only`);
      return log;
    }

    // FCM send placeholder
    // In production, integrate with Firebase Admin SDK:
    //
    // import * as admin from 'firebase-admin';
    // const tokens = devices.map(d => d.token);
    // const message = {
    //   notification: { title, body },
    //   data: { type, referenceId: referenceId || '' },
    //   tokens,
    // };
    // const response = await admin.messaging().sendEachForMulticast(message);
    // // Handle failures and mark invalid tokens

    this.logger.log(
      `Notification queued for user ${userId}: "${title}" -> ${devices.length} device(s)`,
    );

    // Mark as sent (in production, update after actual FCM send)
    await this.prisma.notificationLog.update({
      where: { id: log.id },
      data: { status: 'sent', sentAt: new Date() },
    });

    return log;
  }

  /**
   * Notify relevant users when a pick list is created
   */
  async notifyPickListCreated(pickListId: string, warehouseId: string) {
    try {
      // Find the pick list details
      const pickList = await this.prisma.pickList.findUnique({
        where: { id: pickListId },
        include: {
          salesOrder: {
            include: { customer: true },
          },
        },
      });

      if (!pickList) return;

      const customerName = pickList.salesOrder.customer.companyName;
      const title = 'New Pick List Created';
      const body = `Pick list ${pickList.pickNumber} for ${customerName} is ready for picking.`;

      // If assigned to a specific user, notify them
      if (pickList.assignedTo) {
        await this.sendNotification(
          pickList.assignedTo,
          title,
          body,
          'PICK_LIST',
          pickListId,
        );
        return;
      }

      // Otherwise, find warehouse users (users in the organization)
      const warehouse = await this.prisma.warehouse.findUnique({
        where: { id: warehouseId },
      });

      if (!warehouse) return;

      // Get users in the same organization who have device tokens
      const deviceTokens = await this.prisma.deviceToken.findMany({
        where: { isActive: true },
        select: { userId: true },
      });

      const userIds = [...new Set(deviceTokens.map((d) => d.userId))];

      // Filter to users in the same organization
      const orgUsers = await this.prisma.user.findMany({
        where: {
          id: { in: userIds },
          organizationId: warehouse.organizationId,
          isActive: true,
        },
        select: { id: true },
      });

      for (const user of orgUsers) {
        await this.sendNotification(
          user.id,
          title,
          body,
          'PICK_LIST',
          pickListId,
        );
      }
    } catch (e) {
      this.logger.error(`Failed to notify pick list created: ${e}`);
    }
  }

  /**
   * Notify inventory managers when stock falls below reorder point
   */
  async notifyLowStock(
    itemId: string,
    currentQty: number,
    reorderPoint: number,
  ) {
    try {
      const item = await this.prisma.item.findUnique({
        where: { id: itemId },
        select: {
          name: true,
          code: true,
          organizationId: true,
        },
      });

      if (!item) return;

      const title = 'Low Stock Alert';
      const body = `${item.name} (${item.code}) is below reorder point. Current: ${currentQty}, Reorder point: ${reorderPoint}.`;

      // Get users in the same organization with device tokens
      const deviceTokens = await this.prisma.deviceToken.findMany({
        where: { isActive: true },
        select: { userId: true },
      });

      const userIds = [...new Set(deviceTokens.map((d) => d.userId))];

      const orgUsers = await this.prisma.user.findMany({
        where: {
          id: { in: userIds },
          organizationId: item.organizationId,
          isActive: true,
        },
        select: { id: true },
      });

      for (const user of orgUsers) {
        await this.sendNotification(
          user.id,
          title,
          body,
          'LOW_STOCK',
          itemId,
        );
      }
    } catch (e) {
      this.logger.error(`Failed to notify low stock: ${e}`);
    }
  }

  /**
   * Notify the PO creator when a GRN is completed
   */
  async notifyGRNCompleted(grnId: string, createdBy: string) {
    try {
      const grn = await this.prisma.goodsReceivedNote.findUnique({
        where: { id: grnId },
        include: {
          vendor: true,
          purchaseOrder: true,
        },
      });

      if (!grn) return;

      const title = 'Goods Received';
      const body = `GRN ${grn.grnNumber} from ${grn.vendor.companyName} has been completed.`;

      // Notify the GRN creator
      await this.sendNotification(
        createdBy,
        title,
        body,
        'GRN',
        grnId,
      );

      // If there's a PO, also notify the PO creator
      if (grn.purchaseOrder?.createdBy && grn.purchaseOrder.createdBy !== createdBy) {
        await this.sendNotification(
          grn.purchaseOrder.createdBy,
          title,
          body,
          'GRN',
          grnId,
        );
      }
    } catch (e) {
      this.logger.error(`Failed to notify GRN completed: ${e}`);
    }
  }

  /**
   * Remove inactive or invalid device tokens
   */
  async cleanupInvalidTokens() {
    // Remove tokens that haven't been updated in 90 days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);

    const result = await this.prisma.deviceToken.deleteMany({
      where: {
        OR: [
          { isActive: false },
          { updatedAt: { lt: cutoffDate } },
        ],
      },
    });

    this.logger.log(`Cleaned up ${result.count} invalid device tokens`);
    return { removed: result.count };
  }

  /**
   * Get notification log for a user with pagination
   */
  async getNotificationLog(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      this.prisma.notificationLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notificationLog.count({
        where: { userId },
      }),
    ]);

    return {
      data: notifications,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
