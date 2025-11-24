class QuizQuestion {
  const QuizQuestion({
    required this.id,
    required this.prompt,
    required this.options,
    required this.answerIds,
    this.correctIndex = -1,
    this.imageUrl,
  });

  final String id;
  final String prompt;
  final List<String> options;
  final List<String> answerIds;
  final int correctIndex;
  final String? imageUrl;
}
