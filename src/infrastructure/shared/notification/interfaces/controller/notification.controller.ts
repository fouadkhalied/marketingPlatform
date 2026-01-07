// notification/interfaces/controllers/notification.controller.ts
import { Request, Response } from 'express';
import { ERROR_STATUS_MAP } from '../../../common/errors/mapper/mapperErrorEnum';
import { NotificationType } from '../../enum/notification.type.enum';
import { ApiResponseInterface } from '../../../common/apiResponse/interfaces/apiResponse.interface';
import { NotificationAppService } from '../../service/notification.app.service';

export class NotificationController {
  constructor(
    private readonly notificationService: NotificationAppService
  ) { }

  // Helper method to get status code from error code
  private getStatusCode(response: ApiResponseInterface<any>): number {
    if (response.success) {
      return 200;
    }

    if (response.error?.code && ERROR_STATUS_MAP[response.error.code as keyof typeof ERROR_STATUS_MAP]) {
      return ERROR_STATUS_MAP[response.error.code as keyof typeof ERROR_STATUS_MAP];
    }

    return 500;
  }

  /**
   * GET /notifications
   * Get combined notifications (user + admin) for current user
   */
  async getNotifications(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
          error: {
            code: 'UNAUTHORIZED',
            message: 'User authentication required'
          }
        });
        return;
      }

      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const offset = parseInt(req.query.offset as string) || 0;

      const result = await this.notificationService.getNotifications(userId, limit, offset);
      const statusCode = this.getStatusCode(result);

      res.status(statusCode).json(result);
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch notifications',
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch notifications',
          details: err.message
        }
      });
    }
  }

  /**
   * GET /notifications/unread
   * Get all unread notifications (user + admin)
   */
  async getUnreadNotifications(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
          error: {
            code: 'UNAUTHORIZED',
            message: 'User authentication required'
          }
        });
        return;
      }

      const result = await this.notificationService.getUnreadNotifications(userId);
      const statusCode = this.getStatusCode(result);

      res.status(statusCode).json(result);
    } catch (err: any) {
      console.error('Error fetching unread notifications:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch unread notifications',
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch unread notifications',
          details: err.message
        }
      });
    }
  }

  /**
   * GET /notifications/count
   * Get unread notification count
   */
  async getUnreadCount(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
          error: {
            code: 'UNAUTHORIZED',
            message: 'User authentication required'
          }
        });
        return;
      }

      const result = await this.notificationService.getUnreadCount(userId);
      const statusCode = this.getStatusCode(result);

      res.status(statusCode).json(result);
    } catch (err: any) {
      console.error('Error fetching unread count:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch unread count',
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch unread count',
          details: err.message
        }
      });
    }
  }

  /**
   * PATCH /notifications/:id/read
   * Mark a user notification as read
   */
  async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
          error: {
            code: 'UNAUTHORIZED',
            message: 'User authentication required'
          }
        });
        return;
      }

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Notification ID is required',
          error: {
            code: 'MISSING_REQUIRED_FIELD',
            message: 'Notification ID is required'
          }
        });
        return;
      }

      const result = await this.notificationService.markAsRead(id, userId);
      const statusCode = this.getStatusCode(result);

      res.status(statusCode).json(result);
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to mark notification as read',
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to mark notification as read',
          details: err.message
        }
      });
    }
  }

  /**
   * PATCH /notifications/read-many
   * Mark multiple user notifications as read
   */
  async markManyAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { notificationIds } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
          error: {
            code: 'UNAUTHORIZED',
            message: 'User authentication required'
          }
        });
        return;
      }

      if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Notification IDs array is required',
          error: {
            code: 'MISSING_REQUIRED_FIELD',
            message: 'Notification IDs array is required and must not be empty'
          }
        });
        return;
      }

      const result = await this.notificationService.markManyAsRead(notificationIds, userId);
      const statusCode = this.getStatusCode(result);

      res.status(statusCode).json(result);
    } catch (err: any) {
      console.error('Error marking notifications as read:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to mark notifications as read',
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to mark notifications as read',
          details: err.message
        }
      });
    }
  }

  /**
   * PATCH /notifications/read-all
   * Mark all user notifications as read
   */
  async markAllAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
          error: {
            code: 'UNAUTHORIZED',
            message: 'User authentication required'
          }
        });
        return;
      }

      const result = await this.notificationService.markAllAsRead(userId);
      const statusCode = this.getStatusCode(result);

      res.status(statusCode).json(result);
    } catch (err: any) {
      console.error('Error marking all notifications as read:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to mark all notifications as read',
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to mark all notifications as read',
          details: err.message
        }
      });
    }
  }

  /**
   * PATCH /notifications/admin/:id/read
   * Mark an admin notification as read for current user
   */
  async markAdminNotificationAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
          error: {
            code: 'UNAUTHORIZED',
            message: 'User authentication required'
          }
        });
        return;
      }

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Admin notification ID is required',
          error: {
            code: 'MISSING_REQUIRED_FIELD',
            message: 'Admin notification ID is required'
          }
        });
        return;
      }

      const result = await this.notificationService.markAdminNotificationAsRead(id, userId);
      const statusCode = this.getStatusCode(result);

      res.status(statusCode).json(result);
    } catch (err: any) {
      console.error('Error marking admin notification as read:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to mark admin notification as read',
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to mark admin notification as read',
          details: err.message
        }
      });
    }
  }

  /**
   * PATCH /notifications/admin/read-all
   * Mark all admin notifications as read for current user
   */
  async markAllAdminNotificationsAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
          error: {
            code: 'UNAUTHORIZED',
            message: 'User authentication required'
          }
        });
        return;
      }

      const result = await this.notificationService.markAllAdminNotificationsAsRead(userId);
      const statusCode = this.getStatusCode(result);

      res.status(statusCode).json(result);
    } catch (err: any) {
      console.error('Error marking all admin notifications as read:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to mark all admin notifications as read',
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to mark all admin notifications as read',
          details: err.message
        }
      });
    }
  }

  /**
   * PATCH /notifications/read-all-combined
   * Mark ALL notifications as read (user + admin)
   */
  async markAllCombinedAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
          error: {
            code: 'UNAUTHORIZED',
            message: 'User authentication required'
          }
        });
        return;
      }

      const result = await this.notificationService.markAllCombinedAsRead(userId);
      const statusCode = this.getStatusCode(result);

      res.status(statusCode).json(result);
    } catch (err: any) {
      console.error('Error marking all combined notifications as read:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to mark all notifications as read',
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to mark all notifications as read',
          details: err.message
        }
      });
    }
  }

  /**
   * DELETE /notifications/:id
   * Soft delete a user notification
   */
  async deleteNotification(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
          error: {
            code: 'UNAUTHORIZED',
            message: 'User authentication required'
          }
        });
        return;
      }

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Notification ID is required',
          error: {
            code: 'MISSING_REQUIRED_FIELD',
            message: 'Notification ID is required'
          }
        });
        return;
      }

      const result = await this.notificationService.deleteNotification(id, userId);
      const statusCode = this.getStatusCode(result);

      res.status(statusCode).json(result);
    } catch (err: any) {
      console.error('Error deleting notification:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to delete notification',
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete notification',
          details: err.message
        }
      });
    }
  }

  /**
   * DELETE /notifications/delete-many
   * Soft delete multiple user notifications
   */
  async deleteManyNotifications(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { notificationIds } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
          error: {
            code: 'UNAUTHORIZED',
            message: 'User authentication required'
          }
        });
        return;
      }

      if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Notification IDs array is required',
          error: {
            code: 'MISSING_REQUIRED_FIELD',
            message: 'Notification IDs array is required and must not be empty'
          }
        });
        return;
      }

      const result = await this.notificationService.deleteManyNotifications(notificationIds, userId);
      const statusCode = this.getStatusCode(result);

      res.status(statusCode).json(result);
    } catch (err: any) {
      console.error('Error deleting notifications:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to delete notifications',
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete notifications',
          details: err.message
        }
      });
    }
  }

  /**
   * POST /notifications/admin/broadcast
   * Send broadcast notification to all users (Admin only)
   */
  async createAdminBroadcast(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const isAdmin = req.user?.role === 'admin';

      if (!userId || !isAdmin) {
        res.status(403).json({
          success: false,
          message: 'Admin access required',
          error: {
            code: 'FORBIDDEN',
            message: 'Admin access required'
          }
        });
        return;
      }

      const { titleEn, titleAr, messageEn, messageAr, metadata } = req.body;

      if (!titleEn || !titleAr || !messageEn || !messageAr) {
        res.status(400).json({
          success: false,
          message: 'Title and message in both languages are required',
          error: {
            code: 'MISSING_REQUIRED_FIELD',
            message: 'titleEn, titleAr, messageEn, and messageAr are required'
          }
        });
        return;
      }

      const result = await this.notificationService.createAdminBroadcast(
        userId,
        { titleEn, titleAr, messageEn, messageAr, metadata }
      );
      const statusCode = this.getStatusCode(result);

      res.status(statusCode).json(result);
    } catch (err: any) {
      console.error('Error creating admin broadcast:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to send broadcast',
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to send broadcast',
          details: err.message
        }
      });
    }
  }

  /**
   * GET /notifications/admin/templates
   * Get all notification templates (Admin only)
   */
  async getTemplates(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const isAdmin = req.user?.role === 'admin';

      if (!userId || !isAdmin) {
        res.status(403).json({
          success: false,
          message: 'Admin access required',
          error: {
            code: 'FORBIDDEN',
            message: 'Admin access required'
          }
        });
        return;
      }

      const result = await this.notificationService.getTemplates();
      const statusCode = this.getStatusCode(result);

      res.status(statusCode).json(result);
    } catch (err: any) {
      console.error('Error fetching templates:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch templates',
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch templates',
          details: err.message
        }
      });
    }
  }

  /**
   * DELETE /notifications/admin/:id
   * Delete admin notification (Admin only)
   */
  async deleteAdminNotification(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const isAdmin = req.user?.role === 'admin';
      const { id } = req.params;

      if (!userId || !isAdmin) {
        res.status(403).json({
          success: false,
          message: 'Admin access required',
          error: {
            code: 'FORBIDDEN',
            message: 'Admin access required'
          }
        });
        return;
      }

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Admin notification ID is required',
          error: {
            code: 'MISSING_REQUIRED_FIELD',
            message: 'Admin notification ID is required'
          }
        });
        return;
      }

      const result = await this.notificationService.deleteAdminNotification(id);
      const statusCode = this.getStatusCode(result);

      res.status(statusCode).json(result);
    } catch (err: any) {
      console.error('Error deleting admin notification:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to delete admin notification',
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete admin notification',
          details: err.message
        }
      });
    }
  }

  /**
   * PATCH /notifications/admin/:id
   * Update admin notification (Admin only)
   */
  async updateAdminNotification(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const isAdmin = req.user?.role === 'admin';
      const { id } = req.params;
      const data = req.body;

      if (!userId || !isAdmin) {
        res.status(403).json({
          success: false,
          message: 'Admin access required',
          error: {
            code: 'FORBIDDEN',
            message: 'Admin access required'
          }
        });
        return;
      }

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Admin notification ID is required',
          error: {
            code: 'MISSING_REQUIRED_FIELD',
            message: 'Admin notification ID is required'
          }
        });
        return;
      }

      const result = await this.notificationService.updateAdminNotification(id, data);
      const statusCode = this.getStatusCode(result);

      res.status(statusCode).json(result);
    } catch (err: any) {
      console.error('Error updating admin notification:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to update admin notification',
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update admin notification',
          details: err.message
        }
      });
    }
  }

  /**
   * PUT /notifications/admin/templates
   * Upsert notification template (Admin only)
   */
  async upsertTemplate(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const isAdmin = req.user?.role === 'admin';

      if (!userId || !isAdmin) {
        res.status(403).json({
          success: false,
          message: 'Admin access required',
          error: {
            code: 'FORBIDDEN',
            message: 'Admin access required'
          }
        });
        return;
      }

      const templateData = req.body;

      // Validate required fields
      if (!templateData.type || !templateData.module ||
        !templateData.titleEn || !templateData.titleAr ||
        !templateData.messageEn || !templateData.messageAr) {
        res.status(400).json({
          success: false,
          message: 'Missing required template fields',
          error: {
            code: 'MISSING_REQUIRED_FIELD',
            message: 'type, module, titleEn, titleAr, messageEn, and messageAr are required'
          }
        });
        return;
      }

      const result = await this.notificationService.upsertTemplate(templateData);
      const statusCode = this.getStatusCode(result);

      res.status(statusCode).json(result);
    } catch (err: any) {
      console.error('Error upserting template:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to upsert template',
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to upsert template',
          details: err.message
        }
      });
    }
  }

  async addNotificationType(req: Request, res: Response): Promise<void> {
    try {
      // Extract type from request body
      const { type } = req.body;

      // Validate that type exists
      if (!type) {
        res.status(400).json({
          success: false,
          message: 'Notification type is required',
        });
        return;
      }

      const success = await this.notificationService.addNotificationType(type);

      if (success) {
        res.status(200).json({
          success: true,
          message: 'Notification type added successfully',
          data: {
            normalizedType: type.trim().replace(/\s+/g, '_').toUpperCase()
          }
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Failed to add notification type',
        });
      }
    } catch (error) {
      console.error('Error adding notification type:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async getNotificationTypes(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const isAdmin = req.user?.role === 'admin';

      if (!userId || !isAdmin) {
        res.status(403).json({
          success: false,
          message: 'Admin access required',
          error: {
            code: 'FORBIDDEN',
            message: 'Admin access required'
          }
        });
        return;
      }

      const result = await this.notificationService.getNotificationTypes();
      const statusCode = this.getStatusCode(result);

      res.status(statusCode).json(result);
    } catch (err: any) {
      console.error('Error upserting template:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to upsert template',
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to upsert template',
          details: err.message
        }
      });
    }
  }

}