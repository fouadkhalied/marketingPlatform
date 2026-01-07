import { ILogger } from "../../common/logging";
import { NotificationBuilder } from "../builder/notification.builder";
import { NotificationChannel } from "../interfaces/notification.channel.interface";
import { NotificationPayload } from "../interfaces/notification.payload.interface";
import { INotificationRepository } from "../repositories/notification.repository.interface";
import { NotificationType } from "../enum/notification.type.enum";

export class NotificationService {
  private channels: NotificationChannel[] = [];

  constructor(
    private readonly logger: ILogger,
    private readonly notificationRepo: INotificationRepository
  ) { }

  registerChannel(channel: NotificationChannel): void {
    this.channels.push(channel);
    this.logger.info(`Notification channel registered: ${channel.name}`);
    console.log(`✅ Registered channel: ${channel.name}`);
  }

  /**
   * Fire and forget notification - runs asynchronously without blocking
   * Sends user-specific notifications (not admin broadcasts)
   */
  notify(notification: NotificationPayload | NotificationBuilder): void {
    console.log('🔔 notify() called');

    const payload = notification instanceof NotificationBuilder
      ? notification.build()
      : notification;

    console.log('📤 Notification payload prepared:', {
      userId: payload.userId,
      module: payload.module,
      type: payload.type
    });

    this.sendNotification(payload).catch((error) => {
      this.logger.error("Notification failed", {
        payload,
        error: error instanceof Error ? error.message : error,
      });
      console.error("❌ Notification failed:", error);
    });
  }

  private async sendNotification(payload: NotificationPayload): Promise<void> {
    try {
      console.log('📨 sendNotification() started for user:', payload.userId);
      console.log('📋 Active channels:', this.channels.map(c => c.name));

      this.logger.info("Sending notification", {
        userId: payload.userId,
        module: payload.module,
        type: payload.type
      });

      // Get the template for this notification type
      const template = await this.notificationRepo.getTemplateByType(payload.type);

      if (!template) {
        throw new Error(`Template not found for notification type: ${payload.type}`);
      }

      // Save notification to database (user-specific notification)
      try {
        const savedNotification = await this.notificationRepo.create({
          userId: payload.userId,
          templateId: template.id,
          metadata: payload.metadata || {},
          read: false,
        });

        this.logger.info("Notification saved to database", {
          userId: payload.userId,
          type: payload.type,
          notificationId: savedNotification.id
        });

        console.log("✅ Notification saved to DB:", savedNotification.id);

        // Prepare payload for real-time delivery with template data
        const realtimePayload: NotificationPayload = {
          ...payload,
          id: savedNotification.id,
          title: {
            en: template.titleEn,
            ar: template.titleAr
          },
          message: {
            en: template.messageEn,
            ar: template.messageAr
          },
          isAdminNotification: false
        };

        // Send through real-time channels (SSE, etc.)
        console.log(`📡 Sending through ${this.channels.length} channel(s)...`);

        const results = await Promise.allSettled(
          this.channels.map((channel) => {
            console.log(`  → Sending to channel: ${channel.name}`);
            return channel.send(realtimePayload);
          })
        );

        results.forEach((result, index) => {
          if (result.status === "rejected") {
            this.logger.error(`Channel ${this.channels[index].name} failed`, {
              error: result.reason,
              payload,
            });
            console.error(`❌ Channel ${this.channels[index].name} failed:`, result.reason);
          } else {
            console.log(`✅ Channel ${this.channels[index].name} succeeded`);
          }
        });

      } catch (error) {
        this.logger.error("Failed to save notification to database", {
          userId: payload.userId,
          type: payload.type,
          error: error instanceof Error ? error.message : error,
        });
        console.error("❌ Failed to save notification to DB:", error);
        throw error;
      }

      this.logger.info("Notification sent successfully", {
        userId: payload.userId,
        type: payload.type
      });

      console.log('✅ sendNotification() completed successfully');
    } catch (error) {
      this.logger.error("Error in notification pipeline", {
        payload,
        error: error instanceof Error ? error.message : error,
      });
      console.error("❌ Error in notification pipeline:", error);
      throw error;
    }
  }


  /**
   * Send admin broadcast notification
   * Creates ONE admin notification that all users can see
   * Only sends real-time to connected users via SSE
   * 
   * @param adminId - ID of the admin creating the broadcast
   * @param data - Custom content for the notification
   */
  async sendAdminBroadcast(
    adminId: string,
    data: {
      titleEn: string;
      titleAr: string;
      messageEn: string;
      messageAr: string;
      metadata?: Record<string, any>;
    }
  ): Promise<string> {
    try {
      console.log('📢 Admin broadcast initiated by admin:', adminId);

      // Create ONE admin notification (tied to the admin who created it)
      const adminNotification = await this.notificationRepo.createAdminNotification({
        userId: adminId,
        titleEn: data.titleEn,
        titleAr: data.titleAr,
        messageEn: data.messageEn,
        messageAr: data.messageAr,
        metadata: data.metadata || {}
      });

      this.logger.info("Admin notification created", {
        adminNotificationId: adminNotification.id
      });

      console.log(`✅ Admin notification saved to DB: ${adminNotification.id}`);

      // Create payload for SSE broadcast to connected users
      // const payload: NotificationPayload = {
      //   id: adminNotification.id,
      //   userId: '', // Will be ignored by broadcast
      //   module: 'ADMIN',
      //   type: 'ADMIN_BROADCAST',
      //   title: {
      //     en: data.titleEn,
      //     ar: data.titleAr
      //   },
      //   message: {
      //     en: data.messageEn,
      //     ar: data.messageAr
      //   },
      //   metadata: data.metadata || {},
      //   timestamp: new Date(),
      //   read: false,
      //   isAdminNotification: true,
      //   fromDatabase: false
      // };

      // Broadcast to connected users only via SSE
      //await this.broadcastToChannels(payload);

      console.log(`✅ Admin broadcast completed: notification ${adminNotification.id}`);
      return adminNotification.id;

    } catch (error) {
      this.logger.error("Admin broadcast failed", {
        error: error instanceof Error ? error.message : error,
      });
      console.error("❌ Admin broadcast failed:", error);
      throw error;
    }
  }

  /**
   * Broadcast to all connected users via channels (SSE)
   * Only sends to users currently online
   */
  private async broadcastToChannels(payload: Omit<NotificationPayload, 'userId'>): Promise<void> {
    const results = await Promise.allSettled(
      this.channels.map(channel => {
        // Check if channel supports broadcast (like SSE does)
        if ('broadcast' in channel && typeof channel.broadcast === 'function') {
          return (channel as any).broadcast(payload);
        }
        return Promise.resolve();
      })
    );

    results.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error(`❌ Channel ${this.channels[index].name} broadcast failed:`, result.reason);
      } else {
        console.log(`✅ Channel ${this.channels[index].name} broadcast succeeded`);
      }
    });
  }
}