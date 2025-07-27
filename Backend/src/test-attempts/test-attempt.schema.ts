import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * Schema luu thong tin cac lan lam bai test/quiz cua nguoi dung
 * Ghi nhan diem so, thoi gian hoan thanh, cau tra loi da chon
 */
@Schema({ timestamps: true })
export class TestAttempt extends Document {
  // ID cua quiz ma nguoi dung da lam bai
  @Prop({ type: Types.ObjectId, ref: 'Quiz', required: true })
  quiz_id: Types.ObjectId;

  // ID cua nguoi dung lam bai
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user_id: Types.ObjectId;

  // Diem so dat duoc (tinh theo phan tram, 0-100)
  @Prop({ required: true })
  score: number;

  // Tong so cau hoi trong bai test
  @Prop({ required: true })
  total_questions: number;

  // So cau tra loi dung
  @Prop({ required: true })
  correct_answers: number;

  // So cau tra loi sai
  @Prop({ required: true })
  incorrect_answers: number;

  // Thoi gian hoan thanh bai test (tinh bang giay)
  @Prop({ required: true })
  completion_time: number; // in seconds

  // Thoi diem bat dau lam bai
  @Prop({ type: Date, required: true })
  started_at: Date;

  // Thoi diem hoan thanh bai
  @Prop({ type: Date, required: true })
  completed_at: Date;

  /**
   * Mang luu tru tat ca cau tra loi da chon
   * Moi phan tu chua:
   * - question_id: ID cau hoi
   * - selected_answer_id: ID dap an da chon
   * - is_correct: true/false - cau tra loi co dung khong
   */
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

  // Trang thai bai test: 'completed' (hoan thanh) hoac 'abandoned' (bo do)
  @Prop({
    type: String,
    enum: ['completed', 'abandoned'],
    default: 'completed',
  })
  status: string;
}

export const TestAttemptSchema = SchemaFactory.createForClass(TestAttempt);
