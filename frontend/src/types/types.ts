// Frontend Types - Generated from Backend Schemas
// This file contains TypeScript interfaces based on the backend MongoDB schemas

// ===== ENUMS =====

export enum SubscriptionType {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
  LIFETIME = 'lifetime',
}

export enum PaymentStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELED = 'canceled',
}

export enum PaymentMethod {
  VNPAY = 'vnpay',
  PAYPAL = 'paypal',
}

export enum QuestionType {
  MCQ = 'mcq',
  TRUE_FALSE = 'true_false',
}

export enum TestAttemptStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned',
  LATE = 'late',
}

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum NotificationType {
  SYSTEM_UPDATE = 'system_update',
  PAYMENT_SUCCESS = 'payment_success', 
  PAYMENT_FAILED = 'payment_failed',
  QUIZ_COMPLETED = 'quiz_completed',
  QUIZ_REMINDER = 'quiz_reminder',
  SYSTEM = 'system',
  PAYMENT = 'payment',
  QUIZ = 'quiz',
  TEST_REMINDER = 'test_reminder',
}

// ===== BASE INTERFACES =====

export interface BaseDocument {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

// ===== USER INTERFACES =====

export interface User extends BaseDocument {
  name: string;
  username: string;
  email: string;
  password_hash: string;
  role: string;
  package_id: string | Package | 'guest';
  status: string;
  avatar?: string;
  subscriptionType?: SubscriptionType;
  subscriptionStartDate?: Date;
  subscriptionEndDate?: Date;
}

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  avatar?: string;
}

export interface UpdateUserDto {
  name?: string;
  username?: string;
  email?: string;
  avatar?: string;
  status?: string;
}

export interface ChangePasswordDto {
  oldPassword: string;
  newPassword: string;
}

// ===== PACKAGE INTERFACES =====

export interface Package extends BaseDocument {
  name: string;
  price: number;
  Duration: number;
  Benefit: string;
}

// ===== QUIZ INTERFACES =====

export interface Quiz extends BaseDocument {
  title: string;
  description: string;
  image?: string;
  time_limit?: number; // in minutes or seconds
  user_id: string; // reference to User
  is_premium: boolean;
}

export interface CreateQuizDto {
  title: string;
  description?: string;
  image?: string;
  time_limit?: number;
  is_premium?: boolean;
}

export interface UpdateQuizDto {
  title?: string;
  description?: string;
  image?: string;
  time_limit?: number;
  is_Premium?: boolean;
}

// ===== QUESTION INTERFACES =====

export interface Question extends BaseDocument {
  quiz_id: string; // reference to Quiz
  content: string;
  type: QuestionType;
  explanation?: string;
  question_number?: number;
}

export interface CreateQuestionDto {
  quiz_id: string;
  content: string;
  type: QuestionType;
  explanation?: string;
  question_number?: number;
}

// ===== ANSWER INTERFACES =====

export interface Answer extends BaseDocument {
  question_id: string; // reference to Question
  content: string;
  is_correct: boolean;
}

export interface CreateAnswerDto {
  question_id: string;
  content: string;
  is_correct: boolean;
}

// ===== TEST ATTEMPT INTERFACES =====

export interface TestAttemptAnswer {
  question_id: string;
  selected_answer_id: string;
  is_correct: boolean;
}

export interface TestAttempt extends BaseDocument {
  quiz_id: string | Pick<Quiz, '_id' | 'title' | 'description' | 'time_limit'>; // Can be populated or just ID
  user_id: string; // reference to User
  score?: number;
  total_questions: number;
  correct_answers?: number;
  incorrect_answers?: number;
  completion_time?: number;
  started_at: string | Date; // Backend returns as ISO string
  completed_at?: string | Date; // Backend returns as ISO string
  answers: TestAttemptAnswer[];
  status: TestAttemptStatus;
}

export interface CreateTestAttemptDto {
  quiz_id: string;
  total_questions: number;
}

export interface SubmitTestAttemptDto {
  answers: TestAttemptAnswer[];
}

// ===== PAYMENT INTERFACES =====

export interface Payment extends BaseDocument {
  user_id: string | User;
  package_id: string | Package;
  amount: number;
  date: Date;
  status: PaymentStatus;
  payment_code: string;
  payment_method: PaymentMethod;
  vnp_transaction_no?: string;
  vnp_response_code?: string;
  paypal_order_id?: string;
  paypal_payment_id?: string;
}

export interface CreatePaymentDto {
  package_id: string;
  payment_method: PaymentMethod;
}

// ===== LEADERBOARD INTERFACES =====

export interface Leaderboard extends BaseDocument {
  quizId: string; // reference to Quiz
  userId: string; // reference to User
  attemptId: string; // reference to TestAttempt
  score: number;
  timeSpent?: number;
  rank?: number;
}

export interface LeaderboardEntry {
  user: Pick<User, '_id' | 'name' | 'username' | 'avatar'>;
  score: number;
  timeSpent?: number;
  rank: number;
  completedAt: Date;
}

// ===== NOTIFICATION INTERFACES =====

export interface Notification extends BaseDocument {
  userId: string; // reference to User
  title: string;
  content: string;
  isRead: boolean;
  type: NotificationType;
  data?: any; // Dynamic data based on notification type
}

export interface CreateNotificationDto {
  userId: string;
  title: string;
  content: string;
  type: NotificationType;
  data?: any;
}

export interface MarkNotificationReadDto {
  notificationIds: string[];
}

// ===== API RESPONSE INTERFACES =====

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ===== AUTH INTERFACES =====

export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: Omit<User, 'password_hash'>;
}

export interface RegisterDto {
  name: string;
  username: string;
  email: string;
  password: string;
  avatar?: string;
}

// ===== QUIZ IMPORT INTERFACES =====

export interface ImportQuizResponse {
  message: string;
  totalQuestions: number;
  quiz?: Quiz;
}

// ===== STATISTICS INTERFACES =====

export interface UserStats {
  totalQuizzes: number;
  totalAttempts: number;
  averageScore: number;
  bestScore: number;
  totalTimeSpent: number;
}

export interface QuizStats {
  totalAttempts: number;
  averageScore: number;
  completionRate: number;
  averageTimeSpent: number;
}

// ===== SEARCH AND FILTER INTERFACES =====

export interface QuizFilters {
  search?: string;
  userId?: string;
  isPremium?: boolean;
  hasTimeLimit?: boolean;
  sortBy?: 'createdAt' | 'title' | 'totalAttempts';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface UserFilters {
  search?: string;
  role?: string;
  status?: string;
  hasSubscription?: boolean;
  sortBy?: 'createdAt' | 'name' | 'email';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// ===== SUBSCRIPTION INTERFACES =====

export interface SubscriptionInfo {
  isActive: boolean;
  type?: SubscriptionType;
  startDate?: Date;
  endDate?: Date;
  daysRemaining?: number;
  package?: Package;
}

// ===== QUIZ WITH POPULATED FIELDS =====

export interface QuizWithDetails extends Omit<Quiz, 'user_id'> {
  user_id: Pick<User, '_id' | 'name' | 'username' | 'email'>;
  questions?: Question[];
  totalQuestions?: number;
  totalAttempts?: number;
  averageScore?: number;
}

export interface QuestionWithAnswers extends Question {
  answers: Answer[];
}

export interface TestAttemptWithDetails extends Omit<TestAttempt, 'quiz_id' | 'user_id'> {
  quiz_id: Pick<Quiz, '_id' | 'title' | 'description' | 'time_limit'>;
  user_id: Pick<User, '_id' | 'name' | 'username' | 'email'>;
}

// ===== VALIDATION INTERFACES =====

export interface FieldError {
  field: string;
  message: string;
}

export interface ValidationError {
  message: string;
  errors: FieldError[];
}