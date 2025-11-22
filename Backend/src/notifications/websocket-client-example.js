/**
 * Example WebSocket client code for frontend integration
 * Install: npm install socket.io-client
 */

// Frontend JavaScript example
const io = require('socket.io-client');

class NotificationClient {
  constructor(serverUrl, token) {
    this.serverUrl = serverUrl;
    this.token = token;
    this.socket = null;
  }

  connect() {
    this.socket = io(`${this.serverUrl}/notifications`, {
      auth: {
        token: this.token // JWT token
      },
      query: {
        token: this.token // Alternative way to send token
      }
    });

    // Connection events
    this.socket.on('connect', () => {
      console.log('Connected to notification server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from notification server');
    });

    // Notification events
    this.socket.on('new_notification', (notification) => {
      console.log('New notification received:', notification);
      this.showNotification(notification);
    });

    this.socket.on('unread_count', (data) => {
      console.log('Unread count:', data.count);
      this.updateUnreadBadge(data.count);
    });

    this.socket.on('notification_read', (data) => {
      console.log('Notification marked as read:', data.notificationId);
      this.markNotificationAsRead(data.notificationId);
    });

    this.socket.on('all_notifications_read', (data) => {
      console.log('All notifications marked as read:', data.modifiedCount);
      this.clearAllNotifications();
    });

    this.socket.on('admin_notification', (notification) => {
      console.log('Admin notification:', notification);
      // Handle admin-specific notifications
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  // Request user's notifications
  getMyNotifications(page = 1, limit = 10) {
    this.socket.emit('get_my_notifications', { page, limit });
  }

  // Mark notification as read
  markAsRead(notificationId) {
    this.socket.emit('mark_as_read', { notificationId });
  }

  // Mark all notifications as read
  markAllAsRead() {
    this.socket.emit('mark_all_as_read');
  }

  // Get connected users (admin only)
  getConnectedUsers() {
    this.socket.emit('get_connected_users');
  }

  // UI helper methods (implement based on your frontend framework)
  showNotification(notification) {
    // Show browser notification or update UI
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.content,
        icon: '/notification-icon.png'
      });
    }
  }

  updateUnreadBadge(count) {
    // Update notification badge in UI
    const badge = document.querySelector('.notification-badge');
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'block' : 'none';
    }
  }

  markNotificationAsRead(notificationId) {
    // Update UI to show notification as read
    const notificationElement = document.querySelector(`[data-notification-id="${notificationId}"]`);
    if (notificationElement) {
      notificationElement.classList.add('read');
    }
  }

  clearAllNotifications() {
    // Update UI to show all notifications as read
    document.querySelectorAll('.notification-item').forEach(item => {
      item.classList.add('read');
    });
  }
}

// Usage example
const notificationClient = new NotificationClient('http://localhost:3000', 'your-jwt-token');
notificationClient.connect();

// React Hook example
/*
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

export const useNotifications = (token) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!token) return;

    const newSocket = io('http://localhost:3000/notifications', {
      auth: { token }
    });

    newSocket.on('connect', () => {
      console.log('Connected to notifications');
    });

    newSocket.on('new_notification', (notification) => {
      setNotifications(prev => [notification, ...prev]);
    });

    newSocket.on('unread_count', (data) => {
      setUnreadCount(data.count);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  const markAsRead = (notificationId) => {
    if (socket) {
      socket.emit('mark_as_read', { notificationId });
    }
  };

  const markAllAsRead = () => {
    if (socket) {
      socket.emit('mark_all_as_read');
    }
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead
  };
};
*/

module.exports = NotificationClient;