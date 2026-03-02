# DACS - E-Learning Quiz Platform

Nen tang hoc tap truc tuyen voi he thong quiz va bai kiem tra thong minh, ho tro thanh toan da dang, quan ly leaderboard, va ung dung mobile.

## Tinh nang chinh

### He thong xac thuc & nguoi dung
- Dang ky/Dang nhap voi JWT va Firebase Authentication
- Quan ly ho so: cap nhat thong tin, doi mat khau, avatar
- Phan quyen User/Admin voi Guards va Decorators
- He thong subscription voi nhieu loai goi (monthly, yearly, lifetime)

### He thong Quiz
- Tao quiz voi hinh anh, gioi han thoi gian, cau hoi premium (Admin & Premium Users)
- Import tu dong tu file Word (.docx) hoac PDF bang Google Gemini AI (Admin & Premium Users)
- Loai cau hoi: Trac nghiem (MCQ) va Dung/Sai (True/False)
- Quan ly quyen: chi chu so huu hoac admin co the sua/xoa quiz
- Phan loai noi dung mien phi vs Premium voi kiem soat truy cap

### Lam bai & Cham diem
- Tracking thoi gian lam bai voi kiem tra quyen truy cap
- Tu dong chan user thuong lam quiz premium
- Tu dong cham diem va luu ket qua
- Xem lai lich su va chi tiet dap an dung/sai

### Bang xep hang (Leaderboard)
- Xep hang nguoi dung theo diem so tung quiz
- Thong ke ca nhan va vi tri cua minh
- Admin quan ly tao/sua/xoa bang xep hang

### He thong thanh toan
- VNPay: thanh toan qua vi dien tu (Viet Nam)
- PayPal: thanh toan quoc te
- Webhook xu ly tu dong ket qua thanh toan
- Return URLs redirect sau thanh toan thanh cong/that bai
- Huy subscription

### He thong thong bao
- Real-time WebSocket qua Socket.IO
- Thong bao ca nhan, broadcast, va thong bao he thong
- Email notifications qua SendGrid
- Quan ly trang thai da doc/chua doc
- Phan loai: system, payment, quiz, ...

### Goi dich vu (Packages)
- Quan ly goi subscription: tao/sua/xoa
- Thiet lap gia, thoi han, va mo ta loi ich tung goi

## Cong nghe su dung

### Backend - NestJS
| Thanh phan | Cong nghe |
|---|---|
| Framework | NestJS 11 (Node.js 20) |
| Database | MongoDB + Mongoose ODM |
| Authentication | JWT + Firebase Admin SDK + Passport |
| Real-time | Socket.IO |
| API Docs | Swagger (OpenAPI) |
| Scheduling | NestJS Schedule (cron jobs) |
| File Processing | Mammoth (Word), pdf-parse (PDF), Multer (uploads) |
| AI | Google Gemini AI |
| Payment | VNPay, PayPal (webhook support) |
| Email | SendGrid |
| Validation | class-validator, class-transformer |

### Frontend - React SPA
| Thanh phan | Cong nghe |
|---|---|
| Framework | React 19 + TypeScript |
| Build Tool | Vite 7 |
| Styling | Tailwind CSS 3 + shadcn/ui (Radix UI) |
| Animations | GSAP |
| Charts | Recharts |
| Icons | Lucide React + React Icons |
| Routing | React Router DOM 7 |
| HTTP Client | Axios |
| Real-time | Socket.IO Client |
| Date | Day.js |
| Auth | Firebase Client SDK |
| Deployment | Vercel |

### Mobile - Flutter
| Thanh phan | Cong nghe |
|---|---|
| Framework | Flutter 3 (Dart) |
| State Management | Riverpod |
| HTTP Client | Dio |
| Routing | GoRouter |
| Auth | Firebase Auth + Google Sign-in |
| Storage | Flutter Secure Storage |
| In-app Purchase | in_app_purchase |
| File Picker | file_picker |
| i18n | flutter_localizations + intl |

### DevOps
| Thanh phan | Cong nghe |
|---|---|
| Containerization | Docker + Docker Compose |
| CI/CD | GitHub Actions |
| Testing | Jest (backend), Flutter test (mobile) |
| Linting | ESLint + Prettier |
| Type Safety | TypeScript (full-stack), Dart (mobile) |
| Deployment | Vercel (frontend), Docker (backend) |

## Cau truc du an

```
DACS/
├── Backend/                  # NestJS API Server
│   ├── src/
│   │   ├── auth/             # JWT + Firebase authentication
│   │   ├── users/            # User management + subscription
│   │   ├── quizzes/          # Quiz CRUD + AI import
│   │   ├── questions/        # Question management
│   │   ├── answers/          # Answer management
│   │   ├── test-attempts/    # Test taking + premium control
│   │   ├── leaderboards/     # Ranking system
│   │   ├── payments/         # VNPay + PayPal integration
│   │   ├── packages/         # Subscription packages
│   │   ├── notifications/    # WebSocket + email notifications
│   │   ├── seed.ts           # Database seeder
│   │   ├── seed-simple.ts    # Simple seed data
│   │   ├── seed-clean.ts     # Clean seed data
│   │   └── main.ts           # App bootstrap + Swagger setup
│   ├── Dockerfile
│   └── package.json
├── frontend/                 # React + TypeScript SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/         # Authentication components
│   │   │   ├── gamified/     # Gamified UI components
│   │   │   ├── layout/       # Layout components
│   │   │   ├── quizzes/      # Quiz components
│   │   │   ├── teachers/     # Teacher/admin components
│   │   │   └── ui/           # shadcn/ui base components
│   │   ├── services/         # API client + WebSocket
│   │   ├── types/            # TypeScript definitions
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Utilities
│   │   └── firebase/         # Firebase configuration
│   ├── vercel.json
│   ├── capacitor.config.ts
│   └── package.json
├── mobilefe/                 # Flutter Mobile App
│   ├── lib/
│   │   ├── config/           # App configuration
│   │   ├── data/             # Data layer
│   │   ├── l10n/             # Localization
│   │   ├── models/           # Data models
│   │   ├── providers/        # Riverpod providers
│   │   ├── screens/          # UI screens
│   │   ├── services/         # API services
│   │   ├── widgets/          # Reusable widgets
│   │   └── main.dart         # App entry point
│   ├── android/
│   ├── ios/
│   └── pubspec.yaml
├── .github/workflows/ci.yaml # CI/CD pipeline
├── docker-compose.yml        # Docker orchestration
└── README.md
```

## API Endpoints

Swagger docs co san tai: `http://localhost:3000/api/docs`

```
/auth              - Xac thuc nguoi dung (JWT + Firebase)
/users             - Quan ly nguoi dung + kiem tra subscription status
/quizzes           - CRUD Quiz va import file (Premium gated)
  ├── GET /accessible     - Quiz co the truy cap theo subscription
  ├── POST /              - Tao quiz (chi Admin & Premium)
  └── POST /import        - Import AI (chi Admin & Premium)
/questions         - Quan ly cau hoi
/answers           - Quan ly dap an
/test-attempts     - Lam bai voi premium access control
/leaderboards      - Bang xep hang
/payments          - Xu ly thanh toan (VNPay + PayPal)
/packages          - Quan ly goi dich vu
/notifications     - He thong thong bao + WebSocket gateway
```

## Cau truc Database (MongoDB)

| Collection | Mo ta |
|---|---|
| users | Thong tin nguoi dung, subscription, avatar |
| quizzes | Quiz voi hinh anh, time limit, premium status |
| questions | Cau hoi thuoc quiz |
| answers | Dap an cua cau hoi |
| test-attempts | Lich su lam bai cua nguoi dung |
| leaderboards | Bang xep hang |
| payments | Giao dich thanh toan |
| packages | Cac goi dich vu |
| notifications | Thong bao nguoi dung |

## Cai dat va chay du an

### Yeu cau
- Node.js v20+
- MongoDB 6.0+
- Flutter SDK 3.x (cho mobile)
- npm
- Docker va Docker Compose (tuy chon)

### Cach 1: Chay bang Docker (khuyen nghi)

```bash
# Khoi dong MongoDB va Backend
docker compose up -d

# Backend chay tai http://localhost:3000
# MongoDB tai localhost:27017
```

### Cach 2: Chay thu cong

#### Backend
```bash
cd Backend
npm install

# Seed du lieu mau (tuy chon)
npm run seed           # Full seed
npm run seed:simple    # Simple seed
npm run seed:clean     # Clean seed

npm run start:dev      # Development (hot reload)
npm run build          # Production build
npm run start:prod     # Production
```

#### Frontend
```bash
cd frontend
npm install
npm run dev            # Development (Vite HMR)
npm run build          # Production build
npm run preview        # Preview production build
```

#### Mobile
```bash
cd mobilefe
flutter pub get
flutter run             # Chay tren thiet bi/emulator
flutter build apk       # Build APK (Android)
flutter build ios       # Build iOS
```

### Environment Variables

#### Backend (.env)
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=3000

# Firebase
FIREBASE_PROJECT_ID=your_firebase_project_id

# AI
GEMINI_API_KEY=your_gemini_api_key

# Payment
VNPAY_TMN_CODE=your_vnpay_code
VNPAY_SECRET_KEY=your_vnpay_secret
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_secret

# Email
SENDGRID_API_KEY=your_sendgrid_key
```

#### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:3000
VITE_FIREBASE_CONFIG=your_firebase_config_object
```

## CI/CD

GitHub Actions workflow (`.github/workflows/ci.yaml`) tu dong chay khi push/PR vao `main`, `master`, `develop`:

1. Checkout code
2. Setup Node.js 20.x va Flutter 3.x
3. Install dependencies (frontend, backend, mobile)
4. Analyze mobile code (Flutter analyze)
5. Build tat ca 3 project
6. Chay tests (mobile)
7. Upload coverage reports (Codecov)

## Premium Access Control

| Tinh nang | Free | Premium | Admin |
|---|:---:|:---:|:---:|
| Xem/lam quiz mien phi | x | x | x |
| Xem lich su va ket qua | x | x | x |
| Tham gia leaderboard | x | x | x |
| Tao quiz moi | | x | x |
| Import quiz tu file (AI) | | x | x |
| Truy cap/lam quiz premium | | x | x |
| Quan ly quiz tat ca users | | | x |
| Quan ly leaderboard | | | x |
| Quan ly notifications | | | x |
| Bypass moi restrictions | | | x |

**Logic kiem soat:**
- `checkPremiumAccess()` trong QuizController kiem tra khi tao quiz
- Validation truoc AI processing khi import
- Premium quiz chi hien thi cho dung user
- TestAttemptService validate truoc khi start lam bai

## Scripts huu ich

```bash
# Backend
npm run start:dev          # Dev server voi hot reload
npm run seed               # Seed database
npm run lint               # Lint va fix
npm run test               # Chay unit tests
npm run test:e2e           # Chay e2e tests

# Frontend
npm run dev                # Vite dev server
npm run build              # Build production
npm run lint               # Lint

# Mobile
flutter run                # Chay app
flutter test               # Chay tests
flutter analyze            # Phan tich code
flutter build apk --release # Build release APK

# Docker
docker compose up -d       # Khoi dong services
docker compose down        # Dung services
docker compose logs -f     # Xem logs
```

---

*Du an duoc phat trien voi muc tieu tao ra mot nen tang hoc tap hien dai, than thien voi nguoi dung va co kha nang mo rong cao.*
