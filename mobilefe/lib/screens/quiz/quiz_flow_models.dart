import 'package:mobilefe/models/quiz_model.dart';
import 'package:mobilefe/models/quiz_question_model.dart';

class QuizTakingPayload {
  const QuizTakingPayload({required this.quiz, required this.questions});

  final QuizModel quiz;
  final List<QuizQuestion> questions;
}

class QuizResultPayload {
  const QuizResultPayload({
    required this.quiz,
    required this.questions,
    required this.selectedAnswers,
    required this.correctCount,
    required this.score,
  });

  final QuizModel quiz;
  final List<QuizQuestion> questions;
  final Map<int, int> selectedAnswers;
  final int correctCount;
  final int score;
}
