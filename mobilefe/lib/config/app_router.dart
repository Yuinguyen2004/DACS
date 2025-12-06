import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:mobilefe/models/quiz_model.dart';
import 'package:mobilefe/screens/auth/login_screen.dart';
import 'package:mobilefe/screens/auth/onboarding_screen.dart';
import 'package:mobilefe/screens/auth/register_screen.dart';
import 'package:mobilefe/screens/create_quiz/create_quiz_screen.dart';

import 'package:mobilefe/screens/quiz/quiz_detail_screen.dart';
import 'package:mobilefe/screens/quiz/quiz_flow_models.dart';
import 'package:mobilefe/screens/quiz/quiz_result_screen.dart';
import 'package:mobilefe/screens/quiz/quiz_taking_screen.dart';
import 'package:mobilefe/screens/quiz/quiz_leaderboard_screen.dart';
import 'package:mobilefe/screens/quiz/all_quizzes_screen.dart';
import 'package:mobilefe/screens/history/all_activity_screen.dart';
import 'package:mobilefe/screens/settings/account_settings_screen.dart';
import 'package:mobilefe/screens/settings/edit_profile_screen.dart';
import 'package:mobilefe/screens/settings/change_password_screen.dart';
import 'package:mobilefe/screens/settings/language_settings_screen.dart';
import 'package:mobilefe/screens/notification/notification_screen.dart';
import 'package:mobilefe/screens/subscription/premium_screen.dart';
import 'package:mobilefe/screens/student/main_screen.dart';

class AppRoute {
  AppRoute._();

  static const onboarding = '/';
  static const login = '/login';
  static const register = '/register';
  static const dashboard = '/dashboard';
  static const quizDetail = '/quiz/detail';
  static const quizTaking = '/quiz/taking';
  static const quizResult = '/quiz/result';
  static const quizLeaderboard = '/quiz/leaderboard';
  static const premium = '/premium';
  static const createQuizMethod = '/create-quiz/method';
  static const allQuizzes = '/quizzes/all';
  static const allActivity = '/activity/all';
  static const accountSettings = '/settings/account';
  static const editProfile = '/settings/edit-profile';
  static const changePassword = '/settings/change-password';
  static const languageSettings = '/settings/language';
  static const String notifications = '/notifications';
}

class AppRouter {
  AppRouter._();

  static final GoRouter router = GoRouter(
    initialLocation: AppRoute.onboarding,
    routes: <GoRoute>[
      GoRoute(
        path: AppRoute.onboarding,
        builder: (context, state) => const OnboardingScreen(),
      ),
      GoRoute(
        path: AppRoute.login,
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: AppRoute.register,
        builder: (context, state) => const RegisterScreen(),
      ),
      GoRoute(
        path: AppRoute.dashboard,
        builder: (context, state) => const MainScreen(),
      ),
      GoRoute(
        path: AppRoute.quizDetail,
        builder: (context, state) {
          final Object? extra = state.extra;
          if (extra is QuizModel) {
            return QuizDetailScreen(quiz: extra);
          }
          return const _RouteFallback(message: 'Missing quiz data');
        },
      ),
      GoRoute(
        path: AppRoute.quizTaking,
        builder: (context, state) {
          final Object? extra = state.extra;
          if (extra is QuizTakingPayload) {
            return QuizTakingScreen(payload: extra);
          }
          return const _RouteFallback(message: 'Missing quiz session data');
        },
      ),
      GoRoute(
        path: AppRoute.quizResult,
        builder: (context, state) {
          final Object? extra = state.extra;
          if (extra is QuizResultPayload) {
            return QuizResultScreen(payload: extra);
          }
          return const _RouteFallback(message: 'Missing quiz result data');
        },
      ),
      GoRoute(
        path: AppRoute.quizLeaderboard,
        builder: (context, state) {
          final Object? extra = state.extra;
          if (extra is QuizLeaderboardPayload) {
            return QuizLeaderboardScreen(payload: extra);
          }
          return const _RouteFallback(message: 'Missing leaderboard data');
        },
      ),
      GoRoute(
        path: AppRoute.premium,
        builder: (context, state) => const PremiumScreen(),
      ),
      GoRoute(
        path: AppRoute.createQuizMethod,
        builder: (context, state) {
          return const CreateQuizScreen();
        },
      ),
      GoRoute(
        path: AppRoute.allQuizzes,
        builder: (context, state) => const AllQuizzesScreen(),
      ),
      GoRoute(
        path: AppRoute.allActivity,
        builder: (context, state) => const AllActivityScreen(),
      ),
      GoRoute(
        path: AppRoute.accountSettings,
        builder: (context, state) => const AccountSettingsScreen(),
      ),
      GoRoute(
        path: AppRoute.editProfile,
        builder: (context, state) => const EditProfileScreen(),
      ),
      GoRoute(
        path: AppRoute.changePassword,
        builder: (context, state) => const ChangePasswordScreen(),
      ),
      GoRoute(
        path: AppRoute.languageSettings,
        builder: (context, state) => const LanguageSettingsScreen(),
      ),
      GoRoute(
        path: '/notifications',
        builder: (context, state) => const NotificationScreen(),
      ),
    ],
  );
}

class _RouteFallback extends StatelessWidget {
  const _RouteFallback({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Route error')),
      body: Center(child: Text(message)),
    );
  }
}
