import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { Payment, PaymentSchema } from './payment.schema';
import { PackageModule } from '../packages/package.module';
import { UsersModule } from '../users/user.module';
import { User, UserSchema } from '../users/user.schema';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { ZaloPayService } from './zalopay.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
      { name: User.name, schema: UserSchema },
    ]),
    ConfigModule,
    PackageModule,
    UsersModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentService, FirebaseAuthGuard, ZaloPayService],
  exports: [PaymentService],
})
export class PaymentModule {}
