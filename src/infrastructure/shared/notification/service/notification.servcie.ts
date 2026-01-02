import { ILogger } from "../../common/logging";
import { NotificationBuilder } from "../builder/notification.builder";
import { NotificationChannel } from "../interfaces/notification.channel.interface";
import { NotificationPayload } from "../interfaces/notification.payload.interface";
import { INotificationRepository } from "../repositories/notification.repository.interface";

export class NotificationService {
    private channels: NotificationChannel[] = [];
    
    constructor(
        private readonly logger: ILogger,
        private readonly notificationRepo: INotificationRepository
    ) {}
  
    registerChannel(channel: NotificationChannel): void {
      this.channels.push(channel);
      this.logger.info(`Notification channel registered: ${channel.name}`);
      console.log(`✅ Registered channel: ${channel.name}`);
    }
  
    /**
     * Fire and forget notification - runs asynchronously without blocking
     * Can accept either a NotificationPayload or a NotificationBuilder
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

        // Save notification to database first to ensure it's persisted
        try {
          const savedNotification = await this.notificationRepo.create({
            userId: payload.userId,
            module: payload.module,
            type: payload.type,
            title: payload.title,
            message: payload.message,
            metadata: payload.metadata || {},
            read: false,
          });
          
          this.logger.info("Notification saved to database", {
            userId: payload.userId,
            type: payload.type,
            notificationId: savedNotification.id
          });
          
          console.log("✅ Notification saved to DB:", savedNotification.id);
        } catch (error) {
          this.logger.error("Failed to save notification to database", {
            userId: payload.userId,
            type: payload.type,
            error: error instanceof Error ? error.message : error,
          });
          console.error("❌ Failed to save notification to DB:", error);
          // Continue even if database save fails
        }

        // Send notification through all channels
        console.log(`📡 Sending through ${this.channels.length} channel(s)...`);
        
        const results = await Promise.allSettled(
          this.channels.map((channel) => {
            console.log(`  → Sending to channel: ${channel.name}`);
            return channel.send(payload);
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
}