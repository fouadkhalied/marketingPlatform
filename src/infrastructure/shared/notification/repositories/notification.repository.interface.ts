import { Notification, InsertNotification } from "../../schema/schema";

export interface INotificationRepository {
  create(notification: InsertNotification): Promise<Notification>;
  findById(id: string): Promise<Notification | null>;
  findByUserId(userId: string, limit?: number, offset?: number): Promise<Notification[]>;
  findUnread(userId: string): Promise<Notification[]>;
  
  // Single notification operations
  markAsRead(id: string): Promise<Notification | null>;
  delete(id: string): Promise<boolean>;
  
  // Batch operations
  markManyAsRead(ids: string[], userId?: string): Promise<number>;
  markAllAsRead(userId: string): Promise<void>;
  deleteMany(ids: string[], userId?: string): Promise<number>;
  deleteByUserId(userId: string): Promise<number>;
  
  // Stats
  getUnreadCount(userId: string): Promise<number>;
}