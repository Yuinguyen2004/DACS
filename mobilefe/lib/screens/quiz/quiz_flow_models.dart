import 'package:mobilefe/models/quiz_model.dart';
import 'package:mobilefe/models/quiz_question_model.dart';

class QuizTakingPayload {
  const QuizTakingPayload({
    required this.quiz,
    required this.questions,
    required this.attemptId,
    required this.remainingSeconds,
    this.initialAnswers = const {},
  });

  final QuizModel quiz;
  final List<QuizQuestion> questions;
  final String attemptId;
  final int remainingSeconds;
  final Map<int, int> initialAnswers;
}

class QuizResultPayload {
  const QuizResultPayload({
    required this.quiz,
    required this.questions,
    required this.selectedAnswers,
    required this.correctCount,
    required this.score,
    required this.attemptId,
    this.isTimeOut = false,
  });

  final QuizModel quiz;
  final List<QuizQuestion> questions;
  final Map<int, int> selectedAnswers;
  final int correctCount;
  final int score;
  final String attemptId;
  final bool isTimeOut;
}

class QuizLeaderboardPayload {
  const QuizLeaderboardPayload({
    required this.quizId,
    required this.quizTitle,
  });

  final String quizId;
  final String quizTitle;
}
