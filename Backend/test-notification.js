#!/usr/bin/env node

/**
 * Script test notification system
 * Chạy: node test-notification.js
 */

const io = require('socket.io-client');

// CẤU HÌNH - THAY ĐỔI THEO SETUP CỦA BẠN
const CONFIG = {
  serverUrl: 'http://localhost:3000',
  // Thay đổi token này bằng token thật từ login API
  userToken:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ODg3MjRmMzJmYjljMTA1NDRhNDRlMjQiLCJlbWFpbCI6Ik5ndXllbm1vbmdraGFuZzEyM0BnbWFpbC5jb20iLCJyb2xlIjoidXNlciIsImlhdCI6MTc1NDA2MzI3MCwiZXhwIjoxNzU0NjY4MDcwfQ.Mkn_mxT_W_AaUKWLIo-tAb3QBXhO--CWa_wMX1fVUBA', // Token của user thường
  adminToken:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ODcyMDA0OWE4NGJjMzFjMGRmYjY5NTkiLCJlbWFpbCI6Im5ndXllbnRoYW5oaHV5MjI4MDYwMTIwOEBnbWFpbC5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTQwNjI2MzgsImV4cCI6MTc1NDY2NzQzOH0.QKyOzw5nFyGg2UCTx1VVRcRqJAWkdJeP0h5Uz8WfgrE', // Token của admin
};

class NotificationTester {
  constructor() {
    this.userSocket = null;
    this.adminSocket = null;
  }

  // Kết nối WebSocket như user thường
  connectAsUser() {
    console.log('🔌 Connecting as regular user...');

    this.userSocket = io(`${CONFIG.serverUrl}/notifications`, {
      auth: { token: CONFIG.userToken },
    });

    this.userSocket.on('connect', () => {
      console.log('✅ User connected to WebSocket');
    });

    this.userSocket.on('new_notification', (notification) => {
      console.log('🔔 USER received notification:', {
        title: notification.title,
        content: notification.content,
        type: notification.type,
        createdAt: notification.createdAt,
      });
    });

    this.userSocket.on('unread_count', (data) => {
      console.log('📊 USER unread count:', data.count);
    });

    this.userSocket.on('error', (error) => {
      console.error('❌ USER socket error:', error);
    });

    this.userSocket.on('disconnect', () => {
      console.log('❌ USER disconnected');
    });
  }

  // Kết nối WebSocket như admin
  connectAsAdmin() {
    console.log('🔌 Connecting as admin...');

    this.adminSocket = io(`${CONFIG.serverUrl}/notifications`, {
      auth: { token: CONFIG.adminToken },
    });

    this.adminSocket.on('connect', () => {
      console.log('✅ Admin connected to WebSocket');
    });

    this.adminSocket.on('admin_notification', (notification) => {
      console.log('👨‍💼 ADMIN received notification:', notification);
    });

    this.adminSocket.on('error', (error) => {
      console.error('❌ ADMIN socket error:', error);
    });
  }

  // Test gửi notification qua REST API
  async sendTestNotification() {
    console.log('\n📨 Sending test notification via REST API...');

    try {
      const response = await fetch(
        `${CONFIG.serverUrl}/notifications/admin/broadcast`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${CONFIG.adminToken}`,
          },
          body: JSON.stringify({
            title: '🧪 Test Notification',
            content: 'Đây là notification test từ script!',
            type: 'test',
            data: {
              testId: Date.now(),
              source: 'test-script',
            },
          }),
        },
      );

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Notification sent successfully:', result);
      } else {
        console.error(
          '❌ Failed to send notification:',
          response.status,
          response.statusText,
        );
      }
    } catch (error) {
      console.error('❌ Error sending notification:', error.message);
    }
  }

  // Test system notification
  async sendSystemNotification() {
    console.log('\n📢 Sending system notification...');

    try {
      const response = await fetch(
        `${CONFIG.serverUrl}/notifications/admin/system`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${CONFIG.adminToken}`,
          },
          body: JSON.stringify({
            title: '🚀 System Announcement',
            content: 'Hệ thống notification đang hoạt động tốt!',
            data: {
              version: '1.0.0',
              timestamp: new Date().toISOString(),
            },
          }),
        },
      );

      if (response.ok) {
        const result = await response.json();
        console.log('✅ System notification sent:', result);
      } else {
        console.error(
          '❌ Failed to send system notification:',
          response.status,
        );
      }
    } catch (error) {
      console.error('❌ Error sending system notification:', error.message);
    }
  }

  // Chạy test sequence
  async runTests() {
    console.log('🧪 Starting Notification System Tests...');
    console.log('='.repeat(50));

    // Kiểm tra cấu hình
    if (!CONFIG.userToken || CONFIG.userToken.includes('...')) {
      console.log('⚠️  WARNING: Please update userToken in CONFIG');
    }
    if (!CONFIG.adminToken || CONFIG.adminToken.includes('...')) {
      console.log('⚠️  WARNING: Please update adminToken in CONFIG');
    }

    // Kết nối WebSocket
    this.connectAsUser();
    this.connectAsAdmin();

    // Đợi kết nối ổn định
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Test notifications
    await this.sendTestNotification();
    await new Promise((resolve) => setTimeout(resolve, 1000));

    await this.sendSystemNotification();

    console.log('\n✅ Tests completed!');
    console.log('👂 Listening for real-time notifications...');
    console.log('   Press Ctrl+C to exit');
  }

  // Cleanup
  disconnect() {
    if (this.userSocket) this.userSocket.disconnect();
    if (this.adminSocket) this.adminSocket.disconnect();
  }
}

// Chạy tests
const tester = new NotificationTester();
tester.runTests().catch(console.error);

// Cleanup khi thoát
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  tester.disconnect();
  process.exit(0);
});

// Hướng dẫn sử dụng
console.log(`
📝 HƯỚNG DẪN SỬ DỤNG:

1. Cập nhật CONFIG trong file này:
   - userToken: JWT token của user thường
   - adminToken: JWT token của admin

2. Đảm bảo server đang chạy:
   npm run start:dev

3. Chạy script:
   node test-notification.js

4. Kiểm tra console để thấy real-time notifications!

🔑 Để lấy JWT tokens:
curl -X POST http://localhost:3000/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email": "your@email.com", "password": "your_password"}'
`);
