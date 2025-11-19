enum QuizDifficulty { beginner, intermediate, advanced }

class QuizModel {
  const QuizModel({
    required this.id,
    required this.title,
    required this.author,
    required this.category,
    required this.difficulty,
    required this.questionCount,
    required this.durationMinutes,
    required this.thumbnail,
    required this.description,
  });

  final String id;
  final String title;
  final String author;
  final String category;
  final QuizDifficulty difficulty;
  final int questionCount;
  final int durationMinutes;
  final String thumbnail;
  final String description;
}
