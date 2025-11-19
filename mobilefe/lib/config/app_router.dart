import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:mobilefe/models/quiz_model.dart';
import 'package:mobilefe/screens/auth/login_screen.dart';
import 'package:mobilefe/screens/auth/onboarding_screen.dart';
import 'package:mobilefe/screens/auth/register_screen.dart';
import 'package:mobilefe/screens/create_quiz/quiz_creation_method_screen.dart';
import 'package:mobilefe/screens/create_quiz/quiz_creation_models.dart';
import 'package:mobilefe/screens/create_quiz/quiz_type_selector.dart';
import 'package:mobilefe/screens/premium/premium_screen.dart';
import 'package:mobilefe/screens/quiz/quiz_detail_screen.dart';
import 'package:mobilefe/screens/quiz/quiz_flow_models.dart';
import 'package:mobilefe/screens/quiz/quiz_result_screen.dart';
import 'package:mobilefe/screens/quiz/quiz_taking_screen.dart';
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
  static const premium = '/premium';
  static const createQuizType = '/create-quiz/type';
  static const createQuizMethod = '/create-quiz/method';
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
        path: AppRoute.premium,
        builder: (context, state) => const PremiumScreen(),
      ),
      GoRoute(
        path: AppRoute.createQuizType,
        builder: (context, state) => const QuizTypeSelectorScreen(),
      ),
      GoRoute(
        path: AppRoute.createQuizMethod,
        builder: (context, state) {
          final Object? extra = state.extra;
          if (extra is QuizType) {
            return QuizCreationMethodScreen(quizType: extra);
          }
          return const _RouteFallback(message: 'Missing quiz type data');
        },
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
