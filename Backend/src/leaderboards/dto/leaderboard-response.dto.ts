export class LeaderboardResponseDto {
  _id: string;
  quizId: string;
  userId: string;
  attemptId: string;
  score: number;
  timeSpent?: number;
  rank: number;
  createdAt: Date;
  updatedAt: Date;
}

export class LeaderboardEntryDto {
  rank: number;
  userId: string;
  username?: string;
  score: number;
  timeSpent?: number;
  completedAt: Date;
}

export class QuizLeaderboardDto {
  quizId: string;
  quizTitle?: string;
  entries: LeaderboardEntryDto[];
  totalParticipants: number;
}