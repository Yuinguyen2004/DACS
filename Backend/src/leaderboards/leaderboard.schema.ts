import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Leaderboard extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Quiz', required: true })
  quizId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Attempt', required: true })
  attemptId: Types.ObjectId;

  @Prop({ required: true })
  score: number; // Điểm số của người dùng

  @Prop()
  timeSpent: number; // Thời gian làm bài (nếu muốn tính cả tốc độ)

  @Prop()
  rank: number; // Cập nhật khi có sự thay đổi
}

export const LeaderboardSchema = SchemaFactory.createForClass(Leaderboard);
export type LeaderboardDocument = Leaderboard & Document;
