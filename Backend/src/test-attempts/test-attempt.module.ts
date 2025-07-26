import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TestAttemptController } from './test-attempt.controller';
import { TestAttemptService } from './test-attempt.service';
import { TestAttempt, TestAttemptSchema } from './test-attempt.schema';
import { Quiz, QuizSchema } from '../quizzes/quiz.schema';
import { Question, QuestionSchema } from '../questions/question.schema';
import { Answer, AnswerSchema } from '../answers/answer.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TestAttempt.name, schema: TestAttemptSchema },
      { name: Quiz.name, schema: QuizSchema },
      { name: Question.name, schema: QuestionSchema },
      { name: Answer.name, schema: AnswerSchema },
    ]),
  ],
  controllers: [TestAttemptController],
  providers: [TestAttemptService],
  exports: [TestAttemptService],
})
export class TestAttemptModule {}
