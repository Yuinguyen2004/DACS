# DACS - E-Learning Quiz Platform

Một nền tảng học tập trực tuyến với hệ thống quiz và bài kiểm tra thông minh, hỗ trợ thanh toán đa dạng và quản lý leaderboard.

## 🚀 Tính năng chính

### 🔐 Hệ thống xác thực & người dùng
- **Đăng ký/Đăng nhập**: Xác thực JWT an toàn
- **Quản lý hồ sơ**: Cập nhật thông tin, đổi mật khẩu, avatar người dùng
- **Phân quyền**: User và Admin với các quyền hạn khác nhau
- **Gói đăng ký**: Hệ thống subscription với nhiều loại gói (monthly, yearly, lifetime)

### 📝 Hệ thống Quiz
- **Tạo Quiz**: Tạo quiz với hình ảnh, giới hạn thời gian, câu hỏi premium *(Chỉ Admin & Premium Users)*
- **Import tự động**: Nhập quiz từ file Word (.docx) hoặc PDF bằng AI (Gemini) *(Chỉ Admin & Premium Users)*
- **Loại câu hỏi**: Trắc nghiệm (MCQ) và Đúng/Sai (True/False)
- **Quản lý quyền**: Chỉ chủ sở hữu hoặc admin mới có thể sửa/xóa quiz
- **Quiz Premium**: Yêu cầu gói trả phí để truy cập
- **Phân loại nội dung**: Quiz miễn phí vs Premium với kiểm soát truy cập nghiêm ngặt

### 🎯 Làm bài & Chấm điểm
- **Bắt đầu bài thi**: Hệ thống tracking thời gian làm bài với kiểm tra quyền truy cập
- **Kiểm soát Premium**: Tự động chặn user thường làm quiz premium
- **Nộp bài**: Tự động chấm điểm và lưu kết quả
- **Lịch sử**: Xem lại các lần làm bài trước đó
- **Chi tiết kết quả**: Review đáp án đúng/sai sau khi hoàn thành

### 🏆 Bảng xếp hạng (Leaderboard)
- **Ranking theo Quiz**: Xếp hạng người dùng dựa trên điểm số
- **Thống kê cá nhân**: Xem vị trí của mình trong từng quiz
- **Quản lý Admin**: Admin có thể tạo/sửa/xóa bảng xếp hạng

### 💳 Hệ thống thanh toán
- **VNPay**: Thanh toán qua ví điện tử VNPay (Việt Nam)
- **PayPal**: Thanh toán quốc tế qua PayPal
- **Webhook**: Xử lý tự động kết quả thanh toán
- **Return URLs**: Xử lý redirect sau thanh toán thành công/thất bại
- **Hủy subscription**: Người dùng có thể hủy gói đăng ký

### 🔔 Hệ thống thông báo
- **Real-time WebSocket**: Socket.IO cho thông báo tức thời
- **Thông báo cá nhân**: Gửi thông báo cho từng người dùng
- **Broadcast**: Admin gửi thông báo tới nhiều người cùng lúc
- **Thông báo hệ thống**: Thông báo tự động từ hệ thống
- **Email notifications**: SendGrid integration cho email alerts
- **Quản lý trạng thái**: Đánh dấu đã đọc/chưa đọc
- **Phân loại**: Các loại thông báo khác nhau (system, payment, quiz, etc.)

### 📊 Gói dịch vụ (Packages)
- **Quản lý gói**: Tạo/sửa/xóa các gói subscription
- **Pricing**: Thiết lập giá và thời hạn cho từng gói
- **Benefits**: Mô tả lợi ích của từng gói

## 🛠 Công nghệ sử dụng

### Backend
- **Framework**: NestJS (Node.js)
- **Database**: MongoDB với Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens) + Firebase Admin SDK
- **Real-time**: Socket.IO cho WebSocket notifications
- **Scheduling**: NestJS Schedule (cron jobs) cho auto test timeout
- **File Processing**: Mammoth (Word), pdf-parse (PDF), Multer (uploads)
- **AI Integration**: Google Gemini AI cho import quiz tự động
- **Payment**: VNPay SDK, PayPal SDK với webhook support
- **Email**: SendGrid cho email notifications
- **Validation**: class-validator, class-transformer

### Frontend
- **Framework**: React 19 với TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Animations**: GSAP (@gsap/react)
- **Charts**: Recharts
- **Icons**: Lucide React + React Icons
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **Real-time**: Socket.IO Client
- **Date Processing**: Day.js
- **Firebase**: Firebase client SDK

### DevOps & Tools
- **Testing**: Jest (backend), ESLint + Prettier (both)
- **Type Safety**: TypeScript (full-stack)
- **Package Manager**: npm
- **Development**: Hot reload với nodemon (backend), Vite HMR (frontend)

## 🏗 Kiến trúc hệ thống

### Cấu trúc dự án
```
DACS/
├── Backend/                 # NestJS API Server
│   ├── src/
│   │   ├── auth/           # JWT + Firebase authentication
│   │   ├── users/          # User management + subscription
│   │   ├── quizzes/        # Quiz CRUD + AI import
│   │   ├── questions/      # Question management
│   │   ├── answers/        # Answer management
│   │   ├── test-attempts/  # Test taking + premium control
│   │   ├── leaderboards/   # Ranking system
│   │   ├── payments/       # VNPay + PayPal integration
│   │   ├── packages/       # Subscription packages
│   │   └── notifications/  # WebSocket + email notifications
│   └── package.json
├── frontend/               # React + TypeScript SPA
│   ├── src/
│   │   ├── components/     # UI components (shadcn/ui based)
│   │   ├── services/       # API + WebSocket clients
│   │   ├── types/          # TypeScript definitions
│   │   ├── hooks/          # Custom React hooks
│   │   └── firebase/       # Firebase configuration
│   └── package.json
└── README.md
```

### API Endpoints
```
/auth              - Xác thực người dùng (JWT + Firebase)
/users             - Quản lý người dùng + kiểm tra subscription status
/quizzes           - CRUD Quiz và import file (Premium gated)
  ├── GET /accessible     - Quiz có thể truy cập theo subscription
  ├── POST / (Premium)    - Tạo quiz (chỉ Admin & Premium)
  └── POST /import (Premium) - Import AI (chỉ Admin & Premium)
/questions         - Quản lý câu hỏi
/answers           - Quản lý đáp án
/test-attempts     - Làm bài với premium access control
/leaderboards      - Bảng xếp hạng
/payments          - Xử lý thanh toán (VNPay + PayPal)
/packages          - Quản lý gói dịch vụ
/notifications     - Hệ thống thông báo + WebSocket gateway
```

## 🏗 Cấu trúc Database

### Các collection chính:
- **users**: Thông tin người dùng, subscription, avatar
- **quizzes**: Quiz với hình ảnh, time limit, premium status
- **questions**: Câu hỏi thuộc quiz
- **answers**: Đáp án của câu hỏi
- **test-attempts**: Lịch sử làm bài của người dùng
- **leaderboards**: Bảng xếp hạng
- **payments**: Giao dịch thanh toán
- **packages**: Các gói dịch vụ
- **notifications**: Thông báo người dùng

## 🚀 Cài đặt và chạy dự án

### Prerequisites
- Node.js (v18+)
- MongoDB
- npm hoặc yarn
- Firebase project setup

### Backend Setup
```bash
cd Backend
npm install
# Tạo file .env với các biến môi trường cần thiết
npm run start:dev  # Development mode
npm run build      # Production build
npm run start:prod # Production mode
```

### Frontend Setup  
```bash
cd frontend
npm install
npm run dev        # Development mode (Vite)
npm run build      # Production build
npm run preview    # Preview production build
```

### Environment Variables
#### Backend (.env)
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
FIREBASE_PROJECT_ID=your_firebase_project_id
SENDGRID_API_KEY=your_sendgrid_key
VNPAY_TMN_CODE=your_vnpay_code
VNPAY_SECRET_KEY=your_vnpay_secret
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_secret
```

#### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:3000
VITE_FIREBASE_CONFIG=your_firebase_config_object
```

## 📁 TypeScript Integration
- **Backend**: Đầy đủ NestJS TypeScript với decorators và DTOs
- **Frontend**: React + TypeScript với strict type checking
- **Shared Types**: File `types.ts` đồng bộ interfaces giữa frontend-backend

## 🎭 Premium Access Control

### 🚫 **Free Users** (Gói miễn phí)
- ✅ Xem danh sách quiz miễn phí (`is_premium: false`)
- ✅ Làm quiz miễn phí
- ✅ Xem lịch sử và kết quả làm bài
- ✅ Tham gia leaderboard
- ❌ **Không thể** tạo quiz mới
- ❌ **Không thể** import quiz từ file
- ❌ **Không thể** truy cập quiz premium
- ❌ **Không thể** làm quiz premium

### 💎 **Premium Users** (Đã đăng ký gói trả phí)
- ✅ **Tất cả tính năng của Free Users**
- ✅ **Tạo quiz mới** với đầy đủ tính năng
- ✅ **Import quiz từ file** Word/PDF bằng AI
- ✅ **Truy cập quiz premium** của người khác
- ✅ **Làm quiz premium**
- ✅ Tạo quiz premium cho người khác

### 👑 **Admin** (Quản trị viên)
- ✅ **Full access** tất cả tính năng
- ✅ Quản lý quiz của tất cả users
- ✅ Quản lý leaderboard
- ✅ Quản lý notifications
- ✅ Bypass mọi premium restrictions

### 🔐 **Logic kiểm soát**
- **Kiểm tra khi tạo quiz**: `checkPremiumAccess()` trong QuizController
- **Kiểm tra khi import**: Validation trước khi AI processing
- **Kiểm tra khi truy cập**: Premium quiz chỉ hiển thị cho đúng user
- **Kiểm tra khi làm bài**: TestAttemptService validate trước khi start

## 🎯 Tính năng nổi bật

### 🤖 Import Quiz bằng AI *(Premium Feature)*
- Upload file Word/PDF (chỉ Admin & Premium Users)
- AI tự động phân tích và tạo câu hỏi
- Hỗ trợ nhiều định dạng câu hỏi
- Validation thông minh

### 🔒 Bảo mật & Kiểm soát truy cập
- **Hybrid Authentication**: JWT + Firebase Admin SDK
- **Role-based access control**: User/Admin với Guards và Decorators
- **Premium Access Control**: Kiểm soát nghiêm ngặt nội dung premium
- **Multi-layer Protection**: Quiz creation, quiz access, test attempts
- **Input validation**: class-validator + class-transformer
- **Secure payments**: VNPay + PayPal với webhook verification
- **Real-time security**: WebSocket authentication & authorization

### 📱 User Experience theo Subscription
- **Modern UI**: React 19 + Tailwind CSS + shadcn/ui components
- **Smooth Animations**: GSAP-powered interactions
- **Real-time Updates**: Socket.IO cho instant notifications
- **Responsive Design**: Mobile-first approach
- **Free Users**: Truy cập quiz miễn phí, không thể tạo quiz
- **Premium Users**: Full access, tạo quiz, import AI, quiz premium
- **Admin Dashboard**: Charts, analytics với Recharts
- **Progress tracking**: Comprehensive history với time tracking

---

*Dự án được phát triển với mục tiêu tạo ra một nền tảng học tập hiện đại, thân thiện với người dùng và có khả năng mở rộng cao.*
