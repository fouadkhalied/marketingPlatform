import { eq, desc, and, sql, inArray, isNull, notInArray } from "drizzle-orm";
import { db } from "../../../db/connection";
import { 
  notifications,
  adminNotifications,
  userAdminNotificationReads,
  notificationTemplates,
  Notification,
  AdminNotification,
  NotificationWithTemplate,
  AdminNotificationWithTemplate,
  InsertNotification,
  InsertAdminNotification,
  CombinedNotification,
  NOTIFICATION_TYPES
} from "../../schema/notifications.schema";
import { INotificationRepository } from "./notification.repository.interface";

export class NotificationRepositoryImpl implements INotificationRepository {
  
  // ============ USER NOTIFICATIONS ============
  
  async create(notification: InsertNotification): Promise<Notification> {
    const [created] = await db
      .insert(notifications)
      .values(notification)
      .returning();

    if (!created) {
      throw new Error("Failed to create notification");
    }

    console.log("💾 User notification saved:", {
      id: created.id,
      userId: created.userId,
      templateId: created.templateId,
      createdAt: created.createdAt
    });

    return created;
  }

  async findById(id: string): Promise<NotificationWithTemplate | null> {
    const result = await db
      .select({
        id: notifications.id,
        userId: notifications.userId,
        templateId: notifications.templateId,
        metadata: notifications.metadata,
        read: notifications.read,
        deletedAt: notifications.deletedAt,
        createdAt: notifications.createdAt,
        updatedAt: notifications.updatedAt,
        template: notificationTemplates
      })
      .from(notifications)
      .innerJoin(notificationTemplates, eq(notifications.templateId, notificationTemplates.id))
      .where(
        and(
          eq(notifications.id, id),
          isNull(notifications.deletedAt)
        )
      )
      .limit(1);

    if (!result[0]) return null;

    return {
      ...result[0],
      template: result[0].template
    } as NotificationWithTemplate;
  }

  async findByUserId(
    userId: string, 
    limit: number = 50, 
    offset: number = 0
  ): Promise<NotificationWithTemplate[]> {
    const results = await db
      .select({
        id: notifications.id,
        userId: notifications.userId,
        templateId: notifications.templateId,
        metadata: notifications.metadata,
        read: notifications.read,
        deletedAt: notifications.deletedAt,
        createdAt: notifications.createdAt,
        updatedAt: notifications.updatedAt,
        template: notificationTemplates
      })
      .from(notifications)
      .innerJoin(notificationTemplates, eq(notifications.templateId, notificationTemplates.id))
      .where(
        and(
          eq(notifications.userId, userId),
          isNull(notifications.deletedAt)
        )
      )
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);

    return results.map(r => ({
      ...r,
      template: r.template
    })) as NotificationWithTemplate[];
  }

  async findUnread(userId: string): Promise<NotificationWithTemplate[]> {
    const results = await db
      .select({
        id: notifications.id,
        userId: notifications.userId,
        templateId: notifications.templateId,
        metadata: notifications.metadata,
        read: notifications.read,
        deletedAt: notifications.deletedAt,
        createdAt: notifications.createdAt,
        updatedAt: notifications.updatedAt,
        template: notificationTemplates
      })
      .from(notifications)
      .innerJoin(notificationTemplates, eq(notifications.templateId, notificationTemplates.id))
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.read, false),
          isNull(notifications.deletedAt)
        )
      )
      .orderBy(desc(notifications.createdAt));

    return results.map(r => ({
      ...r,
      template: r.template
    })) as NotificationWithTemplate[];
  }

  async getUnreadCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.read, false),
          isNull(notifications.deletedAt)
        )
      );

    return Number(result?.count || 0);
  }

  // ============ ADMIN NOTIFICATIONS ============

  async createAdminNotification(notification: InsertAdminNotification): Promise<AdminNotification> {
    const [created] = await db
      .insert(adminNotifications)
      .values(notification)
      .returning();

    if (!created) {
      throw new Error("Failed to create admin notification");
    }

    console.log("📢 Admin notification created:", {
      id: created.id,
      templateId: created.templateId,
      createdAt: created.createdAt
    });

    return created;
  }

  async getAdminNotificationsForUser(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<AdminNotificationWithTemplate[]> {
    // Get admin notifications with their templates
    const adminNotifsWithTemplates = await db
      .select({
        id: adminNotifications.id,
        templateId: adminNotifications.templateId,
        metadata: adminNotifications.metadata,
        createdAt: adminNotifications.createdAt,
        updatedAt: adminNotifications.updatedAt,
        template: notificationTemplates
      })
      .from(adminNotifications)
      .innerJoin(notificationTemplates, eq(adminNotifications.templateId, notificationTemplates.id))
      .orderBy(desc(adminNotifications.createdAt))
      .limit(limit)
      .offset(offset);

    // Get read status for this user
    const readStatuses = await db
      .select({
        adminNotificationId: userAdminNotificationReads.adminNotificationId,
        readAt: userAdminNotificationReads.readAt
      })
      .from(userAdminNotificationReads)
      .where(eq(userAdminNotificationReads.userId, userId));

    const readMap = new Map(
      readStatuses.map(r => [r.adminNotificationId, r.readAt])
    );

    return adminNotifsWithTemplates.map(n => ({
      ...n,
      template: n.template,
      isRead: readMap.has(n.id)
    })) as AdminNotificationWithTemplate[];
  }

  async getUnreadAdminNotifications(userId: string): Promise<AdminNotificationWithTemplate[]> {
    // Get IDs of admin notifications this user has read
    const readNotificationIds = await db
      .select({ adminNotificationId: userAdminNotificationReads.adminNotificationId })
      .from(userAdminNotificationReads)
      .where(eq(userAdminNotificationReads.userId, userId));

    const readIds = readNotificationIds.map(r => r.adminNotificationId);

    // Get all admin notifications NOT in the read list
    const query = db
      .select({
        id: adminNotifications.id,
        templateId: adminNotifications.templateId,
        metadata: adminNotifications.metadata,
        createdAt: adminNotifications.createdAt,
        updatedAt: adminNotifications.updatedAt,
        template: notificationTemplates
      })
      .from(adminNotifications)
      .innerJoin(notificationTemplates, eq(adminNotifications.templateId, notificationTemplates.id))
      .orderBy(desc(adminNotifications.createdAt));

    // Only add notInArray if there are read IDs
    const results = readIds.length > 0
      ? await query.where(notInArray(adminNotifications.id, readIds))
      : await query;

    return results.map(n => ({
      ...n,
      template: n.template,
      isRead: false
    })) as AdminNotificationWithTemplate[];
  }

  async getUnreadAdminNotificationCount(userId: string): Promise<number> {
    // Get IDs of admin notifications this user has read
    const readNotificationIds = await db
      .select({ adminNotificationId: userAdminNotificationReads.adminNotificationId })
      .from(userAdminNotificationReads)
      .where(eq(userAdminNotificationReads.userId, userId));

    const readIds = readNotificationIds.map(r => r.adminNotificationId);

    // Count admin notifications NOT in read list
    const query = db
      .select({ count: sql<number>`count(*)` })
      .from(adminNotifications);

    const [result] = readIds.length > 0
      ? await query.where(notInArray(adminNotifications.id, readIds))
      : await query;

    return Number(result?.count || 0);
  }

  async getAdminNotificationById(id: string): Promise<AdminNotificationWithTemplate | null> {
    const [result] = await db
      .select({
        id: adminNotifications.id,
        templateId: adminNotifications.templateId,
        metadata: adminNotifications.metadata,
        createdAt: adminNotifications.createdAt,
        updatedAt: adminNotifications.updatedAt,
        template: notificationTemplates
      })
      .from(adminNotifications)
      .innerJoin(notificationTemplates, eq(adminNotifications.templateId, notificationTemplates.id))
      .where(eq(adminNotifications.id, id))
      .limit(1);

    if (!result) return null;

    return {
      ...result,
      template: result.template
    } as AdminNotificationWithTemplate;
  }

  async deleteAdminNotification(id: string): Promise<boolean> {
    const result = await db
      .delete(adminNotifications)
      .where(eq(adminNotifications.id, id));

    const deleted = result.rowCount! > 0;
    if (deleted) {
      console.log(`🗑️ Admin notification deleted: ${id}`);
    }
    return deleted;
  }

  // ============ COMBINED NOTIFICATIONS ============

  async getCombinedNotifications(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<CombinedNotification[]> {
    // Get admin notifications with read status
    const adminNotifs = await this.getAdminNotificationsForUser(userId, 100, 0);
    
    // Get user notifications
    const userNotifs = await this.findByUserId(userId, 100, 0);
  
    // Combine and format
    const combined: CombinedNotification[] = [
      // Admin notifications first
      ...adminNotifs.map(n => ({
        id: n.id,
        title: { en: n.template.titleEn, ar: n.template.titleAr },
        message: { en: n.template.messageEn, ar: n.template.messageAr },
        module: n.template.module,
        type: n.template.type,
        metadata: (n.metadata as Record<string, any>) || null,
        read: n.isRead || false,
        isAdminNotification: true,
        createdAt: n.createdAt
      })),
      // Then user notifications
      ...userNotifs.map(n => ({
        id: n.id,
        title: { en: n.template.titleEn, ar: n.template.titleAr },
        message: { en: n.template.messageEn, ar: n.template.messageAr },
        module: n.template.module,
        type: n.template.type,
        metadata: (n.metadata as Record<string, any>) || null,
        read: n.read,
        isAdminNotification: false,
        createdAt: n.createdAt
      }))
    ];
  
    // Sort by date (admin priority is already implicit in order)
    combined.sort((a, b) => {
      // Admin notifications first
      if (a.isAdminNotification && !b.isAdminNotification) return -1;
      if (!a.isAdminNotification && b.isAdminNotification) return 1;
      // Then by date
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  
    // Apply pagination
    return combined.slice(offset, offset + limit);
  }

  async getCombinedUnreadCount(userId: string): Promise<number> {
    const userUnread = await this.getUnreadCount(userId);
    const adminUnread = await this.getUnreadAdminNotificationCount(userId);
    return userUnread + adminUnread;
  }

  // ============ MARK AS READ ============

  async markAsRead(id: string, userId?: string): Promise<Notification | null> {
    const conditions = [eq(notifications.id, id)];
    
    if (userId) {
      conditions.push(eq(notifications.userId, userId));
    }

    const [updated] = await db
      .update(notifications)
      .set({ 
        read: true,
        updatedAt: new Date()
      })
      .where(and(...conditions))
      .returning();

    if (updated) {
      console.log(`✅ Marked notification ${id} as read`);
    }

    return updated || null;
  }

  async markManyAsRead(ids: string[], userId?: string): Promise<number> {
    if (ids.length === 0) return 0;

    const conditions = [
      inArray(notifications.id, ids),
      isNull(notifications.deletedAt)
    ];
    
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

  async markAllAsRead(userId: string): Promise<number> {
    const result = await db
      .update(notifications)
      .set({ 
        read: true,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.read, false),
          isNull(notifications.deletedAt)
        )
      );
    
    console.log(`✅ Marked all (${result.rowCount}) user notifications as read for ${userId}`);
    return result.rowCount || 0;
  }

  async markAdminNotificationAsRead(adminNotificationId: string, userId: string): Promise<boolean> {
    try {
      await db
        .insert(userAdminNotificationReads)
        .values({
          userId,
          adminNotificationId
        })
        .onConflictDoNothing(); // Ignore if already marked as read

      console.log(`✅ Marked admin notification ${adminNotificationId} as read for user ${userId}`);
      return true;
    } catch (error) {
      console.error(`Failed to mark admin notification as read:`, error);
      return false;
    }
  }

  async markAllAdminNotificationsAsRead(userId: string): Promise<number> {
    // Get all unread admin notifications
    const unreadAdminNotifs = await this.getUnreadAdminNotifications(userId);
    
    if (unreadAdminNotifs.length === 0) return 0;

    // Insert read records for all
    const values = unreadAdminNotifs.map(n => ({
      userId,
      adminNotificationId: n.id
    }));

    await db
      .insert(userAdminNotificationReads)
      .values(values)
      .onConflictDoNothing();

    console.log(`✅ Marked ${values.length} admin notifications as read for user ${userId}`);
    return values.length;
  }

  // ============ DELETE OPERATIONS ============

  async softDelete(id: string, userId?: string): Promise<boolean> {
    const conditions = [eq(notifications.id, id)];
    
    if (userId) {
      conditions.push(eq(notifications.userId, userId));
    }

    const result = await db
      .update(notifications)
      .set({ 
        deletedAt: new Date(),
        updatedAt: new Date()
      })
      .where(and(...conditions));

    return result.rowCount! > 0;
  }

  async delete(id: string, userId?: string): Promise<boolean> {
    const conditions = [eq(notifications.id, id)];
    
    if (userId) {
      conditions.push(eq(notifications.userId, userId));
    }

    const result = await db
      .delete(notifications)
      .where(and(...conditions));

    return result.rowCount! > 0;
  }

  async softDeleteMany(ids: string[], userId?: string): Promise<number> {
    if (ids.length === 0) return 0;

    const conditions = [inArray(notifications.id, ids)];
    
    if (userId) {
      conditions.push(eq(notifications.userId, userId));
    }

    const result = await db
      .update(notifications)
      .set({ 
        deletedAt: new Date(),
        updatedAt: new Date()
      })
      .where(and(...conditions));

    return result.rowCount || 0;
  }

  async deleteMany(ids: string[], userId?: string): Promise<number> {
    if (ids.length === 0) return 0;

    const conditions = [inArray(notifications.id, ids)];
    
    if (userId) {
      conditions.push(eq(notifications.userId, userId));
    }

    const result = await db
      .delete(notifications)
      .where(and(...conditions));

    return result.rowCount || 0;
  }

  async deleteByUserId(userId: string): Promise<number> {
    const result = await db
      .delete(notifications)
      .where(eq(notifications.userId, userId));

    return result.rowCount!;
  }

  async restore(id: string, userId?: string): Promise<boolean> {
    const conditions = [eq(notifications.id, id)];
    
    if (userId) {
      conditions.push(eq(notifications.userId, userId));
    }

    const result = await db
      .update(notifications)
      .set({ 
        deletedAt: null,
        updatedAt: new Date()
      })
      .where(and(...conditions));

    return result.rowCount! > 0;
  }

  // ============ TEMPLATE OPERATIONS ============

  async getTemplateByType(type: string): Promise<any | null> {
    const [template] = await db
      .select()
      .from(notificationTemplates)
      .where(eq(notificationTemplates.type, type as any))
      .limit(1);

    return template || null;
  }

  async getAllTemplates(): Promise<any[]> {
    return await db
      .select()
      .from(notificationTemplates)
      .orderBy(notificationTemplates.module, notificationTemplates.type);
  }

  async upsertTemplate(template: any): Promise<any> {
    const [upserted] = await db
      .insert(notificationTemplates)
      .values(template)
      .onConflictDoUpdate({
        target: notificationTemplates.type,
        set: {
          titleEn: template.titleEn,
          titleAr: template.titleAr,
          messageEn: template.messageEn,
          messageAr: template.messageAr,
          updatedAt: new Date()
        }
      })
      .returning();

    console.log(`💾 Upserted notification template: ${template.type}`);
    return upserted;
  }
/**
 * Add a new notification type dynamically
 * Spaces in the type will be replaced with underscores
 */
async addNotificationType(newType: string): Promise<boolean> {
  try {
    // Normalize the type: trim, replace spaces with underscores, uppercase
    const normalizedType = newType.trim().replace(/\s+/g, '_').toUpperCase();
    
    // Check if type already exists in the constants
    if (NOTIFICATION_TYPES.includes(normalizedType as any)) {
      console.log(`ℹ️ Notification type already exists: ${normalizedType}`);
      return true;
    }

    console.log(`✅ New notification type ready to use: ${normalizedType}`);
    console.log(`⚠️ Remember to add '${normalizedType}' to NOTIFICATION_TYPES constant in schema for permanent storage`);
    
    return true;
  } catch (error) {
    console.error(`❌ Failed to add notification type ${newType}:`, error);
    return false;
  }
}

/**
 * Get all notification types currently in use in the database
 * (useful for finding types that might not be in the constants)
 */

async getNotificationTypes(): Promise<string[]> {
  try {
    const result = await db
      .selectDistinct({ type: notificationTemplates.type })
      .from(notificationTemplates);
    
    const dbTypes = result.map(row => row.type);
    
    return [...new Set([...dbTypes, ...NOTIFICATION_TYPES])];
  } catch (error) {
    console.error('Failed to fetch active notification types:', error);
    return [];
  }
}
/**
 * Validate and normalize a notification type
 */
async validateNotificationType(type: string): Promise<string> {
  const normalized = type.trim().replace(/\s+/g, '_').toUpperCase();
  
  if (!NOTIFICATION_TYPES.includes(normalized as any)) {
    throw new Error(`Invalid notification type: ${normalized}. Please add it to NOTIFICATION_TYPES constant first.`);
  }
  
  return normalized;
}
}