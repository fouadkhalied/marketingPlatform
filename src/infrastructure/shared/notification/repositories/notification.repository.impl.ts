import { eq, desc, and, sql } from "drizzle-orm";
import { db } from "../../../db/connection";
import { notifications, Notification ,InsertNotification} from "../../schema/schema";
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

  async markAllAsRead(userId: string): Promise<void> {
    await db
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
}

