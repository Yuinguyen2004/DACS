import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Notification extends Document {
  createdAt?: Date;
  updatedAt?: Date;
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop({ default: false })
  isRead: boolean; // Đã đọc chưa

  @Prop({ required: true })
  type: string; // Loại thông báo: system, payment, quiz, test_reminder, etc.

  @Prop({ type: Object })
  data: any; // Dữ liệu động kèm theo, ví dụ quizId, paymentId
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
