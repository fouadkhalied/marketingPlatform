import { ResponseBuilder } from "../../common/apiResponse/apiResponseBuilder";
import { ApiResponseInterface } from "../../common/apiResponse/interfaces/apiResponse.interface";
import { ErrorCode } from "../../common/errors/enums/basic.error.enum";
import { ErrorBuilder } from "../../common/errors/errorBuilder";
import { ILogger } from "../../common/logging";
import { NotificationType } from "../enum/notification.type.enum";
import { INotificationRepository } from "../repositories/notification.repository.interface";
import { NotificationService } from "./notification.servcie";
import { CombinedNotification } from "../../schema/notifications.schema";

export class NotificationAppService {
  constructor(
    private readonly notificationRepo: INotificationRepository,
    private readonly notificationService: NotificationService,
    private readonly logger: ILogger
  ) {}

  /**
   * Get combined notifications (user + admin) for a user
   */
  async getNotifications(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ApiResponseInterface<CombinedNotification[]>> {
    try {
      this.logger.info('Fetching notifications', { userId, limit, offset });

      const notifications = await this.notificationRepo.getCombinedNotifications(
        userId,
        limit,
        offset
      );

      this.logger.info('Notifications fetched successfully', {
        userId,
        count: notifications.length
      });

      return ResponseBuilder.success(notifications);
    } catch (error) {
      this.logger.error('Failed to fetch notifications', {
        userId,
        error: error instanceof Error ? error.message : error
      });
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to fetch notifications",
        error instanceof Error ? error.message : error
      );
    }
  }

  /**
   * Get unread notifications for a user
   */
  async getUnreadNotifications(
    userId: string
  ): Promise<ApiResponseInterface<{ user: any[]; admin: any[] }>> {
    try {
      this.logger.info('Fetching unread notifications', { userId });

      const [userNotifs, adminNotifs] = await Promise.all([
        this.notificationRepo.findUnread(userId),
        this.notificationRepo.getUnreadAdminNotifications(userId)
      ]);

      const result = {
        user: userNotifs.map(n => ({
          id: n.id,
          title: { en: n.template.titleEn, ar: n.template.titleAr },
          message: { en: n.template.messageEn, ar: n.template.messageAr },
          module: n.template.module,
          type: n.template.type,
          metadata: n.metadata,
          createdAt: n.createdAt,
          isAdminNotification: false
        })),
        admin: adminNotifs.map(n => ({
          id: n.id,
          title: { en: n.template.titleEn, ar: n.template.titleAr },
          message: { en: n.template.messageEn, ar: n.template.messageAr },
          module: n.template.module,
          type: n.template.type,
          metadata: n.metadata,
          createdAt: n.createdAt,
          isAdminNotification: true
        }))
      };

      this.logger.info('Unread notifications fetched', {
        userId,
        userCount: result.user.length,
        adminCount: result.admin.length
      });

      return ResponseBuilder.success(result);
    } catch (error) {
      this.logger.error('Failed to fetch unread notifications', {
        userId,
        error: error instanceof Error ? error.message : error
      });
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to fetch unread notifications",
        error instanceof Error ? error.message : error
      );
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(
    userId: string
  ): Promise<ApiResponseInterface<{ total: number; user: number; admin: number }>> {
    try {
      this.logger.info('Fetching unread count', { userId });

      const [userCount, adminCount] = await Promise.all([
        this.notificationRepo.getUnreadCount(userId),
        this.notificationRepo.getUnreadAdminNotificationCount(userId)
      ]);

      const result = {
        total: userCount + adminCount,
        user: userCount,
        admin: adminCount
      };

      this.logger.info('Unread count fetched', { userId, ...result });

      return ResponseBuilder.success(result);
    } catch (error) {
      this.logger.error('Failed to fetch unread count', {
        userId,
        error: error instanceof Error ? error.message : error
      });
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to fetch unread count",
        error instanceof Error ? error.message : error
      );
    }
  }

  /**
   * Mark a user notification as read
   */
  async markAsRead(
    notificationId: string,
    userId: string
  ): Promise<ApiResponseInterface<{ success: boolean }>> {
    try {
      this.logger.info('Marking notification as read', { notificationId, userId });

      const notification = await this.notificationRepo.markAsRead(notificationId, userId);

      if (!notification) {
        return ErrorBuilder.build(
          ErrorCode.NOTIFICATION_NOT_FOUND,
          `Notification ${notificationId} not found or does not belong to user`
        );
      }

      this.logger.info('Notification marked as read', { notificationId, userId });

      return ResponseBuilder.success({ success: true });
    } catch (error) {
      this.logger.error('Failed to mark notification as read', {
        notificationId,
        userId,
        error: error instanceof Error ? error.message : error
      });
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to mark notification as read",
        error instanceof Error ? error.message : error
      );
    }
  }

  /**
   * Mark multiple user notifications as read
   */
  async markManyAsRead(
    notificationIds: string[],
    userId: string
  ): Promise<ApiResponseInterface<{ count: number }>> {
    try {
      this.logger.info('Marking multiple notifications as read', {
        count: notificationIds.length,
        userId
      });

      const count = await this.notificationRepo.markManyAsRead(notificationIds, userId);

      this.logger.info('Notifications marked as read', { count, userId });

      return ResponseBuilder.success({ count });
    } catch (error) {
      this.logger.error('Failed to mark notifications as read', {
        userId,
        error: error instanceof Error ? error.message : error
      });
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to mark notifications as read",
        error instanceof Error ? error.message : error
      );
    }
  }

  /**
   * Mark all user notifications as read
   */
  async markAllAsRead(
    userId: string
  ): Promise<ApiResponseInterface<{ count: number }>> {
    try {
      this.logger.info('Marking all notifications as read', { userId });

      const count = await this.notificationRepo.markAllAsRead(userId);

      this.logger.info('All notifications marked as read', { count, userId });

      return ResponseBuilder.success({ count });
    } catch (error) {
      this.logger.error('Failed to mark all notifications as read', {
        userId,
        error: error instanceof Error ? error.message : error
      });
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to mark all notifications as read",
        error instanceof Error ? error.message : error
      );
    }
  }

  /**
   * Mark an admin notification as read for current user
   */
  async markAdminNotificationAsRead(
    adminNotificationId: string,
    userId: string
  ): Promise<ApiResponseInterface<{ success: boolean }>> {
    try {
      this.logger.info('Marking admin notification as read', {
        adminNotificationId,
        userId
      });

      const success = await this.notificationRepo.markAdminNotificationAsRead(
        adminNotificationId,
        userId
      );

      if (!success) {
        return ErrorBuilder.build(
          ErrorCode.NOTIFICATION_NOT_FOUND,
          `Admin notification ${adminNotificationId} not found`
        );
      }

      this.logger.info('Admin notification marked as read', {
        adminNotificationId,
        userId
      });

      return ResponseBuilder.success({ success: true });
    } catch (error) {
      this.logger.error('Failed to mark admin notification as read', {
        adminNotificationId,
        userId,
        error: error instanceof Error ? error.message : error
      });
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to mark admin notification as read",
        error instanceof Error ? error.message : error
      );
    }
  }

  /**
   * Mark all admin notifications as read for current user
   */
  async markAllAdminNotificationsAsRead(
    userId: string
  ): Promise<ApiResponseInterface<{ count: number }>> {
    try {
      this.logger.info('Marking all admin notifications as read', { userId });

      const count = await this.notificationRepo.markAllAdminNotificationsAsRead(userId);

      this.logger.info('All admin notifications marked as read', { count, userId });

      return ResponseBuilder.success({ count });
    } catch (error) {
      this.logger.error('Failed to mark all admin notifications as read', {
        userId,
        error: error instanceof Error ? error.message : error
      });
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to mark all admin notifications as read",
        error instanceof Error ? error.message : error
      );
    }
  }

  /**
   * Mark ALL notifications as read (user + admin)
   */
  async markAllCombinedAsRead(
    userId: string
  ): Promise<ApiResponseInterface<{ userCount: number; adminCount: number; total: number }>> {
    try {
      this.logger.info('Marking all combined notifications as read', { userId });

      const [userCount, adminCount] = await Promise.all([
        this.notificationRepo.markAllAsRead(userId),
        this.notificationRepo.markAllAdminNotificationsAsRead(userId)
      ]);

      const result = {
        userCount,
        adminCount,
        total: userCount + adminCount
      };

      this.logger.info('All combined notifications marked as read', {
        userId,
        ...result
      });

      return ResponseBuilder.success(result);
    } catch (error) {
      this.logger.error('Failed to mark all combined notifications as read', {
        userId,
        error: error instanceof Error ? error.message : error
      });
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to mark all notifications as read",
        error instanceof Error ? error.message : error
      );
    }
  }

  /**
   * Soft delete a user notification
   */
  async deleteNotification(
    notificationId: string,
    userId: string
  ): Promise<ApiResponseInterface<{ success: boolean }>> {
    try {
      this.logger.info('Deleting notification', { notificationId, userId });

      const success = await this.notificationRepo.softDelete(notificationId, userId);

      if (!success) {
        return ErrorBuilder.build(
          ErrorCode.NOTIFICATION_NOT_FOUND,
          `Notification ${notificationId} not found or does not belong to user`
        );
      }

      this.logger.info('Notification deleted', { notificationId, userId });

      return ResponseBuilder.success({ success: true });
    } catch (error) {
      this.logger.error('Failed to delete notification', {
        notificationId,
        userId,
        error: error instanceof Error ? error.message : error
      });
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to delete notification",
        error instanceof Error ? error.message : error
      );
    }
  }

  /**
   * Soft delete multiple user notifications
   */
  async deleteManyNotifications(
    notificationIds: string[],
    userId: string
  ): Promise<ApiResponseInterface<{ count: number }>> {
    try {
      this.logger.info('Deleting multiple notifications', {
        count: notificationIds.length,
        userId
      });

      const count = await this.notificationRepo.softDeleteMany(notificationIds, userId);

      this.logger.info('Notifications deleted', { count, userId });

      return ResponseBuilder.success({ count });
    } catch (error) {
      this.logger.error('Failed to delete notifications', {
        userId,
        error: error instanceof Error ? error.message : error
      });
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to delete notifications",
        error instanceof Error ? error.message : error
      );
    }
  }

  /**
   * Create admin broadcast notification
   */
  async createAdminBroadcast(
    type: NotificationType,
    metadata?: Record<string, any>
  ): Promise<ApiResponseInterface<{ notificationId: string }>> {
    try {
      this.logger.info('Creating admin broadcast', { type });

      const notificationId = await this.notificationService.sendAdminBroadcast(
        type,
        metadata
      );

      this.logger.info('Admin broadcast created', { notificationId, type });

      return ResponseBuilder.success({ notificationId });
    } catch (error) {
      this.logger.error('Failed to create admin broadcast', {
        type,
        error: error instanceof Error ? error.message : error
      });
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to send broadcast",
        error instanceof Error ? error.message : error
      );
    }
  }

  /**
   * Get all notification templates
   */
  async getTemplates(): Promise<ApiResponseInterface<any[]>> {
    try {
      this.logger.info('Fetching notification templates');

      const templates = await this.notificationRepo.getAllTemplates();

      this.logger.info('Templates fetched', { count: templates.length });

      return ResponseBuilder.success(templates);
    } catch (error) {
      this.logger.error('Failed to fetch templates', {
        error: error instanceof Error ? error.message : error
      });
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to fetch templates",
        error instanceof Error ? error.message : error
      );
    }
  }

  /**
   * Delete admin notification (Admin only)
   */
  async deleteAdminNotification(
    adminNotificationId: string
  ): Promise<ApiResponseInterface<{ success: boolean }>> {
    try {
      this.logger.info('Deleting admin notification', { adminNotificationId });

      const success = await this.notificationRepo.deleteAdminNotification(
        adminNotificationId
      );

      if (!success) {
        return ErrorBuilder.build(
          ErrorCode.NOTIFICATION_NOT_FOUND,
          `Admin notification ${adminNotificationId} not found`
        );
      }

      this.logger.info('Admin notification deleted', { adminNotificationId });

      return ResponseBuilder.success({ success: true });
    } catch (error) {
      this.logger.error('Failed to delete admin notification', {
        adminNotificationId,
        error: error instanceof Error ? error.message : error
      });
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to delete admin notification",
        error instanceof Error ? error.message : error
      );
    }
  }

  async upsertTemplate(templateData: any): Promise<ApiResponseInterface<any>>{
    try {
      this.logger.info('upsert notification template', { templateData });

      const success = await this.notificationRepo.upsertTemplate(
        templateData
      );

      if (!success) {
        return ErrorBuilder.build(
          ErrorCode.NOTIFICATION_NOT_FOUND,
          `failed to create or update notification template`
        );
      }

      this.logger.info('notifcation template created successfully');

      return ResponseBuilder.success({ success: true });
    } catch (error) {
      this.logger.error('Failed to delete admin notification', {
        templateData,
        error: error instanceof Error ? error.message : error
      });
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to delete admin notification",
        error instanceof Error ? error.message : error
      );
    }
  }


  async addNotificationType(newType: string): Promise<ApiResponseInterface<any>>{
    try {
      this.logger.info('upsert notification type', { newType });

      const success = await this.notificationRepo.addNotificationType(
        newType
      );

      if (!success) {
        return ErrorBuilder.build(
          ErrorCode.NOTIFICATION_NOT_FOUND,
          `failed to create new notifcaiton type`
        );
      }

      this.logger.info('notifcation type created successfully');

      return ResponseBuilder.success({ success: true });
    } catch (error) {
      this.logger.error('Failed to delete admin notification', {
        newType,
        error: error instanceof Error ? error.message : error
      });
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to delete admin notification",
        error instanceof Error ? error.message : error
      );
    }
  }

  async getNotificationTypes(): Promise<ApiResponseInterface<string[]>>{
    try {
      this.logger.info('getting notification type');

      const success = await this.notificationRepo.getNotificationTypes();

      if (!success) {
        return ErrorBuilder.build(
          ErrorCode.NOTIFICATION_NOT_FOUND,
          `failed to retrieve notifcaiton types`
        );
      }

      this.logger.info('notifcation type retrived successfully');

      return ResponseBuilder.success(success);
    } catch (error) {
      this.logger.error('Failed to delete admin notification', {
        error: error instanceof Error ? error.message : error
      });
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to delete admin notification",
        error instanceof Error ? error.message : error
      );
    }
  }
}