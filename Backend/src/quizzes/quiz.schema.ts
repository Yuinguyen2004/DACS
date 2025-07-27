import { Type } from '@nestjs/common';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Quiz extends Document {
  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ type: Number, required: false })
  time_limit?: number; // đơn vị: phút hoặc giây (nên chọn 1 loại)

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user_id: Types.ObjectId; // người tạo quiz

  @Prop({ default: false })
  is_premium: boolean;
}

export const QuizSchema = SchemaFactory.createForClass(Quiz);
