import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password_hash: string;

  @Prop({ required: true, default: 'user' })
  role: string;

  @Prop({ required: false, ref: 'Package', default: null })
  package_id: string; // ref tới Package

  @Prop({ default: 'inactive' })
  status: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
