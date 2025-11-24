enum QuizType { basic, advanced }

extension QuizTypeX on QuizType {
  String get title {
    switch (this) {
      case QuizType.basic:
        return 'Basic Quiz';
      case QuizType.advanced:
        return 'Advanced Quiz';
    }
  }

  String get description {
    switch (this) {
      case QuizType.basic:
        return 'Quick multiple-choice quizzes with text-only questions.';
      case QuizType.advanced:
        return 'Rich quizzes supporting images, audio, and advanced formatting.';
    }
  }
}
