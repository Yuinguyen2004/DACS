import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class TestAttempt extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Quiz', required: true })
  quiz_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user_id: Types.ObjectId;

  @Prop({ required: true })
  score: number;

  @Prop({ required: true })
  total_questions: number;

  @Prop({ required: true })
  correct_answers: number;

  @Prop({ required: true })
  incorrect_answers: number;

  @Prop({ required: true })
  completion_time: number; // in seconds

  @Prop({ type: Date, required: true })
  started_at: Date;

  @Prop({ type: Date, required: true })
  completed_at: Date;

  @Prop({
    type: [
      {
        question_id: { type: Types.ObjectId, ref: 'Question', required: true },
        selected_answer_id: {
          type: Types.ObjectId,
          ref: 'Answer',
          required: true,
        },
        is_correct: { type: Boolean, required: true },
      },
    ],
    required: true,
  })
  answers: Array<{
    question_id: Types.ObjectId;
    selected_answer_id: Types.ObjectId;
    is_correct: boolean;
  }>;

  @Prop({
    type: String,
    enum: ['completed', 'abandoned'],
    default: 'completed',
  })
  status: string;
}

export const TestAttemptSchema = SchemaFactory.createForClass(TestAttempt);
