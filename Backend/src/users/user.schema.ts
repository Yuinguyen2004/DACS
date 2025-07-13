import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document,Schema as MongooseSchema } from 'mongoose';
import { Package } from '../packages/package.schema';

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

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Package', required: true })
  package_id: MongooseSchema.Types.ObjectId | Package;

  @Prop({ default: 'inactive' })
  status: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
