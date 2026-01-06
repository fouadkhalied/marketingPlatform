import { NotificationModule } from "../enum/notification.module.enum";
import { NotificationType } from "../enum/notification.type.enum";

export interface NotificationPayload {
    id?: string;
    userId: string;
    module: NotificationModule;
    type: NotificationType;
    title: {en: string, ar: string};
    message: {en: string, ar: string};
    metadata?: Record<string, any>;
    timestamp: Date;
    read?: boolean;
    fromDatabase?: boolean;
    isAdminNotification: boolean;
  }