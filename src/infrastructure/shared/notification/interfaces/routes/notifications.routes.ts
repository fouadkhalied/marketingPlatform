import express from 'express';
import { AuthMiddleware } from '../../../common/auth/module/authModule';
import { UserRole } from '../../../common/auth/enums/userRole';
import { SSENotificationChannel } from '../../channels/SSE.channel';
import { NotificationController } from '../controller/notification.controller';

export function setupNotificationRoutes(notificationControllers: NotificationController, sseChannel: SSENotificationChannel) {
  const router = express.Router();
  // SEE channel
  router.get('/api/notifications/stream', async (req, res) => {
    try {
      await sseChannel.addClient(req, res);
    } catch (error) {
      console.error('SSE connection error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to establish SSE connection',
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  });
  
  // ============ GET NOTIFICATIONS ============
  
  /**
   * GET /notifications
   * Get combined notifications (user + admin) with pagination
   */
  router.get('/api/notifications',AuthMiddleware(UserRole.USER), (req, res) => {
    notificationControllers.getNotifications(req, res);
  });

  /**
   * GET /notifications/unread
   * Get all unread notifications (user + admin)
   */
  router.get('/api/notifications/unread',AuthMiddleware(UserRole.USER), (req, res) => {
    notificationControllers.getUnreadNotifications(req, res);
  });

  /**
   * GET /notifications/count
   * Get unread notification count
   */
  router.get('/api/notifications/count',AuthMiddleware(UserRole.USER), (req, res) => {
    notificationControllers.getUnreadCount(req, res);
  });

  // ============ MARK AS READ ============
  
  /**
   * PATCH /notifications/:id/read
   * Mark a user notification as read
   */
  router.patch('/api/notifications/:id/read',AuthMiddleware(UserRole.USER), (req, res) => {
    notificationControllers.markAsRead(req, res);
  });

  /**
   * PATCH /notifications/read-many
   * Mark multiple user notifications as read
   */
  router.patch('/api/notifications/read-many',AuthMiddleware(UserRole.USER), (req, res) => {
    notificationControllers.markManyAsRead(req, res);
  });

  /**
   * PATCH /notifications/read-all
   * Mark all user notifications as read
   */
  router.patch('/api/notifications/read-all',AuthMiddleware(UserRole.USER), (req, res) => {
    notificationControllers.markAllAsRead(req, res);
  });

  /**
   * PATCH /notifications/admin/:id/read
   * Mark an admin notification as read for current user
   */
  router.patch('/api/notifications/admin/:id/read',AuthMiddleware(UserRole.USER), (req, res) => {
    notificationControllers.markAdminNotificationAsRead(req, res);
  });

  /**
   * PATCH /notifications/admin/read-all
   * Mark all admin notifications as read for current user
   */
  router.patch('/api/notifications/admin/read-all',AuthMiddleware(UserRole.USER), (req, res) => {
    notificationControllers.markAllAdminNotificationsAsRead(req, res);
  });

  /**
   * PATCH /notifications/read-all-combined
   * Mark ALL notifications as read (user + admin)
   */
  router.patch('/api/notifications/read-all-combined',AuthMiddleware(UserRole.USER), (req, res) => {
    notificationControllers.markAllCombinedAsRead(req, res);
  });

  // ============ DELETE NOTIFICATIONS ============
  
  /**
   * DELETE /notifications/:id
   * Soft delete a user notification
   */
  router.delete('/api/notifications/:id',AuthMiddleware(UserRole.USER), (req, res) => {
    notificationControllers.deleteNotification(req, res);
  });

  /**
   * DELETE /notifications/delete-many
   * Soft delete multiple user notifications
   */
  router.delete('/api/notifications/delete-many',AuthMiddleware(UserRole.USER), (req, res) => {
    notificationControllers.deleteManyNotifications(req, res);
  });

  // ============ ADMIN ROUTES ============
  
  /**
     * POST /notifications/admin/broadcast
     * Send broadcast notification to all users (Admin only)
     */
    router.post('/api/notifications/admin/broadcast', AuthMiddleware(UserRole.ADMIN) , (req, res) => {
      notificationControllers.createAdminBroadcast(req, res);
    });

    /**
     * GET /notifications/admin/templates
     * Get all notification templates (Admin only)
     */
    router.get('/api/notifications/admin/templates', AuthMiddleware(UserRole.ADMIN) , (req, res) => {
      notificationControllers.getTemplates(req, res);
    });

    /**
     * PUT /notifications/admin/templates
     * Upsert notification template (Admin only)
     */
    router.put('/api/notifications/admin/templates', AuthMiddleware(UserRole.ADMIN), (req, res) => {
        notificationControllers.upsertTemplate(req, res);
    });

    /**
     * DELETE /notifications/admin/:id
     * Delete admin notification (Admin only)
     */
    router.delete('/api/notifications/admin/:id', AuthMiddleware(UserRole.ADMIN) , (req, res) => {
      notificationControllers.deleteAdminNotification(req, res);
    });


    router.post("/api/notifications/admin/types",AuthMiddleware(UserRole.ADMIN) ,(req, res) => notificationControllers.addNotificationType(req, res));

    router.get("/api/notifications/admin/types",AuthMiddleware(UserRole.ADMIN) ,(req, res) => notificationControllers.getNotificationTypes(req, res));

  return router;
} 