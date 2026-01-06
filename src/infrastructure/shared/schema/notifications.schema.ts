import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, jsonb, pgEnum, index, uniqueIndex } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { number, z } from "zod";
import { users } from "./schema";

// Notification enums
export const notificationModuleEnum = pgEnum("notification_module", ["AD", "PAYMENT", "CREDIT", "USER"]);
export const notificationTypeEnum = pgEnum("notification_type", [
  "AD_APPROVED", "AD_REJECTED", "AD_ACTIVATED", "AD_DEACTIVATED",
  "PAYMENT_SUCCESS", "PAYMENT_FAILED", "PAYMENT_PENDING", "PAYMENT_REFUNDED",
  "CREDIT_ADDED", "CREDIT_DEDUCTED", "CREDIT_LOW_BALANCE"
]);

// Notification templates table - stores static messages
export const notificationTemplates = pgTable('notification_templates', {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: notificationTypeEnum("type").notNull().unique(),
  module: notificationModuleEnum("module").notNull(),
  titleEn: text("title_en").notNull(),
  titleAr: text("title_ar").notNull(),
  messageEn: text("message_en").notNull(),
  messageAr: text("message_ar").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// User notifications table - notifications tied to specific users
export const notifications = pgTable('notifications', {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  templateId: varchar("template_id").notNull().references(() => notificationTemplates.id, { onDelete: 'cascade' }),
  metadata: jsonb("metadata"), // Dynamic data like ad name, amount, etc.
  read: boolean("read").notNull().default(false),
  deletedAt: timestamp("deleted_at"), // Soft delete support
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  // Index for fetching user's notifications
  userDateIdx: index("idx_notifications_user_date").on(
    table.userId, 
    table.createdAt.desc()
  ),
  // Index for unread notifications queries
  userReadDateIdx: index("idx_notifications_user_read_date").on(
    table.userId, 
    table.read, 
    table.createdAt.desc()
  ),
  // Index for soft delete queries
  userDeletedIdx: index("idx_notifications_user_deleted").on(
    table.userId,
    table.deletedAt
  ),
}));

// Admin notifications table - broadcast notifications NOT tied to users
export const adminNotifications = pgTable('admin_notifications', {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id").notNull().references(() => notificationTemplates.id, { onDelete: 'cascade' }),
  metadata: jsonb("metadata"), // Dynamic data for the broadcast
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  // Index for fetching recent admin notifications
  dateIdx: index("idx_admin_notifications_date").on(table.createdAt.desc()),
}));

// User admin notification read status - tracks which users have read which admin notifications
export const userAdminNotificationReads = pgTable('user_admin_notification_reads', {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  adminNotificationId: varchar("admin_notification_id").notNull().references(() => adminNotifications.id, { onDelete: 'cascade' }),
  readAt: timestamp("read_at").notNull().default(sql`now()`),
}, (table) => ({
  // Unique constraint - user can only mark admin notification as read once
  uniqueUserNotification: uniqueIndex("idx_user_admin_notification_unique").on(
    table.userId,
    table.adminNotificationId
  ),
  // Index for checking read status
  userNotificationIdx: index("idx_user_admin_notification").on(
    table.userId,
    table.adminNotificationId
  ),
}));

// Relations
export const notificationTemplatesRelations = relations(notificationTemplates, ({ many }) => ({
  notifications: many(notifications),
  adminNotifications: many(adminNotifications),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  template: one(notificationTemplates, {
    fields: [notifications.templateId],
    references: [notificationTemplates.id],
  }),
}));

export const adminNotificationsRelations = relations(adminNotifications, ({ one, many }) => ({
  template: one(notificationTemplates, {
    fields: [adminNotifications.templateId],
    references: [notificationTemplates.id],
  }),
  reads: many(userAdminNotificationReads),
}));

export const userAdminNotificationReadsRelations = relations(userAdminNotificationReads, ({ one }) => ({
  user: one(users, {
    fields: [userAdminNotificationReads.userId],
    references: [users.id],
  }),
  adminNotification: one(adminNotifications, {
    fields: [userAdminNotificationReads.adminNotificationId],
    references: [adminNotifications.id],
  }),
}));

// Zod schemas for validation
export const insertNotificationTemplateSchema = createInsertSchema(notificationTemplates, {
  type: z.enum([
    "AD_APPROVED", "AD_REJECTED", "AD_ACTIVATED", "AD_DEACTIVATED",
    "PAYMENT_SUCCESS", "PAYMENT_FAILED", "PAYMENT_PENDING", "PAYMENT_REFUNDED",
    "CREDIT_ADDED", "CREDIT_DEDUCTED", "CREDIT_LOW_BALANCE"
  ]),
  module: z.enum(["AD", "PAYMENT", "CREDIT", "USER"]),
  titleEn: z.string().min(1).max(200),
  titleAr: z.string().min(1).max(200),
  messageEn: z.string().min(1).max(500),
  messageAr: z.string().min(1).max(500),
});

export const insertNotificationSchema = createInsertSchema(notifications, {
  userId: z.string().uuid(),
  templateId: z.string().uuid(),
  metadata: z.record(z.any()).optional(),
  read: z.boolean().default(false),
});

export const insertAdminNotificationSchema = createInsertSchema(adminNotifications, {
  templateId: z.string().uuid(),
  metadata: z.record(z.any()).optional(),
});

// Type exports
export type NotificationTemplate = typeof notificationTemplates.$inferSelect;
export type InsertNotificationTemplate = z.infer<typeof insertNotificationTemplateSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type AdminNotification = typeof adminNotifications.$inferSelect;
export type InsertAdminNotification = z.infer<typeof insertAdminNotificationSchema>;

export type UserAdminNotificationRead = typeof userAdminNotificationReads.$inferSelect;

// Extended types for notifications with template data (for queries with joins)
export type NotificationWithTemplate = Notification & {
  template: NotificationTemplate;
};

export type AdminNotificationWithTemplate = AdminNotification & {
  template: NotificationTemplate;
  isRead?: boolean; // Added when querying for specific user
};

// Combined notification type for frontend (union of user and admin notifications)
export type CombinedNotification = {
  id: string;
  title: { en: string; ar: string };
  message: { en: string; ar: string };
  module: string;
  type: string;
  metadata: Record<string, any> | null;
  read: boolean;
  isAdminNotification: boolean;
  createdAt: Date;
};