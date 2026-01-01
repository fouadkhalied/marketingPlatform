import { NotificationChannel } from "../interfaces/notification.channel.interface";
import { NotificationPayload } from "../interfaces/notification.payload.interface";

export class EmailNotificationChannel implements NotificationChannel {
    name = "email";
  
    async send(payload: NotificationPayload): Promise<void> {
      // Implement email sending logic
      console.log(`📧 Email sent to user ${payload.userId}: ${payload.title}`);
    }
  }
  