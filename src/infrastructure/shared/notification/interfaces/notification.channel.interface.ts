import { NotificationPayload } from "./notification.payload.interface";

export interface NotificationChannel {
    name: string;
    send(payload: NotificationPayload): Promise<void>;
  }