// write module code for question module
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QuestionController } from './question.controller';
import { QuestionService } from './question.service';
import { Question, QuestionSchema } from './question.schema';
import { Answer, AnswerSchema } from '../answers/answer.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Question.name, schema: QuestionSchema },
      { name: Answer.name, schema: AnswerSchema },
    ]),
  ],
  controllers: [QuestionController],
  providers: [QuestionService],
})
export class QuestionModule {}
