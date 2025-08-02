import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class TestAttempt extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Quiz', required: true })
  quiz_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user_id: Types.ObjectId;

  // Các field này KHÔNG required khi tạo mới
  @Prop({ type: Number, required: false })
  score?: number;

  @Prop({ type: Number, required: true })
  total_questions: number;

  @Prop({ type: Number, required: false })
  correct_answers?: number;

  @Prop({ type: Number, required: false })
  incorrect_answers?: number;

  @Prop({ type: Number, required: false })
  completion_time?: number;

  @Prop({ type: Date, required: true })
  started_at: Date;

  @Prop({ type: Date, required: false })
  completed_at?: Date;

  @Prop({
    type: [
      {
        question_id: { type: Types.ObjectId, ref: 'Question' },
        selected_answer_id: { type: Types.ObjectId, ref: 'Answer' },
        is_correct: Boolean,
      },
    ],
    default: [],
  })
  answers: Array<{
    question_id: Types.ObjectId;
    selected_answer_id: Types.ObjectId;
    is_correct: boolean;
  }>;

  @Prop({
    type: String,
    enum: ['in_progress', 'completed', 'abandoned', 'late'],
    default: 'in_progress',
    required: true,
  })
  status: string;
}

export const TestAttemptSchema = SchemaFactory.createForClass(TestAttempt);
