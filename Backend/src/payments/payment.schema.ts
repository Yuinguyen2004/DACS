import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../users/user.schema';
import { Package } from '../packages/package.schema';

export type PaymentDocument = Payment & Document;

export enum SubscriptionType {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
  LIFETIME = 'lifetime',
}

export enum PaymentStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELED = 'canceled',
}

export enum PaymentMethod {
  VNPAY = 'vnpay',
  PAYPAL = 'paypal',
}

@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user_id: Types.ObjectId | User;

  @Prop({ type: Types.ObjectId, ref: 'Package', required: true })
  package_id: Types.ObjectId | Package;

  @Prop({ required: true, type: Number })
  amount: number;

  @Prop({ required: true, default: Date.now })
  date: Date;

  @Prop({
    required: true,
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  // Payment code
  @Prop({ required: true, unique: true })
  payment_code: string; // Payment code that we generate

  // Payment method
  @Prop({
    required: true,
    enum: PaymentMethod,
    default: PaymentMethod.VNPAY,
  })
  payment_method: PaymentMethod;

  // VNPAY specific fields
  @Prop({ required: false })
  vnp_transaction_no: string; // Transaction number returned by VNPAY

  @Prop({ required: false, maxlength: 2 })
  vnp_response_code: string; // Response code from VNPAY

  // PayPal specific fields
  @Prop({ required: false })
  paypal_order_id: string; // PayPal order ID

  @Prop({ required: false })
  paypal_payment_id: string; // PayPal payment ID from capture
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

// Add indexes for better performance
PaymentSchema.index({ payment_code: 1 }, { unique: true });
PaymentSchema.index({ user_id: 1 });
PaymentSchema.index({ status: 1 });
