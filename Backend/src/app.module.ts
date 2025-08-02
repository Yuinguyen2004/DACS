import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/user.module';
import { AuthModule } from './auth/auth.module';
import { PackageModule } from './packages/package.module';
import { QuizModule } from './quizzes/quiz.module';
import { AnswerModule } from './answers/answer.module';
import { TestAttemptModule } from './test-attempts/test-attempt.module';
import { QuestionModule } from './questions/question.module';
import { NotificationModule } from './notifications/notification.module';
import { LeaderboardModule } from './leaderboards/leaderboard.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    PackageModule,
    QuizModule,
    QuestionModule,
    AnswerModule,
    TestAttemptModule,
    NotificationModule,
    LeaderboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
