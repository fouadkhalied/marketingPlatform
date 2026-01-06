import { Request, Response } from "express";
import { NotificationChannel } from "../interfaces/notification.channel.interface";
import { NotificationPayload } from "../interfaces/notification.payload.interface";
import { INotificationRepository } from "../repositories/notification.repository.interface";

export class SSENotificationChannel implements NotificationChannel {
  name = "sse";
  private connections = new Map<string, Response[]>();

  constructor(private readonly notificationRepo: INotificationRepository) {}
  
  async addClient(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    
    if (!userId) {
      throw new Error("User ID is required");
    }

    if (!this.connections.has(userId)) {
        this.connections.set(userId, []);
    }
    
    this.connections.get(userId)!.push(res);
    
    // Set SSE headers with additional headers to prevent buffering
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
        'Transfer-Encoding': 'chunked'
    });
    
    // Flush headers immediately
    res.flushHeaders();
    
    // Send initial connection message with proper SSE format
    this.sendSSEMessage(res, {
      event: 'connected',
      data: { type: 'connected', message: 'Successfully connected to notification stream' }
    });
    
    // Send recent notifications (combined: admin + user notifications)
    if (this.notificationRepo) {
        console.log('📬 Fetching recent notifications for user:', userId);
        await this.sendRecentNotifications(userId, res);
    }
    
    // Keep connection alive with heartbeat
    const heartbeat = setInterval(() => {
        try {
            res.write(`:heartbeat ${Date.now()}\n\n`);
        } catch (error) {
            console.error('Heartbeat failed:', error);
            clearInterval(heartbeat);
        }
    }, 30000);
    
    // Cleanup when client disconnects
    res.on('close', () => {
        clearInterval(heartbeat);
        this.removeClient(userId, res);
        console.log(`❌ Client disconnected: ${userId}`);
    });
    
    console.log(`✅ Client connected: ${userId} (total: ${this.connections.get(userId)!.length})`);
  }
  
  private removeClient(userId: string, res: Response): void {
      const userConnections = this.connections.get(userId);
      if (!userConnections) return;
      
      const index = userConnections.indexOf(res);
      if (index > -1) {
          userConnections.splice(index, 1);
      }
      
      if (userConnections.length === 0) {
          this.connections.delete(userId);
      }
  }
  
  /**
   * Send notification to a specific user
   * Used for user-specific notifications
   */
  async send(payload: NotificationPayload): Promise<void> {
      const userConnections = this.connections.get(payload.userId);
      
      if (!userConnections || userConnections.length === 0) {
          console.log(`📭 User ${payload.userId} not connected, skipping real-time notification`);
          return;
      }
      
      let successCount = 0;
      userConnections.forEach(res => {
          try {
              this.sendSSEMessage(res, {
                  event: 'notification',
                  id: payload.id || Date.now().toString(),
                  data: payload
              });
              successCount++;
          } catch (error) {
              console.error('Failed to send to connection:', error);
          }
      });
      
      console.log(`📱 Notification sent to user ${payload.userId} (${successCount}/${userConnections.length} connections)`);
  }
  
  private sendSSEMessage(res: Response, { event, id, data }: { event?: string; id?: string; data: any }): void {
      try {
          if (id) {
              res.write(`id: ${id}\n`);
          }
          if (event) {
              res.write(`event: ${event}\n`);
          }
          res.write(`data: ${JSON.stringify(data)}\n\n`);
          
          // Force flush to ensure immediate delivery
          if (typeof (res as any).flush === 'function') {
              (res as any).flush();
          }
      } catch (error) {
          console.error('Error writing SSE message:', error);
          throw error;
      }
  }
  
  isUserOnline(userId: string): boolean {
      return this.connections.has(userId) && this.connections.get(userId)!.length > 0;
  }
  
  getOnlineUsersCount(): number {
      return this.connections.size;
  }
  
  /**
   * Broadcast to all connected users
   * Used for admin notifications - only sends to currently connected users
   */
  async broadcast(payload: Omit<NotificationPayload, 'userId'>): Promise<void> {
      const onlineUsers = Array.from(this.connections.keys());
      
      console.log(`📢 Broadcasting to ${onlineUsers.length} connected users`);
      
      for (const userId of onlineUsers) {
          await this.send({ ...payload, userId });
      }
      
      console.log(`📢 Broadcast completed to ${onlineUsers.length} users`);
  }

  /**
   * Send recent notifications when user connects
   * Fetches combined notifications (admin + user, last 5)
   * Admin notifications appear first, then user notifications
   * Does NOT mark as read - user must explicitly mark them
   */
  private async sendRecentNotifications(userId: string, res: Response): Promise<void> {
    try {
      // Fetch combined notifications (admin + user)
      const recentNotifications = await this.notificationRepo.getCombinedNotifications(userId, 5, 0);
      
      console.log(`📬 Found ${recentNotifications.length} recent notifications for ${userId}`);
      
      if (recentNotifications.length > 0) {
        const unreadCount = recentNotifications.filter(n => !n.read).length;
        console.log(`📤 Sending ${recentNotifications.length} notifications (${unreadCount} unread)`);
        
        // Send all notifications via SSE
        for (const notification of recentNotifications) {
          this.sendSSEMessage(res, {
            event: 'notification',
            id: notification.id,
            data: {
              id: notification.id,
              userId: userId,
              title: notification.title,
              message: notification.message,
              module: notification.module,
              type: notification.type,
              metadata: notification.metadata,
              timestamp: notification.createdAt,
              read: notification.read,
              isAdminNotification: notification.isAdminNotification,
              fromDatabase: true
            }
          });
          
          // Small delay to ensure proper delivery
          await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        console.log(`✅ Successfully sent ${recentNotifications.length} notifications to ${userId}`);
      } else {
        console.log(`📪 No notifications to send for ${userId}`);
      }
    } catch (error) {
      console.error('❌ Error fetching/sending notifications:', error);
    }
  }
}