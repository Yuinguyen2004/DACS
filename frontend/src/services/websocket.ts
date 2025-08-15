import { io, Socket } from 'socket.io-client';
import { authAPI } from './api';
import { Notification as NotificationType } from '../types/types';

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(): void {
    const token = authAPI.getToken();
    const user = authAPI.getCurrentUser();
    
    if (!token || !user) {
      console.warn('No authentication token or user found, skipping WebSocket connection');
      return;
    }

    // Disconnect existing socket if any
    if (this.socket) {
      this.socket.disconnect();
    }

    // Connect to the notifications namespace
    this.socket = io(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/notifications`, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected to notifications');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      // Don't manually handle reconnection, let Socket.IO handle it automatically
      if (reason === 'io server disconnect') {
        console.log('🔌 Server initiated disconnect - will not auto-reconnect');
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
      // Let Socket.IO handle reconnection automatically
    });

    this.socket.on('new_notification', (notification: NotificationType) => {
      console.log('🔔 New notification received:', notification);
      this.handleNewNotification(notification);
    });

    this.socket.on('unread_count', (data: { count: number }) => {
      console.log('📊 Unread count updated:', data.count);
      this.handleUnreadCountUpdate(data.count);
    });

    this.socket.on('notification_read', (data: { notificationId: string }) => {
      console.log('✅ Notification marked as read:', data.notificationId);
    });

    this.socket.on('all_notifications_read', (data: { modifiedCount: number }) => {
      console.log('✅ All notifications marked as read:', data.modifiedCount);
      this.handleUnreadCountUpdate(0);
    });

    this.socket.on('error', (error: any) => {
      console.error('❌ WebSocket error:', error);
    });
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        if (this.socket && !this.socket.connected) {
          this.socket.connect();
        }
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('❌ Max reconnection attempts reached');
    }
  }

  private handleNewNotification(notification: NotificationType): void {
    // Show browser notification if permission is granted
    if (Notification.permission === 'granted') {
      new window.Notification(notification.title, {
        body: notification.content,
        icon: '/vite.svg', // You can replace this with your app icon
        tag: notification._id,
      });
    }

    // Dispatch custom event for components to listen to
    window.dispatchEvent(new CustomEvent('newNotification', { 
      detail: notification 
    }));
  }

  private handleUnreadCountUpdate(count: number): void {
    // Dispatch custom event for header to update unread count
    window.dispatchEvent(new CustomEvent('unreadCountUpdate', { 
      detail: { count } 
    }));
  }

  // Request browser notification permission
  requestNotificationPermission(): void {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        console.log('Notification permission:', permission);
      });
    }
  }

  // WebSocket methods for interacting with server
  getMyNotifications(page: number = 1, limit: number = 10): void {
    if (this.socket?.connected) {
      this.socket.emit('get_my_notifications', { page, limit });
    }
  }

  markAsRead(notificationId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('mark_as_read', { notificationId });
    }
  }

  markAllAsRead(): void {
    if (this.socket?.connected) {
      this.socket.emit('mark_all_as_read');
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService();