import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TestAttemptController } from './test-attempt.controller';
import { TestAttemptService } from './test-attempt.service';
import { TestAttempt, TestAttemptSchema } from './test-attempt.schema';
import { Quiz, QuizSchema } from '../quizzes/quiz.schema';
import { Question, QuestionSchema } from '../questions/question.schema';
import { Answer, AnswerSchema } from '../answers/answer.schema';
import { User, UserSchema } from '../users/user.schema';
import { Package, PackageSchema } from '../packages/package.schema';
import { LeaderboardModule } from '../leaderboards/leaderboard.module';
import { NotificationModule } from '../notifications/notification.module';

/**
 * Module chinh cua test-attempts
 * Ket noi tat ca thanh phan: schema, controller, service
 * Import cac schema can thiet: TestAttempt, Quiz, Question, Answer
 * Export service de cac module khac co the su dung
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TestAttempt.name, schema: TestAttemptSchema },
      { name: Quiz.name, schema: QuizSchema },
      { name: Question.name, schema: QuestionSchema },
      { name: Answer.name, schema: AnswerSchema },
      { name: User.name, schema: UserSchema },
      { name: Package.name, schema: PackageSchema },
    ]),
    LeaderboardModule,
    NotificationModule,
  ],
  controllers: [TestAttemptController],
  providers: [TestAttemptService],
  exports: [TestAttemptService],
})
export class TestAttemptModule {}
