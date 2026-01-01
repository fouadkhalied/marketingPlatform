import { Request, Response } from "express";
import { NotificationChannel } from "../interfaces/notification.channel.interface";
import { NotificationPayload } from "../interfaces/notification.payload.interface";
import { INotificationRepository } from "../repositories/notification.repository.interface";

export class SSENotificationChannel implements NotificationChannel {
  name = "sse";
  private connections = new Map<string, Response[]>(); // userId -> Response[]

  constructor(private readonly notificationRepo: INotificationRepository) {}
  
  // Call this from your Express route
  async addClient(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    
    if (!userId) {
      throw new Error("User ID is required");
    }

    // Initialize array if first connection
    if (!this.connections.has(userId)) {
        this.connections.set(userId, []);
    }
    
    // Add this connection
    this.connections.get(userId)!.push(res);
    
    // Set SSE headers
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no' // Disable nginx buffering
    });
    
    // Send initial connection message
    res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);
    
    // Send unread notifications if repository is available
    if (this.notificationRepo) {
        console.log('sending unread notifications');
        
      await this.sendUnreadNotifications(userId, res);
    }
    
    // Keep connection alive with heartbeat
    const heartbeat = setInterval(() => {
        res.write(`:heartbeat\n\n`);
    }, 30000); // Every 30 seconds
    
    // Cleanup when client disconnects
    res.on('close', () => {
        clearInterval(heartbeat);
        this.removeClient(userId, res);
        console.log(`Client disconnected: ${userId}`);
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
      
      // Remove user entry if no more connections
      if (userConnections.length === 0) {
          this.connections.delete(userId);
      }
  }
  
  async send(payload: NotificationPayload): Promise<void> {
      const userConnections = this.connections.get(payload.userId);
      
      if (!userConnections || userConnections.length === 0) {
          console.log(`📭 User ${payload.userId} not connected, skipping`);
          return;
      }
      
      const data = `data: ${JSON.stringify(payload)}\n\n`;
      
      // Send to all user's active connections
      let successCount = 0;
      userConnections.forEach(res => {
          try {
              res.write(data);
              successCount++;
          } catch (error) {
              console.error('Failed to send to connection:', error);
          }
      });
      
      console.log(`📱 Notification sent to user ${payload.userId} (${successCount}/${userConnections.length} connections)`);
  }
  
  // Helper: Check if user is online
  isUserOnline(userId: string): boolean {
      return this.connections.has(userId) && this.connections.get(userId)!.length > 0;
  }
  
  // Helper: Get online users count
  getOnlineUsersCount(): number {
      return this.connections.size;
  }
  
  // Helper: Broadcast to all connected users
  async broadcast(payload: Omit<NotificationPayload, 'userId'>): Promise<void> {
      const onlineUsers = Array.from(this.connections.keys());
      
      for (const userId of onlineUsers) {
          await this.send({ ...payload, userId });
      }
      
      console.log(`📢 Broadcast sent to ${onlineUsers.length} users`);
  }

  private async sendUnreadNotifications(userId: string, res: Response): Promise<void> {
  

    try {
      const unreadNotifications = await this.notificationRepo.findByUserId(userId);
      
      if (unreadNotifications && unreadNotifications.length > 0) {
        console.log(`📬 Sending ${unreadNotifications.length} unread notifications to ${userId}`);
        console.log(unreadNotifications);
        
        
        for (const notification of unreadNotifications) {
          const data = `data: ${JSON.stringify({
            id: notification.id,
            userId: notification.userId,
            title: notification.title,
            message: notification.message,
            module: notification.module,
            type: notification.type,
            metadata: notification.metadata,
            timestamp: notification.createdAt,
            read: notification.read,
            fromDatabase: true // Flag to indicate this is from DB
          })}\n\n`;
          
          res.write(data);
        }
      }
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
    }
  }
}