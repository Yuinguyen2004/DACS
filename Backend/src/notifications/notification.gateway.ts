import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { NotificationService } from './notification.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userEmail?: string;
  userRole?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*', // Configure này trong production
    methods: ['GET', 'POST'],
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('NotificationGateway');
  private connectedUsers = new Map<string, string>(); // userId -> socketId

  constructor(
    private notificationService: NotificationService,
    private jwtService: JwtService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket, ...args: any[]) {
    try {
      // Extract token from query parameters or headers
      const token = client.handshake.auth.token || client.handshake.query.token;

      if (!token) {
        this.logger.error(`Client ${client.id} connected without token`);
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = this.jwtService.verify(token.replace('Bearer ', ''));

      if (!payload.sub || !payload.email) {
        this.logger.error(`Invalid token payload for client ${client.id}`);
        client.disconnect();
        return;
      }

      // Attach user info to socket
      client.userId = payload.sub;
      client.userEmail = payload.email;
      client.userRole = payload.role || 'user';

      // Store connection
      if (client.userId) {
        this.connectedUsers.set(client.userId, client.id);

        // Join user to their personal room
        client.join(`user_${client.userId}`);

        // Join admin to admin room if applicable
        if (client.userRole === 'admin') {
          client.join('admin_room');
        }

        this.logger.log(
          `User ${client.userEmail} (${client.userId}) connected with socket ${client.id}`,
        );

        // Send initial unread count
        const unreadCount = await this.notificationService.getUnreadCount(
          client.userId,
        );
        client.emit('unread_count', { count: unreadCount });
      }
    } catch (error) {
      this.logger.error(
        `Authentication failed for client ${client.id}: ${error.message}`,
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.connectedUsers.delete(client.userId);
      this.logger.log(
        `User ${client.userEmail} (${client.userId}) disconnected`,
      );
    }
  }

  // Method to send notification to specific user
  async sendNotificationToUser(userId: string, notification: any) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.server.to(`user_${userId}`).emit('new_notification', notification);

      // Update unread count
      const unreadCount = await this.notificationService.getUnreadCount(userId);
      this.server
        .to(`user_${userId}`)
        .emit('unread_count', { count: unreadCount });

      this.logger.log(`Notification sent to user ${userId}`);
      return true;
    }
    return false;
  }

  // Method to broadcast notification to all connected users
  async broadcastNotification(notification: any, excludeUserId?: string) {
    this.server.emit('new_notification', notification);
    this.logger.log(`Broadcast notification sent to all users`);

    // Update unread counts for all connected users
    for (const [userId, socketId] of this.connectedUsers.entries()) {
      if (excludeUserId && userId === excludeUserId) continue;

      try {
        const unreadCount =
          await this.notificationService.getUnreadCount(userId);
        this.server
          .to(`user_${userId}`)
          .emit('unread_count', { count: unreadCount });
      } catch (error) {
        this.logger.error(
          `Failed to update unread count for user ${userId}: ${error.message}`,
        );
      }
    }
  }

  // Method to send notification to admins only
  async sendNotificationToAdmins(notification: any) {
    this.server.to('admin_room').emit('admin_notification', notification);
    this.logger.log('Notification sent to all admins');
  }

  // Handle client requesting their notifications
  @SubscribeMessage('get_my_notifications')
  async handleGetMyNotifications(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { page?: number; limit?: number },
  ) {
    if (!client.userId) {
      client.emit('error', { message: 'Unauthorized' });
      return;
    }

    try {
      const result = await this.notificationService.findByUserId(
        client.userId,
        data.page || 1,
        data.limit || 10,
      );
      client.emit('my_notifications', result);
    } catch (error) {
      client.emit('error', { message: 'Failed to fetch notifications' });
      this.logger.error(
        `Failed to fetch notifications for user ${client.userId}: ${error.message}`,
      );
    }
  }

  // Handle client marking notification as read
  @SubscribeMessage('mark_as_read')
  async handleMarkAsRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { notificationId: string },
  ) {
    if (!client.userId) {
      client.emit('error', { message: 'Unauthorized' });
      return;
    }

    try {
      // Verify ownership
      const isOwner =
        await this.notificationService.verifyNotificationOwnership(
          data.notificationId,
          client.userId,
        );

      if (!isOwner && client.userRole !== 'admin') {
        client.emit('error', { message: 'Access denied' });
        return;
      }

      await this.notificationService.markAsRead(data.notificationId);

      // Send updated unread count
      const unreadCount = await this.notificationService.getUnreadCount(
        client.userId,
      );
      client.emit('unread_count', { count: unreadCount });
      client.emit('notification_read', { notificationId: data.notificationId });
    } catch (error) {
      client.emit('error', { message: 'Failed to mark notification as read' });
      this.logger.error(
        `Failed to mark notification as read: ${error.message}`,
      );
    }
  }

  // Handle client marking all notifications as read
  @SubscribeMessage('mark_all_as_read')
  async handleMarkAllAsRead(@ConnectedSocket() client: AuthenticatedSocket) {
    if (!client.userId) {
      client.emit('error', { message: 'Unauthorized' });
      return;
    }

    try {
      const result = await this.notificationService.markAllAsReadForUser(
        client.userId,
      );
      client.emit('all_notifications_read', {
        modifiedCount: result.modifiedCount,
      });
      client.emit('unread_count', { count: 0 });
    } catch (error) {
      client.emit('error', {
        message: 'Failed to mark all notifications as read',
      });
      this.logger.error(
        `Failed to mark all notifications as read: ${error.message}`,
      );
    }
  }

  // Get connected users count (admin only)
  @SubscribeMessage('get_connected_users')
  async handleGetConnectedUsers(
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (client.userRole !== 'admin') {
      client.emit('error', { message: 'Admin access required' });
      return;
    }

    const connectedCount = this.connectedUsers.size;
    const connectedUserIds = Array.from(this.connectedUsers.keys());

    client.emit('connected_users', {
      count: connectedCount,
      userIds: connectedUserIds,
    });
  }
}
