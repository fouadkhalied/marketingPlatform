import { Notification, InsertNotification } from "../../schema/schema";

export interface INotificationRepository {
  create(notification: InsertNotification): Promise<Notification>;
  findById(id: string): Promise<Notification | null>;
  findByUserId(userId: string, limit?: number, offset?: number): Promise<Notification[]>;
  findUnread(userId: string): Promise<Notification[]>;
  markAsRead(id: string): Promise<Notification | null>;
  markAllAsRead(userId: string): Promise<void>;
  getUnreadCount(userId: string): Promise<number>;
  delete(id: string): Promise<boolean>;
  deleteByUserId(userId: string): Promise<number>;
}

