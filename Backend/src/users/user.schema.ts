import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Package } from '../packages/package.schema';
import { SubscriptionType } from '../payments/payment.schema';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password_hash: string;

  @Prop({ required: true, default: 'user' })
  role: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'Package',
    required: false,
    default: 'guest',
  })
  package_id: Types.ObjectId | Package;

  @Prop({ default: 'inactive' })
  status: string;

  @Prop({ required: false })
  avatar?: string;

  // Subscription fields
  @Prop({ enum: SubscriptionType, required: false })
  subscriptionType?: SubscriptionType;

  @Prop({ required: false })
  subscriptionStartDate?: Date;

  @Prop({ required: false })
  subscriptionEndDate?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
