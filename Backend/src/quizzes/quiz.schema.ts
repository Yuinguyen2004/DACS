import { Type } from '@nestjs/common';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Quiz extends Document {
  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ required: false })
  image?: string;

  @Prop({ type: Number, required: false })
  time_limit?: number; // đơn vị: phút hoặc giây (nên chọn 1 loại)

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user_id: Types.ObjectId; // người tạo quiz

  @Prop({ default: false })
  is_premium: boolean;

  @Prop({ default: false })
  is_hidden: boolean; // Admin can hide/unhide quiz
}

export const QuizSchema = SchemaFactory.createForClass(Quiz);

// Add indexes for admin queries
QuizSchema.index({ is_hidden: 1 });
QuizSchema.index({ user_id: 1, is_hidden: 1 });
