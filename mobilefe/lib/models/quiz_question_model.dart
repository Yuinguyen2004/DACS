class QuizQuestion {
  const QuizQuestion({
    required this.id,
    required this.prompt,
    required this.options,
    required this.correctIndex,
    this.imageUrl,
  });

  final String id;
  final String prompt;
  final List<String> options;
  final int correctIndex;
  final String? imageUrl;
}
