import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Question } from '../questions/question.schema';

@Schema({ timestamps: true })
export class Answer extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Question', required: true })
  question_id: Types.ObjectId;

  @Prop({ required: true })
  content: string;

  @Prop({ required: true, default: false })
  is_correct: boolean;
}

export const AnswerSchema = SchemaFactory.createForClass(Answer);
