import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '../firebase/firebase.config';
import {
  LoginDto,
  LoginResponse,
  RegisterDto,
  User,
  Quiz,
  QuizWithDetails,
  Question,
  QuestionWithAnswers,
  Answer,
  TestAttempt,
  CreateTestAttemptDto,
  SubmitTestAttemptDto,
  AutosaveDto,
  CreateQuizDto,
  UpdateQuizDto,
  CreateQuestionDto,
  CreateAnswerDto,
  Package,
  Notification,
  LeaderboardEntry,
  UserStats,
  SubmitTestResponse,
} from '../types/types';

// API Configuration
const API_BASE_URL = 'http://localhost:3000';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token and logging
api.interceptors.request.use(
  (config) => {
    console.log('[API] Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      data: config.data,
      params: config.params,
      timestamp: new Date().toISOString()
    });

    // Add auth token if exists
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[API] Added auth token to request:', token.substring(0, 50) + '...');

      // Check if token is expired
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) {
          console.warn('[API] Token appears to be expired:', {
            exp: payload.exp,
            now: now,
            expired: payload.exp < now
          });
        } else {
          console.log('[API] Token is valid, expires at:', new Date(payload.exp * 1000));
        }
      } catch (e) {
        console.warn('[API] Could not parse token for expiration check');
      }
    } else {
      console.warn('[API] No auth token found in localStorage');
    }

    return config;
  },
  (error) => {
    console.error('[API] Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for logging and error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('[API] Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data,
      timestamp: new Date().toISOString()
    });
    return response;
  },
  (error: AxiosError) => {
    console.error('[API] Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
      data: error.response?.data,
      timestamp: new Date().toISOString()
    });

    // Handle auth errors
    if (error.response?.status === 401) {
      console.log('[API] Unauthorized error on:', error.config?.url);
      console.log('[API] Error response data:', error.response?.data);

      // Only clear tokens for token validation failures
      const responseData = error.response?.data as { message?: string } | undefined;
      const isTokenInvalid = responseData?.message?.includes('Invalid Firebase token') ||
        responseData?.message?.includes('token') ||
        responseData?.message?.includes('Unauthorized');

      if (isTokenInvalid) {
        console.log('[API] Token appears invalid - clearing stored tokens');
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        console.log('[API] Tokens cleared, component should handle redirect');
      } else {
        console.log('[API] 401 error but token might still be valid - not clearing tokens');
      }
    }

    return Promise.reject(error);
  }
);

// ==== AUTHENTICATION API ====

export const authAPI = {
  async login(data: LoginDto): Promise<LoginResponse> {
    console.log('[AUTH] Attempting login for:', data.email);
    const response = await api.post('/auth/login', data);

    console.log('[AUTH] Login response structure:', response.data);

    if (response.data && response.data.user && response.data.firebaseToken) {
      // Backend returns custom token, we need to exchange it for ID token
      console.log('[AUTH] Exchanging custom token for ID token...');

      try {
        // Sign in with custom token to get ID token
        const userCredential = await signInWithCustomToken(auth, response.data.firebaseToken);
        const idToken = await userCredential.user.getIdToken();

        console.log('[AUTH] ID token obtained successfully');
        console.log('[AUTH] ID token preview:', idToken.substring(0, 50) + '...');

        // Store ID token (not custom token)
        localStorage.setItem('authToken', idToken);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        console.log('[AUTH] Login successful, ID token stored');

        return {
          access_token: idToken,
          user: response.data.user
        };
      } catch (error) {
        console.error('[AUTH] Failed to exchange custom token for ID token:', error);
        throw new Error('Failed to complete authentication. Please try again.');
      }
    }

    throw new Error('Invalid login response format');
  },

  async register(data: RegisterDto): Promise<User> {
    console.log('[AUTH] Attempting registration for:', data.email);
    const response = await api.post('/auth/register', data);

    console.log('[AUTH] Registration response structure:', response.data);

    if (response.data && response.data.user && response.data.firebaseToken) {
      // Backend returns custom token, exchange it for ID token
      console.log('[AUTH] Exchanging custom token for ID token after registration...');

      try {
        // Sign in with custom token to get ID token
        const userCredential = await signInWithCustomToken(auth, response.data.firebaseToken);
        const idToken = await userCredential.user.getIdToken();

        console.log('[AUTH] ID token obtained successfully after registration');

        // Store ID token and user info
        localStorage.setItem('authToken', idToken);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        console.log('[AUTH] Registration successful, ID token stored');

        return response.data.user;
      } catch (error) {
        console.error('[AUTH] Failed to exchange custom token for ID token:', error);
        throw new Error('Registration successful but authentication failed. Please login.');
      }
    }

    throw new Error('Invalid registration response format');
  },

  async logout(): Promise<void> {
    console.log('[AUTH] Logging out user');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    console.log('[AUTH] Logout complete - tokens removed');
  },

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('[AUTH] Error parsing stored user:', error);
        localStorage.removeItem('user');
      }
    }
    return null;
  },

  getToken(): string | null {
    return localStorage.getItem('authToken');
  },

  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getCurrentUser();

    if (!token || !user) {
      return false;
    }

    // Check if token is expired
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        console.log('[AUTH] Token expired, clearing stored data');
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        return false;
      }
      return true;
    } catch (error) {
      console.warn('[AUTH] Could not parse token, treating as invalid');
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      return false;
    }
  }
};

// ==== QUIZ API ====

export const quizAPI = {
  async getAllQuizzes(): Promise<QuizWithDetails[]> {
    console.log('[QUIZ] Fetching all quizzes');
    const response = await api.get<QuizWithDetails[]>('/quizzes');
    // Backend returns array directly, not wrapped in ApiResponse
    return response.data;
  },

  async getQuizById(id: string): Promise<QuizWithDetails> {
    console.log('[QUIZ] Fetching quiz by ID:', id);
    const response = await api.get<QuizWithDetails>(`/quizzes/${id}`);
    // Backend returns quiz object directly
    return response.data;
  },

  async createQuiz(data: CreateQuizDto): Promise<Quiz> {
    console.log('[QUIZ] Creating new quiz:', data.title);
    const response = await api.post<Quiz>('/quizzes', data);
    console.log('[QUIZ] Quiz created successfully');
    return response.data;
  },

  async updateQuiz(id: string, data: UpdateQuizDto): Promise<Quiz> {
    console.log('[QUIZ] Updating quiz:', id);
    const response = await api.patch<Quiz>(`/quizzes/${id}`, data);
    console.log('[QUIZ] Quiz updated successfully');
    return response.data;
  },

  async deleteQuiz(id: string): Promise<void> {
    console.log('[QUIZ] Deleting quiz:', id);
    await api.delete(`/quizzes/${id}`);
    console.log('[QUIZ] Quiz deleted successfully');
  },

  async getMyQuizzes(): Promise<QuizWithDetails[]> {
    console.log('[QUIZ] Fetching my quizzes');
    const response = await api.get<QuizWithDetails[]>('/quizzes/my');
    // Backend returns array directly, not wrapped in ApiResponse
    return response.data;
  },

  async processDocxWithGemini(file: File, aiRequirements?: string): Promise<{
    questions: Array<{
      text: string;
      options: string[];
      correctAnswerIndex: number;
    }>;
  }> {
    console.log('[QUIZ] Processing .docx file with Gemini:', file.name);

    const formData = new FormData();
    formData.append('file', file);
    if (aiRequirements) {
      formData.append('aiRequirements', aiRequirements);
    }

    const response = await api.post<{
      questions: Array<{
        text: string;
        options: string[];
        correctAnswerIndex: number;
      }>;
    }>('/quizzes/process-docx', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // 60 seconds for Gemini processing
    });

    console.log('[QUIZ] Gemini processing completed, found', response.data.questions.length, 'questions');
    return response.data;
  },

  async importQuizFromFile(file: File, desiredQuestionCount?: number): Promise<Quiz> {
    console.log('[QUIZ] Importing quiz from file:', file.name);
    const formData = new FormData();
    formData.append('file', file);
    if (desiredQuestionCount) {
      formData.append('desiredQuestionCount', desiredQuestionCount.toString());
    }

    const response = await api.post<Quiz>('/quizzes/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // 60 seconds for AI processing
    });

    console.log('[QUIZ] Import successful:', response.data);
    return response.data;
  }
};

// ==== QUESTION API ====

export const questionAPI = {
  async getQuizQuestions(quizId: string): Promise<QuestionWithAnswers[]> {
    console.log('[QUESTION] Fetching questions for quiz:', quizId);
    const response = await api.get<QuestionWithAnswers[]>(`/questions/quiz/${quizId}`);
    // Backend returns array directly
    return response.data;
  },

  async createQuestion(data: CreateQuestionDto): Promise<Question> {
    console.log('[QUESTION] Creating new question for quiz:', data.quiz_id);
    const response = await api.post<Question>('/questions', data);
    console.log('[QUESTION] Question created successfully');
    return response.data;
  },

  async updateQuestion(id: string, data: Partial<CreateQuestionDto>): Promise<Question> {
    console.log('[QUESTION] Updating question:', id);
    const response = await api.patch<Question>(`/questions/${id}`, data);
    console.log('[QUESTION] Question updated successfully');
    return response.data;
  },

  async deleteQuestion(id: string): Promise<void> {
    console.log('[QUESTION] Deleting question:', id);
    await api.delete(`/questions/${id}`);
    console.log('[QUESTION] Question deleted successfully');
  }
};

// ==== ANSWER API ====

export const answerAPI = {
  async createAnswer(data: CreateAnswerDto): Promise<Answer> {
    console.log('[ANSWER] Creating new answer for question:', data.question_id);
    const response = await api.post<Answer>('/answers', data);
    console.log('[ANSWER] Answer created successfully');
    return response.data;
  },

  async updateAnswer(id: string, data: Partial<CreateAnswerDto>): Promise<Answer> {
    console.log('[ANSWER] Updating answer:', id);
    const response = await api.patch<Answer>(`/answers/${id}`, data);
    console.log('[ANSWER] Answer updated successfully');
    return response.data;
  },

  async deleteAnswer(id: string): Promise<void> {
    console.log('[ANSWER] Deleting answer:', id);
    await api.delete(`/answers/${id}`);
    console.log('[ANSWER] Answer deleted successfully');
  }
};

// ==== TEST ATTEMPT API ====

export const testAttemptAPI = {
  async startTestAttempt(data: CreateTestAttemptDto): Promise<TestAttempt> {
    console.log('[TEST] Starting test attempt for quiz:', data.quiz_id);
    const response = await api.post<TestAttempt>(`/test-attempts/start/${data.quiz_id}`);
    console.log('[TEST] Test attempt started');
    return response.data;
  },

  async submitTestAttempt(id: string, data: SubmitTestAttemptDto): Promise<SubmitTestResponse> {
    console.log('[TEST] Submitting test attempt:', id);
    // Transform frontend data to match backend SubmitTestDto format
    const submitData = {
      attempt_id: id,
      answers: data.answers.map(answer => ({
        question_id: answer.question_id,
        selected_answer_id: answer.selected_answer_id
      }))
    };
    const response = await api.post<SubmitTestResponse>('/test-attempts/submit', submitData);
    console.log('[TEST] Test attempt submitted');
    return response.data;
  },

  async getMyAttempts(): Promise<TestAttempt[]> {
    console.log('[TEST] Fetching my test attempts');
    const response = await api.get<TestAttempt[]>('/test-attempts/history');
    return response.data;
  },

  async getAttemptById(id: string): Promise<TestAttempt> {
    console.log('[TEST] Fetching test attempt:', id);
    const response = await api.get<TestAttempt>(`/test-attempts/${id}`);
    return response.data;
  },

  async abandonAttempt(id: string): Promise<{ success: boolean; message: string }> {
    console.log('[TEST] Abandoning test attempt:', id);
    const response = await api.post<{ success: boolean; message: string }>(`/test-attempts/abandon/${id}`);
    return response.data;
  },

  async resumeAttempt(resume_token: string): Promise<TestAttempt> {
    console.log('[TEST] Resuming test attempt with token:', resume_token.substring(0, 10) + '...');
    const response = await api.post<TestAttempt>('/test-attempts/resume', { resume_token });
    console.log('[TEST] Test attempt resumed successfully');
    return response.data;
  },

  async autosaveAnswers(data: AutosaveDto): Promise<{ success: boolean; message: string; server_seq: number }> {
    console.log('[TEST] Autosaving answers for attempt:', data.attempt_id);
    const response = await api.post<{ success: boolean; message: string; server_seq: number }>('/test-attempts/autosave', data);
    return response.data;
  },

  async getInProgressAttempts(): Promise<TestAttempt[]> {
    console.log('[TEST] Fetching in-progress test attempts');
    const response = await api.get<TestAttempt[]>('/test-attempts/history');
    // Filter to only in-progress attempts
    return response.data.filter((attempt: TestAttempt) => attempt.status === 'in_progress');
  }
};

// ==== USER API ====

export const userAPI = {
  async getProfile(): Promise<User> {
    console.log('[USER] Fetching user profile');
    const response = await api.get<User>('/users/profile');
    return response.data;
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    console.log('[USER] Updating user profile');
    const response = await api.patch<User>('/users/profile', data);
    console.log('[USER] Profile updated successfully');
    return response.data;
  },

  async getUserStats(): Promise<UserStats> {
    console.log('[USER] Fetching user stats');
    const response = await api.get<UserStats>('/users/stats');
    return response.data;
  },

  async cancelSubscription(): Promise<{ success: boolean; message: string }> {
    console.log('[USER] Canceling subscription');
    const response = await api.delete('/users/cancel-subscription');
    return response.data;
  }
};

// ==== ADMIN API ====

export const adminAPI = {
  async getAdminStats(): Promise<{
    totalUsers: number;
    totalTeachers: number;
    activeUsers: number;
    premiumUsers: number;
    totalQuizzes: number;
    totalAttempts: number;
  }> {
    console.log('[ADMIN] Fetching admin stats');
    const response = await api.get('/users/admin/stats');
    return response.data;
  },

  async getAllUsers(filters?: {
    search?: string;
    role?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    users: User[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    console.log('[ADMIN] Fetching all users with filters:', filters);
    const params = new URLSearchParams();

    if (filters?.search) params.append('search', filters.search);
    if (filters?.role) params.append('role', filters.role);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await api.get(`/users/admin/users?${params.toString()}`);
    return response.data;
  },

  async updateUser(userId: string, updateData: { role?: string; status?: string }): Promise<User> {
    console.log('[ADMIN] Updating user:', userId, updateData);
    const response = await api.patch(`/users/admin/${userId}`, updateData);
    return response.data;
  },

  async deleteUser(userId: string): Promise<{ message: string }> {
    console.log('[ADMIN] Deleting user:', userId);
    const response = await api.delete(`/users/admin/${userId}`);
    return response.data;
  },

  // Quiz Management
  async getQuizStats(): Promise<{
    total: number;
    hidden: number;
    premium: number;
    free: number;
    totalQuestions: number;
  }> {
    console.log('[ADMIN] Fetching quiz stats');
    const response = await api.get('/quizzes/admin/stats');
    return response.data;
  },

  async getAllQuizzes(filters?: {
    search?: string;
    creator?: string;
    premium?: string;
    hidden?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    quizzes: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    console.log('[ADMIN] Fetching all quizzes with filters:', filters);
    const params = new URLSearchParams();

    if (filters?.search) params.append('search', filters.search);
    if (filters?.creator) params.append('creator', filters.creator);
    if (filters?.premium) params.append('premium', filters.premium);
    if (filters?.hidden) params.append('hidden', filters.hidden);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await api.get(`/quizzes/admin/all?${params.toString()}`);
    return response.data;
  },

  async toggleQuizHidden(quizId: string): Promise<{ message: string; is_hidden: boolean }> {
    console.log('[ADMIN] Toggling quiz hidden status:', quizId);
    const response = await api.patch(`/quizzes/admin/${quizId}/toggle-hidden`);
    return response.data;
  },

  async deleteQuiz(quizId: string): Promise<{ message: string }> {
    console.log('[ADMIN] Deleting quiz:', quizId);
    const response = await api.delete(`/quizzes/admin/${quizId}`);
    return response.data;
  }
};

// ==== PACKAGE API ====

export const packageAPI = {
  async getAllPackages(): Promise<Package[]> {
    console.log('[PACKAGE] Fetching all packages');
    const response = await api.get<Package[]>('/packages');
    return response.data;
  },

  async getPremiumPackages(): Promise<Package[]> {
    console.log('[PACKAGE] Fetching premium packages only');
    const response = await api.get<Package[]>('/packages');
    // Filter out free packages (price <= 0) - only show premium packages for purchase
    const premiumPackages = response.data.filter(pkg => pkg.price > 0);
    console.log(`[PACKAGE] Found ${premiumPackages.length} premium packages`);
    return premiumPackages;
  }
};

// ==== PAYMENT API ====

export const paymentAPI = {
  async createVNPayPayment(packageId: string): Promise<{ paymentUrl: string; paymentCode: string }> {
    console.log('[PAYMENT] Creating VNPay payment for package:', packageId);
    const response = await api.post('/api/v1/payments/vnpay/create-url', { packageId });
    console.log('[PAYMENT] VNPay payment URL created');
    return response.data;
  },

  async createPayPalPayment(packageId: string): Promise<{ orderId: string; approvalUrl: string; paymentCode: string }> {
    console.log('[PAYMENT] Creating PayPal payment for package:', packageId);
    const response = await api.post('/api/v1/payments/paypal/create-payment', { packageId });
    console.log('[PAYMENT] PayPal payment created');
    return response.data;
  },

  async capturePayPalPayment(orderId: string): Promise<{ success: boolean; message: string; paymentCode?: string; captureId?: string }> {
    console.log('[PAYMENT] Capturing PayPal payment:', orderId);
    const response = await api.post('/api/v1/payments/paypal/capture-payment', { orderId });
    console.log('[PAYMENT] PayPal payment captured');
    return response.data;
  },

  async getPaymentStatus(paymentCode: string): Promise<{ paymentCode: string; status: string; amount: number; createdAt: Date; vnpTransactionNo?: string }> {
    console.log('[PAYMENT] Getting payment status:', paymentCode);
    const response = await api.get(`/api/v1/payments/status/${paymentCode}`);
    return response.data;
  }
};

// ==== NOTIFICATION API ====

export const notificationAPI = {
  async getMyNotifications(): Promise<Notification[]> {
    console.log('[NOTIFICATION] Fetching notifications');
    const response = await api.get<{ notifications: Notification[]; total: number; totalPages: number }>('/notifications/my-notifications');
    console.log('[NOTIFICATION] Response data:', response.data);
    return response.data.notifications;
  },

  async markAsRead(notificationIds: string[]): Promise<void> {
    console.log('[NOTIFICATION] Marking notifications as read:', notificationIds);
    if (notificationIds.length === 1) {
      // Mark single notification as read
      await api.patch(`/notifications/${notificationIds[0]}/mark-read`);
    } else {
      // Mark all notifications as read
      await api.patch('/notifications/mark-all-read');
    }
    console.log('[NOTIFICATION] Notifications marked as read');
  }
};

// ==== LEADERBOARD API ====

export interface QuizLeaderboardResponse {
  quizId: string;
  quizTitle: string;
  entries: LeaderboardEntry[];
  totalParticipants: number;
}

export interface UserRankResponse {
  rank: number;
  totalParticipants: number;
  score: number;
}

export const leaderboardAPI = {
  async getQuizLeaderboard(quizId: string, limit?: number): Promise<QuizLeaderboardResponse> {
    console.log('[LEADERBOARD] Fetching leaderboard for quiz:', quizId);
    const params = limit ? `?limit=${limit}` : '';
    const response = await api.get<QuizLeaderboardResponse>(`/leaderboards/quiz/${quizId}${params}`);
    return response.data;
  },

  async getMyRankInQuiz(quizId: string): Promise<UserRankResponse | null> {
    console.log('[LEADERBOARD] Fetching my rank for quiz:', quizId);
    try {
      const response = await api.get<UserRankResponse>(`/leaderboards/quiz/${quizId}/my-rank`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }
};

// ==== UTILITY FUNCTIONS ====

export const userUtils = {
  /**
   * Check if a user has premium access
   * @param user - User object
   * @returns boolean - true if user has premium package
   */
  hasPremiumAccess(user: User | null): boolean {
    if (!user || !user.package_id) return false;

    // If package_id is 'guest', user doesn't have premium
    if (user.package_id === 'guest') return false;

    // If package_id is a string (not 'guest'), we need to check the package details
    // For now, we'll assume non-guest packages are premium
    if (typeof user.package_id === 'string') return true;

    // If package_id is a Package object, check if price > 0
    if (typeof user.package_id === 'object' && user.package_id.price) {
      return user.package_id.price > 0;
    }

    return false;
  },

  /**
   * Get user's package name for display
   * @param user - User object
   * @returns string - package name
   */
  getPackageName(user: User | null): string {
    if (!user || !user.package_id) return 'Guest';

    if (user.package_id === 'guest') return 'Guest';

    if (typeof user.package_id === 'string') return 'Premium';

    if (typeof user.package_id === 'object' && user.package_id.name) {
      return user.package_id.name;
    }

    return 'Unknown';
  },

  /**
   * Check if user has admin role
   * @param user - User object
   * @returns boolean - true if user is admin
   */
  isAdmin(user: User | null): boolean {
    return !!(user && user.role === 'admin');
  },

  /**
   * Check if user has teacher role or higher
   * @param user - User object
   * @returns boolean - true if user is teacher or admin
   */
  isTeacherOrAdmin(user: User | null): boolean {
    return !!(user && (user.role === 'teacher' || user.role === 'admin'));
  }
};

// Export the axios instance for custom calls if needed
export default api;