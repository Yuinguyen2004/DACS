import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Quiz extends Document {
  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user_id: string; // ref tới User

  @Prop({ default: false })
  is_premium: boolean;
}

export const QuizSchema = SchemaFactory.createForClass(Quiz);
