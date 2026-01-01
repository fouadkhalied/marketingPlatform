import { NotificationChannel } from "../interfaces/notification.channel.interface";
import { NotificationPayload } from "../interfaces/notification.payload.interface";
import { INotificationRepository } from "../repositories/notification.repository.interface";

export class DatabaseNotificationChannel implements NotificationChannel {
    name = "database";
    
    constructor(private readonly notificationRepo: INotificationRepository) {}

    async send(payload: NotificationPayload): Promise<void> {
      await this.notificationRepo.create({
        userId: payload.userId,
        module: payload.module,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        metadata: payload.metadata || {},
        read: false,
      });
      console.log(`💾 Notification saved to database for user ${payload.userId}`);
    }
  }