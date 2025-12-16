class QuizLeaderboardEntry {
  const QuizLeaderboardEntry({
    required this.rank,
    required this.userId,
    required this.score,
    required this.completedAt,
    this.username,
    this.timeSpent,
  });

  final int rank;
  final String userId;
  final String? username;
  final int score;
  final int? timeSpent; // in seconds
  final DateTime completedAt;

  factory QuizLeaderboardEntry.fromJson(Map<String, dynamic> json) {
    DateTime parsedDate;
    try {
      final completedAtValue = json['completedAt'];
      if (completedAtValue is String) {
        parsedDate = DateTime.parse(completedAtValue);
      } else if (completedAtValue is int) {
        parsedDate = DateTime.fromMillisecondsSinceEpoch(completedAtValue);
      } else {
        parsedDate = DateTime.now();
      }
    } catch (e) {
      parsedDate = DateTime.now();
    }

    return QuizLeaderboardEntry(
      rank: (json['rank'] as num?)?.toInt() ?? 0,
      userId: json['userId']?.toString() ?? '',
      username: json['username'] as String?,
      score: (json['score'] as num?)?.toInt() ?? 0,
      timeSpent: json['timeSpent'] != null ? (json['timeSpent'] as num).toInt() : null,
      completedAt: parsedDate,
    );
  }
}
