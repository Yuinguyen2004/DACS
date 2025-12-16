class UserQuizRank {
  const UserQuizRank({
    required this.rank,
    required this.totalParticipants,
    required this.score,
  });

  final int rank;
  final int totalParticipants;
  final int score;

  factory UserQuizRank.fromJson(Map<String, dynamic> json) {
    return UserQuizRank(
      rank: json['rank'] as int,
      totalParticipants: json['totalParticipants'] as int,
      score: (json['score'] as num).toInt(),
    );
  }
}
