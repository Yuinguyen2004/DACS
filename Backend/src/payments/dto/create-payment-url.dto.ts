import { IsNotEmpty, IsString, IsMongoId, IsOptional, IsEnum } from 'class-validator';
import { PaymentMethod } from '../payment.schema';

export class CreatePaymentUrlDto {
  @IsNotEmpty()
  @IsMongoId()
  packageId: string;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;
}