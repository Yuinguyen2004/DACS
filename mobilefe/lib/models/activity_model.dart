class ActivityModel {
  const ActivityModel({
    required this.id,
    required this.quizTitle,
    required this.score,
    required this.completedOn,
    required this.status,
  });

  final String id;
  final String quizTitle;
  final int score;
  final DateTime completedOn;
  final ActivityStatus status;
}

enum ActivityStatus { completed, inProgress }
