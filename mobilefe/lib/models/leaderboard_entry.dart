class LeaderboardEntry {
  const LeaderboardEntry({
    required this.rank,
    required this.name,
    required this.avatarUrl,
    required this.score,
  });

  final int rank;
  final String name;
  final String avatarUrl;
  final int score;
}
