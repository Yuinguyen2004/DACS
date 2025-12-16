import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:mobilefe/models/user_model.dart';
import 'package:mobilefe/models/quiz_model.dart';
import 'package:mobilefe/models/activity_model.dart';
import 'package:mobilefe/models/notification_model.dart';
import 'package:mobilefe/models/quiz_leaderboard.dart';
import 'package:mobilefe/models/user_quiz_rank.dart';
import 'package:file_picker/file_picker.dart';

class ApiService {
  // Use your computer's local IP for physical devices
  // Use 10.0.2.2 for Android emulator, localhost for Web/iOS
  static String get baseUrl {
    if (kIsWeb) {
      return 'http://localhost:3000';
    }
    // For physical Android devices, use your computer's local IP address
    // Make sure your phone and computer are on the same WiFi network
    return 'http://192.168.101.71:3000';
  }

  final Dio _dio;
  final FlutterSecureStorage _storage;
  final FirebaseAuth _firebaseAuth = FirebaseAuth.instance;

  ApiService()
    : _dio = Dio(
        BaseOptions(
          baseUrl: baseUrl,
          connectTimeout: const Duration(seconds: 10),
          receiveTimeout: const Duration(seconds: 10),
        ),
      ),
      _storage = const FlutterSecureStorage() {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _storage.read(key: 'auth_token');
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
      ),
    );
  }

  // Exchange custom token for ID token using Firebase Auth SDK
  Future<String> _exchangeCustomTokenForIdToken(String customToken) async {
    try {
      // Use Firebase Auth SDK to sign in with custom token
      final userCredential = await _firebaseAuth.signInWithCustomToken(
        customToken,
      );
      debugPrint('🔐 [LOGIN] Firebase Auth sign in successful');

      // Get the ID token from the signed-in user
      final idToken = await userCredential.user?.getIdToken();
      if (idToken == null) {
        throw Exception('Failed to get ID token after Firebase sign in');
      }
      return idToken;
    } catch (e) {
      debugPrint('❌ [LOGIN] Firebase Auth error: $e');
      rethrow;
    }
  }

  // Auth
  Future<void> login(String email, String password) async {
    try {
      debugPrint('🔐 [LOGIN] Attempting login to: $baseUrl/auth/login');
      debugPrint('🔐 [LOGIN] Email: $email');

      final response = await _dio.post(
        '/auth/login',
        data: {'email': email, 'password': password},
      );

      debugPrint('🔐 [LOGIN] Response received: ${response.statusCode}');
      debugPrint('🔐 [LOGIN] Response data: ${response.data}');

      final customToken = response.data['firebaseToken'];
      debugPrint(
        '🔐 [LOGIN] Custom token received, exchanging for ID token...',
      );

      final idToken = await _exchangeCustomTokenForIdToken(customToken);
      debugPrint('🔐 [LOGIN] ID token obtained successfully');

      await _storage.write(key: 'auth_token', value: idToken);
      debugPrint('🔐 [LOGIN] Token saved to storage');
    } catch (e) {
      debugPrint('❌ [LOGIN] Error: $e');
      if (e is DioException) {
        debugPrint('❌ [LOGIN] DioException type: ${e.type}');
        debugPrint('❌ [LOGIN] DioException message: ${e.message}');
        debugPrint('❌ [LOGIN] DioException response: ${e.response?.data}');
        debugPrint(
          '❌ [LOGIN] DioException statusCode: ${e.response?.statusCode}',
        );
      }
      rethrow;
    }
  }

  Future<void> register(String email, String password, String name) async {
    try {
      final response = await _dio.post(
        '/auth/register',
        data: {'email': email, 'password': password, 'name': name},
      );

      final customToken = response.data['firebaseToken'];
      final idToken = await _exchangeCustomTokenForIdToken(customToken);

      await _storage.write(key: 'auth_token', value: idToken);
    } catch (e) {
      rethrow;
    }
  }

  /// Login with Google Sign-In
  /// Takes Firebase ID token from Google Sign-In and authenticates with backend
  Future<void> loginWithGoogle({
    required String idToken,
    required String email,
    String? name,
    String? photoURL,
  }) async {
    try {
      debugPrint('🔐 [GOOGLE LOGIN] Sending Google auth to backend...');
      debugPrint('🔐 [GOOGLE LOGIN] Email: $email');

      final response = await _dio.post(
        '/auth/google',
        data: {
          'idToken': idToken,
          'email': email,
          'name': name,
          'photoURL': photoURL,
        },
      );

      debugPrint('🔐 [GOOGLE LOGIN] Response: ${response.statusCode}');
      debugPrint('🔐 [GOOGLE LOGIN] Data: ${response.data}');

      // Backend returns the same idToken for Google auth
      // Store it for subsequent API calls
      await _storage.write(key: 'auth_token', value: idToken);
      debugPrint('🔐 [GOOGLE LOGIN] Token saved to storage');
    } catch (e) {
      debugPrint('❌ [GOOGLE LOGIN] Error: $e');
      if (e is DioException) {
        debugPrint('❌ [GOOGLE LOGIN] DioException: ${e.response?.data}');
      }
      rethrow;
    }
  }

  Future<void> logout() async {
    await _storage.delete(key: 'auth_token');
  }

  // User
  Future<UserModel> getProfile() async {
    try {
      debugPrint('👤 [PROFILE] Fetching user profile...');
      final response = await _dio.get('/users/profile');
      debugPrint('👤 [PROFILE] Response received: ${response.statusCode}');
      debugPrint('👤 [PROFILE] Response data: ${response.data}');
      final json = response.data;

      return UserModel(
        id: json['_id'] ?? '',
        name: json['name'] ?? json['username'] ?? 'User',
        email: json['email'] ?? '',
        avatarUrl: json['avatar'] ?? '',
        level: 'Beginner',
        points: json['total_score'] ?? 0,
        quizzesTaken: json['quizzes_taken'] ?? 0,
        averageScore: (json['average_score'] ?? 0).toDouble(),
        isPremium: json['isPremium'] ?? false,
        subscriptionType: json['subscriptionType'],
        subscriptionStartDate: json['subscriptionStartDate'] != null
            ? DateTime.parse(json['subscriptionStartDate'])
            : null,
        subscriptionEndDate: json['subscriptionEndDate'] != null
            ? DateTime.parse(json['subscriptionEndDate'])
            : null,
        subscriptionCanceledAt: json['subscriptionCanceledAt'] != null
            ? DateTime.parse(json['subscriptionCanceledAt'])
            : null,
      );
    } catch (e) {
      debugPrint('❌ [PROFILE] Error: $e');
      if (e is DioException) {
        debugPrint('❌ [PROFILE] DioException type: ${e.type}');
        debugPrint('❌ [PROFILE] DioException message: ${e.message}');
        debugPrint('❌ [PROFILE] DioException response: ${e.response?.data}');
        debugPrint(
          '❌ [PROFILE] DioException statusCode: ${e.response?.statusCode}',
        );
      }
      rethrow;
    }
  }

  Future<UserModel> updateProfile({required String name}) async {
    try {
      final response = await _dio.patch('/users/profile', data: {'name': name});
      final json = response.data;

      return UserModel(
        id: json['_id'] ?? '',
        name: json['name'] ?? json['username'] ?? 'User',
        email: json['email'] ?? '',
        avatarUrl: json['avatar'] ?? '',
        level: 'Beginner',
        points: json['total_score'] ?? 0,
        quizzesTaken: json['quizzes_taken'] ?? 0,
        averageScore: (json['average_score'] ?? 0).toDouble(),
        isPremium: json['isPremium'] ?? false,
        subscriptionType: json['subscriptionType'],
        subscriptionStartDate: json['subscriptionStartDate'] != null
            ? DateTime.parse(json['subscriptionStartDate'])
            : null,
        subscriptionEndDate: json['subscriptionEndDate'] != null
            ? DateTime.parse(json['subscriptionEndDate'])
            : null,
        subscriptionCanceledAt: json['subscriptionCanceledAt'] != null
            ? DateTime.parse(json['subscriptionCanceledAt'])
            : null,
      );
    } catch (e) {
      rethrow;
    }
  }

  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    try {
      await _dio.patch(
        '/users/change-password',
        data: {'currentPassword': currentPassword, 'newPassword': newPassword},
      );
    } catch (e) {
      rethrow;
    }
  }

  Future<void> cancelSubscription() async {
    try {
      await _dio.delete('/users/cancel-subscription');
    } catch (e) {
      rethrow;
    }
  }

  // Notifications
  Future<List<NotificationModel>> getNotifications({
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final response = await _dio.get(
        '/notifications/my-notifications',
        queryParameters: {'page': page, 'limit': limit},
      );
      final data = response.data;
      final List<dynamic> jsonList = data['notifications'] ?? [];
      return jsonList.map((json) => NotificationModel.fromJson(json)).toList();
    } catch (e) {
      rethrow;
    }
  }

  Future<int> getUnreadNotificationCount() async {
    try {
      final response = await _dio.get('/notifications/unread/count');
      return response.data['count'] ?? 0;
    } catch (e) {
      return 0;
    }
  }

  Future<void> markNotificationAsRead(String id) async {
    try {
      await _dio.patch('/notifications/$id/mark-read');
    } catch (e) {
      rethrow;
    }
  }

  Future<void> markAllNotificationsAsRead() async {
    try {
      await _dio.patch('/notifications/mark-all-read');
    } catch (e) {
      rethrow;
    }
  }

  /// Clear all notifications for the current user
  Future<Map<String, dynamic>> clearAllNotifications() async {
    try {
      final response = await _dio.delete('/notifications/clear-all');
      return Map<String, dynamic>.from(response.data);
    } catch (e) {
      rethrow;
    }
  }

  // Quizzes
  Future<List<QuizModel>> getQuizzes() async {
    try {
      final response = await _dio.get('/quizzes');
      final List<dynamic> quizzesJson = response.data;

      return quizzesJson.map((json) {
        return QuizModel(
          id: json['_id'],
          title: json['title'],
          author: json['user_id']?['username'] ?? 'Unknown',
          category: json['category'] ?? 'General',
          difficulty: _parseDifficulty(json['difficulty']),
          questionCount:
              json['totalQuestions'] ?? 0, // Backend returns totalQuestions
          durationMinutes: json['time_limit'] ?? 15,
          thumbnail: json['image'] ?? '',
          description: json['description'] ?? '',
          isPremiumContent: json['is_premium'] ?? false,
        );
      }).toList();
    } catch (e) {
      rethrow;
    }
  }

  // Test Attempts
  Future<Map<String, dynamic>> startTest(String quizId) async {
    try {
      final response = await _dio.post('/test-attempts/start/$quizId');
      return response.data;
    } catch (e) {
      rethrow;
    }
  }

  Future<Map<String, dynamic>?> getActiveAttempt(String quizId) async {
    try {
      final response = await _dio.get(
        '/test-attempts/active',
        queryParameters: {'quiz_id': quizId},
      );
      return response.data;
    } catch (e) {
      if (e is DioException && e.response?.statusCode == 404) {
        return null;
      }
      rethrow;
    }
  }

  Future<void> saveAnswers(
    String attemptId,
    List<Map<String, dynamic>> answers,
  ) async {
    try {
      await _dio.patch(
        '/test-attempts/$attemptId/answers',
        data: {'answers': answers},
      );
    } catch (e) {
      // Autosave errors should be silent or logged, but not crash the app flow usually.
      // But rethrowing allows UI to show "Saving failed" if needed.
      debugPrint('Autosave failed: $e');
    }
  }

  Future<Map<String, dynamic>> submitTest(
    String attemptId,
    List<Map<String, dynamic>> answers,
  ) async {
    try {
      final response = await _dio.post(
        '/test-attempts/submit',
        data: {'attempt_id': attemptId, 'answers': answers},
      );
      return response.data;
    } catch (e) {
      rethrow;
    }
  }

  Future<List<Map<String, dynamic>>> getTestHistory() async {
    try {
      final response = await _dio.get('/test-attempts/history');
      return List<Map<String, dynamic>>.from(response.data);
    } catch (e) {
      rethrow;
    }
  }

  /// Clear test history (completed attempts only)
  Future<Map<String, dynamic>> clearTestHistory() async {
    try {
      final response = await _dio.delete('/test-attempts/history');
      return Map<String, dynamic>.from(response.data);
    } catch (e) {
      rethrow;
    }
  }

  /// Get attempt details with correct answers (after quiz completion)
  Future<Map<String, dynamic>> getAttemptDetails(String attemptId) async {
    try {
      final response = await _dio.get('/test-attempts/$attemptId');
      return response.data;
    } catch (e) {
      rethrow;
    }
  }

  // ==================== CREATE QUIZ METHODS ====================

  /// Create a new quiz
  Future<Map<String, dynamic>> createQuiz({
    required String title,
    String? description,
    String? image,
    int? timeLimit,
    bool isPremium = false,
  }) async {
    try {
      final response = await _dio.post(
        '/quizzes',
        data: {
          'title': title,
          if (description != null) 'description': description,
          if (image != null) 'image': image,
          if (timeLimit != null) 'time_limit': timeLimit,
          'is_premium': isPremium,
        },
      );
      return response.data;
    } catch (e) {
      rethrow;
    }
  }

  /// Create a question for a quiz
  Future<Map<String, dynamic>> createQuestion({
    required String quizId,
    required String content,
    required String type, // 'mcq' or 'true_false'
    String? image,
  }) async {
    try {
      final response = await _dio.post(
        '/questions',
        data: {
          'quiz_id': quizId,
          'content': content,
          'type': type,
          if (image != null) 'image': image,
        },
      );
      return response.data;
    } catch (e) {
      rethrow;
    }
  }

  /// Create an answer for a question
  Future<Map<String, dynamic>> createAnswer({
    required String questionId,
    required String content,
    required bool isCorrect,
  }) async {
    try {
      final response = await _dio.post(
        '/answers',
        data: {
          'question_id': questionId,
          'content': content,
          'is_correct': isCorrect,
        },
      );
      return response.data;
    } catch (e) {
      rethrow;
    }
  }

  /// Get quizzes created by the current user
  Future<List<Map<String, dynamic>>> getMyQuizzes() async {
    try {
      final response = await _dio.get('/quizzes/my');
      return List<Map<String, dynamic>>.from(response.data);
    } catch (e) {
      rethrow;
    }
  }

  /// Delete a quiz
  Future<void> deleteQuiz(String quizId) async {
    try {
      await _dio.delete('/quizzes/$quizId');
    } catch (e) {
      rethrow;
    }
  }

  /// Process file with AI (Gemini) to generate quiz questions
  /// Returns questions preview without saving to database
  /// Supports both web (using bytes) and mobile (using file path)
  Future<Map<String, dynamic>> processFileWithAI({
    required PlatformFile platformFile,
    int? desiredQuestionCount,
  }) async {
    try {
      MultipartFile multipartFile;

      // Handle web vs mobile file upload
      if (platformFile.bytes != null) {
        // Web: use bytes
        multipartFile = MultipartFile.fromBytes(
          platformFile.bytes!,
          filename: platformFile.name,
        );
      } else if (platformFile.path != null) {
        // Mobile/Desktop: use file path
        multipartFile = await MultipartFile.fromFile(
          platformFile.path!,
          filename: platformFile.name,
        );
      } else {
        throw Exception('File has neither bytes nor path');
      }

      final formData = FormData.fromMap({
        'file': multipartFile,
        if (desiredQuestionCount != null)
          'desiredQuestionCount': desiredQuestionCount.toString(),
      });

      final response = await _dio.post('/quizzes/process-file', data: formData);
      return response.data;
    } catch (e) {
      rethrow;
    }
  }

  // Payment
  Future<void> verifyGooglePurchase({
    required String purchaseToken,
    required String productId,
    required String packageId,
  }) async {
    try {
      await _dio.post(
        '/api/v1/payments/google-iap',
        data: {
          'purchaseToken': purchaseToken,
          'productId': productId,
          'packageId': packageId,
        },
      );
    } catch (e) {
      rethrow;
    }
  }

  // ZaloPay payment
  Future<Map<String, dynamic>> createZaloPayOrder({
    required String packageId,
    required int amount,
    required String description,
  }) async {
    try {
      final response = await _dio.post(
        '/api/v1/payments/zalopay/create-order',
        data: {
          'packageId': packageId,
          'amount': amount,
          'description': description,
        },
      );
      return response.data as Map<String, dynamic>;
    } catch (e) {
      rethrow;
    }
  }

  Future<Map<String, dynamic>> checkPaymentStatus(String paymentCode) async {
    try {
      final response = await _dio.get('/api/v1/payments/status/$paymentCode');
      return response.data as Map<String, dynamic>;
    } catch (e) {
      rethrow;
    }
  }

  QuizDifficulty _parseDifficulty(String? difficulty) {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
      case 'beginner':
        return QuizDifficulty.beginner;
      case 'medium':
      case 'intermediate':
        return QuizDifficulty.intermediate;
      case 'hard':
      case 'advanced':
        return QuizDifficulty.advanced;
      default:
        return QuizDifficulty.intermediate;
    }
  }

  // Leaderboard
  Future<QuizLeaderboard> getQuizLeaderboard(String quizId, {int limit = 50}) async {
    try {
      debugPrint('📊 [LEADERBOARD] Fetching leaderboard for quiz: $quizId');
      final response = await _dio.get(
        '/leaderboards/quiz/$quizId',
        queryParameters: {'limit': limit},
      );
      debugPrint('📊 [LEADERBOARD] Response: ${response.data}');
      return QuizLeaderboard.fromJson(response.data);
    } catch (e) {
      debugPrint('❌ [LEADERBOARD] Error: $e');
      if (e is DioException) {
        debugPrint('❌ [LEADERBOARD] Status: ${e.response?.statusCode}');
        debugPrint('❌ [LEADERBOARD] Data: ${e.response?.data}');
      }
      rethrow;
    }
  }

  Future<UserQuizRank?> getMyQuizRank(String quizId) async {
    try {
      final response = await _dio.get('/leaderboards/quiz/$quizId/my-rank');
      if (response.data == null) return null;
      return UserQuizRank.fromJson(response.data);
    } catch (e) {
      if (e is DioException && e.response?.statusCode == 404) {
        return null; // User has not completed this quiz
      }
      rethrow;
    }
  }
}
