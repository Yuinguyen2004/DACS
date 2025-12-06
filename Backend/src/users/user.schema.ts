import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
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

  @Prop({ required: false }) // Made optional for Firebase users
  password_hash?: string;

  @Prop({ required: true, default: 'user' })
  role: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Package',
    required: false,
    default: null,
  })
  package_id: Types.ObjectId | Package | null;

  @Prop({ default: false })
  isOnline: boolean;

  @Prop({ default: Date.now })
  lastSeen: Date;

  @Prop({ default: 'active' })
  status: string; // For account status (active/inactive/suspended)

  @Prop({ required: false })
  avatar?: string;

  // Firebase fields
  @Prop({ required: false, unique: true, sparse: true })
  firebaseUid?: string;

  @Prop({ required: false, default: false })
  emailVerified?: boolean;

  @Prop({ required: false })
  displayName?: string;

  @Prop({ required: false })
  photoURL?: string;

  // Subscription fields
  @Prop({ enum: SubscriptionType, required: false })
  subscriptionType?: SubscriptionType;

  @Prop({ required: false })
  subscriptionStartDate?: Date;

  @Prop({ required: false })
  subscriptionEndDate?: Date;

  @Prop({ required: false })
  subscriptionCanceledAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
