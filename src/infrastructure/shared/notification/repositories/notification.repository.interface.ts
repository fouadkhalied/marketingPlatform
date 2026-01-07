import {
  Notification,
  NotificationWithTemplate,
  InsertNotification,
  AdminNotification,
  AdminNotificationWithTemplate,
  InsertAdminNotification,
  CombinedNotification
} from "../../schema/notifications.schema";

export interface INotificationRepository {
  // ============ USER NOTIFICATION CRUD ============

  /**
   * Create a new user notification
   */
  create(notification: InsertNotification): Promise<Notification>;

  /**
   * Find notification by ID with template data
   */
  findById(id: string): Promise<NotificationWithTemplate | null>;

  /**
   * Find notifications for a user (with pagination)
   */
  findByUserId(userId: string, limit?: number, offset?: number): Promise<NotificationWithTemplate[]>;

  /**
   * Find unread user notifications
   */
  findUnread(userId: string): Promise<NotificationWithTemplate[]>;

  // ============ COMBINED NOTIFICATIONS (USER + ADMIN) ============

  /**
   * Get combined notifications (user notifications + admin notifications)
   * Admin notifications appear first, then user notifications
   * Returns unified format for frontend
   */
  getCombinedNotifications(userId: string, limit?: number, offset?: number): Promise<CombinedNotification[]>;

  /**
   * Get combined unread count (user unread + unread admin notifications)
   */
  getCombinedUnreadCount(userId: string): Promise<number>;

  // ============ MARK AS READ ============

  /**
   * Mark a user notification as read
   */
  markAsRead(id: string, userId?: string): Promise<Notification | null>;

  /**
   * Mark multiple user notifications as read by their IDs
   */
  markManyAsRead(ids: string[], userId?: string): Promise<number>;

  /**
   * Mark all user unread notifications as read
   */
  markAllAsRead(userId: string): Promise<number>;

  /**
   * Mark an admin notification as read for a specific user
   */
  markAdminNotificationAsRead(adminNotificationId: string, userId: string): Promise<boolean>;

  /**
   * Mark all admin notifications as read for a user
   */
  markAllAdminNotificationsAsRead(userId: string): Promise<number>;

  /**
   * Get unread count for user notifications only
   */
  getUnreadCount(userId: string): Promise<number>;

  // ============ DELETE OPERATIONS ============

  /**
   * Soft delete a user notification
   */
  softDelete(id: string, userId?: string): Promise<boolean>;

  /**
   * Hard delete a user notification (permanent removal)
   */
  delete(id: string, userId?: string): Promise<boolean>;

  /**
   * Soft delete multiple user notifications
   */
  softDeleteMany(ids: string[], userId?: string): Promise<number>;

  /**
   * Hard delete multiple user notifications (permanent)
   */
  deleteMany(ids: string[], userId?: string): Promise<number>;

  /**
   * Delete all user notifications for a user (hard delete)
   */
  deleteByUserId(userId: string): Promise<number>;

  /**
   * Restore a soft-deleted user notification
   */
  restore(id: string, userId?: string): Promise<boolean>;

  // ============ ADMIN NOTIFICATION OPERATIONS ============

  /**
   * Create a new admin notification (broadcast to all users)
   */
  createAdminNotification(notification: InsertAdminNotification): Promise<AdminNotification>;

  /**
   * Get admin notifications with read status for a specific user
   */
  getAdminNotificationsForUser(userId: string, limit?: number, offset?: number): Promise<AdminNotificationWithTemplate[]>;

  /**
   * Get unread admin notifications for a user
   */
  getUnreadAdminNotifications(userId: string): Promise<AdminNotificationWithTemplate[]>;

  /**
   * Get admin notification by ID
   */
  getAdminNotificationById(id: string): Promise<AdminNotificationWithTemplate | null>;

  /**
   * Delete admin notification (affects all users)
   */
  deleteAdminNotification(id: string): Promise<boolean>;

  /**
   * Update admin notification
   */
  updateAdminNotification(id: string, notification: Partial<InsertAdminNotification>): Promise<AdminNotification | null>;

  /**
   * Get count of unread admin notifications for a user
   */
  getUnreadAdminNotificationCount(userId: string): Promise<number>;

  // ============ TEMPLATE OPERATIONS ============

  /**
   * Get notification template by type
   */
  getTemplateByType(type: string): Promise<any | null>;

  /**
   * Get all notification templates
   */
  getAllTemplates(): Promise<any[]>;

  /**
   * Create or update a notification template
   */
  upsertTemplate(template: any): Promise<any>;

  updateAdminNotification(id: string, notification: Partial<InsertAdminNotification>): Promise<AdminNotification | null>

  addNotificationType(newType: string): Promise<boolean>;

  getNotificationTypes(): Promise<string[]>

}