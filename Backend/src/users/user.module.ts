import { Module } from '@nestjs/common';
import { UsersController } from './user.controller';
import { UsersService } from './user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './user.schema';
import { Quiz, QuizSchema } from '../quizzes/quiz.schema';
import { TestAttempt, TestAttemptSchema } from '../test-attempts/test-attempt.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Quiz.name, schema: QuizSchema },
      { name: TestAttempt.name, schema: TestAttemptSchema },
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
