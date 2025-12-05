# Business Flows

## Authentication Flow

The system supports two types of authentication:
1.  **Traditional Email/Password**: Handled locally with bcrypt hashing.
2.  **Firebase Authentication**: Delegated to Firebase (Google, Facebook, etc.), with a local user record synced via `firebaseUid`.

### Login Process
1.  **Client** sends credentials (email/password) or Firebase Token.
2.  **Server** validates credentials.
    *   If Email/Password: Checks hash in DB.
    *   If Firebase: Verifies token with Firebase Admin SDK.
3.  **Server** issues a JWT (or Custom Firebase Token) for session management.
4.  **Client** includes this token in the `Authorization` header (`Bearer <token>`) for subsequent requests.

## Quiz Taking Flow

1.  **Browse**: User fetches list of available quizzes (`GET /quizzes`).
2.  **Start**: User selects a quiz.
    *   Check `is_premium`. If true, verify user subscription.
3.  **Fetch Questions**: Client fetches questions for the quiz (`GET /questions?quiz_id=...`).
4.  **Submit**: User submits answers.
    *   Answers are validated against the `Answer` model (not detailed here but exists).

## Subscription & Upgrade Flow

The system supports Freemium and Premium models. Users can upgrade their account by purchasing packages.

### Package Types
Packages are defined in the `Package` model with a `duration` field:
*   **Monthly**: Duration = 30 days.

### Upgrade Process
1.  **Select Package**: User chooses a package to purchase.
2.  **Initiate Payment**: Client calls `POST /payments` with `packageId` and `paymentMethod` (VNPAY, ZaloPay, Google Pay).
3.  **Process Payment**:
    *   **VNPAY/ZaloPay**: Server generates a payment URL. User completes payment on the gateway. Gateway calls back to Server (Webhook/IPN).
    *   **Google Pay**: Client handles payment with Google. Client sends `purchaseToken` to Server for verification.
4.  **Activate Subscription**:
    *   Upon successful payment (or verification), the server calls `updateUserPackageAfterPayment`.
    *   **Logic**:
        *   Updates `user.package_id`.
        *   Sets `user.subscriptionType` (monthly).
        *   Calculates `subscriptionEndDate` based on package duration.
    *   **Status**: User status is updated to reflect the new subscription.

### Freemium vs Premium
*   **Freemium**: Default state. Access to free quizzes only.

## AI Quiz Generation Flow

The system allows users to generate quizzes automatically from uploaded documents (`.docx`, `.pdf`) using Google Gemini AI.

### Process Overview
1.  **Upload**: User uploads a file via `POST /quizzes/import`.
    *   Supported formats: PDF, DOCX.
    *   Max size: 5MB.
2.  **Text Extraction**:
    *   **PDF**: Uses `pdf-parse` to extract raw text.
    *   **DOCX**: Uses `mammoth` to extract raw text.
3.  **AI Processing**:
    *   Extracted text is sent to **Google Gemini AI** (`gemini-2.5-flash`).
    *   Prompt instructs AI to generate MCQs (Multiple Choice Questions) in JSON format.
    *   AI extracts/generates: Title, Description, Time Limit, Questions, Options, Correct Answer, Explanation.
4.  **Validation & Parsing**:
    *   Server parses the JSON response.
    *   Validates structure (minimum 2 options, valid types).
    *   Auto-fixes common issues (missing explanations, fuzzy matching correct answers).
5.  **Creation**:
    *   `Quiz` is created with `is_premium: false` (default).
    *   `Question` and `Answer` records are created in the database.

## Real-time Notifications Flow

The system uses **Socket.IO** to deliver real-time notifications to connected users.

### Connection & Authentication
1.  **Connect**: Client connects to `/notifications` namespace.
2.  **Auth**: Client provides a token (Firebase ID Token or Custom Token) in `auth.token` or query param.
3.  **Validation**: Server verifies the token and identifies the user.
4.  **Room Joining**:
    *   User joins their personal room: `user_{userId}`.
    *   Admins join: `admin_room`.

### Notification Events
*   **Server -> Client**:
    *   `new_notification`: Sent when a new notification is created.
    *   `unread_count`: Sent when the number of unread notifications changes.
    *   `admin_notification`: Broadcast to all admins.
*   **Client -> Server**:
    *   `mark_as_read`: Mark a specific notification as read.
    *   `mark_all_as_read`: Mark all notifications as read.
    *   `get_my_notifications`: Fetch paginated notifications.

### Typical Flow
1.  **Trigger**: System event occurs (e.g., subscription success, quiz graded).
2.  **Create**: `NotificationService` creates a record in DB.
3.  **Emit**: `NotificationGateway` emits `new_notification` to the specific user's room.
4.  **Receive**: Client receives event and displays toast/badge.

## Test Attempt Flow

The system manages the entire lifecycle of a user taking a quiz, including starting, saving progress, submitting, and grading.

### Key Concepts
*   **TestAttempt**: A record representing a user's session for a specific quiz.
*   **Status**: `in_progress`, `submitting`, `completed`, `late`, `abandoned`.
*   **Resume Token**: A secure token used to resume interrupted sessions.

### Detailed Process

#### 1. Start Test
*   **Endpoint**: `POST /test-attempts/start`
*   **Logic**:
    *   Checks if Quiz exists.
    *   **Premium Check**: If `quiz.is_premium`, verifies user has an active subscription (or is Admin).
    *   Creates a `TestAttempt` with status `in_progress`.
    *   Generates a `resume_token`.
    *   Returns questions (without correct answers) and the token.

#### 2. Taking the Test (Progress Saving)
*   **Endpoint**: `POST /test-attempts/save-answers`
*   **Logic**:
    *   Client periodically sends draft answers.
    *   Server updates `draft_answers` in the `TestAttempt`.
    *   Updates `last_seen_at` for timeout tracking.
    *   **Heartbeat**: Client sends heartbeats to keep the session alive and sync remaining time.

#### 3. Submit Test
*   **Endpoint**: `POST /test-attempts/submit`
*   **Logic**:
    *   Locks the attempt (status: `submitting`) to prevent race conditions.
    *   **Time Check**: Verifies if submission is within `time_limit` (+ grace period). Marks as `late` or `abandoned` if overdue.
    *   **Grading**:
        *   Compares submitted answers with correct answers in DB.
        *   Calculates score (percentage).
    *   **Finalization**:
        *   Updates attempt status to `completed` (or `late`).
        *   Saves final score and completion time.
    *   **Post-Processing**:
        *   Updates **Leaderboard** (if score is best).
        *   Sends **Notification** (Quiz Completed).

#### 4. Resume Test
*   **Endpoint**: `POST /test-attempts/resume`
*   **Logic**:
    *   Uses `resume_token` to find the active `in_progress` attempt.

## Payment Flow

The system integrates with **VNPAY** and **PayPal** (and potentially Google Pay for mobile) to handle payments.

### 1. VNPAY Integration
*   **Initiation**:
    *   Client calls `POST /payments` with `paymentMethod: 'VNPAY'`.
    *   Server creates a `Payment` record (status: `PENDING`).
    *   Server generates a secure VNPAY URL with:
        *   `vnp_TmnCode`: Merchant code.
        *   `vnp_Amount`: Amount in VND (x100).
        *   `vnp_ReturnUrl`: URL to redirect after payment.
        *   `vnp_SecureHash`: HMAC-SHA512 signature of all parameters.
    *   Client redirects user to this URL.
*   **Processing**: User enters card details on VNPAY gateway.
*   **Return/IPN**:
    *   VNPAY redirects user back to `vnp_ReturnUrl` (Frontend).
    *   **Verification**: Server verifies `vnp_SecureHash` to ensure data integrity.
    *   **Update**: Server updates `Payment` status to `SUCCESS` or `FAILED`.
    *   **Activation**: If success, triggers `updateUserPackageAfterPayment`.

### 2. PayPal Integration
*   **Initiation**:
    *   Client calls `POST /payments` with `paymentMethod: 'PAYPAL'`.
    *   Server interacts with PayPal API to create an Order (`v2/checkout/orders`).
    *   Returns `orderId` and approval link.
*   **Approval**: User approves payment on PayPal.
*   **Capture**:
    *   Client calls `POST /payments/paypal/capture` with `orderId`.
    *   Server calls PayPal API to capture funds.
    *   **Update**: Server updates `Payment` status to `SUCCESS`.
    *   **Activation**: Triggers `updateUserPackageAfterPayment`.

### 3. Google In-App Purchase (Mobile)
*   **Flow**:
    *   Mobile App handles purchase via Google Play Billing Library.
    *   Mobile App sends `purchaseToken` and `productId` to Backend.
    *   Backend verifies token with Google Play Developer API.
    *   If valid, Backend creates/updates `Payment` record and activates subscription.
