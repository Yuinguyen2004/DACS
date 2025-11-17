import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { 
  ApiResponse, 
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
  CreateQuizDto,
  UpdateQuizDto,
  CreateQuestionDto,
  CreateAnswerDto,
  Package,
  Payment,
  CreatePaymentDto,
  Notification,
  LeaderboardEntry,
  UserStats,
  QuizStats,
  ChangePasswordDto
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
      
      // Only clear tokens for authentication endpoints or token validation failures
      const isAuthEndpoint = error.config?.url?.includes('/auth/');
      const isTokenInvalid = error.response?.data?.message?.includes('Invalid Firebase token') || 
                            error.response?.data?.message?.includes('token') ||
                            error.response?.data?.message?.includes('Unauthorized');
      
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
      // Store Firebase token as auth token
      localStorage.setItem('authToken', response.data.firebaseToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      console.log('[AUTH] Login successful, token stored');
      
      return {
        access_token: response.data.firebaseToken,
        user: response.data.user
      };
    }
    
    throw new Error('Invalid login response format');
  },

  async register(data: RegisterDto): Promise<User> {
    console.log('[AUTH] Attempting registration for:', data.email);
    const response = await api.post('/auth/register', data);
    
    console.log('[AUTH] Registration response structure:', response.data);
    
    if (response.data && response.data.user) {
      console.log('[AUTH] Registration successful for user:', response.data.user.name || response.data.user.email);
      return response.data.user;
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

  async processFileWithGemini(file: File, desiredQuestionCount?: number): Promise<{
    questions: Array<{
      text: string;
      options: string[];
      correctAnswerIndex: number;
    }>;
    title?: string;
    description?: string;
    totalQuestions?: number;
    requestedCount?: number;
    actualCount?: number;
  }> {
    console.log('[QUIZ] Processing file with Gemini:', {
      name: file.name,
      type: file.type,
      size: file.size,
      desiredQuestionCount,
    });

    // Validate file type on frontend
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/pdf',
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Chỉ hỗ trợ file .docx hoặc .pdf');
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File quá lớn. Kích thước tối đa là 5MB.');
    }

    // Validate desired question count
    if (desiredQuestionCount !== undefined && desiredQuestionCount !== null) {
      if (desiredQuestionCount < 5 || desiredQuestionCount > 100) {
        throw new Error('Số lượng câu hỏi phải nằm trong khoảng 5-100.');
      }
    }

    const formData = new FormData();
    formData.append('file', file);
    if (desiredQuestionCount) {
      formData.append('desiredQuestionCount', desiredQuestionCount.toString());
    }

    const response = await api.post<{
      questions: Array<{
        text: string;
        options: string[];
        correctAnswerIndex: number;
      }>;
      title?: string;
      description?: string;
      totalQuestions?: number;
      requestedCount?: number;
      actualCount?: number;
    }>('/quizzes/process-file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000, // 120 seconds for large PDF processing
    });

    console.log('[QUIZ] Gemini processing completed:', {
      questionCount: response.data.questions.length,
      requestedCount: response.data.requestedCount,
      actualCount: response.data.actualCount,
      title: response.data.title,
    });

    return response.data;
  },

  // Keep legacy method name for backward compatibility
  async processDocxWithGemini(file: File, desiredQuestionCount?: number): Promise<{
    questions: Array<{
      text: string;
      options: string[];
      correctAnswerIndex: number;
    }>;
    title?: string;
    description?: string;
    totalQuestions?: number;
    requestedCount?: number;
    actualCount?: number;
  }> {
    return this.processFileWithGemini(file, desiredQuestionCount);
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

  async submitTestAttempt(id: string, data: SubmitTestAttemptDto): Promise<TestAttempt> {
    console.log('[TEST] Submitting test attempt:', id);
    // Transform frontend data to match backend SubmitTestDto format
    const submitData = {
      attempt_id: id,
      answers: data.answers.map(answer => ({
        question_id: answer.question_id,
        selected_answer_id: answer.selected_answer_id
      }))
    };
    const response = await api.post<TestAttempt>('/test-attempts/submit', submitData);
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

  async abandonAttempt(id: string): Promise<{success: boolean; message: string}> {
    console.log('[TEST] Abandoning test attempt:', id);
    const response = await api.post<{success: boolean; message: string}>(`/test-attempts/abandon/${id}`);
    return response.data;
  },

  // New methods for resume quiz feature
  async getActiveAttempt(quizId: string): Promise<any> {
    console.log('[TEST] Fetching active attempt for quiz:', quizId);
    const response = await api.get(`/test-attempts/active?quiz_id=${quizId}`);
    return response.data;
  },

  async heartbeat(attemptId: string): Promise<{remainingSeconds: number | null; status: string; last_seen_at: string}> {
    console.log('[TEST] Sending heartbeat for attempt:', attemptId);
    const response = await api.post(`/test-attempts/${attemptId}/heartbeat`);
    return response.data;
  },

  async saveAnswers(attemptId: string, answers: Array<{question_id: string; selected_answer_id: string; client_seq: number}>): Promise<{success: boolean; saved_count: number; remainingSeconds: number | null}> {
    console.log('[TEST] Saving answers for attempt:', attemptId, 'Count:', answers.length);
    const response = await api.patch(`/test-attempts/${attemptId}/answers`, { answers });
    return response.data;
  },

  async resume(resumeToken: string): Promise<any> {
    console.log('[TEST] Resuming attempt with token');
    const response = await api.post('/test-attempts/resume', { resume_token: resumeToken });
    return response.data;
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

  async changePassword(userId: string, payload: ChangePasswordDto): Promise<{ message: string }> {
    console.log('[USER] Changing password for user:', userId);
    const response = await api.patch(`/users/${userId}/password`, payload);
    console.log('[USER] Password changed successfully');
    return response.data;
  },

  async getUserStats(): Promise<UserStats> {
    console.log('[USER] Fetching user stats');
    const response = await api.get<UserStats>('/users/stats');
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
    const response = await api.get('/notifications/my-notifications');
    const responseData = response.data;

    // Backend currently returns either { data: [...] } or { notifications: [...] }
    if (Array.isArray(responseData)) {
      return responseData as Notification[];
    }

    if (responseData?.data && Array.isArray(responseData.data)) {
      return responseData.data as Notification[];
    }

    if (
      responseData?.notifications &&
      Array.isArray(responseData.notifications)
    ) {
      return responseData.notifications as Notification[];
    }

    console.warn('[NOTIFICATION] Unexpected response format:', responseData);
    return [];
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

export const leaderboardAPI = {
  async getQuizLeaderboard(quizId: string): Promise<LeaderboardEntry[]> {
    console.log('[LEADERBOARD] Fetching leaderboard for quiz:', quizId);
    const response = await api.get<ApiResponse<LeaderboardEntry[]>>(`/leaderboards/quiz/${quizId}`);
    return response.data.data!;
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
    if (!user) return false;
    
    // Admin luôn có quyền premium (không cần mua gói)
    if (user.role === 'admin') return true;
    
    // Teacher cũng được coi là có quyền premium
    if (user.role === 'teacher') return true;
    
    // Kiểm tra package_id
    if (!user.package_id) return false;
    
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
