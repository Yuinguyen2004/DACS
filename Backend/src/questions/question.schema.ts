// write code for question schema
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { IsString, IsNotEmpty } from 'class-validator';
import { Quiz } from '../quizzes/quiz.schema';

@Schema({ timestamps: true })
export class Question extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Quiz', required: true })
  quiz_id: Types.ObjectId;

  @Prop({ required: true })
  @IsString()
  @IsNotEmpty()
  content: string;

  @Prop({ type: String, enum: ['mcq', 'true_false'], required: true })
  @IsString()
  @IsNotEmpty()
  type: string;

  @Prop()
  explanation: string;

  @Prop()
  question_number: number;
}

export const QuestionSchema = SchemaFactory.createForClass(Question);
