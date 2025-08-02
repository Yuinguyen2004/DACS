import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Leaderboard, LeaderboardSchema } from './leaderboard.schema';
import { LeaderboardService } from './leaderboard.service';
import { LeaderboardController } from './leaderboard.controller';
import { AuditLogService } from './audit-log.service';
import { User, UserSchema } from '../users/user.schema';
import { Quiz, QuizSchema } from '../quizzes/quiz.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Leaderboard.name, schema: LeaderboardSchema },
      { name: User.name, schema: UserSchema },
      { name: Quiz.name, schema: QuizSchema },
    ]),
  ],
  controllers: [LeaderboardController],
  providers: [LeaderboardService, AuditLogService],
  exports: [LeaderboardService],
})
export class LeaderboardModule {}