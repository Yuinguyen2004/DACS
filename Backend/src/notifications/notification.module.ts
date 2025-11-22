import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/user.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationGateway } from './notification.gateway';
import { Notification, NotificationSchema } from './notification.schema';
import { User, UserSchema } from '../users/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: User.name, schema: UserSchema },
    ]),
    AuthModule,
    UsersModule,
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationGateway,
    {
      provide: 'NOTIFICATION_GATEWAY_SETUP',
      useFactory: (
        service: NotificationService,
        gateway: NotificationGateway,
      ) => {
        service.setNotificationGateway(gateway);
        return true;
      },
      inject: [NotificationService, NotificationGateway],
    },
  ],
  exports: [NotificationService, NotificationGateway], // Export both service and gateway
})
export class NotificationModule {}
