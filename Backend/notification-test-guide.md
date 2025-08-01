# 🧪 Hướng dẫn Test Notification System

## 🚀 Bước 1: Start Server
```bash
cd Backend
npm run start:dev
```

## 🔐 Bước 2: Lấy JWT Token

### Đăng nhập để lấy token:
```bash
# POST http://localhost:3000/auth/login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "your_password"
  }'
```

**Lưu lại `accessToken` để sử dụng cho các requests tiếp theo.**

## 📨 Bước 3: Test Admin Notification APIs

### 3.1. Tạo notification cho 1 user cụ thể:
```bash
curl -X POST http://localhost:3000/notifications/admin/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "userId": "USER_OBJECT_ID",
    "title": "Thông báo test",
    "content": "Đây là notification test từ admin",
    "type": "admin_message",
    "data": {
      "priority": "high",
      "category": "announcement"
    }
  }'
```

### 3.2. Broadcast notification tới nhiều users:
```bash
curl -X POST http://localhost:3000/notifications/admin/broadcast \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Thông báo quan trọng",
    "content": "Tất cả users sẽ nhận được thông báo này",
    "type": "broadcast",
    "userIds": ["USER_ID_1", "USER_ID_2", "USER_ID_3"]
  }'
```

### 3.3. Broadcast tới TẤT CẢ users (bỏ trống userIds):
```bash
curl -X POST http://localhost:3000/notifications/admin/broadcast \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Thông báo hệ thống",
    "content": "Thông báo này sẽ gửi tới tất cả users trong hệ thống",
    "type": "system_announcement"
  }'
```

### 3.4. Tạo System Notification:
```bash
curl -X POST http://localhost:3000/notifications/admin/system \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Bảo trì hệ thống",
    "content": "Hệ thống sẽ bảo trì từ 2:00 - 4:00 sáng ngày mai",
    "data": {
      "maintenance_time": "2024-01-15T02:00:00Z",
      "duration": "2 hours"
    }
  }'
```

## 🌐 Bước 4: Test WebSocket Connection

### 4.1. Tạo file test client:
```javascript
// test-websocket.js
const io = require('socket.io-client');

const socket = io('http://localhost:3000/notifications', {
  auth: {
    token: 'YOUR_JWT_TOKEN' // Thay bằng token thật
  }
});

socket.on('connect', () => {
  console.log('✅ Connected to WebSocket');
});

socket.on('new_notification', (notification) => {
  console.log('🔔 New notification received:', notification);
});

socket.on('unread_count', (data) => {
  console.log('📊 Unread count:', data.count);
});

socket.on('admin_notification', (notification) => {
  console.log('👨‍💼 Admin notification:', notification);
});

socket.on('error', (error) => {
  console.error('❌ Socket error:', error);
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from WebSocket');
});

// Keep connection alive
setInterval(() => {
  console.log('🟢 WebSocket still connected...');
}, 30000);
```

### 4.2. Chạy WebSocket client:
```bash
node test-websocket.js
```

## 🧪 Bước 5: Test Flow Hoàn Chỉnh

### 1. Kết nối WebSocket với user token
### 2. Từ Postman/curl, gửi notification qua admin API
### 3. Kiểm tra WebSocket client nhận được notification real-time
### 4. Test các loại notification khác nhau:
   - ✅ Single user notification
   - ✅ Broadcast to specific users  
   - ✅ Broadcast to all users
   - ✅ System notifications

## 📊 Bước 6: Kiểm tra Admin Statistics

```bash
# Xem thống kê notifications
curl -X GET http://localhost:3000/notifications/admin/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Xem tất cả notifications với filters
curl -X GET "http://localhost:3000/notifications/admin/all?page=1&limit=10&type=system" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🛠️ Debug Tips:

### 1. Kiểm tra user role:
Đảm bảo user có role='admin' trong database

### 2. Kiểm tra JWT token:
```bash
# Decode JWT để xem payload
node -e "console.log(JSON.parse(Buffer.from('JWT_PAYLOAD_PART'.split('.')[1], 'base64').toString()))"
```

### 3. Kiểm tra WebSocket connection:
- Mở browser dev tools → Network → WS để xem WebSocket connections
- Kiểm tra console logs để thấy connect/disconnect events

### 4. Test với multiple users:
- Tạo nhiều WebSocket connections với different tokens
- Gửi notification từ admin và kiểm tra các clients nhận được

## 🔍 Expected Results:

1. **REST API**: Response trả về success với notification data
2. **WebSocket**: Client nhận được event `new_notification` ngay lập tức  
3. **Database**: Notification được lưu vào MongoDB
4. **Unread count**: Tự động cập nhật cho user

**Chúc bạn test thành công! 🎉**