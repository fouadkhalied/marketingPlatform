import { eq, desc, and, sql, inArray } from "drizzle-orm";
import { db } from "../../../db/connection";
import { notifications, Notification, InsertNotification } from "../../schema/schema";
import { INotificationRepository } from "./notification.repository.interface";

export class NotificationRepositoryImpl implements INotificationRepository {
  async create(notification: InsertNotification): Promise<Notification> {
    const [created] = await db
      .insert(notifications)
      .values(notification)
      .returning();

    if (!created) {
      throw new Error("Failed to create notification");
    }

    console.log("💾 Notification saved to database:", {
      id: created.id,
      userId: created.userId,
      module: created.module,
      type: created.type,
      title: created.title,
      message: created.message,
      read: created.read,
      createdAt: created.createdAt
    });

    return created;
  }

  async findById(id: string): Promise<Notification | null> {
    const [notification] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id))
      .limit(1);

    return notification || null;
  }

  async findByUserId(userId: string, limit: number = 50, offset: number = 0): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async findUnread(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.read, false)
        )
      )
      .orderBy(desc(notifications.createdAt));
  }

  async markAsRead(id: string): Promise<Notification | null> {
    const [updated] = await db
      .update(notifications)
      .set({ 
        read: true,
        updatedAt: new Date()
      })
      .where(eq(notifications.id, id))
      .returning();

    return updated || null;
  }

  /**
   * Mark multiple notifications as read by their IDs
   * @param ids Array of notification IDs to mark as read
   * @param userId Optional: verify notifications belong to this user
   * @returns Number of notifications marked as read
   */
  async markManyAsRead(ids: string[], userId?: string): Promise<number> {
    if (ids.length === 0) {
      return 0;
    }

    const conditions = [inArray(notifications.id, ids)];
    
    // Optional: Only mark as read if notifications belong to the user
    if (userId) {
      conditions.push(eq(notifications.userId, userId));
    }

    const result = await db
      .update(notifications)
      .set({ 
        read: true,
        updatedAt: new Date()
      })
      .where(and(...conditions));

    console.log(`✅ Marked ${result.rowCount} notifications as read`);
    return result.rowCount || 0;
  }

  /**
   * Mark all unread notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    const result = await db
      .update(notifications)
      .set({ 
        read: true,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.read, false)
        )
      );
    
    console.log(`✅ Marked all (${result.rowCount}) notifications as read for user ${userId}`);
  }

  async getUnreadCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.read, false)
        )
      );

    return Number(result?.count || 0);
  }

  async delete(id: string): Promise<boolean> {
    const result = await db
      .delete(notifications)
      .where(eq(notifications.id, id));

    return result.rowCount! > 0;
  }

  async deleteByUserId(userId: string): Promise<number> {
    const result = await db
      .delete(notifications)
      .where(eq(notifications.userId, userId));

    return result.rowCount!;
  }

  /**
   * Delete multiple notifications by their IDs
   * @param ids Array of notification IDs to delete
   * @param userId Optional: only delete if notifications belong to this user
   * @returns Number of notifications deleted
   */
  async deleteMany(ids: string[], userId?: string): Promise<number> {
    if (ids.length === 0) {
      return 0;
    }

    const conditions = [inArray(notifications.id, ids)];
    
    if (userId) {
      conditions.push(eq(notifications.userId, userId));
    }

    const result = await db
      .delete(notifications)
      .where(and(...conditions));

    console.log(`🗑️ Deleted ${result.rowCount} notifications`);
    return result.rowCount || 0;
  }
}